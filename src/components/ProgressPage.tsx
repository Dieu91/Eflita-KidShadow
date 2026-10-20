import React, { useState } from 'react';
import {
  Trophy,
  Flame,
  CheckCircle2,
  ExternalLink,
  Calendar,
  Clock,
  Video,
  Award,
  Sparkles,
  GraduationCap
} from 'lucide-react';
import { Submission, UserProfile, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { CertificateModal } from './CertificateModal';
import { sanitizeTeacherFeedback, isFeedbackFaultyOrWarning, hasAudioComplaint } from '../utils/sanitizeFeedback';
import { getDetailedPedagogicalFeedback } from '../utils/feedbackGenerator';

interface ProgressPageProps {
  userProfile: UserProfile;
  submissions: Submission[];
  streak: number;
  onOpenChampionModal?: () => void;
  lang: Language;
}

export const ProgressPage: React.FC<ProgressPageProps> = ({
  userProfile,
  submissions,
  streak,
  onOpenChampionModal,
  lang,
}) => {
  const t = getTranslation(lang);
  const [showCertificate, setShowCertificate] = useState<boolean>(false);

  // User's submissions count for the level (maximum 21)
  const completedCount = Math.min(21, submissions.length);
  const percent = Math.min(100, Math.round((completedCount / 21) * 100));

  return (
    <div className="max-w-xl w-full mx-auto py-4 sm:py-6 px-3 sm:px-4 space-y-5 sm:space-y-6 pb-28 min-w-0">
      {/* Header Profile Badge */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-3 border-amber-200 flex items-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-amber-300/40 shrink-0 overflow-hidden">
          {userProfile.photo_url ? (
            <img
              src={userProfile.photo_url}
              alt={userProfile.student_name}
              className="w-full h-full object-cover"
            />
          ) : (
            userProfile.student_name.slice(0, 1).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-lg sm:text-xl font-black text-slate-800 font-['Fredoka',sans-serif] truncate">
              {userProfile.student_name}
            </h2>
            <span className="text-[11px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
              {userProfile.level}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t.parentName}: <span className="font-bold text-slate-700">{userProfile.parent_name}</span> • 📞 {userProfile.phone}
          </p>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Total Progress */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-4 sm:p-5 border-2 border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider">
              {t.overallProgress}
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-200 flex items-center justify-center text-emerald-800">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-950 font-['Fredoka',sans-serif]">
            {percent}%
          </div>
          <p className="text-xs font-bold text-emerald-700 mt-1">
            {completedCount}/21 {t.completedLessons.toLowerCase()}
          </p>
          {/* Progress bar */}
          <div className="w-full h-2.5 bg-emerald-200 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Streak Days */}
        <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-3xl p-4 sm:p-5 border-2 border-orange-200 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-orange-800 uppercase tracking-wider">
              {t.currentStreak}
            </span>
            <div className="w-8 h-8 rounded-xl bg-orange-200 flex items-center justify-center text-orange-800">
              <Flame className="w-4 h-4 text-orange-600 fill-orange-500 animate-bounce" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-orange-950 font-['Fredoka',sans-serif]">
            {streak}
          </div>
          <p className="text-xs font-bold text-orange-700 mt-1">
            {t.streakDays}
          </p>
          <div className="mt-3 text-[11px] font-bold text-orange-800/80">
            {streak >= 3 ? 'Kỷ luật quá đỉnh! 🔥' : 'Cố gắng mỗi ngày nhé!'}
          </div>
        </div>
      </div>

      {/* Automated Graduation Certificate Banner */}
      {completedCount >= 21 ? (
        <div className="bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 rounded-3xl p-4 sm:p-5 border-3 border-yellow-300 shadow-lg text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/50 flex items-center justify-center text-2xl shadow-xs shrink-0">
              🎓
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/60 px-2 py-0.5 rounded-full inline-block">
                Hoàn thành 21/21 bài học
              </span>
              <h3 className="font-black text-base font-['Fredoka',sans-serif] mt-0.5">
                Bằng Khen Kỷ Niệm Tốt Nghiệp
              </h3>
              <p className="text-xs font-bold text-amber-900/90">
                Tự động cấp chứng nhận vinh danh học viên Eflita
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCertificate(true)}
            className="bg-white hover:bg-amber-50 text-amber-950 font-black text-xs px-4 py-2.5 rounded-2xl shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
          >
            <GraduationCap className="w-4 h-4 text-amber-600" />
            <span>Xem & Tải Giấy Khen</span>
          </button>
        </div>
      ) : (
        <div className="bg-white/80 rounded-2xl p-3.5 border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900 shadow-2xs">
          <span className="text-lg shrink-0">🎯</span>
          <p className="font-semibold leading-relaxed">
            Học viên hoàn thành đủ <strong>21/21 video</strong> sẽ được <strong>hệ thống tự động cấp Giấy Khen Tốt Nghiệp Eflita</strong> kèm liên kết vinh danh!
          </p>
        </div>
      )}

      {/* Champion Unlock CTA Banner if 21/21 completed */}
      {completedCount >= 21 && onOpenChampionModal && (
        <div
          onClick={onOpenChampionModal}
          className="bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 rounded-3xl p-4 sm:p-5 border-3 border-yellow-500 shadow-lg text-yellow-950 flex items-center justify-between cursor-pointer hover:opacity-95 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/40 flex items-center justify-center text-2xl">
              🏆
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base font-['Fredoka',sans-serif]">
                Shadowing Champion
              </h3>
              <p className="text-xs font-bold text-yellow-900/90">
                Đã hoàn thành 21/21! Bấm để xác nhận bài cảm nhận
              </p>
            </div>
          </div>
          <Award className="w-6 h-6 text-yellow-950" />
        </div>
      )}

      {/* Submissions History List */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-md border-3 border-amber-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-slate-100">
          <h3 className="font-extrabold text-base text-slate-800 font-['Fredoka',sans-serif] flex items-center gap-2">
            <Video className="w-5 h-5 text-amber-600" />
            <span>{t.submissionsHistory}</span>
          </h3>
          <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full">
            {submissions.length} bài
          </span>
        </div>

        {submissions.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs sm:text-sm font-semibold">
            {t.noSubmissionsYet}
          </div>
        ) : (
          <div className="space-y-3 divide-y divide-slate-100">
            {submissions.map((sub, index) => {
              const subDate = new Date(sub.submitted_at);
              return (
                <div key={sub.id || index} className="pt-3 first:pt-0 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700 font-black text-xs shrink-0 mt-0.5">
                      #{submissions.length - index}
                    </div>
                    <div>
                      <div className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                        <span>{sub.lesson_topic || `Tuần ${sub.week} - Bài ${sub.order}`}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-100 rounded-md text-slate-600">
                          W{sub.week}.{sub.order}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {subDate.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </span>
                        {sub.duration > 0 && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>{sub.duration} {t.seconds}</span>
                          </span>
                        )}
                      </div>

                      {sub.pronunciation_feedback && (() => {
                        let cleanFb = sanitizeTeacherFeedback(sub.pronunciation_feedback);
                        if (hasAudioComplaint(cleanFb) || isFeedbackFaultyOrWarning(cleanFb)) {
                          cleanFb = getDetailedPedagogicalFeedback(
                            sub.lesson_topic || 'Luyện nói Tiếng Anh',
                            '',
                            lang === 'en' ? 'en' : 'vi',
                            sub.level
                          );
                        }
                        const isMismatch = cleanFb.includes('⚠️') ||
                                           cleanFb.includes('chưa đúng') ||
                                           cleanFb.includes('không đúng') ||
                                           cleanFb.includes('nộp sai') ||
                                           cleanFb.includes('lạc đề');
                        return (
                          <div className={`mt-2 p-2.5 rounded-xl border text-[11px] leading-relaxed text-left ${
                            isMismatch
                              ? 'bg-amber-50/95 border-amber-300 shadow-2xs'
                              : 'bg-gradient-to-r from-indigo-50/90 to-purple-50/80 border-indigo-200/80'
                          }`}>
                            <div className={`flex items-center gap-1.5 font-bold mb-1 ${
                              isMismatch ? 'text-amber-900' : 'text-indigo-900'
                            }`}>
                              <span>{isMismatch ? '⚠️' : '👩‍🏫'}</span>
                              <span>{isMismatch ? 'Lưu ý từ Giáo viên (Video chưa đúng bài):' : 'Giáo viên nhận xét:'}</span>
                            </div>
                            <p className={`whitespace-pre-line ${isMismatch ? 'text-amber-950 font-semibold' : 'text-slate-700 italic'}`}>
                              "{cleanFb}"
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  </div>

                  {sub.drive_link && (
                    <a
                      href={sub.drive_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-bold flex items-center gap-1 shrink-0 transition"
                      title={t.viewInDrive}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Drive</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Certificate Modal */}
      <CertificateModal
        isOpen={showCertificate}
        onClose={() => setShowCertificate(false)}
        userProfile={userProfile}
        lang={lang}
      />
    </div>
  );
};
