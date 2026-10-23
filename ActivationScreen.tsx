import React, { useState } from 'react';
import { Language } from '../types';
import { checkActivationCode, formatActivationCode, normalizeActivationCode, ACTIVATION_CODE_LENGTH } from '../services/firebase';

interface ActivationScreenProps {
  lang: Language;
  uid: string;
  email: string;
  errorMessage?: string | null;
  onVerified: (code: string) => void;
  onLogout: () => void;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({
  lang,
  uid,
  email,
  errorMessage,
  onVerified,
  onLogout,
}) => {
  const [input, setInput] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const vi = lang === 'vi';

  const handleChange = (value: string) => {
    // Tự thêm dấu gạch giữa cho dễ đọc: ABCDE-FGHJK
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
    setChecking(true);
    try {
      const code = await checkActivationCode(clean, uid);
      onVerified(code);
    } catch (err: any) {
      const msg = String(err?.message || err);
      if (msg === 'CODE_USED_UP') {
        setError(
          vi
            ? 'Mã này đã được dùng hết số tài khoản cho phép. Nếu ba mẹ cần thêm tài khoản, vui lòng liên hệ Eflita để được hỗ trợ.'
            : 'This code has no accounts left. Please contact Eflita if you need another account.'
        );
      } else if (msg === 'INVALID_CODE') {
        setError(
          vi
            ? 'Không tìm thấy mã này. Ba mẹ kiểm tra lại từng ký tự hoặc liên hệ Eflita nhé.'
            : 'This code was not found. Please check each character or contact Eflita.'
        );
      } else {
        setError(
          vi
            ? 'Chưa kiểm tra được mã (có thể do mạng). Ba mẹ thử lại sau ít phút nhé.'
            : 'Could not check the code (network?). Please try again in a moment.'
        );
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/95 rounded-3xl p-6 sm:p-8 shadow-xl border-4 border-amber-200 text-center">
        <div className="text-5xl mb-3">🔑</div>
        <h1 className="text-2xl font-extrabold text-amber-950 font-['Fredoka',sans-serif] mb-2">
          {vi ? 'Kích hoạt khóa học' : 'Activate your course'}
        </h1>
        <p className="text-sm font-bold text-amber-800 mb-1 leading-relaxed">
          {vi
            ? 'Ba mẹ nhập mã kích hoạt Eflita đã gửi khi đăng ký khóa học để bắt đầu nhé.'
            : 'Please enter the activation code Eflita sent you when you enrolled.'}
        </p>
        {email && (
          <p className="text-xs text-amber-700/80 mb-4">
            {vi ? 'Đang đăng nhập:' : 'Signed in as:'} <strong>{email}</strong>
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          {(error || errorMessage) && (
            <div className="p-3 bg-rose-50 border-2 border-rose-200 rounded-2xl text-xs font-bold text-rose-800 text-left">
              {error || errorMessage}
            </div>
          )}
          <input
            value={input}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="ABCDE-FGHJK"
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            inputMode="text"
            className="w-full text-center text-lg font-black tracking-widest border-2 border-amber-300 rounded-2xl px-4 py-3 focus:outline-none focus:border-amber-500 uppercase"
          />
          <button
            type="submit"
            disabled={checking || !input.trim()}
            className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-3 rounded-2xl shadow-md transition disabled:opacity-60 cursor-pointer"
          >
            {checking ? (vi ? 'Đang kiểm tra...' : 'Checking...') : vi ? 'Kích hoạt' : 'Activate'}
          </button>
        </form>

        <p className="text-[11px] text-amber-700/80 mt-4">
          {vi ? 'Chưa có mã? Vui lòng liên hệ Eflita.' : 'No code yet? Please contact Eflita.'}
        </p>
        <button onClick={onLogout} className="mt-3 text-xs underline text-amber-800 cursor-pointer">
          {vi ? 'Đăng xuất / dùng tài khoản khác' : 'Sign out / use another account'}
        </button>
      </div>
    </div>
  );
};
