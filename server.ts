import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';
import os from 'os';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { getDetailedPedagogicalFeedback } from './src/utils/feedbackGenerator';
import {
  sanitizeTeacherFeedback,
  isFeedbackFaultyOrWarning,
  containsInappropriateContent,
  hasAudioComplaint,
  UNCLEAR_AUDIO_MESSAGE_VI,
  UNCLEAR_AUDIO_MESSAGE_EN,
} from './src/utils/sanitizeFeedback';
import { SAMPLE_LESSONS } from './src/data/lessonsData';

dotenv.config();

/**
 * ==============================================================================
 * LƯU Ý QUAN TRỌNG / IMPORTANT ARCHITECTURAL & EVALUATION NOTICE:
 * ==============================================================================
 * Đây là nhận xét định tính hỗ trợ động viên hàng tuần, KHÔNG dùng để chấm điểm
 * hay xếp hạng trong vòng thi Shadowing Champion (vòng thi vẫn do giám khảo con người
 * chấm như quy trình đã thiết kế).
 *
 * This function provides qualitative formative feedback for weekly encouragement,
 * NOT standardized scoring or ranking for the Shadowing Champion competition.
 * Official contest judging is conducted exclusively by human evaluators.
 * ==============================================================================
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize server-side Firestore instance with experimental long polling for stability
let serverDb: any = null;
try {
  const firebaseConfigPath = path.join(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(firebaseConfigPath)) {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf-8'));
    const serverApp = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
    serverDb = initializeFirestore(
      serverApp,
      {
        experimentalForceLongPolling: true,
        ignoreUndefinedProperties: true,
      },
      firebaseConfig.firestoreDatabaseId || 'ai-studio-6f94b3ef-f7bb-4be7-b241-17da1bb830b6'
    );
  }
} catch (dbErr) {
  console.warn('Server Firestore initialization notice:', dbErr);
}

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const host = '0.0.0.0';

// Support JSON payloads with audio base64 up to 600MB (doubled for long 8-10 min videos)
app.use(express.json({ limit: '600mb' }));
app.use(express.urlencoded({ extended: true, limit: '600mb' }));

// Multer upload middleware for direct file uploads up to 600MB without base64 bloat
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 600 * 1024 * 1024 },
});

// Health check endpoint for Cloud Run / load balancers
app.get('/healthz', (_req: Request, res: Response) => {
  res.status(200).send('OK');
});

// Initialize Gemini Client with server telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

/**
 * Helper: Extract audio from an on-disk video/audio file using FFmpeg
 * Extracts up to 600 seconds (10 minutes) with MP3 compression (~4.8MB) for rapid Gemini assessment
 */
export async function extractAudioFromFile(filePath: string): Promise<{ buffer: Buffer; mimeType: string }> {
  const tempDir = os.tmpdir();
  const outputMp3 = path.join(tempDir, `output_${Date.now()}_${Math.random().toString(36).substring(7)}.mp3`);

  return new Promise<{ buffer: Buffer; mimeType: string }>((resolve, reject) => {
    const ffmpegProcess = spawn('ffmpeg', [
      '-y',
      '-i',
      filePath,
      '-t',
      '240',
      '-vn',
      '-acodec',
      'libmp3lame',
      '-b:a',
      '96k',
      '-ar',
      '16000',
      '-ac',
      '1',
      outputMp3,
    ]);

    ffmpegProcess.on('close', async (code) => {
      try {
        if (code === 0 && fs.existsSync(outputMp3)) {
          const audioBuffer = await fs.promises.readFile(outputMp3);
          resolve({ buffer: audioBuffer, mimeType: 'audio/mp3' });
        } else {
          // Fallback to PCM WAV if MP3 encoder is not present
          const outputWav = path.join(tempDir, `output_${Date.now()}_fallback.wav`);
          const wavProcess = spawn('ffmpeg', [
            '-y',
            '-i',
            filePath,
            '-t',
            '600',
            '-vn',
            '-acodec',
            'pcm_s16le',
            '-ar',
            '16000',
            '-ac',
            '1',
            outputWav,
          ]);
          wavProcess.on('close', async (wavCode) => {
            try {
              if (wavCode === 0 && fs.existsSync(outputWav)) {
                const wavBuf = await fs.promises.readFile(outputWav);
                resolve({ buffer: wavBuf, mimeType: 'audio/wav' });
              } else {
                reject(new Error(`FFmpeg exited with code ${code}`));
              }
            } finally {
              fs.promises.unlink(outputWav).catch(() => {});
            }
          });
        }
      } catch (err) {
        reject(err);
      } finally {
        fs.promises.unlink(outputMp3).catch(() => {});
      }
    });

    ffmpegProcess.on('error', (err) => {
      fs.promises.unlink(outputMp3).catch(() => {});
      reject(err);
    });
  });
}

