import React, { useEffect, useState } from 'react';
import { Check, Play, X, Sparkles } from 'lucide-react';
import { Language, LevelType, UserProfile } from '../types';
import { EXTRA_VIDEOS, ExtraVideo, getExtraEmbedUrl } from '../data/extraVideos';

interface ExtraPracticePageProps {
  userProfile: UserProfile;
  lang: Language;
}

const LEVELS: { id: LevelType; label: string; icon: string }[] = [
  { id: 'STARTER', label: 'Starters', icon: '🌱' },
  { id: 'MOVERS', label: 'Movers', icon: '🧭' },
  { id: 'FLYERS', label: 'Flyers', icon: '🚀' },
];

const readWatched = (uid: string): string[] => {
  try {
    const raw = localStorage.getItem(`kidshadow_extra_watched_${uid}`);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

export const ExtraPracticePage: React.FC<ExtraPracticePageProps> = ({ userProfile, lang }) => {
  const vi = lang === 'vi';
  const [level, setLevel] = useState<LevelType>(userProfile.level);
  const [watched, setWatched] = useState<string[]>(() => readWatched(userProfile.uid));
  const [active, setActive] = useState<ExtraVideo | null>(null);

  useEffect(() => {
    setWatched(readWatched(userProfile.uid));
  }, [userProfile.uid]);

  const markWatched = (id: string) => {
    setWatched((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(`kidshadow_extra_watched_${userProfile.uid}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const videos = EXTRA_VIDEOS.filter((v) => v.level === level).sort((a, b) => a.order - b.order);
  const doneCount = videos.filter((v) => watched.includes(v.id)).length;

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
            ? 'Các video ngắn để con luyện nói thêm mỗi ngày. Nghe thật kỹ, nhại lại thật to, rồi nghe lại để so giọng của mình nhé! Mục này không tính vào lộ trình 21 bài.'
            : 'Short videos for extra daily speaking practice. Listen closely, repeat out loud, then listen again to compare! These are not part of the 21-lesson path.'}
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
          {doneCount}/{videos.length} {vi ? 'đã xem' : 'watched'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {videos.map((v) => {
          const done = watched.includes(v.id);
          return (
            <button
              key={v.id}
              onClick={() => setActive(v)}
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
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/70 backdrop-blur-xs"
          onClick={() => setActive(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl border-4 border-amber-300 shadow-2xl p-3 sm:p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-black text-sm text-slate-900 font-['Fredoka',sans-serif]">{active.title}</h3>
              <button
                onClick={() => setActive(null)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full cursor-pointer"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black mx-auto aspect-[9/16] max-h-[65vh]">
              <iframe
                src={getExtraEmbedUrl(active.youtubeId)}
                title={active.title}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
            <button
              onClick={() => {
                markWatched(active.id);
                setActive(null);
              }}
              className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-2.5 rounded-2xl text-xs sm:text-sm cursor-pointer font-['Fredoka',sans-serif]"
            >
              {watched.includes(active.id)
                ? vi ? 'Đóng' : 'Close'
                : vi ? 'Con đã luyện xong ✓' : "I've practised ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
