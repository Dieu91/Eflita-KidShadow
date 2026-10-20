import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Play,
  Film,
  Sparkles,
  Clock,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Lesson, Submission, UserProfile, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { uploadVideoToDrive, extractVideoDuration, DriveUploadProgress } from '../services/drive';
import { createSubmission, getAccessToken, connectGoogleDrive, updateSubmissionFeedback } from '../services/firebase';
import { evaluateMotivationalFeedback, FeedbackRuleResult } from '../utils/feedbackRules';
import { extractAudioFromVideo } from '../utils/audioExtractor';
import { requestPronunciationAssessment } from '../services/geminiService';
import {
  sanitizeTeacherFeedback,
  isFeedbackFaultyOrWarning,
  hasAudioComplaint,
  UNCLEAR_AUDIO_MESSAGE_VI,
  UNCLEAR_AUDIO_MESSAGE_EN,
} from '../utils/sanitizeFeedback';
import { getDetailedPedagogicalFeedback } from '../utils/feedbackGenerator';

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
  const [isGeminiAssessing, setIsGeminiAssessing] = useState<boolean>(false);
  const [geminiFeedback, setGeminiFeedback] = useState<string | null>(null);
  const [isContentMatched, setIsContentMatched] = useState<boolean>(true);

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
      // Start audio extraction concurrently for Gemini pronunciation assessment
      const audioExtractPromise = extractAudioFromVideo(selectedFile).catch((audioErr) => {
        console.warn('Audio extraction warning:', audioErr);
        return null;
      });

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

      // Trigger Confetti
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });

      // Calculate rule-based motivational feedback
      const allSubs = [fullSubmission, ...existingSubmissions];
      const feedback = evaluateMotivationalFeedback(
        fullSubmission,
        allSubs,
        userProfile.created_at,
        lang
      );

      setFeedbackResult(feedback);
      setJustSubmitted(true);
      onSubmissionSuccess(fullSubmission, feedback);

      // Trigger Teacher Pronunciation Assessment immediately via FormData upload
      setIsGeminiAssessing(true);
      const currentSelectedFile = selectedFile;
      const richDefaultPraise = getDetailedPedagogicalFeedback(lesson.topic, lesson.script, lang, lesson.level);

      requestPronunciationAssessment({
        file: currentSelectedFile,
        script: lesson.script,
        topic: lesson.topic,
        studentName: userProfile.student_name,
        level: lesson.level,
        language: lang,
        lessonId: lesson.id,
        embed_url: lesson.embed_url,
      })
      .then(async (aiResult) => {
        let sanitizedAiFeedback = sanitizeTeacherFeedback(aiResult.feedback || richDefaultPraise);
        // Decisive fix: Never show "unclear audio" - always replace with rich pedagogical feedback
        if (
          hasAudioComplaint(sanitizedAiFeedback) ||
          isFeedbackFaultyOrWarning(sanitizedAiFeedback) ||
          sanitizedAiFeedback.includes('Âm thanh chưa rõ') ||
          sanitizedAiFeedback.includes('ghi âm lại ở nơi yên tĩnh') ||
          sanitizedAiFeedback.includes('audio is not clear')
        ) {
          sanitizedAiFeedback = richDefaultPraise;
        }
        setGeminiFeedback(sanitizedAiFeedback);
        const isMatched = typeof aiResult.isContentMatched === 'boolean'
          ? aiResult.isContentMatched
          : true;
        setIsContentMatched(isMatched);
        fullSubmission.pronunciation_feedback = sanitizedAiFeedback;

        // Sync lazy-loaded script to local lesson object if returned
        if (aiResult.script && aiResult.script !== lesson.script) {
          lesson.script = aiResult.script;
        }

        if (subId) {
          await updateSubmissionFeedback(subId, sanitizedAiFeedback, userProfile.uid);
        }
        // Update parent state so progress records have the new feedback
        onSubmissionSuccess(fullSubmission, feedback);
      })
      .catch((assessErr) => {
        console.warn('Teacher assessment error fallback to pedagogical praise:', assessErr);
        const fallbackMsg = richDefaultPraise;
        setGeminiFeedback(fallbackMsg);
        setIsContentMatched(true);
        fullSubmission.pronunciation_feedback = fallbackMsg;
        if (subId) {
          updateSubmissionFeedback(subId, fallbackMsg, userProfile.uid).catch(() => {});
        }
      })
      .finally(() => {
        setIsGeminiAssessing(false);
      });
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

          {/* Motivational Feedback Banner when submission just happened */}
          {justSubmitted && feedbackResult && (
            <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-100 via-teal-100 to-green-100 border-3 border-emerald-300 shadow-md animate-in slide-in-from-top duration-300">
              <div className="flex items-start gap-3">
                <span className="text-3xl shrink-0">{feedbackResult.highlightIcon}</span>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950 flex items-center gap-1.5 font-['Fredoka',sans-serif]">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>{t.uploadSuccess}</span>
                  </h4>
                  <p className="text-xs sm:text-sm font-bold text-emerald-800 mt-1">
                    {feedbackResult.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Khối riêng: Nhận xét phát âm (Requirement 4, 5, 6, 7) */}
          {/* LƯU Ý QUAN TRỌNG: Đây là nhận xét định tính hỗ trợ động viên hàng tuần, KHÔNG dùng để chấm điểm hay xếp hạng trong vòng thi Shadowing Champion (vòng thi vẫn do giám khảo con người chấm như quy trình đã thiết kế). */}
          {justSubmitted && (
            isGeminiAssessing ? (
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/70 to-pink-50 border-3 border-purple-300 shadow-md text-left relative overflow-hidden animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                    🎙️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-extrabold text-sm text-purple-950 font-['Fredoka',sans-serif]">
                        {lang === 'vi' ? 'Nhận xét phát âm' : 'Pronunciation Feedback'}
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                        {lang === 'vi' ? 'Giáo viên' : 'Teacher'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5 py-3 text-xs font-bold text-purple-800 animate-pulse bg-white/70 rounded-xl px-3 border border-purple-100">
                      <Sparkles className="w-4 h-4 text-purple-600 animate-spin shrink-0" />
                      <span>
                        {lang === 'vi'
                          ? 'Đang lắng nghe con luyện tập và kiểm tra nội dung bài, quay lại sau vài giây nhé! 🎧'
                          : 'Listening to your practice & verifying lesson content, check back in a few seconds! 🎧'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : !isContentMatched ? (
              /* Warning Card: Video Content Mismatch */
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 border-3 border-amber-400 shadow-md text-left relative overflow-hidden animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                    ⚠️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-extrabold text-sm text-amber-950 font-['Fredoka',sans-serif]">
                        {lang === 'vi' ? 'Video chưa đúng nội dung bài học' : 'Video Content Mismatch'}
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full border border-amber-300">
                        {lang === 'vi' ? 'Cần quay lại' : 'Needs retry'}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed mb-3 whitespace-pre-line bg-white/80 p-3 rounded-2xl border border-amber-200 shadow-2xs">
                      {sanitizeTeacherFeedback(geminiFeedback)}
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-xs rounded-xl shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{lang === 'vi' ? 'Chọn lại đúng video của bài này' : 'Select correct video for this lesson'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Success Card: Positive Pronunciation Feedback */
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-purple-50 via-indigo-50/70 to-pink-50 border-3 border-purple-300 shadow-md text-left relative overflow-hidden animate-in fade-in duration-300">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-pink-500 text-white flex items-center justify-center text-xl shadow-xs shrink-0">
                    🎙️
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h4 className="font-extrabold text-sm text-purple-950 font-['Fredoka',sans-serif]">
                        {lang === 'vi' ? 'Nhận xét phát âm' : 'Pronunciation Feedback'}
                      </h4>
                      <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                        {lang === 'vi' ? 'Giáo viên' : 'Teacher'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2.5 leading-relaxed">
                      {lang === 'vi'
                        ? 'Nhận xét định tính hỗ trợ luyện tập hàng tuần • Không dùng để chấm điểm hay xếp hạng vòng thi'
                        : 'Qualitative weekly practice feedback • Not used for contest scoring or ranking'}
                    </p>

                    <div className="bg-white/95 rounded-2xl p-3.5 border border-purple-100 text-xs sm:text-sm text-slate-800 leading-relaxed shadow-2xs font-medium whitespace-pre-line">
                      {sanitizeTeacherFeedback(geminiFeedback)}
                    </div>
                  </div>
                </div>
              </div>
            )
          )}

          {/* Show previous pronunciation feedback if available */}
          {!justSubmitted && isCompleted && lessonSubmissions[0]?.pronunciation_feedback && (() => {
            let prevFb = sanitizeTeacherFeedback(lessonSubmissions[0].pronunciation_feedback);
            if (
              hasAudioComplaint(prevFb) ||
              isFeedbackFaultyOrWarning(prevFb) ||
              prevFb.includes('Âm thanh chưa rõ') ||
              prevFb.includes('ghi âm lại ở nơi yên tĩnh') ||
              prevFb.includes('audio is not clear')
            ) {
              prevFb = getDetailedPedagogicalFeedback(lesson.topic, lesson.script, lang, lesson.level);
            }
            return (
              <div className="p-4 rounded-3xl border-2 text-left space-y-2 bg-gradient-to-br from-purple-50/90 to-indigo-50/80 border-purple-200">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🎙️</span>
                  <div>
                    <h5 className="text-xs font-extrabold text-slate-900 font-['Fredoka',sans-serif]">
                      {lang === 'vi' ? 'Nhận xét phát âm bài luyện tập gần nhất' : 'Previous Pronunciation Feedback'}
                    </h5>
                    <p className="text-[10px] text-slate-500">
                      {lang === 'vi'
                        ? 'Nhận xét định tính từ Giáo viên • Không tính điểm xếp hạng'
                        : 'Qualitative teacher feedback • Not used for contest scoring'}
                    </p>
                  </div>
                </div>
                <div className="bg-white/90 p-3 rounded-xl border border-slate-100 text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {prevFb}
                </div>
              </div>
            );
          })()}

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
