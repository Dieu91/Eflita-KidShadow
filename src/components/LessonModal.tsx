import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Film,
  Sparkles,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson, Submission, UserProfile, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { uploadVideoToDrive, extractVideoDuration, DriveUploadProgress } from '../services/drive';
import { createSubmission, getAccessToken, connectGoogleDrive } from '../services/firebase';
import { evaluateMotivationalFeedback, FeedbackRuleResult } from '../utils/feedbackRules';

// Số video của mỗi cấp độ (Starter / Movers / Flyers)
const TOTAL_VIDEOS_PER_LEVEL = 21;

// Các mốc tiến độ được ăn mừng bằng pháo giấy lớn hơn
const MILESTONES = [1, 7, 14, 20, 21];

const GENERAL_MESSAGES_VI = [
  '🎉 Giỏi lắm! Con đã nộp bài rồi. Mỗi ngày luyện một chút, con sẽ nói tiếng Anh tự tin hơn nhé!',
  '👏 Con thật dũng cảm khi nói tiếng Anh hôm nay! Hãy giữ thói quen luyện tập này nhé!',
  '🌟 Tuyệt vời! Luyện tập đều đặn là bí quyết để con tiến bộ mỗi ngày.',
  '💪 Con làm tốt lắm! Hẹn con ở video tiếp theo nhé!',
];

const GENERAL_MESSAGES_EN = [
  '🎉 Great job! You submitted your video. A little practice every day makes you more confident!',
  '👏 You were so brave speaking English today! Keep up this great habit!',
  '🌟 Awesome! Practicing regularly is the secret to getting better every day.',
  '💪 Well done! See you at the next video!',
];

function getProgressMessage(done: number, lang: Language): string {
  const total = TOTAL_VIDEOS_PER_LEVEL;
  const isEn = lang === 'en';

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
  if (done === 7) {
    return isEn
      ? `🎉 Amazing! ${done}/${total} videos done, you are one third of the way there! Keep this habit going!`
      : `🎉 Tuyệt vời! Con đã hoàn thành ${done}/${total} video, đi được 1/3 chặng đường rồi. Giữ thói quen luyện tập này nhé!`;
  }
  if (done === 14) {
    return isEn
      ? `🎉 Amazing! ${done}/${total} videos done, you are two thirds of the way there! Keep this habit going!`
      : `🎉 Tuyệt vời! Con đã hoàn thành ${done}/${total} video, đi được 2/3 chặng đường rồi. Giữ thói quen luyện tập này nhé!`;
  }

  const list = isEn ? GENERAL_MESSAGES_EN : GENERAL_MESSAGES_VI;
  return list[Math.floor(Math.random() * list.length)];
}

