import { Language } from '../types';

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
  // Tùy chọn: số video học viên đã nộp (tính cả bài vừa nộp) và tổng số video
  completedCount?: number;
  totalCount?: number;
}

export interface AssessPronunciationResponse {
  feedback: string;
  isContentMatched: boolean;
  script?: string;
  topic?: string;
  language?: Language;
}

const DEFAULT_TOTAL = 21;

const GENERAL_VI = [
  '🎉 Giỏi lắm! Con đã nộp bài rồi. Mỗi ngày luyện một chút, con sẽ nói tiếng Anh tự tin hơn nhé!',
  '👏 Con thật dũng cảm khi nói tiếng Anh hôm nay! Hãy giữ thói quen luyện tập này nhé!',
  '🌟 Tuyệt vời! Luyện tập đều đặn là bí quyết để con tiến bộ mỗi ngày.',
  '💪 Con làm tốt lắm! Hẹn con ở video tiếp theo nhé!',
];

const GENERAL_EN = [
  '🎉 Great job! You submitted your video. A little practice every day makes you more confident!',
  '👏 You were so brave speaking English today! Keep up this great habit!',
  '🌟 Awesome! Practicing regularly is the secret to getting better every day.',
  '💪 Well done! See you at the next video!',
];

function pick(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}

function buildMessage(params: AssessPronunciationParams): string {
  const isEn = params.language === 'en';
  const done = params.completedCount;
  const total = params.totalCount || DEFAULT_TOTAL;

  if (typeof done === 'number' && done > 0) {
    if (done >= total) {
      return isEn
        ? `🏆 You finished ${total}/${total} videos! Don't forget to write your reflection post in the Eflita community to join the Shadowing Champion contest!`
        : `🏆 Con đã hoàn thành ${total}/${total} video! Đừng quên viết bài cảm nhận trên cộng đồng Eflita để được xét vào cuộc thi Shadowing Champion nhé!`;
    }
    if (done === total - 1) {
      return isEn
        ? '🔥 Only 1 more video to go! You can do it!'
        : '🔥 Chỉ còn 1 video nữa thôi! Cố lên con nhé!';
    }
    if (done === 1) {
      return isEn
        ? '🌟 Congratulations on your first video! Your English journey has begun. A little every day!'
        : '🌟 Chúc mừng con đã nộp video đầu tiên! Hành trình luyện nói tiếng Anh của con bắt đầu rồi. Mỗi ngày một chút nhé!';
    }
    if (done === 7 || done === 14) {
      const part = done === 7 ? (isEn ? 'one third' : '1/3') : (isEn ? 'two thirds' : '2/3');
      return isEn
        ? `🎉 Amazing! ${done}/${total} videos done, you are ${part} of the way there! Keep this habit going!`
        : `🎉 Tuyệt vời! Con đã hoàn thành ${done}/${total} video, đi được ${part} chặng đường rồi. Giữ thói quen luyện tập này nhé!`;
    }
    const base = pick(isEn ? GENERAL_EN : GENERAL_VI);
    return isEn
      ? `${base}\n📚 You have completed ${done}/${total} videos.`
      : `${base}\n📚 Con đã hoàn thành ${done}/${total} video.`;
  }

  return pick(isEn ? GENERAL_EN : GENERAL_VI);
}

// Không còn gửi video lên server hay gọi Gemini: chỉ trả về lời chúc mừng ngay lập tức.
export async function requestPronunciationAssessment(
  params: AssessPronunciationParams
): Promise<AssessPronunciationResponse> {
  return {
    feedback: buildMessage(params),
    isContentMatched: true,
    script: params.script,
    topic: params.topic,
    language: params.language,
  };
}
