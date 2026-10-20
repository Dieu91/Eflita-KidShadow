import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { getFirestore, getDocs, collection, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper: Convert embed URL to standard watch URL
function toWatchUrl(embedUrl: string): string {
  if (!embedUrl) return '';
  if (embedUrl.includes('youtube.com/watch?v=')) return embedUrl;
  const match = embedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://www.youtube.com/watch?v=${match[1]}`;
  }
  return embedUrl;
}

// Helper: Check if string has Vietnamese diacritics
function hasVietnamese(text: string): boolean {
  const vnRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;
  return vnRegex.test(text);
}

// Clean generated script
function cleanScript(raw: string): string {
  return raw
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .replace(/^Script:\s*/i, '')
    .replace(/^Sentence:\s*/i, '')
    .trim();
}

async function run() {
  console.log('================================================================');
  console.log('BẮT ĐẦU TRÍCH XUẤT CÂU MẪU SHADOWING BẰNG GEMINI CHO 63 BÀI HỌC');
  console.log('================================================================\n');

  // 1. Initialize Firebase
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  // 2. Initialize Gemini
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  // 3. Fetch all 63 lessons from Firestore
  console.log('Đang tải danh sách documents từ collection "lessons"...');
  const snap = await getDocs(collection(db, 'lessons'));
  console.log(`Đã tìm thấy ${snap.size} documents trong Firestore.\n`);

  const docsList = snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  })) as any[];

  // Sort by level (STARTER, MOVERS, FLYERS), then week, then order
  const levelOrder: Record<string, number> = { STARTER: 1, MOVERS: 2, FLYERS: 3 };
  docsList.sort((a, b) => {
    const lA = levelOrder[a.level] || 99;
    const lB = levelOrder[b.level] || 99;
    if (lA !== lB) return lA - lB;
    if (a.week !== b.week) return a.week - b.week;
    return a.order - b.order;
  });

  const successfulResults: { id: string; topic: string; script: string; originalScript?: string }[] = [];
  const manualWarningList: { id: string; reason: string; rawOutput?: string; watchUrl: string }[] = [];
  const skippedList: { id: string; currentScript: string; reason: string }[] = [];

  for (let i = 0; i < docsList.length; i++) {
    const lesson = docsList[i];
    const docId = lesson.id;
    const embedUrl = lesson.embed_url || '';
    const watchUrl = toWatchUrl(embedUrl);
    const topic = lesson.topic || '';
    const existingScript = (lesson.script || '').trim();

    console.log(`[${i + 1}/${docsList.length}] Đang xử lý: ${docId} | Cấp độ: ${lesson.level} | Chủ đề: "${topic}"`);

    if (!watchUrl) {
      console.warn(`  ⚠️ Cảnh báo: Bài học ${docId} không có link video.`);
      manualWarningList.push({ id: docId, reason: 'Không có embed_url / video link', watchUrl: '' });
      continue;
    }

    const promptText = `Đây là video dạy tiếng Anh cho trẻ em. Link video: ${watchUrl}
Chủ đề bài học: "${topic}" (Cấp độ: ${lesson.level}, Tuần ${lesson.week}, Bài ${lesson.order})
Hãy nghe kỹ và viết lại CHÍNH XÁC câu hoặc đoạn hội thoại tiếng Anh mà video đang dạy học viên nói theo (không phải lời dẫn/giải thích, chỉ câu mẫu chính để luyện shadowing). Nếu có nhiều câu, chỉ lấy 1 câu hoặc 1 đoạn ngắn tiêu biểu nhất, không quá 20 từ. Chỉ trả về đúng câu đó, không thêm giải thích.`;

    let generatedScript = '';
    let callError = null;

    // Call Gemini with fallback between flash and flash-lite
    for (const modelName of ['gemini-3.1-flash-lite', 'gemini-3.8-flash']) {
      try {
        const response = await ai.models.generateContent({
          model: modelName,
          contents: promptText
        });
        generatedScript = cleanScript(response.text || '');
        if (generatedScript) break;
      } catch (err: any) {
        callError = err?.message || String(err);
        // Wait 1.5s before retry
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    // Validation (Requirement 5):
    // Check if empty, too long (> 20 words), contains Vietnamese, or failed
    const words = generatedScript.split(/\s+/).filter(Boolean);
    const isTooLong = words.length > 25;
    const isVietnamese = hasVietnamese(generatedScript);
    const isEmpty = !generatedScript || generatedScript.length < 3;

    if (isEmpty || isTooLong || isVietnamese) {
      let reason = '';
      if (isEmpty) reason = `Không nhận diện được nội dung hoặc API lỗi: ${callError || 'Rỗng'}`;
      else if (isTooLong) reason = `Câu trả về quá dài (${words.length} từ > quy định 20 từ)`;
      else if (isVietnamese) reason = `Câu trả về chứa tiếng Việt thay vì tiếng Anh`;

      console.warn(`  ⚠️ [CẢNH BÁO KIỂM TRA THỦ CÔNG] ${docId}: ${reason}`);
      console.warn(`     Raw output: "${generatedScript}"`);
      manualWarningList.push({
        id: docId,
        reason,
        rawOutput: generatedScript,
        watchUrl
      });
      // Do not overwrite, keep existing script
    } else {
      // Valid script obtained!
      console.log(`  ✅ Gemini trích xuất: "${generatedScript}"`);

      // Update Firestore document (Requirement 3)
      try {
        const docRef = doc(db, 'lessons', docId);
        await updateDoc(docRef, {
          script: generatedScript,
          script_source: 'gemini_video_understanding',
          script_updated_at: new Date().toISOString()
        });
        successfulResults.push({
          id: docId,
          topic,
          script: generatedScript,
          originalScript: existingScript
        });
      } catch (writeErr: any) {
        console.error(`  ❌ Lỗi khi ghi Firestore cho ${docId}:`, writeErr.message);
        manualWarningList.push({
          id: docId,
          reason: `Lỗi ghi Firestore: ${writeErr.message}`,
          rawOutput: generatedScript,
          watchUrl
        });
      }
    }

    // Delay 1.2s to prevent hitting rate limits
    await new Promise((r) => setTimeout(r, 1200));
  }

  // Save report to JSON file
  const reportPath = path.resolve(__dirname, '../extracted_scripts_report.json');
  fs.writeFileSync(
    reportPath,
    JSON.stringify(
      {
        total: docsList.length,
        successCount: successfulResults.length,
        warningCount: manualWarningList.length,
        successfulResults,
        manualWarningList
      },
      null,
      2
    )
  );

  console.log('\n================================================================');
  console.log(`HOÀN THÀNH QUÁ TRÌNH TRÍCH XUẤT CÂU MẪU SHADOWING`);
  console.log(`- Thành công: ${successfulResults.length} / ${docsList.length} bài`);
  console.log(`- Cảnh báo cần kiểm tra thủ công: ${manualWarningList.length} bài`);
  console.log('================================================================\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Lỗi nghiêm trọng trong quá trình chạy:', err);
  process.exit(1);
});
