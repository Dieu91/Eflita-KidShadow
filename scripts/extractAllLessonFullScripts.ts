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

function toWatchUrl(embedUrl: string): string {
  if (!embedUrl) return '';
  if (embedUrl.includes('youtube.com/watch?v=')) return embedUrl;
  const match = embedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://www.youtube.com/watch?v=${match[1]}`;
  }
  return embedUrl;
}

function hasVietnamese(text: string): boolean {
  const vnRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđĐ]/i;
  return vnRegex.test(text);
}

function cleanScript(raw: string): string {
  return raw
    .replace(/^```[a-zA-Z]*\n?/g, '')
    .replace(/```$/g, '')
    .trim();
}

async function run() {
  console.log('================================================================');
  console.log('BẮT ĐẦU TRÍCH XUẤT FULL SCRIPT ĐẦY ĐỦ CHO TOÀN BỘ 63 BÀI HỌC');
  console.log('================================================================\n');

  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const snap = await getDocs(collection(db, 'lessons'));
  console.log(`Tìm thấy ${snap.size} documents trong collection "lessons".\n`);

  const docsList = snap.docs.map((d) => ({
    id: d.id,
    ...d.data()
  })) as any[];

  const levelOrder: Record<string, number> = { STARTER: 1, MOVERS: 2, FLYERS: 3 };
  docsList.sort((a, b) => {
    const lA = levelOrder[a.level] || 99;
    const lB = levelOrder[b.level] || 99;
    if (lA !== lB) return lA - lB;
    if (a.week !== b.week) return a.week - b.week;
    return a.order - b.order;
  });

  const results: { id: string; topic: string; level: string; lineCount: number; preview: string; fullScript: string }[] = [];
  const warnings: { id: string; reason: string; watchUrl: string }[] = [];

  for (let i = 0; i < docsList.length; i++) {
    const lesson = docsList[i];
    const docId = lesson.id;
    const watchUrl = toWatchUrl(lesson.embed_url || '');
    const topic = lesson.topic || '';

    console.log(`[${i + 1}/${docsList.length}] Xử lý: ${docId} | ${lesson.level} W${lesson.week}#${lesson.order} | "${topic}"`);

    if (!watchUrl) {
      console.warn(`  ⚠️ Cảnh báo: Bài học ${docId} không có link video.`);
      warnings.push({ id: docId, reason: 'Không có URL video', watchUrl: '' });
      continue;
    }

    const promptText = `Đây là video bài học tiếng Anh cho trẻ em: ${watchUrl}
Chủ đề bài học: "${topic}" (Cấp độ: ${lesson.level}, Tuần ${lesson.week}, Bài ${lesson.order})

Hãy nghe kỹ và chép lại TOÀN BỘ kịch bản/đoạn hội thoại tiếng Anh đầy đủ (full English transcript/dialogue script) từ đầu đến cuối video mà giáo viên hoặc các nhân vật nói, giảng dạy hoặc hướng dẫn học viên nói theo.
- Bao gồm đầy đủ các câu trong suốt bài học để học viên có thể luyện shadowing toàn bài.
- Giữ nguyên các câu tiếng Anh, phân chia từng dòng hoặc theo lượt nhân vật nói rõ ràng.
- Chỉ trả về nội dung kịch bản tiếng Anh, không thêm phần dịch tiếng Việt hay lời giải thích ngoài lề.`;

    let generatedScript = '';
    let lastError = '';

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: promptText
        });
        generatedScript = cleanScript(response.text || '');
        if (generatedScript && generatedScript.length > 20) break;
      } catch (err: any) {
        lastError = err?.message || String(err);
        await new Promise((r) => setTimeout(r, 2000));
      }
    }

    // Validation
    const isVietnamese = hasVietnamese(generatedScript);
    const isEmpty = !generatedScript || generatedScript.length < 15;

    if (isEmpty || isVietnamese) {
      const reason = isEmpty ? `Rỗng hoặc lỗi: ${lastError}` : `Script chứa tiếng Việt`;
      console.warn(`  ⚠️ Cảnh báo [${docId}]: ${reason}`);
      warnings.push({ id: docId, reason, watchUrl });
    } else {
      const lines = generatedScript.split('\n').filter((l) => l.trim().length > 0);
      const preview = lines.slice(0, 3).join(' | ');

      console.log(`  ✅ Thành công: ${lines.length} dòng | Preview: "${preview.substring(0, 80)}..."`);

      try {
        await updateDoc(doc(db, 'lessons', docId), {
          script: generatedScript,
          script_source: 'gemini_video_understanding_full',
          script_updated_at: new Date().toISOString()
        });
        results.push({
          id: docId,
          topic,
          level: lesson.level,
          lineCount: lines.length,
          preview,
          fullScript: generatedScript
        });
      } catch (e: any) {
        console.error(`  ❌ Lỗi ghi Firestore [${docId}]:`, e.message);
        warnings.push({ id: docId, reason: `Lỗi ghi Firestore: ${e.message}`, watchUrl });
      }
    }

    // Delay 1.5s between requests to be gentle on quota
    await new Promise((r) => setTimeout(r, 1500));
  }

  const outReportPath = path.resolve(__dirname, '../full_scripts_report.json');
  fs.writeFileSync(
    outReportPath,
    JSON.stringify(
      {
        total: docsList.length,
        successCount: results.length,
        warningCount: warnings.length,
        results,
        warnings
      },
      null,
      2
    )
  );

  console.log('\n================================================================');
  console.log(`HOÀN TẤT TRÍCH XUẤT FULL SCRIPT:`);
  console.log(`- Thành công: ${results.length} / ${docsList.length}`);
  console.log(`- Cảnh báo: ${warnings.length}`);
  console.log('================================================================\n');

  process.exit(0);
}

run().catch((err) => {
  console.error('Lỗi nghiêm trọng:', err);
  process.exit(1);
});
