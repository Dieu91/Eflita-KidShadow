import React, { useState } from 'react';
import { Trophy, Sparkles, RotateCcw, Play, CheckCircle2, ChevronDown, ChevronUp, ShieldCheck, Flame, X } from 'lucide-react';
import { Lesson, Submission, ReflectionPost, ContestRegistration, Language } from '../types';

interface AdminChampionTestBarProps {
  lessons: Lesson[];
  submissions: Submission[];
  reflectionPost: ReflectionPost | null;
  contestRegistration: ContestRegistration | null;
  onSimulate21: () => void;
  onSimulate20: () => void;
  onReset: () => void;
  onOpenChampionModal: () => void;
  onOpenChampionArena?: () => void;
  onCloseTestMode: () => void;
  lang: Language;
}

export const AdminChampionTestBar: React.FC<AdminChampionTestBarProps> = ({
  lessons,
  submissions,
  reflectionPost,
  contestRegistration,
  onSimulate21,
  onSimulate20,
  onReset,
  onOpenChampionModal,
  onOpenChampionArena,
  onCloseTestMode,
  lang,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const completedLessonIds = new Set(submissions.map((s) => s.lesson_id));
  const completedCount = completedLessonIds.size;
  const isQualified = completedCount >= 21;
  const hasReflection = !!reflectionPost;
  const hasRegistered = !!contestRegistration;

  return (
    <aside
      aria-label="Admin Champion Testing Panel"
      className="fixed bottom-3 left-3 right-3 sm:left-auto sm:right-4 sm:bottom-4 z-40 max-w-sm sm:max-w-md sm:w-auto bg-slate-900/95 text-white rounded-3xl shadow-2xl border-2 border-yellow-400 backdrop-blur-md transition-all overflow-hidden"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-yellow-500 via-amber-500 to-yellow-600 text-yellow-950 font-black text-xs">
        <div className="flex items-center gap-1.5 font-['Fredoka',sans-serif]">
          <Trophy className="w-4 h-4 text-yellow-950 fill-yellow-950" />
          <span>🛠️ Test Admin: Shadowing Champion</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-yellow-400/50 rounded-lg transition text-yellow-950 cursor-pointer"
            title={isCollapsed ? 'Mở rộng' : 'Thu nhỏ'}
          >
            {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          <button
            onClick={onCloseTestMode}
            className="p-1 hover:bg-yellow-400/50 rounded-lg transition text-yellow-950 cursor-pointer"
            title="Đóng chế độ test"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3.5 space-y-3 text-xs">
          {/* Status Tracker */}
          <div className="grid grid-cols-3 gap-2 bg-slate-800/80 p-2.5 rounded-2xl border border-slate-700/80 text-center">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Tiến độ bài</span>
              <span className={`font-black text-xs ${isQualified ? 'text-emerald-400' : 'text-amber-300'}`}>
                {completedCount}/21 ({isQualified ? 'Đủ điều kiện 🏆' : 'Chưa đủ'})
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Bước 1: Cảm nhận</span>
              <span className={`font-black text-xs ${hasReflection ? 'text-emerald-400' : 'text-slate-400'}`}>
                {hasReflection ? 'Đã gửi link ✅' : 'Chưa gửi'}
              </span>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 block font-semibold">Bước 2: Chung kết</span>
              <span className={`font-black text-xs ${hasRegistered ? 'text-emerald-400' : 'text-slate-400'}`}>
                {hasRegistered ? 'Đã đăng ký 🌟' : 'Chưa'}
              </span>
            </div>
          </div>

          {/* Quick Simulation Buttons */}
          <div className="space-y-1.5">
            <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
              <span>Mô phỏng nhanh các kịch bản:</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Option A: Simulate 21/21 immediately */}
              <button
                onClick={onSimulate21}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                title="Đặt 21/21 bài đã hoàn thành để mở khóa Champion"
              >
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                <span>Hoàn thành 21/21 bài</span>
              </button>

              {/* Option B: Simulate 20/21 (Ready for final submission) */}
              <button
                onClick={onSimulate20}
                className="px-3 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-black rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                title="Đặt 20/21 bài, sau đó bạn nộp bài thứ 21 để thấy pháo hoa & popup tự nổ"
              >
                <Flame className="w-3.5 h-3.5 text-amber-200" />
                <span>Hoàn thành 20/21 bài</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              {/* Option C: Open Champion Modal directly */}
              <button
                onClick={onOpenChampionModal}
                className="px-3 py-2 bg-yellow-400 hover:bg-yellow-300 text-yellow-950 font-black rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
              >
                <Trophy className="w-3.5 h-3.5 text-yellow-950" />
                <span>Mở Modal Champion</span>
              </button>

              {/* Option C2: Open Champion Arena Directly */}
              {onOpenChampionArena && (
                <button
                  onClick={onOpenChampionArena}
                  className="px-3 py-2 bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-amber-950 font-black rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                >
                  <span>🏆 Vào Vòng Thi Đấu</span>
                </button>
              )}

              {/* Option D: Reset state back */}
              <button
                onClick={onReset}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold rounded-xl text-[11px] shadow-sm flex items-center justify-center gap-1.5 transition cursor-pointer active:scale-98"
                title="Xóa bài nộp test và reset trạng thái đăng ký"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset về ban đầu</span>
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight border-t border-slate-800 pt-2">
            💡 <strong className="text-slate-300">Gợi ý test luồng chuẩn:</strong> Chọn "Hoàn thành 20/21 bài" → Vào Bản đồ làm nốt bài 21 → Nộp video → Xem pháo hoa & popup mở khóa tự kích hoạt!
          </p>
        </div>
      )}
    </aside>
  );
};
