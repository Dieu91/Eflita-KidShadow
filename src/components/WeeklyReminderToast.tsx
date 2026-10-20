import React from 'react';
import { Sparkles, ArrowRight, X, Flame, Target } from 'lucide-react';
import { Language } from '../types';
import { getTranslation } from '../i18n/translations';

// Configurable constant for weekly target
export const WEEKLY_TARGET = 3;

interface WeeklyReminderToastProps {
  currentWeek: number;
  submittedCountInWeek: number;
  onLearnNow: () => void;
  onDismiss: () => void;
  lang: Language;
}

export const WeeklyReminderToast: React.FC<WeeklyReminderToastProps> = ({
  currentWeek,
  submittedCountInWeek,
  onLearnNow,
  onDismiss,
  lang,
}) => {
  const t = getTranslation(lang);

  // If already reached weekly target, do not display
  if (submittedCountInWeek >= WEEKLY_TARGET) {
    return null;
  }

  const missing = WEEKLY_TARGET - submittedCountInWeek;

  // Determine dynamic message based on missing count
  let dynamicMessage = '';
  if (missing === 3) {
    dynamicMessage = t.weeklyReminder.missing3;
  } else if (missing === 2) {
    // If WEEKLY_TARGET is 3, 1 submitted: "Con đã nộp 1/3 video tuần này, cố lên nhé!"
    dynamicMessage = t.weeklyReminder.missing2;
  } else if (missing === 1) {
    dynamicMessage = t.weeklyReminder.missing1;
  } else {
    dynamicMessage = t.weeklyReminder.genericMissing(submittedCountInWeek, WEEKLY_TARGET);
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-4 shadow-xl shadow-amber-500/25 border-3 border-amber-300 text-amber-950 flex flex-col gap-2.5 relative">
        {/* Dismiss Button */}
        <button
          onClick={onDismiss}
          className="absolute top-2.5 right-2.5 p-1 text-amber-900/70 hover:text-amber-950 hover:bg-white/30 rounded-full transition cursor-pointer"
          title="Đóng thông báo"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header: Week Pill & Target badge */}
        <div className="flex items-center gap-2 pr-6">
          <span className="bg-amber-950 text-amber-200 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
            <Target className="w-3 h-3 text-amber-300" />
            <span>{t.weeklyReminder.weekBadge(currentWeek)}</span>
          </span>
          <span className="text-xs font-bold text-amber-900 bg-white/40 px-2 py-0.5 rounded-full">
            {submittedCountInWeek}/{WEEKLY_TARGET} {t.video.toLowerCase()}
          </span>
        </div>

        {/* Message */}
        <p className="text-xs sm:text-sm font-extrabold text-amber-950 leading-snug">
          {dynamicMessage}
        </p>

        {/* Action Button */}
        <div className="pt-0.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 text-[11px] font-bold text-amber-900/80">
            <Sparkles className="w-3.5 h-3.5 text-amber-800" />
            <span>{missing} {t.video.toLowerCase()} nữa</span>
          </div>

          <button
            onClick={onLearnNow}
            className="bg-amber-950 hover:bg-black text-white px-4 py-2 rounded-2xl text-xs font-black shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer font-['Fredoka',sans-serif]"
          >
            <span>{t.weeklyReminder.learnNowBtn}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