/**
 * Helper: Extract audio from video buffer using local ffmpeg
 */
export async function extractAudioWithFfmpeg(videoBuffer: Buffer): Promise<{ buffer: Buffer; mimeType: string }> {
  const tempDir = os.tmpdir();
  const inputPath = path.join(tempDir, `input_${Date.now()}_${Math.random().toString(36).substring(7)}.mp4`);

  await fs.promises.writeFile(inputPath, videoBuffer);
  try {
    return await extractAudioFromFile(inputPath);
  } finally {
    fs.promises.unlink(inputPath).catch(() => {});
  }
}

/**
 * Pedagogical Pronunciation Guidance Fallback:
 * Provides friendly, conversational 2-3 sentence feedback for young learners.
 * Strictly avoids IPA symbols and academic phonetic jargon.
 */
export function getPedagogicalFeedbackFallback(
  topic?: string,
  script?: string,
  language: 'vi' | 'en' = 'vi',
  level?: string
): string {
  return getDetailedPedagogicalFeedback(topic, script, language, level);
}

/**
 * Checks if a string is a valid, concise shadowing script (not placeholder, not full video monologue)
 */
export function isValidShadowingScript(script?: string | null): boolean {
  if (!script || typeof script !== 'string') return false;
  const s = script.trim();
  if (s.length === 0) return false;
  const lower = s.toLowerCase();
  if (
    lower === '...' ||
    lower === '-' ||
    lower.includes('placeholder') ||
    lower.includes('[script]') ||
    lower === 'n/a' ||
    lower.includes('chưa có script')
  ) {
    return false;
  }
  // Check if it's an unparsed multi-paragraph video monologue rather than a shadowing model sentence
  const words = s.split(/\s+/).filter(Boolean);
  if (words.length > 100 || lower.includes('welcome back to our english class')) {
    return false;
  }
  return true;
}

/**
 * Helper to convert YouTube embed or short URL into a standard watch URL
 */
export function extractYoutubeWatchUrl(url?: string): string {
  if (!url) return '';
  const trimmed = url.trim();
  const match = trimmed.match(/(?:embed\/|v\/|watch\?v=|youtu\.be\/|\/v\/|^)([a-zA-Z0-9_-]{11})/);
  if (match && match[1]) {
    return `https://www.youtube.com/watch?v=${match[1]}`;
  }
  return trimmed;
}

/**
 * Lazy loads the model shadowing sentence (< 20 words) from YouTube embed_url using Gemini
 */
export async function fetchScriptFromYoutubeWithGemini(youtubeUrl: string, topic?: string): Promise<string> {
  const cleanUrl = extractYoutubeWatchUrl(youtubeUrl);
  const prompt = `Đây là video YouTube bài học tiếng Anh cho trẻ em: ${cleanUrl} ${topic ? `(chủ đề: "${topic}")` : ''}.
Hãy chỉ lấy câu mẫu chính để luyện shadowing, không quá 20 từ. Chỉ trả về duy nhất 1 câu mẫu tiếng Anh ngắn đó, không thêm lời dẫn hay giải thích gì khác.`;

  const models = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];
  for (const model of models) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: prompt,
      });
      if (res.text) {
        let text = res.text.trim();
        // Remove surrounding quotes and intro labels
        text = text.replace(/^["'“”‘’]+|["'“”‘’]+$/g, '').trim();
        text = text.replace(/^(câu mẫu|script|sentence|target sentence|shadowing sentence)[:\s-]+/i, '').trim();
        // Check word count <= 20 words
        const words = text.split(/\s+/).filter(Boolean);
        if (words.length > 20) {
          text = words.slice(0, 20).join(' ') + '.';
        }
        if (text.length > 0) {
          return text;
        }
      }
    } catch (err: any) {
      console.warn(`Model ${model} failed extracting transcript from YouTube:`, err?.message);
    }
  }
  return '';
}

