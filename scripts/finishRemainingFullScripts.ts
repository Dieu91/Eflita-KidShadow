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
  if (match && match[1]) return `https://www.youtube.com/watch?v=${match[1]}`;
  return embedUrl;
}

function cleanScript(raw: string): string {
  return raw
    .replace(/^```[a-zA-Z]*\n?/g, '')
    .replace(/```$/g, '')
    .trim();
}

async function finish() {
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const snap = await getDocs(collection(db, 'lessons'));
  const allDocs = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

  // Filter lessons that haven't been updated with full script yet
  const remaining = allDocs.filter(d => d.script_source !== 'gemini_video_understanding_full');
  console.log(`Số bài học cần hoàn thiện tiếp: ${remaining.length} / ${allDocs.length}`);

  for (let i = 0; i < remaining.length; i++) {
    const lesson = remaining[i];
    const docId = lesson.id;
    const watchUrl = toWatchUrl(lesson.embed_url || '');
    const topic = lesson.topic || '';

    console.log(`[${i + 1}/${remaining.length}] Đang xử lý: ${docId} | ${lesson.level} | "${topic}"`);

    const promptText = `Đây là video bài học tiếng Anh cho trẻ em: ${watchUrl}
Chủ đề bài học: "${topic}" (Cấp độ: ${lesson.level}, Tuần ${lesson.week}, Bài ${lesson.order})

Hãy nghe kỹ và chép lại TOÀN BỘ kịch bản/đoạn hội thoại tiếng Anh đầy đủ (full English transcript/dialogue script) từ đầu đến cuối video mà giáo viên hoặc các nhân vật nói, giảng dạy hoặc hướng dẫn học viên nói theo.
- Bao gồm đầy đủ các câu trong suốt bài học để học viên có thể luyện shadowing toàn bài.
- Giữ nguyên các câu tiếng Anh, phân chia từng dòng hoặc theo lượt nhân vật nói rõ ràng.
- Chỉ trả về nội dung kịch bản tiếng Anh, không thêm phần dịch tiếng Việt hay lời giải thích ngoài lề.`;

    let generatedScript = '';
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: promptText
        });
        generatedScript = cleanScript(response.text || '');
        if (generatedScript && generatedScript.length > 20) break;
      } catch (err: any) {
        console.warn(`    Lỗi attempt ${attempt} [${docId}]: ${err.message}`);
        await new Promise(r => setTimeout(r, 2500));
      }
    }

    if (generatedScript && generatedScript.length > 20) {
      const lines = generatedScript.split('\n').filter(l => l.trim().length > 0);
      console.log(`  ✅ Thành công [${docId}]: ${lines.length} dòng`);
      try {
        await updateDoc(doc(db, 'lessons', docId), {
          script: generatedScript,
          script_source: 'gemini_video_understanding_full',
          script_updated_at: new Date().toISOString()
        });
      } catch (e: any) {
        console.error(`  ❌ Lỗi ghi Firestore: ${e.message}`);
      }
    } else {
      console.warn(`  ⚠️ Không lấy được script cho ${docId}`);
    }

    await new Promise(r => setTimeout(r, 1800));
  }

  // Final check
  const snapFinal = await getDocs(collection(db, 'lessons'));
  const completed = snapFinal.docs.filter(d => d.data().script_source === 'gemini_video_understanding_full').length;
  console.log(`\n🎉 HOÀN THÀNH: ${completed} / ${snapFinal.size} bài học đã có full script trong Firestore!`);
  process.exit(0);
}

finish().catch(e => {
  console.error('Lỗi finish:', e);
  process.exit(1);
});
