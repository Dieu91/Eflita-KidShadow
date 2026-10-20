import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function test() {
  const watchUrl = 'https://www.youtube.com/watch?v=tVlcKp3bWH8';
  console.log('Testing video understanding with YouTube URL:', watchUrl);

  const prompt = `Đây là video dạy tiếng Anh cho trẻ em: ${watchUrl}
Chủ đề bài học: Hello (Starter, Week 1, Lesson 1)
Hãy nghe kỹ và viết lại CHÍNH XÁC câu hoặc đoạn hội thoại tiếng Anh mà video đang dạy học viên nói theo (không phải lời dẫn/giải thích, chỉ câu mẫu chính để luyện shadowing). Nếu có nhiều câu, chỉ lấy 1 câu hoặc 1 đoạn ngắn tiêu biểu nhất, không quá 20 từ. Chỉ trả về đúng câu đó, không thêm giải thích.`;

  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: prompt,
    });
    console.log('gemini-3.1-flash-lite result:', res.text);
  } catch (err: any) {
    console.error('Error:', err.message);
  }
}

test();