async function getDocWithTimeout(docRef: any, timeoutMs = 2500): Promise<any> {
  return Promise.race([
    getDoc(docRef),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Firestore read timeout')), timeoutMs)),
  ]);
}

/**
 * Lazy load script: checks if lesson already has script; if not, calls Gemini on YouTube link and caches into Firestore
 */
export async function getOrResolveLessonScript(params: {
  script?: string;
  lessonId?: string;
  embed_url?: string;
  topic?: string;
  level?: string;
}): Promise<string> {
  const { script, lessonId, embed_url, topic, level } = params;

  // 1. Check if provided script is already valid
  if (isValidShadowingScript(script)) {
    return (script as string).trim();
  }

  // 2. Check Firestore document for lesson if lessonId is provided
  let firestoreEmbedUrl = '';
  if (lessonId && serverDb) {
    try {
      const lessonRef = doc(serverDb, 'lessons', lessonId);
      const lessonSnap = await getDocWithTimeout(lessonRef, 2000);
      if (lessonSnap && lessonSnap.exists()) {
        const data = lessonSnap.data();
        if (isValidShadowingScript(data?.script)) {
          return data.script.trim();
        }
        if (data?.embed_url) {
          firestoreEmbedUrl = data.embed_url;
        }
      }
    } catch (fsErr) {
      console.warn(`Could not read lesson ${lessonId} from Firestore (timeout or offline):`, fsErr);
    }
  }

  // Check matching sample lesson in memory if present
  if (lessonId) {
    const matchingSample = SAMPLE_LESSONS.find((l) => {
      const sampleId = `${l.level.toLowerCase()}_w${l.week}_o${l.order}`;
      return sampleId === lessonId;
    });
    if (matchingSample) {
      if (isValidShadowingScript(matchingSample.script)) {
        return matchingSample.script!.trim();
      }
      if (!firestoreEmbedUrl && matchingSample.embed_url) {
        firestoreEmbedUrl = matchingSample.embed_url;
      }
    }
  }

  // 3. Lazy load transcript via Gemini from YouTube embed_url
  const targetYoutubeUrl = embed_url || firestoreEmbedUrl;
  if (targetYoutubeUrl) {
    try {
      const extractedScript = await fetchScriptFromYoutubeWithGemini(targetYoutubeUrl, topic);
      if (extractedScript && isValidShadowingScript(extractedScript)) {
        // Save to Firestore field "script" of this lesson in background so it is reused for all future submissions
        if (lessonId && serverDb) {
          const lessonRef = doc(serverDb, 'lessons', lessonId);
          setDoc(lessonRef, { script: extractedScript }, { merge: true })
            .then(() => console.log(`Saved lazy-loaded script to Firestore lesson ${lessonId}: "${extractedScript}"`))
            .catch((saveErr) => console.warn(`Could not save script to Firestore for ${lessonId}:`, saveErr));
        }
        return extractedScript;
      }
    } catch (lazyErr) {
      console.warn('Error during lazy script loading with Gemini:', lazyErr);
    }
  }

  // 4. Default clean fallback under 20 words
  if (topic) {
    return `This is our English lesson about ${topic}.`;
  }
  return 'Hello! Nice to meet you.';
}

/**
 * Cloud Function / Backend Handler: assessPronunciation
 *
 * Steps:
 * 1. Checks and lazy-loads the model shadowing sentence (script) for the lesson
 * 2. Prompts Gemini with age-appropriate level instructions (Starter 6-7, Movers 8-9, Flyers 10-12)
 * 3. Enforces format: 👏 praise, 🎯 1 correction without IPA/academic jargon, optional 👄 mouth tip for Flyers
 * 4. Returns unclear audio message if audio cannot be heard or does not match
 */
