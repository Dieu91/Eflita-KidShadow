import React, { useState } from 'react';
import { Sparkles, Flame, User as UserIcon, LogOut, ShieldAlert, Award, Smartphone, Palette, MoreVertical } from 'lucide-react';
import { UserProfile, Language, LevelType, BrandConfig } from '../types';
import { getTranslation } from '../i18n/translations';
import { isUserAdmin } from '../services/firebase';

// App chạy ở đường dẫn con (ví dụ /Eflita-KidShadow/), nên đường dẫn ảnh dạng "/logo.png"
// cần được thêm tiền tố này để trình duyệt tìm đúng file.
const resolveAssetUrl = (url?: string): string | undefined => {
  if (url && url.startsWith('/') && !url.startsWith('//')) {
    const rawBase = ((import.meta as any).env?.BASE_URL as string | undefined) || '/';
    const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;
    return `${base}${url.slice(1)}`;
  }
  return url;
};

interface NavbarProps {
  userProfile: UserProfile | null;
  userEmail: string | null;
  brandConfig?: BrandConfig;
  lang: Language;
  onToggleLang: () => void;
  streak: number;
  activeTab: 'map' | 'progress' | 'admin' | 'champion';
  onChangeTab: (tab: 'map' | 'progress' | 'admin' | 'champion') => void;
  onOpenProfile: () => void;
  onOpenLevelSelector: () => void;
  onSelectLevel?: (level: LevelType) => void;
  onLogout: () => void;
  onOpenChampionModal?: () => void;
  isChampionQualified?: boolean;
  onOpenBrandSettings?: () => void;
  onOpenStudentGuide?: () => void;
  onToggleAdminTestBar?: () => void;
  isAdminTestActive?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  userProfile,
  userEmail,
  brandConfig,
  lang,
  onToggleLang,
  streak,
  activeTab,
  onChangeTab,
  onOpenProfile,
  onOpenLevelSelector,
  onSelectLevel,
  onLogout,
  onOpenChampionModal,
  isChampionQualified,
  onOpenBrandSettings,
  onOpenStudentGuide,
  onToggleAdminTestBar,
  isAdminTestActive,
}) => {
  const t = getTranslation(lang);
  const isAdmin = isUserAdmin(userEmail);
  const [isLevelMenuOpen, setIsLevelMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLevelBadgeStyle = (level?: LevelType) => {
    switch (level) {
      case 'STARTER':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'MOVERS':
        return 'bg-sky-100 text-sky-800 border-sky-300';
      case 'FLYERS':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b-2 border-amber-200/80 shadow-xs w-full max-w-full">
      <div className="max-w-4xl w-full mx-auto px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1 sm:gap-2">
        {/* App Logo & Title */}
        <div 
          onClick={() => onChangeTab('map')} 
          className="flex items-center gap-1.5 sm:gap-2.5 cursor-pointer group shrink-0"
        >
          {brandConfig?.logoUrl ? (
            <div className="bg-white px-2 py-1 rounded-2xl border-2 border-amber-300 shadow-xs flex items-center h-10 group-hover:border-amber-400 transition-colors">
              <img
                src={resolveAssetUrl(brandConfig.logoUrl)}
                alt={brandConfig.brandName || 'Brand Logo'}
                className="h-7 sm:h-8 w-auto max-w-[105px] sm:max-w-[190px] object-contain transform group-hover:scale-105 transition-transform"
              />
            </div>
          ) : (
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-400 to-rose-400 flex items-center justify-center shadow-md shadow-amber-300/40 text-xl sm:text-2xl transform group-hover:scale-105 transition-transform">
              🦁
            </div>
          )}
          <div className="hidden sm:block text-left">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-sm text-amber-900 tracking-tight font-['Fredoka',sans-serif]">
                KidShadow
              </span>
              <Sparkles className="w-3.5 h-3.5 text-amber-500 fill-amber-400 animate-pulse" />
            </div>
            <span className="text-[10px] font-bold text-amber-700/90 block">
              {t.appTagline}
            </span>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Level Switcher with Instant Quick Menu */}
          {userProfile && (
            <div className="relative">
              <button
                onClick={() => setIsLevelMenuOpen(!isLevelMenuOpen)}
                className={`px-2 py-1 sm:px-2.5 rounded-full text-xs font-black border flex items-center gap-1 shadow-xs hover:opacity-90 active:scale-95 transition-all cursor-pointer ${getLevelBadgeStyle(
                  userProfile.level
                )}`}
                title={t.changeLevel}
              >
                <span>
                  {userProfile.level === 'STARTER' ? '🌱' : userProfile.level === 'MOVERS' ? '🧭' : '🚀'}
                </span>
                <span className="text-[11px] sm:text-xs">{userProfile.level}</span>
                <span className="text-[9px] opacity-70">▼</span>
              </button>

              {/* Instant Dropdown Menu */}
              {isLevelMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsLevelMenuOpen(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 w-48 bg-white rounded-2xl shadow-xl border-2 border-amber-300 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                      {lang === 'vi' ? 'Đổi cấp độ tức thì' : 'Switch Level'}
                    </div>

                    {(
                      [
                        { id: 'STARTER', label: 'Starter (6-7t)', icon: '🌱', active: userProfile.level === 'STARTER' },
                        { id: 'MOVERS', label: 'Movers (8-9t)', icon: '🧭', active: userProfile.level === 'MOVERS' },
                        { id: 'FLYERS', label: 'Flyers (10-12t)', icon: '🚀', active: userProfile.level === 'FLYERS' },
                      ] as const
                    ).map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => {
                          setIsLevelMenuOpen(false);
                          if (onSelectLevel) {
                            onSelectLevel(lvl.id);
                          } else {
                            onOpenLevelSelector();
                          }
                        }}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer ${
                          lvl.active
                            ? 'bg-amber-100 text-amber-950 font-black'
                            : 'hover:bg-slate-100 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{lvl.icon}</span>
                          <span>{lvl.label}</span>
                        </div>
                        {lvl.active && <span className="text-amber-700 text-xs">✓</span>}
                      </button>
                    ))}

                    <div className="border-t border-slate-100 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setIsLevelMenuOpen(false);
                          onOpenLevelSelector();
                        }}
                        className="w-full text-center py-1 text-[11px] font-bold text-amber-800 hover:text-amber-950 hover:bg-amber-50 rounded-lg transition cursor-pointer"
                      >
                        {lang === 'vi' ? 'Xem chi tiết cấp độ...' : 'Level details...'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Streak Counter */}
          <div 
            className="flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-600 px-2 py-1 sm:px-2.5 rounded-full font-bold text-xs shadow-xs"
            title={`${streak} ${t.streakDays}`}
          >
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 fill-orange-500 animate-bounce" />
            <span className="text-[11px] sm:text-xs font-black">{streak}</span>
            <span className="hidden md:inline text-[11px] font-medium text-orange-700">
              {t.streakDays}
            </span>
          </div>

          {/* Champion Trophy Button (if qualified or admin) */}
          {(isChampionQualified || isAdmin) && (
            <button
              onClick={() => onChangeTab('champion')}
              className={`flex items-center gap-1 font-black px-2 py-1 sm:px-2.5 rounded-full text-xs shadow-md border cursor-pointer transition ${
                activeTab === 'champion'
                  ? 'bg-amber-500 text-white border-amber-600 ring-2 ring-amber-300'
                  : 'bg-yellow-400 hover:bg-yellow-300 text-yellow-950 border-yellow-500 animate-pulse'
              }`}
              title="Vòng Thi Shadowing Champion"
            >
              <Award className="w-3.5 h-3.5 text-yellow-900" />
              <span className="hidden sm:inline">Vòng Chung Kết</span>
            </button>
          )}

          {/* Brand & Logo Settings Button - Admin only (Desktop) */}
          {isAdmin && onOpenBrandSettings && (
            <button
              onClick={onOpenBrandSettings}
              className="hidden lg:inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold px-2.5 py-1 rounded-full text-xs shadow-xs transition-colors cursor-pointer"
              title={lang === 'vi' ? 'Cấu hình Logo & Thương hiệu' : 'Brand & Logo Settings'}
            >
              <Palette className="w-3.5 h-3.5 text-amber-700" />
              <span>{lang === 'vi' ? 'Logo' : 'Brand'}</span>
            </button>
          )}

          {/* Test Champion Dock Button - Admin only (Desktop) */}
          {isAdmin && onToggleAdminTestBar && (
            <button
              onClick={onToggleAdminTestBar}
              className={`hidden lg:inline-flex items-center gap-1 border px-2.5 py-1 rounded-full text-xs shadow-xs transition-colors cursor-pointer ${
                isAdminTestActive
                  ? 'bg-amber-400 border-amber-500 text-yellow-950 font-black ring-2 ring-yellow-400/50'
                  : 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-950 font-bold'
              }`}
              title={lang === 'vi' ? 'Bật/Tắt Bảng Điều Khiển Test Shadowing Champion' : 'Toggle Shadowing Champion Test Dock'}
            >
              <span>🛠️</span>
              <span>Test Champion</span>
            </button>
          )}

          {/* Student Guide Button (Tablet/Desktop) */}
          {onOpenStudentGuide && (
            <button
              onClick={onOpenStudentGuide}
              className="hidden md:inline-flex items-center gap-1 bg-amber-100/90 hover:bg-amber-200 border border-amber-300 text-amber-950 font-bold px-2 py-1 rounded-full text-xs shadow-xs transition-colors cursor-pointer"
              title={lang === 'vi' ? 'Hướng dẫn tự học & Quy trình tự động' : 'Learning Guide & FAQ'}
            >
              <span>💡</span>
              <span className="hidden lg:inline">{lang === 'vi' ? 'Hướng dẫn' : 'Guide'}</span>
            </button>
          )}

          {/* Language Switcher */}
          <button
            onClick={onToggleLang}
            className="flex items-center gap-1 bg-slate-100 hover:bg-slate-200 border border-slate-300 px-2 py-1 rounded-full text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            title="Switch Language / Đổi ngôn ngữ"
          >
            {lang === 'vi' ? (
              <>
                <span className="text-sm">🇻🇳</span>
                <span className="hidden sm:inline">VI</span>
              </>
            ) : (
              <>
                <span className="text-sm">🇬🇧</span>
                <span className="hidden sm:inline">EN</span>
              </>
            )}
          </button>

          {/* User Profile / Menu */}
          {userProfile && (
            <div className="flex items-center gap-1">
              <button
                onClick={onOpenProfile}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-100 hover:bg-amber-200 border-2 border-amber-300 flex items-center justify-center text-amber-800 font-bold overflow-hidden shadow-xs cursor-pointer"
                title={`${userProfile.student_name} (${t.editProfile})`}
              >
                {userProfile.photo_url ? (
                  <img
                    src={userProfile.photo_url}
                    alt={userProfile.student_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-amber-700" />
                )}
              </button>

              <button
                onClick={onLogout}
                className="hidden sm:inline-flex p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors cursor-pointer"
                title={t.logout}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Mobile Utilities Dropdown Button (shown on mobile to access Guide, Admin Tools, Logout without horizontal overflow) */}
          <div className="relative sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-amber-100/80 transition cursor-pointer"
              title="Tiện ích & Menu"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {isMobileMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsMobileMenuOpen(false)}
                />
                <div className="absolute top-full right-0 mt-1.5 w-56 bg-white rounded-2xl shadow-2xl border-2 border-amber-300 p-2 z-50 animate-in fade-in zoom-in-95 duration-100 space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1">
                    Tiện ích & Tùy chọn
                  </div>

                  {onOpenStudentGuide && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenStudentGuide();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-950 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span>💡</span>
                      <span>{lang === 'vi' ? 'Hướng dẫn tự học & FAQ' : 'Learning Guide & FAQ'}</span>
                    </button>
                  )}

                  {isAdmin && onOpenBrandSettings && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onOpenBrandSettings();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-950 flex items-center gap-2 transition cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-amber-700" />
                      <span>{lang === 'vi' ? 'Cấu hình Logo Thương Hiệu' : 'Brand & Logo'}</span>
                    </button>
                  )}

                  {isAdmin && onToggleAdminTestBar && (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onToggleAdminTestBar();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-950 flex items-center gap-2 transition cursor-pointer"
                    >
                      <span>🛠️</span>
                      <span>{isAdminTestActive ? 'Tắt thanh Test Champion' : 'Bật thanh Test Champion'}</span>
                    </button>
                  )}

                  <div className="border-t border-slate-100 my-1 pt-1">
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        onLogout();
                      }}
                      className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>{t.logout}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Tab Navigation */}
      {userProfile && (
        <div className="bg-amber-50/70 border-t border-amber-100 flex items-center justify-around py-1.5 px-2 text-xs font-bold gap-1">
          <button
            onClick={() => onChangeTab('map')}
            className={`flex-1 py-1.5 rounded-xl text-center transition-all ${
              activeTab === 'map'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'text-amber-800/80 hover:bg-amber-200/50'
            }`}
          >
            🗺️ {t.mapTab}
          </button>
          <button
            onClick={() => onChangeTab('progress')}
            className={`flex-1 py-1.5 rounded-xl text-center transition-all ${
              activeTab === 'progress'
                ? 'bg-amber-400 text-amber-950 shadow-xs'
                : 'text-amber-800/80 hover:bg-amber-200/50'
            }`}
          >
            📊 {t.progressTab}
          </button>
          {(isChampionQualified || isAdmin) && (
            <button
              onClick={() => onChangeTab('champion')}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1 ${
                activeTab === 'champion'
                  ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-amber-950 font-black shadow-xs ring-2 ring-yellow-400/50'
                  : 'text-amber-900 hover:bg-amber-200/60 font-black'
              }`}
            >
              <span>🏆 Chung Kết</span>
            </button>
          )}
          {isAdmin && (
            <button
              onClick={() => onChangeTab('admin')}
              className={`flex-1 py-1.5 rounded-xl text-center transition-all flex items-center justify-center gap-1 ${
                activeTab === 'admin'
                  ? 'bg-rose-500 text-white shadow-xs'
                  : 'text-rose-700 hover:bg-rose-100'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>{t.adminTab}</span>
            </button>
          )}
        </div>
      )}
    </header>
  );
};
