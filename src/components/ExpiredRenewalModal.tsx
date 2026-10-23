import React, { useState } from 'react';
import { Language, UserProfile } from '../types';
import {
  renewWithActivationCode,
  normalizeActivationCode,
  formatActivationCode,
  ACTIVATION_CODE_LENGTH,
} from '../services/firebase';

interface ExpiredRenewalModalProps {
  userProfile: UserProfile;
  lang: Language;
  validityWeeks: number;
  onRenewed: (renewed: UserProfile) => void;
  onLogout: () => void;
}

export const ExpiredRenewalModal: React.FC<ExpiredRenewalModalProps> = ({
  userProfile,
  lang,
  validityWeeks,
  onRenewed,
  onLogout,
}) => {
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vi = lang === 'vi';

  const handleChange = (value: string) => {
    const clean = normalizeActivationCode(value).slice(0, ACTIVATION_CODE_LENGTH);
    setInput(formatActivationCode(clean));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = normalizeActivationCode(input);
    if (clean.length !== ACTIVATION_CODE_LENGTH) {
      setError(
        vi
          ? 'Mã chưa đủ ký tự. Mã gồm 10 ký tự (chữ và số), ba mẹ kiểm tra lại giúp con nhé.'
          : 'The code is incomplete. It has 10 characters (letters and digits).'
      );
      return;
    }
    setBusy(true);
    try {
      const renewed = await renewWithActivationCode(userProfile, clean, validityWeeks);
      onRenewed(renewed);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg === 'INVALID_CODE') {
        setError(
          vi
            ? 'Không tìm thấy mã này. Ba mẹ kiểm tra lại từng ký tự hoặc liên hệ Eflita nhé.'
            : 'This code was not found. Please check each character or contact Eflita.'
        );
      } else if (msg === 'CODE_USED_UP') {
        setError(
          vi
            ? 'Mã này đã được sử dụng. Mỗi mã chỉ dùng cho một lần đăng ký, ba mẹ liên hệ Eflita để nhận mã mới nhé.'
            : 'This code has already been used. Each code works for one enrollment only; please contact Eflita for a new one.'
        );
      } else {
        setError(
          vi
            ? 'Chưa kiểm tra được mã (có thể do mạng). Ba mẹ thử lại sau ít phút nhé.'
            : 'Could not check the code (network?). Please try again in a moment.'
        );
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border-4 border-amber-300 text-center">
        <div className="text-5xl mb-3">🎓</div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-amber-950 font-['Fredoka',sans-serif] mb-2">
          {vi ? 'Khóa học của con đã kết thúc' : 'Your course period has ended'}
        </h2>
        <p className="text-sm font-bold text-amber-800 mb-2 leading-relaxed">
          {vi
            ? `Thời hạn học ${validityWeeks} tuần của con đã hết. Cảm ơn con và gia đình đã đồng hành cùng Eflita!`
            : `Your ${validityWeeks}-week access has ended. Thank you for learning with Eflita!`}
        </p>
        <p className="text-xs text-amber-700/90 mb-4 leading-relaxed">
          {vi
            ? 'Muốn học tiếp, ba mẹ đăng ký lại với Eflita để nhận mã kích hoạt mới và nhập vào ô bên dưới. Các bài con đã nộp vẫn được giữ nguyên.'
            : 'To keep learning, please re-enroll with Eflita to get a new activation code and enter it below. Your previous submissions are kept.'}
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl text-xs font-bold text-rose-800 text-left">
              {error}
            </div>
          )}
          <input
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="ABCDE-FGHJK"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full text-center text-lg font-black tracking-widest border-2 border-amber-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-amber-500 uppercase"
          />
          <button
            type="submit"
            disabled={busy || !input.trim()}
            className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-3 rounded-2xl shadow-md transition disabled:opacity-60 cursor-pointer"
          >
            {busy ? (vi ? 'Đang kiểm tra...' : 'Checking...') : vi ? 'Học tiếp với mã mới' : 'Continue with new code'}
          </button>
        </form>

        <button onClick={onLogout} className="mt-4 text-xs underline text-amber-800 cursor-pointer">
          {vi ? 'Đăng xuất' : 'Sign out'}
        </button>
      </div>
    </div>
  );
};