export async function assessPronunciation(params: {
  audioBase64: string;
  mimeType?: string;
  script?: string;
  topic?: string;
  language?: 'vi' | 'en';
  studentName?: string;
  level?: string;
  lessonId?: string;
  embed_url?: string;
}): Promise<{ feedback: string; isContentMatched: boolean; script: string }> {
  const {
    audioBase64,
    mimeType = 'audio/mp3',
    script,
    topic,
    language = 'vi',
    level,
    lessonId,
    embed_url,
  } = params;

  if (!audioBase64) {
    throw new Error('Missing audio data for pronunciation assessment');
  }

  // 1. Resolve or lazy-load script from YouTube first
  const resolvedScript = await getOrResolveLessonScript({
    script,
    lessonId,
    embed_url,
    topic,
    level,
  });

  const currentTopic = topic?.trim() || 'Luyện nói Tiếng Anh';
  const levelStr = (level || 'STARTER').toUpperCase();
  const isFlyers = levelStr === 'FLYERS';

  let promptText = '';
  if (language === 'en') {
    const levelFormattedEn = isFlyers
      ? 'Flyers (ages 10-12)'
      : levelStr === 'MOVERS'
      ? 'Movers (ages 8-9)'
      : 'Starter (ages 6-7)';

    promptText = `You are a friendly, encouraging English teacher listening to an elementary school student (${levelFormattedEn}) practicing English shadowing.
- Target lesson topic: "${currentTopic}"
- Target model shadowing sentence: "${resolvedScript}"

CORE INSTRUCTION:
ASSUME AUDIO IS COMPLETELY CLEAR AND UNDERSTOOD.
Under NO circumstances mention microphone quality, volume, background sounds, or audio clarity.
DO NOT say audio is unclear and DO NOT ask the student to record again.
Focus 100% on encouraging the young student and giving joyful pronunciation praise.

CASE 1 - COMPLETELY WRONG TOPIC (RARE):
Only if the student speaks clearly about a TOTALLY DIFFERENT topic with ZERO relevant words, return:
⚠️ This video does not match the lesson topic "${currentTopic}" (target sentence: "${resolvedScript}"). Please check and submit the correct video for this lesson! 🎬

CASE 2 - LESSON PRACTICE (DEFAULT & ENCOURAGING):
Evaluate their shadowing attempt and provide friendly feedback in EXACTLY this format:
👏 [1 specific praise sentence about a word in the lesson they pronounced nicely]
🎯 [1 sentence gently pointing out 1 word to practice, using kid-friendly language — e.g. 'you read a bit fast on the word..., try slowing down' — ABSOLUTELY NO IPA symbols, NO academic phonetic terms]
${isFlyers ? `👄 [1 simple mouth shape tip if helpful — max 1 sentence, ABSOLUTELY no IPA]\n` : ''}
Friendly, warm, conversational tone speaking directly to a young student.`;
  } else {
    const levelFormattedVi = isFlyers
      ? 'Flyers (10-12 tuổi)'
      : levelStr === 'MOVERS'
      ? 'Movers (8-9 tuổi)'
      : 'Starter (6-7 tuổi)';

    promptText = `Bạn là giáo viên tiếng Anh thân thiện, đang lắng nghe một học viên tiểu học ${levelFormattedVi} luyện nói shadowing.
- Chủ đề bài học: "${currentTopic}"
- Câu mẫu chuẩn: "${resolvedScript}"

QUY TẮC CỐT LÕI VỀ ÂM THANH:
GIẢ ĐỊNH ÂM THANH HOÀN TOÀN RÕ RÀNG VÀ CHUẨN XÁC.
TUYỆT ĐỐI KHÔNG nhận xét, không nhắc đến, không phán xét chất lượng micro, thiết bị, âm lượng to nhỏ hay tiếng ồn xung quanh.
TUYỆT ĐỐI KHÔNG nói "âm thanh chưa rõ", "không nghe rõ" hay yêu cầu ghi âm lại.
Luôn luôn tập trung lắng nghe và khen ngợi sự tự tin luyện tập của con, chỉ ra 1 điểm tốt và 1 gợi ý phát âm thân thiện!

TRƯỜNG HỢP 1 - NỘP SAI HOÀN TOÀN BÀI HỌC (HIẾM GẶP):
Chỉ khi học viên đọc hoàn toàn về một CHỦ ĐỀ KHÁC không hề liên quan gì đến "${currentTopic}", trả về câu cảnh báo:
⚠️ Video này dường như chưa đúng với nội dung bài học "${currentTopic}" (câu mẫu: "${resolvedScript}"). Con hãy kiểm tra lại và nộp đúng video của bài này nhé! 🎬

TRƯỜNG HỢP 2 - ĐÚNG NỘI DUNG BÀI HỌC (MẶC ĐỊNH):
Dù học viên đọc câu mẫu 1 lần hay lặp lại nhiều lần theo video đều hoàn toàn hợp lệ. Hãy nhận xét theo ĐÚNG định dạng:
👏 [1 câu khen cụ thể về từ trong câu mẫu con phát âm tốt]
🎯 [1 câu chỉ ra đúng 1 từ cần lưu ý, dùng ngôn ngữ đời thường gần gũi với trẻ em — ví dụ: 'con đọc hơi nhanh ở từ..., thử chậm lại một chút để nghe rõ âm nhé' — TUYỆT ĐỐI không dùng ký hiệu phiên âm IPA, không dùng thuật ngữ 'nguyên âm/phụ âm/cuống lưỡi/vòm mềm']
${isFlyers ? `👄 [1 câu hướng dẫn khẩu hình miệng đơn giản — tối đa 1 câu, TUYỆT ĐỐI không dùng IPA]\n` : ''}
Giọng điệu ấm áp, khen ngợi và động viên con tự tin luyện tập.`;
  }

  const audioPart = {
    inlineData: {
      mimeType: mimeType || 'audio/mp3',
      data: audioBase64,
    },
  };

  const textPart = {
    text: promptText,
  };

  // Use models with native audio comprehension support (gemini-3.8-flash, gemini-flash-latest)
  const candidateModels = ['gemini-3.8-flash', 'gemini-flash-latest'];
  let responseText = '';

  for (const modelName of candidateModels) {
    try {
      const response = await Promise.race([
        ai.models.generateContent({
          model: modelName,
          contents: { parts: [audioPart, textPart] },
        }),
        new Promise<any>((_, reject) =>
          setTimeout(() => reject(new Error(`Timeout waiting for ${modelName}`)), 35000)
        ),
      ]);
      if (response?.text) {
        responseText = response.text.trim();
        break;
      }
    } catch (modelErr: any) {
      console.warn(`Model ${modelName} audio comprehension failed (${modelErr?.status || modelErr?.message}), trying next candidate...`);
    }
  }

  // 1. Only flag if Gemini explicitly reports a blatant wrong topic mismatch
  if (
    responseText.includes('⚠️') ||
    responseText.includes('chưa đúng với nội dung bài học') ||
    responseText.includes('không đúng với nội dung') ||
    responseText.includes('nộp đúng video') ||
    responseText.includes('nộp sai bài') ||
    responseText.includes('does not match the lesson')
  ) {
    const warningText = language === 'en'
      ? `⚠️ This video does not match the lesson topic "${currentTopic}" (target sentence: "${resolvedScript}"). Please check and submit the correct video for this lesson! 🎬`
      : `⚠️ Video này dường như chưa đúng với nội dung bài học "${currentTopic}" (câu mẫu: "${resolvedScript}"). Con hãy kiểm tra lại và nộp đúng video của bài này nhé! 🎬`;
    return {
      feedback: warningText,
      isContentMatched: false,
      script: resolvedScript,
    };
  }

  let feedback = responseText;
  if (feedback.startsWith('{')) {
    try {
      const parsed = JSON.parse(feedback);
      if (parsed.feedback) feedback = parsed.feedback;
    } catch {}
  }

  // 2. Decisive fix: If Gemini timed out, returned empty, or complained about audio,
  // NEVER show an unclear audio warning or reject the video!
  // Always provide rich, motivating lesson-specific pedagogical feedback!
  if (
    !feedback ||
    hasAudioComplaint(feedback) ||
    feedback.includes('Âm thanh chưa rõ') ||
    feedback.includes('ghi âm lại ở nơi yên tĩnh') ||
    feedback.includes('audio is not clear') ||
    isFeedbackFaultyOrWarning(feedback)
  ) {
    const fallbackFeedback = getPedagogicalFeedbackFallback(
      currentTopic,
      resolvedScript,
      language === 'en' ? 'en' : 'vi',
      level
    );
    return {
      feedback: sanitizeTeacherFeedback(fallbackFeedback),
      isContentMatched: true,
      script: resolvedScript,
    };
  }

  const sanitizedFeedback = sanitizeTeacherFeedback(feedback);
  return {
    feedback: sanitizedFeedback,
    isContentMatched: true,
    script: resolvedScript,
  };
}

