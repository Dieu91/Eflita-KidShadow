import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Heart,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  X,
  Share2
} from 'lucide-react';
import { Language, BrandConfig } from '../types';
import { getTranslation } from '../i18n/translations';
import { detectEnv } from '../utils/envDetector';

const resolveAssetUrl = (url?: string): string | undefined => {
  if (url && url.startsWith('/') && !url.startsWith('//')) {
    const base = (import.meta.env.BASE_URL || '/').replace(/\/+$/, '');
    return `${base}${url}`;
  }
  return url;
};

interface AuthScreenProps {
  onSignIn: () => void;
  brandConfig?: BrandConfig;
  isLoading: boolean;
  lang: Language;
  onToggleLang: () => void;
  errorMessage?: string | null;
  forceInAppCard?: boolean;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  brandConfig,
  isLoading,
  lang,
  onToggleLang,
  errorMessage,
  forceInAppCard = false,
}) => {
  const t = getTranslation(lang);
  const env = detectEnv();

  // If detected as in-app browser or triggered by a popup-blocked error
  const isInApp = env.inApp || forceInAppCard;

  const [copied, setCopied] = useState(false);
  const [androidIntentFailed, setAndroidIntentFailed] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Copy current URL to clipboard with fallback
  const handleCopyLink = async () => {
    const url = window.location.href;
    let success = false;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(url);
        success = true;
      } catch {
        success = false;
      }
    }
    if (!success) {
      try {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        success = true;
      } catch {
        success = false;
      }
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Best-effort Chrome Intent for Android
  const handleOpenInChrome = () => {
    setAndroidIntentFailed(false);
    const hostPathQuery = window.location.host + window.location.pathname + window.location.search;
    const intentUrl = `intent://${hostPathQuery}#Intent;scheme=https;package=com.android.chrome;end`;
    window.location.href = intentUrl;

    setTimeout(() => {
      // If page is still visible after 1.5s, intent might not have opened
      setAndroidIntentFailed(true);
    }, 1500);
  };

  return (
    <div className="min-h-screen min-h-[100dvh] w-full max-w-full overflow-x-hidden bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 flex flex-col justify-between p-3.5 sm:p-6 font-['Nunito',sans-serif]">
      {/* Top Header: strictly single line on 360-412px phones */}
      <header className="max-w-md w-full mx-auto flex items-center justify-between py-2 px-1 shrink-0">
        <div className="flex items-center gap-2 shrink-0">
          {brandConfig?.logoUrl ? (
            <img
              src={resolveAssetUrl(brandConfig.logoUrl)}
              alt="Logo"
              className="h-8 w-auto max-w-[120px] sm:max-w-[150px] rounded-lg object-contain bg-white border border-amber-300 p-0.5 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-black text-amber-950 shadow-xs">
              🦁
            </div>
          )}
          <span className="font-extrabold text-amber-900 font-['Fredoka',sans-serif] text-base tracking-tight whitespace-nowrap">
            KidShadow
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 bg-white border-2 border-amber-300 px-3 py-1 rounded-full text-xs font-extrabold text-amber-900 shadow-xs hover:bg-amber-50 transition cursor-pointer whitespace-nowrap active:scale-95"
            title="Switch Language / Đổi ngôn ngữ"
          >
            <span>{lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
          </button>
        </div>
      </header>

      {/* Main Card */}
      <main className="max-w-md w-full mx-auto my-auto bg-white/95 backdrop-blur-md rounded-3xl p-5 sm:p-7 shadow-xl shadow-amber-200/60 border-4 border-amber-200 text-center relative overflow-hidden">
        {/* Playful Floating Glow */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-200/60 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-orange-200/60 rounded-full blur-xl pointer-events-none" />

        {/* Brand Logo Presentation */}
        <div className="max-w-[260px] sm:max-w-[300px] mx-auto mb-3 bg-white rounded-2xl p-2.5 sm:p-3.5 border-2 border-amber-300 shadow-md shadow-amber-200/40 flex items-center justify-center">
          <img
            src={resolveAssetUrl(brandConfig?.logoUrl || '/kidshadow-logo.svg')}
            alt="KidShadow Logo"
            className="h-14 sm:h-18 w-auto object-contain mx-auto"
          />
        </div>

        {/* Title & Taglines */}
        <h1 className="text-2xl sm:text-3xl font-black text-amber-950 font-['Fredoka',sans-serif] tracking-tight">
          KidShadow
        </h1>

        <p className="text-xs sm:text-sm font-extrabold text-amber-900 mt-1 mb-2.5 leading-snug">
          {t.learningIntro}
        </p>

        {/* 3 Step Icons: Nghe -> Ghi âm -> Nộp bài */}
        <div className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 py-1.5 bg-amber-100/70 rounded-2xl border border-amber-200 text-xs font-black text-amber-950 mb-4 shadow-2xs">
          <span>🎧 {t.stepListen}</span>
          <span className="text-amber-400 font-bold">→</span>
          <span>🎙️ {t.stepRecord}</span>
          <span className="text-amber-400 font-bold">→</span>
          <span>📤 {t.stepSubmit}</span>
        </div>

        {/* ============================================================== */}
        {/* REQUIREMENT 2: IN-APP BROWSER INSTRUCTION CARD                 */}
        {/* ============================================================== */}
        {isInApp ? (
          <div className="bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 border-3 border-amber-400 rounded-3xl p-4 sm:p-5 text-left shadow-lg relative my-2 animate-in fade-in zoom-in-95 duration-200">
            {/* Top Right ⋯ Illustrated Pill */}
            <div className="absolute top-3 right-3 bg-amber-400 text-amber-950 font-black text-[11px] px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1 border border-amber-500/30">
              <span className="font-mono text-base font-black leading-none">⋯</span>
              <span className="font-['Fredoka',sans-serif] text-[10px]">ở góc trên</span>
            </div>

            {/* Title */}
            <h2 className="text-base sm:text-lg font-black text-amber-950 font-['Fredoka',sans-serif] pr-20 leading-snug mb-3">
              Ba mẹ mở bằng trình duyệt để đăng nhập nhé 🙏
            </h2>

            {/* Instruction Steps according to OS */}
            {env.os === 'ios' ? (
              <div className="space-y-2 text-xs sm:text-sm font-bold text-amber-950">
                <div className="p-2.5 bg-white/95 rounded-2xl border border-amber-200 flex items-start gap-2 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span>Bấm dấu </span>
                    <strong className="text-amber-900 font-mono text-sm px-1 bg-amber-100 rounded">⋯</strong>
                    <span> ở góc phải phía trên màn hình.</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white/95 rounded-2xl border border-amber-200 flex items-start gap-2 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span>Chọn </span>
                    <strong className="text-amber-900 font-black">"Mở bằng Safari"</strong>
                    <span className="text-slate-500 text-xs"> (hoặc "Open in Safari").</span>
                  </div>
                </div>
              </div>
            ) : env.os === 'android' ? (
              <div className="space-y-2 text-xs sm:text-sm font-bold text-amber-950">
                <div className="p-2.5 bg-white/95 rounded-2xl border border-amber-200 flex items-start gap-2 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </span>
                  <div>
                    <span>Bấm dấu </span>
                    <strong className="text-amber-900 font-mono text-sm px-1 bg-amber-100 rounded">⋯</strong>
                    <span> (hoặc </span>
                    <strong className="text-amber-900 font-mono text-sm px-1 bg-amber-100 rounded">⋮</strong>
                    <span>) ở góc phải phía trên.</span>
                  </div>
                </div>

                <div className="p-2.5 bg-white/95 rounded-2xl border border-amber-200 flex items-start gap-2 shadow-2xs">
                  <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <span>Chọn </span>
                    <strong className="text-amber-900 font-black">"Mở bằng trình duyệt"</strong>
                    <span> / </span>
                    <strong className="text-amber-900 font-black">"Mở bằng Chrome"</strong>
                    <span className="text-slate-500 text-xs"> (hoặc "Open in browser").</span>
                  </div>
                </div>

                {/* Big Button: Open in Chrome */}
                <button
                  type="button"
                  onClick={handleOpenInChrome}
                  className="w-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white font-black py-3 px-4 rounded-2xl shadow-md text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer font-['Fredoka',sans-serif]"
                >
                  <span>🚀 Mở bằng Chrome</span>
                </button>

                {androidIntentFailed && (
                  <p className="text-[11px] text-amber-950 font-bold bg-amber-200/70 p-2 rounded-xl text-center leading-snug border border-amber-300">
                    Máy không mở được tự động, ba mẹ làm theo Bước 1–2 hoặc sao chép link nhé.
                  </p>
                )}
              </div>
            ) : (
              /* Other OS */
              <div className="p-3 bg-white/90 rounded-2xl border border-amber-200 text-xs font-bold text-amber-950 text-center">
                Ba mẹ vui lòng mở bằng <strong>Safari</strong> hoặc <strong>Chrome</strong> để đăng nhập thuận tiện nhất nhé.
              </div>
            )}

            {/* Always Available: Copy Link Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="w-full bg-white hover:bg-amber-100/70 text-amber-950 font-black py-2.5 px-4 rounded-2xl border-2 border-amber-300 shadow-xs text-xs sm:text-sm flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer font-['Fredoka',sans-serif]"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-amber-700" />}
                <span>{copied ? 'Đã sao chép link thành công! ✓' : 'Sao chép link'}</span>
              </button>
              <p className="text-[11px] font-bold text-amber-800 text-center mt-1.5">
                Dán vào Safari hoặc Chrome
              </p>
            </div>

            {/* Subtle Fallback Link if detection was mistaken */}
            <div className="pt-3 text-center border-t border-amber-200/80 mt-3">
              <button
                type="button"
                onClick={onSignIn}
                disabled={isLoading}
                className="text-xs text-slate-500 hover:text-amber-900 underline transition cursor-pointer disabled:opacity-50"
              >
                {isLoading ? t.signingIn : 'Vẫn thử đăng nhập ở đây'}
              </button>
            </div>
          </div>
        ) : (
          /* ============================================================== */
          /* REGULAR BROWSER LOGIN BUTTON                                   */
          /* ============================================================== */
          <div className="space-y-3">
            {/* Friendly popup blocked / login error prompt */}
            {errorMessage && (
              <div className="p-3.5 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs font-bold text-amber-950 text-left space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">{errorMessage}</p>
                </div>
                <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={onSignIn}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-xl text-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    Thử lại
                  </button>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-amber-300 text-amber-900 font-extrabold rounded-xl text-xs transition cursor-pointer flex items-center gap-1 active:scale-95"
                  >
                    <Copy className="w-3 h-3 text-amber-700" />
                    <span>{copied ? 'Đã sao chép! ✓' : 'Sao chép link'}</span>
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={onSignIn}
              disabled={isLoading}
              className="w-full bg-white hover:bg-slate-50 text-slate-700 font-black py-3.5 px-4 rounded-2xl border-2 border-slate-300 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-60 cursor-pointer font-['Fredoka',sans-serif]"
            >
              {/* Google G SVG */}
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
              <span className="text-sm sm:text-base">
                {isLoading ? t.signingIn : t.signInWithGoogle}
              </span>
            </button>

            <p className="text-[11px] font-bold text-amber-700/80 flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t.parentAccount} • {t.privacySecure}</span>
            </p>
          </div>
        )}
      </main>

      {/* Footer Info with Privacy Policy & Zalo Support links */}
      <footer className="max-w-md w-full mx-auto text-center py-3 shrink-0 space-y-1.5">
        <p className="text-xs text-amber-900/80 flex items-center justify-center gap-1.5 font-bold">
          <span>KidShadow & Eflita Community</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>{t.nurtureLove}</span>
        </p>

        {/* Links: Privacy Policy & Zalo Support */}
        <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-amber-800/85 font-bold pt-0.5">
          <button
            type="button"
            onClick={() => setShowPrivacyModal(true)}
            className="hover:underline flex items-center gap-1 text-slate-700 hover:text-amber-950 cursor-pointer"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.privacyPolicy}</span>
          </button>
          <span className="text-amber-400">•</span>
          <a
            href="https://zalo.me/eflitaedu"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline text-blue-700 hover:text-blue-800 flex items-center gap-1"
          >
            <span>💬</span>
            <span>{t.supportZalo}</span>
          </a>
        </div>
      </footer>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="max-w-md w-full bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border-4 border-amber-300 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-base text-slate-900 font-['Fredoka',sans-serif]">
                  {t.privacyPolicy}
                </h3>
              </div>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
              <p>
                <strong>1. Thông tin thu thập:</strong> Tài khoản Google của phụ huynh (tên, email, ảnh đại diện) để đăng nhập; tên bé, tên phụ huynh, số điện thoại và cấp độ học do ba mẹ nhập; tiến độ học và liên kết bài nộp.
              </p>
              <p>
                <strong>2. Video của bé:</strong> Video được lưu trong Google Drive của chính tài khoản ba mẹ. Khi nộp bài, ứng dụng chia sẻ video ở quyền chỉ xem cho tài khoản giáo viên của Eflita để xem bài, nhận xét và chấm phần thi Shadowing Champion. Ứng dụng chỉ truy cập các file do chính ứng dụng tạo ra, không đọc các file khác trong Drive của ba mẹ.
              </p>
              <p>
                <strong>3. Mục đích sử dụng:</strong> Chỉ phục vụ việc học, theo dõi tiến độ, nhận xét và tổ chức cuộc thi. Eflita không bán dữ liệu và không dùng cho quảng cáo của bên thứ ba.
              </p>
              <p>
                <strong>4. Quyền của phụ huynh:</strong> Ba mẹ có thể yêu cầu xem, chỉnh sửa hoặc xóa dữ liệu học tập của con, và có thể tự xóa video trong Google Drive của mình, bất kỳ lúc nào qua kênh Zalo hỗ trợ của Eflita.
              </p>
            </div>

            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full bg-amber-400 hover:bg-amber-500 text-amber-950 font-black py-2.5 rounded-2xl text-xs transition cursor-pointer font-['Fredoka',sans-serif]"
            >
              Đã hiểu & Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
