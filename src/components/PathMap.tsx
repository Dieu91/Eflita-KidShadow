import React, { useState } from 'react';
import { Check, Lock, Play, Star, Sparkles, Gift, Film, Map as MapIcon, ArrowRight, Video } from 'lucide-react';
import { Lesson, Submission, Language, LevelType } from '../types';
import { getTranslation } from '../i18n/translations';

interface PathMapProps {
  lessons: Lesson[];
  submissions: Submission[];
  onSelectLesson: (lesson: Lesson) => void;
  onOpenChampionModal: () => void;
  lang: Language;
  currentLevel?: LevelType;
  onChangeLevel?: (level: LevelType) => void;
}

export const PathMap: React.FC<PathMapProps> = ({
  lessons,
  submissions,
  onSelectLesson,
  onOpenChampionModal,
  lang,
  currentLevel,
  onChangeLevel,
}) => {
  const t = getTranslation(lang);

  // View mode: 'videos' (default inline embedded video list) or 'map' (interactive gamified path)
  const [viewMode, setViewMode] = useState<'videos' | 'map'>('videos');

  // Group lessons by week 1 to 7
  const weeks = [1, 2, 3, 4, 5, 6, 7];

  // Map of completed lesson IDs
  const completedLessonIds = new Set(submissions.map((s) => s.lesson_id));

  // Find current active lesson (first uncompleted lesson in order)
  let foundCurrent = false;
  const lessonStatuses = lessons.map((lesson) => {
    const isCompleted = completedLessonIds.has(lesson.id);
    let isCurrent = false;
    let isLocked = false;

    if (isCompleted) {
      // completed
    } else if (!foundCurrent) {
      isCurrent = true;
      foundCurrent = true;
    } else {
      isLocked = true;
    }

    return {
      lesson,
      isCompleted,
      isCurrent,
      isLocked,
    };
  });

  const allCompleted = lessons.length > 0 && lessons.every((l) => completedLessonIds.has(l.id));

  // Sinuous horizontal offset pattern for nodes (left, center, right)
  const getOffsetClass = (order: number) => {
    switch (order) {
      case 1:
        return '-translate-x-3 sm:-translate-x-12';
      case 2:
        return 'translate-x-0';
      case 3:
        return 'translate-x-3 sm:translate-x-12';
      default:
        return 'translate-x-0';
    }
  };

  return (
    <div className="max-w-4xl w-full mx-auto py-4 sm:py-6 px-3 sm:px-4 relative pb-28 min-w-0">
      {/* Top Map Intro Card & View Mode Switcher */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 rounded-3xl p-4 sm:p-5 text-amber-950 shadow-lg shadow-amber-300/40 border-2 border-amber-300 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-black uppercase tracking-wider bg-white/40 px-2.5 py-0.5 rounded-full inline-block">
            🗺️ 7 Tuần / 21 Video Bài Học
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-['Fredoka',sans-serif] mt-1">
            {t.embeddedVideosTitle}
          </h2>
          <p className="text-xs sm:text-sm font-bold text-amber-900/90 mt-0.5">
            {completedLessonIds.size}/21 {t.completedBadge.toLowerCase()} • {t.embeddedVideosSubtitle}
          </p>
        </div>

        {/* View Switcher Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-amber-950/15 rounded-2xl self-start sm:self-center shrink-0">
          <button
            onClick={() => setViewMode('videos')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'videos'
                ? 'bg-white text-amber-950 shadow-sm'
                : 'text-amber-950/80 hover:bg-white/30'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>{t.viewModeVideos}</span>
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              viewMode === 'map'
                ? 'bg-white text-amber-950 shadow-sm'
                : 'text-amber-950/80 hover:bg-white/30'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>{t.viewModeMap}</span>
          </button>
        </div>
      </div>

      {/* Quick Level Switcher Bar */}
      {onChangeLevel && currentLevel && (
        <div className="bg-white/95 backdrop-blur-xs border-2 border-amber-200 rounded-2xl p-2 sm:p-2.5 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
          <div className="flex items-center gap-2 pl-1">
            <span className="text-xs font-black uppercase tracking-wider text-slate-500">
              {lang === 'vi' ? 'Cấp độ đang học:' : 'Current Level:'}
            </span>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
              {currentLevel}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-1.5 p-1 bg-amber-50 rounded-xl border border-amber-200 w-full sm:w-auto">
            {(
              [
                { id: 'STARTER', label: 'Starter', age: '6-7t', icon: '🌱', activeClass: 'from-emerald-400 to-teal-500 text-white shadow-emerald-200' },
                { id: 'MOVERS', label: 'Movers', age: '8-9t', icon: '🧭', activeClass: 'from-sky-400 to-blue-500 text-white shadow-sky-200' },
                { id: 'FLYERS', label: 'Flyers', age: '10-12t', icon: '🚀', activeClass: 'from-orange-400 to-amber-500 text-white shadow-orange-200' },
              ] as const
            ).map((item) => {
              const isActive = currentLevel === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onChangeLevel(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 font-['Fredoka',sans-serif] ${
                    isActive
                      ? `bg-gradient-to-r ${item.activeClass} shadow-md scale-102`
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                  title={`${item.label} (${item.age})`}
                >
                  <span className="text-sm">{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="text-[10px] font-normal hidden md:inline opacity-80">
                    ({item.age})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 1: WEEKLY EMBEDDED VIDEOS GALLERY (DIRECT EMBEDDED VIDEO VIEW)       */}
      {/* ========================================================================= */}
      {viewMode === 'videos' && (
        <div className="space-y-8 animate-in fade-in duration-200">
          {weeks.map((weekNum) => {
            const weekLessons = lessonStatuses.filter((item) => item.lesson.week === weekNum);
            const weekCompletedCount = weekLessons.filter((i) => i.isCompleted).length;
            const isWeekFinished = weekCompletedCount === 3;

            return (
              <div
                key={weekNum}
                className="bg-white rounded-3xl p-4 sm:p-6 border-3 border-amber-200 shadow-md relative overflow-hidden"
              >
                {/* Week Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b border-amber-100 gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center font-black text-amber-950 text-base shadow-sm font-['Fredoka',sans-serif]">
                      W{weekNum}
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg text-slate-800 font-['Fredoka',sans-serif] flex items-center gap-2">
                        <span>{t.week} {weekNum}</span>
                        <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full font-sans">
                          Chặng {weekNum}
                        </span>
                      </h3>
                      <p className="text-xs font-bold text-slate-500">
                        {weekCompletedCount}/3 {t.completedBadge.toLowerCase()}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isWeekFinished ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Hoàn thành 3/3 video</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100/70 px-3 py-1 rounded-full border border-amber-200">
                        <span>Mục tiêu tuần: 3 video</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* 3 Embedded Videos for this Week */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {weekLessons.map((item) => {
                    const { lesson, isCompleted, isCurrent } = item;

                    return (
                      <div
                        key={lesson.id}
                        className={`rounded-2xl border-2 transition-all p-3 flex flex-col justify-between ${
                          isCompleted
                            ? 'bg-emerald-50/60 border-emerald-200 shadow-xs'
                            : isCurrent
                            ? 'bg-amber-50/70 border-amber-400 shadow-md ring-2 ring-amber-300/60'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        {/* Video Embed Header */}
                        <div className="mb-2">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-black uppercase text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              {t.video} {lesson.order}
                            </span>
                            {isCompleted ? (
                              <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>{t.completedBadge}</span>
                              </span>
                            ) : isCurrent ? (
                              <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200 px-2 py-0.5 rounded-full animate-pulse">
                                Bài tiếp theo 🔥
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
                                Sẵn sàng
                              </span>
                            )}
                          </div>
                          <h4 className="text-sm font-black text-slate-800 truncate font-['Fredoka',sans-serif]">
                            {lesson.topic}
                          </h4>
                        </div>

                        {/* Responsive Embedded YouTube Player */}
                        <div className="aspect-video w-full rounded-xl overflow-hidden border-2 border-slate-300/80 bg-black shadow-xs relative">
                          <iframe
                            src={lesson.embed_url}
                            title={`${lesson.topic} - W${lesson.week}V${lesson.order}`}
                            className="w-full h-full"
                            allowFullScreen
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          />
                        </div>

                        {/* Action: Practice and Submit Video */}
                        <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectLesson(lesson)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer font-['Fredoka',sans-serif] ${
                              isCompleted
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-amber-400 hover:bg-amber-500 text-amber-950 border border-amber-500'
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>{isCompleted ? t.practiceAgain : t.watchAndPractice}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GAMIFIED PATH MAP (CIRCULAR PATH VIEW)                           */}
      {/* ========================================================================= */}
      {viewMode === 'map' && (
        <div className="space-y-12 animate-in fade-in duration-200">
          {weeks.map((weekNum) => {
            const weekLessons = lessonStatuses.filter((item) => item.lesson.week === weekNum);
            const weekCompletedCount = weekLessons.filter((i) => i.isCompleted).length;
            const isWeekFinished = weekCompletedCount === 3;

            return (
              <div key={weekNum} className="relative">
                {/* Week Header Banner */}
                <div className="relative z-10 flex items-center justify-between bg-white/90 backdrop-blur-xs border-2 border-amber-200 rounded-2xl px-4 py-2.5 shadow-sm mb-8">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-black text-amber-950 text-sm shadow-xs">
                      W{weekNum}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-800 font-['Fredoka',sans-serif]">
                        {t.week} {weekNum}
                      </h3>
                      <span className="text-[11px] font-bold text-slate-500">
                        {weekCompletedCount}/3 {t.completedBadge.toLowerCase()}
                      </span>
                    </div>
                  </div>

                  {isWeekFinished ? (
                    <span className="flex items-center gap-1 text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Xong</span>
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                      Chặng {weekNum}
                    </span>
                  )}
                </div>

                {/* Sinuous Dotted Path connecting nodes */}
                <div className="flex flex-col items-center gap-8 relative overflow-x-hidden w-full py-2">
                  {weekLessons.map((item) => {
                    const { lesson, isCompleted, isCurrent, isLocked } = item;
                    const offsetClass = getOffsetClass(lesson.order);

                    return (
                      <div
                        key={lesson.id}
                        className={`flex flex-col items-center transition-transform ${offsetClass}`}
                      >
                        {/* Interactive circular node (Duolingo Style 3D Button) */}
                        <button
                          type="button"
                          onClick={() => onSelectLesson(lesson)}
                          className={`relative w-18 h-18 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all transform active:scale-90 cursor-pointer ${
                            isCompleted
                              ? 'bg-emerald-500 border-b-6 border-emerald-700 text-white shadow-lg shadow-emerald-400/40 hover:bg-emerald-400'
                              : isCurrent
                              ? 'bg-amber-400 border-b-6 border-amber-600 text-amber-950 shadow-xl shadow-amber-300/60 ring-6 ring-amber-300 ring-offset-2 animate-pulse hover:bg-amber-300'
                              : 'bg-amber-100 border-b-6 border-amber-300 text-amber-900 hover:bg-amber-200'
                          }`}
                        >
                          {/* Node Icon */}
                          {isCompleted ? (
                            <div className="flex flex-col items-center">
                              <Check className="w-8 h-8 stroke-[3.5] drop-shadow-xs" />
                            </div>
                          ) : isCurrent ? (
                            <div className="flex flex-col items-center">
                              <Play className="w-8 h-8 fill-amber-950 stroke-[2.5] ml-1 drop-shadow-xs" />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center">
                              <Film className="w-6 h-6 stroke-[2]" />
                            </div>
                          )}

                          {/* Order pill badge */}
                          <div
                            className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full text-[11px] font-black flex items-center justify-center shadow-xs border-2 border-white ${
                              isCompleted
                                ? 'bg-emerald-700 text-white'
                                : isCurrent
                                ? 'bg-amber-600 text-white'
                                : 'bg-amber-500 text-white'
                            }`}
                          >
                            {lesson.order}
                          </div>
                        </button>

                        {/* Topic Name Label */}
                        <div className="mt-2 text-center max-w-[150px]">
                          <span
                            className={`text-xs font-extrabold px-2.5 py-1 rounded-xl shadow-2xs block truncate ${
                              isCompleted
                                ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                                : isCurrent
                                ? 'bg-amber-100 text-amber-950 border border-amber-300'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {lesson.topic}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Week Reward Star/Chest Milestone */}
                  <div className="my-2 flex items-center justify-center">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-md border-2 ${
                        isWeekFinished
                          ? 'bg-yellow-400 border-yellow-500 text-yellow-950 shadow-yellow-300/50'
                          : 'bg-amber-100/60 border-amber-200 text-amber-700 opacity-60'
                      }`}
                    >
                      {isWeekFinished ? (
                        <Star className="w-6 h-6 fill-yellow-900 text-yellow-900 animate-spin" />
                      ) : (
                        <Gift className="w-6 h-6" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Final Champion Castle / Trophy Stage at the end of Week 7 */}
      <div className="mt-14 pt-8 text-center border-t-2 border-dashed border-amber-300">
        <div
          onClick={allCompleted ? onOpenChampionModal : undefined}
          className={`p-6 rounded-3xl border-4 transition-all ${
            allCompleted
              ? 'bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-400 border-yellow-500 shadow-xl shadow-yellow-400/50 cursor-pointer transform hover:scale-102'
              : 'bg-white/80 border-slate-200 text-slate-400 opacity-80'
          }`}
        >
          <div className="w-20 h-20 mx-auto mb-3 rounded-3xl bg-white/90 shadow-md flex items-center justify-center text-4xl">
            🏆
          </div>
          <h3 className="text-xl font-black font-['Fredoka',sans-serif] text-slate-800">
            Shadowing Champion
          </h3>
          <p className="text-xs font-bold text-slate-600 mt-1 max-w-xs mx-auto">
            {allCompleted
              ? 'Chúc mừng con đã hoàn thành 21/21 video! Bấm vào đây để mở khóa điều kiện dự thi!'
              : 'Hoàn thành trọn vẹn 21 video của 7 tuần để mở khóa Vòng Chung Kết!'}
          </p>

          {allCompleted && (
            <button
              onClick={onOpenChampionModal}
              className="mt-4 px-6 py-2.5 bg-yellow-950 text-white font-black text-xs rounded-full shadow-lg hover:bg-yellow-900 transition cursor-pointer"
            >
              Mở khóa ngay 🌟
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