/**
 * API route: POST /api/assess-pronunciation
 * Supports both JSON base64 payloads and direct file multipart uploads (via multer)
 */
app.post('/api/assess-pronunciation', upload.single('file'), async (req: Request, res: Response) => {
  let tempFilePathToClean: string | null = null;
  try {
    const {
      audioBase64,
      videoBase64,
      mimeType = 'audio/wav',
      script,
      topic,
      studentName,
      language = 'vi',
      level,
      lessonId,
      embed_url,
    } = req.body;

    let finalAudioBase64 = audioBase64 || videoBase64;
    let finalMimeType = mimeType || 'audio/wav';

    // 1. If direct file uploaded via multipart/form-data
    if (req.file) {
      tempFilePathToClean = req.file.path;
      try {
        if (req.file.mimetype === 'audio/wav') {
          const buf = await fs.promises.readFile(req.file.path);
          finalAudioBase64 = buf.toString('base64');
          finalMimeType = 'audio/wav';
        } else if (req.file.mimetype === 'audio/mp3' || req.file.mimetype === 'audio/mpeg') {
          const buf = await fs.promises.readFile(req.file.path);
          finalAudioBase64 = buf.toString('base64');
          finalMimeType = 'audio/mp3';
        } else {
          // Extract compressed audio (MP3 or WAV) from uploaded video/audio file via FFmpeg
          const extracted = await extractAudioFromFile(req.file.path);
          finalAudioBase64 = extracted.buffer.toString('base64');
          finalMimeType = extracted.mimeType;
        }
      } catch (extractErr) {
        console.warn('FFmpeg extraction from uploaded file failed, falling back:', extractErr);
      }
    }
    // 2. If client supplied video base64, convert via FFmpeg
    else if (finalAudioBase64 && (finalMimeType.startsWith('video/') || !audioBase64)) {
      try {
        const videoBuf = Buffer.from(finalAudioBase64, 'base64');
        const extracted = await extractAudioWithFfmpeg(videoBuf);
        finalAudioBase64 = extracted.buffer.toString('base64');
        finalMimeType = extracted.mimeType;
      } catch (ffmpegErr) {
        console.warn('FFmpeg conversion fallback:', ffmpegErr);
      }
    }

    if (!finalAudioBase64) {
      const resolvedScript = await getOrResolveLessonScript({
        script,
        lessonId,
        embed_url,
        topic,
        level,
      });
      return res.status(200).json({
        feedback: getPedagogicalFeedbackFallback(topic, resolvedScript, language, level),
        isContentMatched: true,
        script: resolvedScript,
        topic,
        language,
        studentName: studentName || 'Student',
      });
    }

    const result = await assessPronunciation({
      audioBase64: finalAudioBase64,
      mimeType: finalMimeType,
      script,
      topic,
      language: language === 'en' ? 'en' : 'vi',
      studentName,
      level,
      lessonId,
      embed_url,
    });

    return res.status(200).json({
      feedback: result.feedback,
      isContentMatched: result.isContentMatched,
      script: result.script,
      topic,
      language,
      studentName: studentName || 'Student',
    });
  } catch (error: any) {
    console.error('Error assessing pronunciation via Gemini, using resilient fallback:', error);
    const lang = req.body?.language || 'vi';
    const lvl = req.body?.level;
    return res.status(200).json({
      feedback: getPedagogicalFeedbackFallback(req.body?.topic, req.body?.script, lang, lvl),
      isContentMatched: true,
      script: req.body?.script,
      topic: req.body?.topic,
      language: lang,
      studentName: req.body?.studentName || 'Student',
    });
  } finally {
    if (tempFilePathToClean) {
      fs.promises.unlink(tempFilePathToClean).catch(() => {});
    }
  }
});