interface LessonModalProps {
  lesson: Lesson;
  userProfile: UserProfile;
  existingSubmissions: Submission[];
  onClose: () => void;
  onSubmissionSuccess: (newSubmission: Submission, feedback: FeedbackRuleResult) => void;
  lang: Language;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  userProfile,
  existingSubmissions,
  onClose,
  onSubmissionSuccess,
  lang,
}) => {
  const t = getTranslation(lang);

  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [detectedDuration, setDetectedDuration] = useState<number>(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<DriveUploadProgress | null>(null);
  const [uploadError, setUploadError] = useState<string>('');
  const [justSubmitted, setJustSubmitted] = useState<boolean>(false);
  const [feedbackResult, setFeedbackResult] = useState<FeedbackRuleResult | null>(null);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Submissions for this specific lesson
  const lessonSubmissions = existingSubmissions.filter((s) => s.lesson_id === lesson.id);
  const isCompleted = lessonSubmissions.length > 0;

  // Handle file selection and metadata extraction
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError('');

    // Extract duration from browser video element
    try {
      const dur = await extractVideoDuration(file);
      setDetectedDuration(dur);
    } catch {
      setDetectedDuration(0);
    }

    // Prompt Workspace confirmation dialog
    setShowConfirmDialog(true);
  };

  // Perform upload to Google Drive and save to Firestore
  const handleConfirmUpload = async () => {
    if (!selectedFile) return;

    if (userProfile.uid === 'guest') {
      setUploadError(
        lang === 'vi'
          ? 'Bạn đang ở chế độ xem trước bài học. Vui lòng đăng nhập với tài khoản Google để tải video lên Drive và lưu tiến độ nhé!'
          : 'You are previewing lessons. Please sign in with Google to upload your video and save progress!'
      );
      setShowConfirmDialog(false);
      return;
    }

    setShowConfirmDialog(false);
    setIsUploading(true);
    setUploadError('');

    try {
      let driveLink = '';
      let accessToken = getAccessToken();

      // Gracefully attempt Drive connection if not yet authorized
      if (!accessToken) {
        setUploadProgress({
          percent: 15,
          status: 'locating_folder',
          message: lang === 'vi' ? 'Đang chuẩn bị nộp bài & kết nối...' : 'Preparing submission...'
        });
        try {
          accessToken = await connectGoogleDrive();
        } catch (driveErr) {
          console.warn('Google Drive authorization skipped, proceeding directly:', driveErr);
        }
      }

      // If Drive access is available, upload to Google Drive
      if (accessToken) {
        try {
          setUploadProgress({
            percent: 30,
            status: 'uploading',
            message: lang === 'vi' ? 'Đang lưu video vào Google Drive của con...' : 'Uploading video to Google Drive...'
          });
          const driveResult = await uploadVideoToDrive(
            accessToken,
            selectedFile,
            lesson.topic,
            userProfile.student_name,
            (progress) => setUploadProgress(progress)
          );
          driveLink = driveResult.driveLink;
        } catch (uploadErr) {
          console.warn('Google Drive upload failed, continuing with direct practice record:', uploadErr);
        }
      } else {
        // Direct practice submission without Drive blocker
        setUploadProgress({
          percent: 45,
          status: 'uploading',
          message: lang === 'vi' ? 'Đang gửi bài nói đến Giáo viên...' : 'Submitting speaking practice to teacher...'
        });
      }

      // Create submission document in Firestore
      const newSubData: Omit<Submission, 'id'> = {
        user_id: userProfile.uid,
        lesson_id: lesson.id,
        drive_link: driveLink || '',
        duration: detectedDuration || 30, // fallback
        submitted_at: new Date().toISOString(),
        level: lesson.level,
        week: lesson.week,
        order: lesson.order,
        lesson_topic: lesson.topic,
      };

      const subId = await createSubmission(newSubData);
      const fullSubmission: Submission = { ...newSubData, id: subId };

      // Calculate rule-based motivational feedback
      const allSubs = [fullSubmission, ...existingSubmissions];
      const feedback = evaluateMotivationalFeedback(
        fullSubmission,
        allSubs,
        userProfile.created_at,
        lang
      );

      // Progress: number of distinct videos completed in this level (including the one just submitted)
      const doneCount = new Set(
        allSubs.filter((s) => s.level === lesson.level).map((s) => s.lesson_id)
      ).size;
      setCompletedCount(doneCount);
      setProgressMessage(getProgressMessage(doneCount, lang));

      // Confetti: bigger burst at milestones
      const isMilestone = MILESTONES.includes(doneCount);
      confetti({
        particleCount: isMilestone ? 220 : 80,
        spread: isMilestone ? 110 : 70,
        origin: { y: 0.6 },
      });

      setFeedbackResult(feedback);
      setJustSubmitted(true);
      onSubmissionSuccess(fullSubmission, feedback);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-2xl border-4 border-amber-300 relative my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-amber-100/80 px-5 py-4 border-b-2 border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-400 flex items-center justify-center font-black text-amber-950 shadow-xs">
              <Film className="w-5 h-5 text-amber-950" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-amber-700">
                {t.week} {lesson.week} • {t.video} {lesson.order}
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-800 font-['Fredoka',sans-serif] leading-tight">
                {lesson.topic}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-white rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* YouTube Video Player */}
          <div className="rounded-2xl overflow-hidden shadow-md border-2 border-amber-200 bg-black aspect-video relative">
            <iframe
              src={lesson.embed_url}
              title={lesson.topic}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          {/* Detailed Step 1 & 2 Shadowing Guide Card */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50/40 to-amber-50 rounded-2xl border-2 border-amber-300 p-3.5 sm:p-4 space-y-3 shadow-xs">
            {/* Guide Header */}
            <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
              <div className="flex items-center gap-2">
                <span className="text-base">🎯</span>
                <h4 className="font-black text-xs sm:text-sm text-amber-950 font-['Fredoka',sans-serif]">
                  {t.watchVideoPrompt}
                </h4>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200/70 text-amber-900 px-2 py-0.5 rounded-full">
                Eflita Shadowing
              </span>
            </div>

            {/* Step 1 Card: Nghe & Bắt chước */}
            <div className="bg-white/95 rounded-xl p-3 border border-amber-200/90 shadow-2xs space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-amber-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <h5 className="font-extrabold text-xs text-amber-950">
                  {t.step1Title}
                </h5>
              </div>
              <ul className="text-xs text-slate-700 space-y-1 pl-6 list-disc leading-relaxed">
                <li>{t.step1Rule1}</li>
                <li>{t.step1Rule2}</li>
                <li>{t.step1Rule3}</li>
              </ul>
              <div className="pl-6 pt-1">
                <p className="text-[11px] font-bold text-amber-800 bg-amber-100/70 px-2.5 py-1 rounded-lg inline-block border border-amber-200">
                  💡 {t.step1Tip}
                </p>
              </div>
            </div>

            {/* Step 2 Guide Card: Ghi âm / Quay video */}
            <div className="bg-white/95 rounded-xl p-3 border border-sky-200 shadow-2xs space-y-1.5 text-left">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-sky-500 text-white font-black text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <h5 className="font-extrabold text-xs text-sky-950">
                  {t.step2GuideTitle}
                </h5>
              </div>
              <ul className="text-xs text-slate-700 space-y-1 pl-6 list-disc leading-relaxed">
                <li>{t.step2GuideRule1}</li>
                <li>
                  <span className="font-semibold text-sky-900">{t.step2GuideRule2}</span>
                </li>
                <li>{t.step2GuideRule3}</li>
              </ul>
            </div>
          </div>

          {/* Congratulation banner when a submission just happened */}
          {justSubmitted && feedbackResult && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-100 via-teal-100 to-green-100 border-3 border-emerald-300 shadow-md animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{feedbackResult.highlightIcon}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5 font-['Fredoka',sans-serif]">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{t.uploadSuccess}</span>
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-emerald-800 mt-1">
                    {feedbackResult.message}
                  </p>

                  {/* Progress bar + milestone / encouragement message */}
                  {completedCount > 0 && (
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-extrabold text-emerald-900">
                        <span>📚 {lang === 'vi' ? 'Tiến độ của con' : 'Your progress'}</span>
                        <span>
                          {Math.min(completedCount, TOTAL_VIDEOS_PER_LEVEL)}/{TOTAL_VIDEOS_PER_LEVEL}
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-white/70 rounded-full overflow-hidden border border-emerald-200">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (completedCount / TOTAL_VIDEOS_PER_LEVEL) * 100)}%`,
                          }}
                        />
                      </div>
                      {progressMessage && (
                        <p className="text-xs sm:text-sm font-bold text-emerald-800 pt-0.5">
                          {progressMessage}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Existing Submissions List */}
          {isCompleted && (
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold text-slate-700">
                <span className="flex items-center gap-1 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{t.completedBadge} ({lessonSubmissions.length})</span>
                </span>
                <span className="text-[11px] text-slate-500 font-normal">
                  {new Date(lessonSubmissions[0].submitted_at).toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US')}
                </span>
              </div>
              {lessonSubmissions[0].drive_link && (
                <a
                  href={lessonSubmissions[0].drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t.viewInDrive}</span>
                  {lessonSubmissions[0].duration > 0 && (
                    <span className="text-slate-500 font-normal ml-1">
                      ({lessonSubmissions[0].duration} {t.seconds})
                    </span>
                  )}
                </a>
              )}
            </div>
          )}

          {/* Video Upload Section */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs sm:text-sm font-extrabold text-slate-800 uppercase tracking-wider">
              {t.uploadVideoPrompt}
            </h4>

            {/* Hidden Input for file selection */}
            <input
              type="file"
              ref={fileInputRef}
              accept="video/*"
              onChange={handleFileChange}
              className="hidden"
            />

            {/* Upload Button */}
            {!isUploading ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black py-3.5 px-4 rounded-2xl shadow-lg shadow-amber-300/40 border-2 border-amber-400 flex items-center justify-center gap-2 active:scale-98 transition font-['Fredoka',sans-serif] text-sm sm:text-base cursor-pointer"
              >
                {isCompleted ? (
                  <>
                    <RotateCcw className="w-5 h-5 text-amber-900" />
                    <span>{t.practiceAgain} & {t.uploadBtn}</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5 text-amber-900" />
                    <span>{t.uploadBtn}</span>
                  </>
                )}
              </button>
            ) : (
              /* Upload Progress Bar */
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-300 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                    <span>{uploadProgress?.message || t.uploadingFile}</span>
                  </span>
                  <span>{uploadProgress?.percent || 20}%</span>
                </div>
                <div className="w-full h-3 bg-amber-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress?.percent || 20}%` }}
                  />
                </div>
              </div>
            )}

            {/* Note on Google Drive storage */}
            <p className="text-[11px] text-slate-500 font-medium text-center">
              {t.driveFolderNote}
            </p>

            {uploadError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500 mt-0.5" />
                <span>{uploadError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
          >
            {t.close}
          </button>
        </div>
      </div>

      {/* Mandatory User Confirmation Dialog before Workspace API Mutation */}
      {showConfirmDialog && selectedFile && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-2xl border-4 border-amber-300 animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 mx-auto mb-3 flex items-center justify-center text-amber-600">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <h3 className="text-lg font-black text-center text-slate-800 font-['Fredoka',sans-serif]">
              {t.confirmDriveUploadTitle}
            </h3>
            <p className="text-xs text-slate-600 mt-2 text-center leading-relaxed">
              {t.confirmDriveUploadDesc}
            </p>

            {/* Selected File Details */}
            <div className="my-4 p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs space-y-1 text-slate-700">
              <div className="font-bold truncate">📁 {selectedFile.name}</div>
              <div className="text-slate-500">
                📦 {Math.round((selectedFile.size / (1024 * 1024)) * 10) / 10} MB
                {detectedDuration > 0 && ` • ⏱️ ${detectedDuration} ${t.seconds}`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowConfirmDialog(false);
                  setSelectedFile(null);
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 rounded-xl text-xs transition cursor-pointer"
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleConfirmUpload}
                className="py-2.5 px-4 bg-emerald-500 hover:bg-emerald-600 font-black text-white rounded-xl text-xs shadow-md transition cursor-pointer"
              >
                {t.confirmBtn}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
