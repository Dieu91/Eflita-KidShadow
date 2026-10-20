import React from 'react';
import { Clock, Phone, Sparkles, Trophy, LogOut, CheckCircle2 } from 'lucide-react';
import { UserProfile, Language } from '../types';

interface ExpiredNoticeModalProps {
  isOpen: boolean;
  userProfile: UserProfile;
  lang: Language;
  onLogout: () => void;
  validityWeeks?: number;
}

export const ExpiredNoticeModal: React.FC<ExpiredNoticeModalProps> = ({
  isOpen,
  userProfile,
  lang,
  onLogout,
  validityWeeks = 8,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 text-center shadow-2xl border-4 border-amber-300 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-rose-200/50 rounded-full blur-2xl pointer-events-none" />

        <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-400 text-white rounded-3xl flex items-center justify-center mx-auto text-3xl shadow-lg shadow-orange-300/40 mb-4 animate-bounce">
          🎓
        </div>

        <span className="text-[11px] font-black uppercase tracking-wider px-3 py-1 bg-amber-100 text-amber-900 rounded-full inline-block mb-2">
          {lang === 'vi' ? `Khóa học ${validityWeeks} tuần đã hoàn tất` : `${validityWeeks}-Week Challenge Completed`}
        </span>

        <h3 className="text-xl sm:text-2xl font-black text-slate-800 font-['Fredoka',sans-serif] leading-tight">
          {lang === 'vi'
            ? `Chúc mừng ${userProfile.student_name}!`
            : `Congratulations, ${userProfile.student_name}!`}
        </h3>

        <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
          {lang === 'vi' ? (
            <>
              Thời gian thử thách <strong>{validityWeeks} tuần</strong> kể từ ngày con bắt đầu hành trình đã khép lại. Cảm ơn con và ba mẹ <strong>{userProfile.parent_name}</strong> đã luôn chăm chỉ luyện nói tiếng Anh mỗi ngày!
            </>
          ) : (
            <>
              Your <strong>{validityWeeks}-week challenge</strong> has come to an end. Thank you and your family for practicing English shadowing every single day!
            </>
          )}
        </p>

        {/* Info card */}
        <div className="my-5 p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-left space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-semibold text-slate-500">
              {lang === 'vi' ? 'Học viên:' : 'Student:'}
            </span>
            <span className="font-bold text-slate-900">{userProfile.student_name}</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-semibold text-slate-500">
              {lang === 'vi' ? 'Phụ huynh:' : 'Parent:'}
            </span>
            <span className="font-bold text-slate-900">{userProfile.parent_name} ({userProfile.phone})</span>
          </div>
          <div className="flex items-center justify-between text-slate-700">
            <span className="font-semibold text-slate-500">
              {lang === 'vi' ? 'Cấp độ:' : 'Level:'}
            </span>
            <span className="font-black text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full text-[11px]">
              {userProfile.level}
            </span>
          </div>
        </div>

        <div className="p-3 bg-sky-50 rounded-2xl border border-sky-200 text-xs text-sky-800 font-medium mb-5">
          {lang === 'vi' ? (
            <>
              💡 Ba mẹ muốn <strong>gia hạn tài khoản</strong> hoặc <strong>đăng ký khóa học nâng cao</strong> cho con? Vui lòng liên hệ ban quản lý Eflita để được hỗ trợ tức thì!
            </>
          ) : (
            <>
              💡 Want to extend access or register for next level? Please contact Eflita support team!
            </>
          )}
        </div>

        {/* Buttons */}
        <div className="space-y-2">
          <button
            onClick={onLogout}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-black text-sm rounded-2xl shadow-md transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer font-['Fredoka',sans-serif]"
          >
            <LogOut className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Đăng xuất tài khoản' : 'Sign Out'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
