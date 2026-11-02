import React, { useState } from 'react';
import { Check, Play, Sparkles } from 'lucide-react';
import { Language, Lesson, LevelType, Submission, UserProfile } from '../types';
import { EXTRA_ID_PREFIX, EXTRA_VIDEOS, ExtraVideo, getExtraEmbedUrl } from '../data/extraVideos';

interface ExtraPracticePageProps {
  userProfile: UserProfile;
  submissions: Submission[];
  onSelectLesson: (lesson: Lesson) => void;
  lang: Language;
}

const LEVELS: { id: LevelType; label: string; icon: string }[] = [
  { id: 'STARTER', label: 'Starters', icon: '🌱' },
  { id: 'MOVERS', label: 'Movers', icon: '🧭' },
  { id: 'FLYERS', label: 'Flyers', icon: '🚀' },
];

// Biến video luyện thêm thành "bài học" để dùng chung màn hình xem, quay và nộp bài
export const toExtraLesson = (v: ExtraVideo): Lesson => ({
  id: `${EXTRA_ID_PREFIX}${v.id}`,
  level: v.level,
  week: 0,
  order: v.order,
  topic: v.title,
  embed_url: getExtraEmbedUrl(v.youtubeId),
  script: '',
});

export const ExtraPracticePage: React.FC<ExtraPracticePageProps> = ({
  userProfile,
  submissions,
  onSelectLesson,
  lang,
}) => {
  const vi = lang === 'vi';
  const [level, setLevel] = useState<LevelType>(userProfile.level);

  const submittedIds = new Set(submissions.map((s) => s.lesson_id));
  const videos = EXTRA_VIDEOS.filter((v) => v.level === level).sort((a, b) => a.order - b.order);
  const doneCount = videos.filter((v) => submittedIds.has(`${EXTRA_ID_PREFIX}${v.id}`)).length;

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-5 sm:py-8 space-y-5">
      <div className="bg-gradient-to-br from-amber-100 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-3xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center gap-2 text-amber-950">
          <Sparkles className="w-5 h-5 text-amber-600" />
          <h2 className="font-black text-lg sm:text-xl font-['Fredoka',sans-serif]">
            {vi ? 'Luyện thêm' : 'Extra Practice'}
          </h2>
        </div>
        <p className="text-xs sm:text-sm font-bold text-amber-900/90 mt-1.5 leading-relaxed">
          {vi
            ? 'Các video ngắn để con luyện nói thêm. Xem video, nhại lại thật to rồi quay video của con và nộp bài giống như các bài chính nhé! Các bài luyện thêm không tính vào lộ trình 21 bài.'
            : 'Short videos for extra speaking practice. Watch, repeat out loud, then record and submit your own video just like the main lessons! Extra videos are not part of the 21-lesson path.'}
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-black border-2 cursor-pointer transition active:scale-95 ${
              level === l.id
                ? 'bg-amber-400 border-amber-500 text-amber-950 shadow-xs'
                : 'bg-white border-amber-200 text-amber-800 hover:bg-amber-50'
            }`}
          >
            {l.icon} {l.label}
            {l.id === userProfile.level && (
              <span className="ml-1 text-[10px] font-bold opacity-70">{vi ? '(của con)' : '(yours)'}</span>
            )}
          </button>
        ))}
        <span className="ml-auto text-xs font-black text-amber-900 bg-amber-100 px-2.5 py-1 rounded-full">
          {doneCount}/{videos.length} {vi ? 'đã nộp' : 'submitted'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {videos.map((v) => {
          const done = submittedIds.has(`${EXTRA_ID_PREFIX}${v.id}`);
          return (
            <button
              key={v.id}
              onClick={() => onSelectLesson(toExtraLesson(v))}
              className={`text-left rounded-2xl border-2 p-3 sm:p-4 transition cursor-pointer active:scale-95 hover:shadow-md ${
                done ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-amber-200 hover:border-amber-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                  {v.id}
                </span>
                {done ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Play className="w-4 h-4 text-amber-500 fill-amber-400" />
                )}
              </div>
              <div className="mt-2 text-sm font-black text-slate-800 leading-snug">{v.title}</div>
              {done && (
                <div className="mt-1 text-[11px] font-bold text-emerald-700">
                  {vi ? 'Đã nộp bài ✓' : 'Submitted ✓'}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
