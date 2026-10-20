import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targets = [
  { id: 'movers_w1_o3', topic: 'Routine Chants', watchUrl: 'https://www.youtube.com/watch?v=-GSnmRZlgc4', level: 'MOVERS', week: 1, order: 3 },
  { id: 'movers_w7_o2', topic: 'Dinner with friends', watchUrl: 'https://www.youtube.com/watch?v=FwKB4HT5w-Y', level: 'MOVERS', week: 7, order: 2 },
  { id: 'flyers_w6_o1', topic: 'What did you do last weekend', watchUrl: 'https://www.youtube.com/watch?v=pcWBtzTnpb8', level: 'FLYERS', week: 6, order: 1 },
  { id: 'flyers_w6_o2', topic: 'Where did you go', watchUrl: 'https://www.youtube.com/watch?v=tGWiowdjnHk', level: 'FLYERS', week: 6, order: 2 }
];

async function retry() {
  const configPath = path.resolve(__dirname, '../firebase-applet-config.json');
  const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
  });

  const reportPath = path.resolve(__dirname, '../extracted_scripts_report.json');
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));

  const remainingWarnings = [];

  for (const item of targets) {
    const promptText = `Đây là video dạy tiếng Anh cho trẻ em. Link video: ${item.watchUrl}
Chủ đề bài học: "${item.topic}" (Cấp độ: ${item.level}, Tuần ${item.week}, Bài ${item.order})
Hãy nghe kỹ và viết lại CHÍNH XÁC câu hoặc đoạn hội thoại tiếng Anh mà video đang dạy học viên nói theo (không phải lời dẫn/giải thích, chỉ câu mẫu chính để luyện shadowing). Nếu có nhiều câu, chỉ lấy 1 câu hoặc 1 đoạn ngắn tiêu biểu nhất, không quá 20 từ. Chỉ trả về đúng câu đó, không thêm giải thích.`;

    let generated = '';
    try {
      const res = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: promptText
      });
      generated = (res.text || '').replace(/^["'“”]+|["'“”]+$/g, '').trim();
    } catch (e: any) {
      console.warn(`Retry failed for ${item.id}:`, e.message);
    }

    if (generated && generated.length > 5 && generated.split(/\s+/).length <= 25) {
      console.log(`Success on retry for ${item.id}: "${generated}"`);
      await updateDoc(doc(db, 'lessons', item.id), {
        script: generated,
        script_source: 'gemini_video_understanding_retry',
        script_updated_at: new Date().toISOString()
      });
      report.successfulResults.push({
        id: item.id,
        topic: item.topic,
        script: generated
      });
    } else {
      console.warn(`Still warning for ${item.id}: "${generated}"`);
      remainingWarnings.push({
        id: item.id,
        reason: 'Không trích xuất được hoặc API trả về không hợp lệ',
        rawOutput: generated,
        watchUrl: item.watchUrl
      });
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  report.manualWarningList = remainingWarnings;
  report.successCount = report.successfulResults.length;
  report.warningCount = remainingWarnings.length;
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log('Final results:', {
    total: report.total,
    success: report.successCount,
    warnings: report.warningCount
  });
}

retry();
