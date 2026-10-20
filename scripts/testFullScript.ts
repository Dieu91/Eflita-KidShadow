import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function testFullScript() {
  const watchUrl = 'https://www.youtube.com/watch?v=tVlcKp3bWH8';
  console.log('Testing full script extraction for:', watchUrl);

  const prompt = `Đây là video bài học tiếng Anh cho trẻ em: ${watchUrl}
Chủ đề: Hello (Starter, Week 1, Lesson 1)

Hãy trích xuất và chép lại TOÀN BỘ đoạn hội thoại / kịch bản tiếng Anh (full English script) trong video mà nhân vật/giáo viên nói hoặc dạy học viên luyện theo (toàn bộ các câu tiếng Anh diễn ra trong bài học).
- Giữ nguyên thứ tự các câu/đoạn hội thoại theo diễn biến video.
- Định dạng rõ ràng theo từng lượt nói (ví dụ: A: ... / B: ... hoặc từng câu liên tiếp).
- Chỉ trả về nội dung kịch bản tiếng Anh, không thêm lời chào, giải thích ngoài lề.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });
    console.log('--- GEMINI FULL SCRIPT RESULT ---');
    console.log(res.text);
    console.log('---------------------------------');
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

testFullScript();
