import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const cfg = JSON.parse(fs.readFileSync('firebase-applet-config.json', 'utf-8'));
const app = initializeApp(cfg);
const db = getFirestore(app, cfg.firestoreDatabaseId);

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

function toWatchUrl(embedUrl: string): string {
  if (!embedUrl) return '';
  if (embedUrl.includes('youtube.com/watch?v=')) return embedUrl;
  const match = embedUrl.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) return `https://www.youtube.com/watch?v=${match[1]}`;
  return embedUrl;
}

async function testMovers() {
  const d = await getDoc(doc(db, 'lessons', 'movers_w1_o1'));
  const lesson = d.data();
  const watchUrl = toWatchUrl(lesson?.embed_url);
  console.log('Testing movers_w1_o1:', lesson?.topic, watchUrl);

  const prompt = `Đây là video bài học tiếng Anh cho trẻ em: ${watchUrl}
Chủ đề: "${lesson?.topic}" (Cấp độ: ${lesson?.level}, Tuần ${lesson?.week}, Bài ${lesson?.order})

Hãy trích xuất và chép lại TOÀN BỘ kịch bản/đoạn hội thoại tiếng Anh đầy đủ (full English transcript/dialogue script) trong toàn bộ video mà giáo viên hoặc các nhân vật nói, giảng dạy hoặc hướng dẫn học viên nói theo.
- Bao gồm đầy đủ các câu từ đầu đến cuối video bài học để học sinh có thể theo dõi và luyện shadowing toàn bài.
- Giữ nguyên các câu nói tiếng Anh, phân chia từng dòng hoặc theo lượt nói thoại rõ ràng.
- Chỉ trả về nội dung script tiếng Anh, không thêm phần dịch tiếng Việt hay lời giải thích ngoài lề.`;

  const res = await ai.models.generateContent({
    model: 'gemini-3.1-flash-lite',
    contents: prompt
  });
  console.log('--- FULL SCRIPT MOVERS_W1_O1 ---');
  console.log(res.text);
  console.log('--------------------------------');
  process.exit(0);
}

testMovers();
