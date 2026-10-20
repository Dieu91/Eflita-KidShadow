/**
 * Utility to strictly remove and sanitize all mentions of "Cô giáo AI", "Cô giáo Gemini",
 * "AI", "Gemini", "Trí tuệ nhân tạo", "Robot", and replace with "Giáo viên".
 * Also removes international phonetic alphabet (IPA) and academic jargon
 * ("nguyên âm/phụ âm/cuống lưỡi/vòm mềm") to keep feedback kid-friendly.
 */

export const UNCLEAR_AUDIO_MESSAGE_VI = 'Âm thanh chưa rõ lắm, con thử ghi âm lại ở nơi yên tĩnh hơn nhé! 🎙️';
export const UNCLEAR_AUDIO_MESSAGE_EN = 'The audio is not clear enough, try recording again in a quiet place! 🎙️';

const INAPPROPRIATE_PATTERNS = [
  /\b(bitch|shit|fuck|damn|ass|dick|pussy|bastard|cunt|slut|whore)\b/i,
  /\b(đụ|địt|lồn|cặc|buồi|chó đẻ|đĩ|mẹ kiếp)\b/i,
];

export function containsInappropriateContent(text?: string | null): boolean {
  if (!text) return false;
  return INAPPROPRIATE_PATTERNS.some((pattern) => pattern.test(text));
}

export const AUDIO_COMPLAINT_PATTERNS = [
  /âm\s*thanh/i,
  /không\s*rõ/i,
  /chưa\s*rõ/i,
  /không\s*nghe\s*(thấy|được|rõ)/i,
  /chưa\s*nghe\s*(thấy|được|rõ)/i,
  /tạp\s*âm/i,
  /tiếng\s*ồn/i,
  /ghi\s*âm\s*lại/i,
  /nơi\s*yên\s*tĩnh/i,
  /âm\s*lượng/i,
  /quá\s*nhỏ/i,
  /micro/i,
  /chất\s*lượng\s*âm/i,
  /unclear/i,
  /not\s*clear/i,
  /cannot\s*hear/i,
  /hard\s*to\s*hear/i,
  /quiet\s*place/i,
  /re-record/i,
  /audio\s*quality/i,
];

export function hasAudioComplaint(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  return AUDIO_COMPLAINT_PATTERNS.some((pattern) => pattern.test(text));
}

export function isFeedbackWarningOrUnclear(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  return (
    trimmed.includes('⚠️') ||
    trimmed.includes('chưa đúng với nội dung') ||
    trimmed.includes('không đúng với nội dung') ||
    trimmed.includes('nộp đúng video') ||
    trimmed.includes('nộp sai bài') ||
    trimmed.includes('does not match the lesson')
  );
}

export function isFeedbackFaultyOrWarning(text?: string | null): boolean {
  if (!text || typeof text !== 'string') return true;
  const trimmed = text.trim();
  if (trimmed.length < 10) return true;
  if (containsInappropriateContent(trimmed)) return true;

  // Never accept any audio complaints - always trigger auto-repair with positive pedagogical feedback
  if (hasAudioComplaint(trimmed)) {
    return true;
  }

  // Legit wrong-topic warnings
  if (isFeedbackWarningOrUnclear(trimmed)) {
    return false;
  }

  // Explicitly valid: formatted with praise and tip
  if (trimmed.includes('👏') || trimmed.includes('🎯')) {
    return false;
  }

  // Reject unparsed raw code/JSON or old erroneous warnings
  if (
    trimmed.startsWith('{') ||
    trimmed.startsWith('```') ||
    trimmed.includes('"feedback":') ||
    trimmed.includes('từ vựng trọng tâm') ||
    trimmed.includes('prepositions of place')
  ) {
    return true;
  }

  return false;
}

export function sanitizeTeacherFeedback(text?: string | null): string {
  if (!text) return '';

  let result = text;

  // 1. Specific composite teacher terms first
  result = result.replace(/cô\s*giáo\s*(ai|gemini)/gi, 'Giáo viên');
  result = result.replace(/thầy\s*giáo\s*(ai|gemini)/gi, 'Giáo viên');
  result = result.replace(/thầy\s*cô\s*(ai|gemini)/gi, 'Giáo viên');

  // 2. Standalone "cô giáo" -> "Giáo viên"
  result = result.replace(/cô\s*giáo/gi, 'Giáo viên');

  // 3. Remove/replace remaining "AI" or "Gemini" references
  result = result.replace(/trí\s*tuệ\s*nhân\s*tạo/gi, 'Giáo viên');
  result = result.replace(/công\s*nghệ\s*ai/gi, 'Giáo viên');
  result = result.replace(/\bgemini\b/gi, 'Giáo viên');
  result = result.replace(/\bAI\b/g, 'Giáo viên');

  // 4. Remove IPA notations like /.../ to strictly follow requirement: TUYỆT ĐỐI không dùng IPA
  result = result.replace(/\/[a-zA-Zˈˌːæɑɔəɛɪʊʌθðʃʒŋ\.:-]+\//g, '');

  // 5. Remove prohibited academic jargon terms
  result = result.replace(/\b(nguyên âm|phụ âm|cuống lưỡi|vòm mềm|vòm họng)\b/gi, 'âm');

  // 6. Clean up any awkward repetitions like "Giáo viên Giáo viên"
  result = result.replace(/(giáo\s*viên\s*)+/gi, 'Giáo viên ');
  result = result.replace(/nhận\s*xét\s*từ\s*Giáo\s*viên\s*Giáo\s*viên/gi, 'nhận xét từ Giáo viên');
  result = result.replace(/của\s*Giáo\s*viên\s*Giáo\s*viên/gi, 'của Giáo viên');

  // Clean double spaces created by removals
  result = result.replace(/  +/g, ' ');

  return result.trim();
}