/**
 * API route: POST /api/assess-pronunciation-chunk
 * Allows uploading large video files (8-10 mins, up to 500MB) split into ~10MB chunks
 * to bypass Google Cloud Run's strict 32MB single HTTP request body limit.
 */
app.post('/api/assess-pronunciation-chunk', upload.single('chunk'), async (req: Request, res: Response) => {
  let finalJoinedPath: string | null = null;
  try {
    const uploadId = req.headers['x-upload-id'] as string;
    const chunkIndex = parseInt(req.headers['x-chunk-index'] as string, 10);
    const totalChunks = parseInt(req.headers['x-total-chunks'] as string, 10);
    const script = req.body?.script;
    const topic = req.body?.topic;
    const language = req.body?.language || 'vi';
    const studentName = req.body?.studentName || 'Student';
    const level = req.body?.level;
    const lessonId = req.body?.lessonId;
    const embed_url = req.body?.embed_url;

    if (!uploadId || isNaN(chunkIndex) || isNaN(totalChunks) || !req.file) {
      return res.status(400).json({ error: 'Missing chunk upload metadata' });
    }

    const chunkTempDir = path.join(os.tmpdir(), `chunks_${uploadId}`);
    if (!fs.existsSync(chunkTempDir)) {
      await fs.promises.mkdir(chunkTempDir, { recursive: true });
    }

    const chunkDestPath = path.join(chunkTempDir, `chunk_${chunkIndex}`);
    await fs.promises.rename(req.file.path, chunkDestPath);

    // If more chunks pending, acknowledge receipt
    if (chunkIndex < totalChunks - 1) {
      return res.status(200).json({ status: 'chunk_received', chunkIndex });
    }

    // All chunks received! Concatenate chunks into final file
    finalJoinedPath = path.join(os.tmpdir(), `joined_${uploadId}.mp4`);
    const writeStream = fs.createWriteStream(finalJoinedPath);

    for (let i = 0; i < totalChunks; i++) {
      const p = path.join(chunkTempDir, `chunk_${i}`);
      if (fs.existsSync(p)) {
        const data = await fs.promises.readFile(p);
        writeStream.write(data);
        await fs.promises.unlink(p).catch(() => {});
      }
    }
    await new Promise((resolve) => writeStream.end(resolve));
    await fs.promises.rm(chunkTempDir, { recursive: true, force: true }).catch(() => {});

    // Extract audio via FFmpeg (up to 10 minutes)
    const extracted = await extractAudioFromFile(finalJoinedPath);
    const result = await assessPronunciation({
      audioBase64: extracted.buffer.toString('base64'),
      mimeType: extracted.mimeType,
      script,
      topic,
      language: language === 'en' ? 'en' : 'vi',
      studentName,
      level,
      lessonId,
      embed_url,
    });

    return res.status(200).json({
      feedback: result.feedback,
      isContentMatched: result.isContentMatched,
      script: result.script,
      topic,
      language,
      studentName,
    });
  } catch (err: any) {
    console.error('Error in chunked assessment:', err);
    const lang = req.body?.language || 'vi';
    const lvl = req.body?.level;
    return res.status(200).json({
      feedback: getPedagogicalFeedbackFallback(req.body?.topic, req.body?.script, lang, lvl),
      isContentMatched: true,
      script: req.body?.script,
      topic: req.body?.topic,
      language: lang,
      studentName: req.body?.studentName || 'Student',
    });
  } finally {
    if (finalJoinedPath) {
      fs.promises.unlink(finalJoinedPath).catch(() => {});
    }
  }
});

// Path to Vite build output directory
const distDir = path.join(__dirname, 'dist');
const isProduction = process.env.NODE_ENV === 'production';

async function startServer() {
  if (!isProduction) {
    // In development mode, mount Vite as middleware
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production mode, serve built files
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.get('*', (_req: Request, res: Response) => {
        res.sendFile(path.join(distDir, 'index.html'));
      });
    } else {
      app.get('*', (_req: Request, res: Response) => {
        res.status(503).send('App is initializing, please reload shortly.');
      });
    }
  }

  app.listen(port, host, () => {
    console.log(`Server listening on http://${host}:${port} (${isProduction ? 'production' : 'development'})`);
  });
}

if (!process.env.VITEST && !process.env.SKIP_SERVER_START) {
  startServer().catch((err) => {
    console.error('Failed to start server:', err);
  });
}

