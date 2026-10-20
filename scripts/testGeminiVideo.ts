import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function test() {
  const watchUrl = 'https://www.youtube.com/watch?v=tVlcKp3bWH8';
  console.log('Testing Gemini Video Understanding with YouTube URL:', watchUrl);

  const prompt = `Đây là video dạy tiếng Anh cho trẻ em. Link video: ${watchUrl}
Hãy nghe kỹ và viết lại CHÍNH XÁC câu hoặc đoạn hội thoại tiếng Anh mà video đang dạy học viên nói theo (không phải lời dẫn/giải thích, chỉ câu mẫu chính để luyện shadowing). Nếu có nhiều câu, chỉ lấy 1 câu hoặc 1 đoạn ngắn tiêu biểu nhất, không quá 20 từ. Chỉ trả về đúng câu đó, không thêm giải thích.`;

  // Test Method A: fileData with fileUri
  try {
    console.log('--- Attempt 1: fileData with YouTube URI ---');
    const resA = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [
        {
          fileData: {
            fileUri: watchUrl,
            mimeType: 'video/mp4'
          }
        },
        {
          text: `Đây là video dạy tiếng Anh cho trẻ em. Hãy nghe kỹ và viết lại CHÍNH XÁC câu hoặc đoạn hội thoại tiếng Anh mà video đang dạy học viên nói theo (không phải lời dẫn/giải thích, chỉ câu mẫu chính để luyện shadowing). Nếu có nhiều câu, chỉ lấy 1 câu hoặc 1 đoạn ngắn tiêu biểu nhất, không quá 20 từ. Chỉ trả về đúng câu đó, không thêm giải thích.`
        }
      ]
    });
    console.log('Attempt 1 Success:', resA.text);
  } catch (err: any) {
    console.log('Attempt 1 failed:', err.message);
  }

  // Test Method B: Direct URL in prompt text
  try {
    console.log('--- Attempt 2: Direct URL in prompt text ---');
    const resB = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt
    });
    console.log('Attempt 2 Success:', resB.text);
  } catch (err: any) {
    console.log('Attempt 2 failed:', err.message);
  }
}

test();
