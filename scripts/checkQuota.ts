import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
});

async function check() {
  console.log('Testing simple text generateContent on gemini-3.8-flash...');
  try {
    const res = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'Hello, are you available?'
    });
    console.log('gemini-3.8-flash response:', res.text);
  } catch (err: any) {
    console.error('gemini-3.8-flash error:', err.message);
  }

  console.log('Testing simple text generateContent on gemini-3.1-flash-lite...');
  try {
    const resLite = await ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: 'Hello, are you available?'
    });
    console.log('gemini-3.1-flash-lite response:', resLite.text);
  } catch (err: any) {
    console.error('gemini-3.1-flash-lite error:', err.message);
  }
}

check();
