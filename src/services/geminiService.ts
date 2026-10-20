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

import { Language } from '../types';
import { getDetailedPedagogicalFeedback } from '../utils/feedbackGenerator';
import { UNCLEAR_AUDIO_MESSAGE_VI, UNCLEAR_AUDIO_MESSAGE_EN } from '../utils/sanitizeFeedback';

export interface AssessPronunciationParams {
  audioBase64?: string;
  file?: File;
  mimeType?: string;
  script?: string;
  topic?: string;
  studentName?: string;
  level?: string;
  language?: Language;
  lessonId?: string;
  embed_url?: string;
}

export interface AssessPronunciationResponse {
  feedback: string;
  isContentMatched: boolean;
  script?: string;
  topic?: string;
  language?: Language;
}

export async function requestPronunciationAssessment(
  params: AssessPronunciationParams
): Promise<AssessPronunciationResponse> {
  const isEn = params.language === 'en';
  try {
    let res!: globalThis.Response;

    // If direct file is provided
    if (params.file) {
      // For large files (>20MB) such as 8-10 min videos, upload in 10MB chunks
      // to easily bypass Cloud Run's strict 32MB single HTTP request body limit
      if (params.file.size > 20 * 1024 * 1024) {
        const CHUNK_SIZE = 10 * 1024 * 1024; // 10MB
        const totalChunks = Math.ceil(params.file.size / CHUNK_SIZE);
        const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(params.file.size, start + CHUNK_SIZE);
          const chunkBlob = params.file.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunkBlob, params.file.name);
          if (params.script) formData.append('script', params.script);
          if (params.topic) formData.append('topic', params.topic);
          if (params.studentName) formData.append('studentName', params.studentName);
          if (params.level) formData.append('level', params.level);
          if (params.language) formData.append('language', params.language);
          if (params.lessonId) formData.append('lessonId', params.lessonId);
          if (params.embed_url) formData.append('embed_url', params.embed_url);

          res = await fetch('/api/assess-pronunciation-chunk', {
            method: 'POST',
            headers: {
              'x-upload-id': uploadId,
              'x-chunk-index': String(i),
              'x-total-chunks': String(totalChunks),
            },
            body: formData,
          });

          if (!res.ok) {
            const errData = await res.json().catch(() => ({}));
            throw new Error(errData.details || errData.error || `Chunk ${i} failed`);
          }
        }
      } else {
        // Direct FormData upload for files <= 20MB
        const formData = new FormData();
        formData.append('file', params.file);
        if (params.script) formData.append('script', params.script);
        if (params.topic) formData.append('topic', params.topic);
        if (params.studentName) formData.append('studentName', params.studentName);
        if (params.level) formData.append('level', params.level);
        if (params.language) formData.append('language', params.language);
        if (params.lessonId) formData.append('lessonId', params.lessonId);
        if (params.embed_url) formData.append('embed_url', params.embed_url);

        res = await fetch('/api/assess-pronunciation', {
          method: 'POST',
          body: formData,
        });
      }
    } else {
      res = await fetch('/api/assess-pronunciation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });
    }

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      console.warn('Backend assessment returned status:', res.status, errorData);
      throw new Error(errorData.details || errorData.error || 'Assessment failed');
    }

    const data: AssessPronunciationResponse = await res.json();
    return {
      feedback: data.feedback,
      isContentMatched: typeof data.isContentMatched === 'boolean' ? data.isContentMatched : true,
      script: data.script,
      topic: data.topic,
      language: data.language,
    };
  } catch (error) {
    console.error('requestPronunciationAssessment error fallback:', error);
    const fallbackMsg = getDetailedPedagogicalFeedback(
      params.topic,
      params.script,
      params.language || 'vi',
      params.level
    );
    return {
      feedback: fallbackMsg,
      isContentMatched: true,
      script: params.script,
    };
  }
}
