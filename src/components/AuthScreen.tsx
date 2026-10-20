import React from 'react';
import { Sparkles, Trophy, Video, Calendar, ShieldCheck, Heart, Palette } from 'lucide-react';
import { Language, BrandConfig } from '../types';
import { getTranslation } from '../i18n/translations';

interface AuthScreenProps {
  onSignIn: () => void;
  onOpenMobileQr?: () => void;
  brandConfig?: BrandConfig;
  isLoading: boolean;
  lang: Language;
  onToggleLang: () => void;
  errorMessage?: string | null;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({
  onSignIn,
  onOpenMobileQr,
  brandConfig,
  isLoading,
  lang,
  onToggleLang,
  errorMessage
}) => {
  const t = getTranslation(lang);

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-gradient-to-b from-amber-100 via-amber-50 to-orange-100 flex flex-col justify-between p-3.5 sm:p-6">
      {/* Top Bar with Language Switcher & Mobile button */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between py-2">
        <div className="flex items-center gap-2">
          {brandConfig?.logoUrl ? (
            <img
              src={brandConfig.logoUrl}
              alt="Logo"
              className="h-8 w-auto max-w-[140px] rounded-lg object-contain bg-white border border-amber-300 p-0.5 shadow-2xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-xl bg-amber-400 flex items-center justify-center font-black text-amber-950 shadow-xs">
              🦁
            </div>
          )}
          <span className="font-extrabold text-amber-900 font-['Fredoka',sans-serif] text-base">
            KidShadow
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onOpenMobileQr && (
            <button
              onClick={onOpenMobileQr}
              className="flex items-center gap-1 bg-amber-100/90 border-2 border-amber-300 px-2.5 py-1 rounded-full text-xs font-bold text-amber-950 shadow-xs hover:bg-amber-200 transition cursor-pointer"
              title="Xem trên điện thoại / Scan QR"
            >
              <span>📱</span>
              <span className="text-[11px]">{lang === 'vi' ? 'Điện thoại' : 'Mobile'}</span>
            </button>
          )}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1.5 bg-white border-2 border-amber-300 px-3 py-1 rounded-full text-xs font-bold text-amber-900 shadow-xs hover:bg-amber-50 transition cursor-pointer"
          >
            <span>{lang === 'vi' ? '🇻🇳 Tiếng Việt' : '🇬🇧 English'}</span>
          </button>
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="max-w-md w-full mx-auto my-auto bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-8 shadow-xl shadow-amber-200/60 border-4 border-amber-200 text-center relative overflow-hidden">
        {/* Playful Floating Decor */}
        <div className="absolute -top-10 -right-10 w-28 h-28 bg-amber-200/60 rounded-full blur-xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-28 h-28 bg-orange-200/60 rounded-full blur-xl pointer-events-none" />

        {/* Crisp Logo Card */}
        <div className="max-w-[280px] sm:max-w-[320px] mx-auto mb-5 bg-white rounded-3xl p-3 sm:p-4 border-3 border-amber-300 shadow-lg shadow-amber-300/35 flex items-center justify-center transform hover:scale-102 transition-transform">
          <img
            src={brandConfig?.logoUrl || '/eflita-logo.png'}
            alt="KidShadow Logo"
            className="h-16 sm:h-20 w-auto object-contain mx-auto"
          />
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-amber-950 font-['Fredoka',sans-serif] tracking-tight mb-2">
          KidShadow
        </h1>
        <p className="text-sm sm:text-base font-bold text-amber-800 mb-6 leading-relaxed">
          {t.loginWelcome}
        </p>

        {/* Official-Style Sign In With Google Button */}
        <div className="space-y-3">
          {errorMessage && (
            <div className="p-3 bg-amber-50 border-2 border-amber-300 rounded-2xl text-xs font-bold text-amber-900 text-left animate-in fade-in">
              {errorMessage}
            </div>
          )}

          <button
            onClick={onSignIn}
            disabled={isLoading}
            className="w-full bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 px-4 rounded-2xl border-2 border-slate-300 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-3 active:scale-98 disabled:opacity-60 cursor-pointer"
          >
            {/* Google G SVG */}
            <svg className="w-5 h-5" viewBox="0 0 48 48">
              <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
              <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
              <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
            </svg>
            <span className="text-sm sm:text-base">
              {isLoading ? t.signingIn : t.signInWithGoogle}
            </span>
          </button>

          <p className="text-[11px] text-amber-700/80 flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>{t.parentAccount} • Bảo mật thông tin</span>
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <footer className="max-w-md w-full mx-auto text-center py-4">
        <p className="text-xs text-amber-800/70 flex items-center justify-center gap-1 font-semibold">
          <span>KidShadow & Eflita Community</span>
          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
          <span>Nuôi dưỡng tình yêu tiếng Anh tự nhiên</span>
        </p>
      </footer>
    </div>
  );
};
