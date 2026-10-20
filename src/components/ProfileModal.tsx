import React, { useState } from 'react';
import { User, Phone, Heart, Sparkles, X, Award, Check, Lock, Calendar } from 'lucide-react';
import { UserProfile, LevelType, Language, Submission } from '../types';
import { LevelSelector } from './LevelSelector';
import { getTranslation } from '../i18n/translations';
import { evaluateBadges } from '../utils/badges';

interface ProfileModalProps {
  isOpen: boolean;
  onClose?: () => void;
  isFirstTime?: boolean;
  initialProfile?: Partial<UserProfile>;
  submissions?: Submission[];
  streak?: number;
  onSave: (data: { student_name: string; parent_name: string; phone: string; level: LevelType }) => Promise<void>;
  lang: Language;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  isFirstTime = false,
  initialProfile,
  submissions = [],
  streak = 0,
  onSave,
  lang,
}) => {
  const t = getTranslation(lang);

  const [studentName, setStudentName] = useState(initialProfile?.student_name || '');
  const [parentName, setParentName] = useState(initialProfile?.parent_name || '');
  const [phone, setPhone] = useState(initialProfile?.phone || '');
  const [level, setLevel] = useState<LevelType>(initialProfile?.level || 'STARTER');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeTab, setActiveTab] = useState<'info' | 'badges'>('info');

  if (!isOpen) return null;

  // Calculate Badges
  const badges = evaluateBadges(submissions, streak);
  const unlockedBadgesCount = badges.filter((b) => b.isUnlocked).length;
  const badgesPercent = Math.round((unlockedBadgesCount / badges.length) * 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập tên của con.' : 'Please enter student name.');
      return;
    }
    if (!parentName.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập tên phụ huynh.' : 'Please enter parent name.');
      return;
    }
    if (!phone.trim()) {
      setErrorMsg(lang === 'vi' ? 'Vui lòng nhập số điện thoại.' : 'Please enter contact phone.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await onSave({
        student_name: studentName.trim(),
        parent_name: parentName.trim(),
        phone: phone.trim(),
        level,
      });
      if (onClose) onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error saving profile');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-lg w-full bg-white rounded-3xl p-5 sm:p-7 shadow-2xl border-4 border-amber-300 relative my-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {!isFirstTime && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header */}
        <div className="text-center mb-4">
          <div className="w-14 h-14 mx-auto mb-2 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center text-white shadow-md text-2xl font-black">
            {isFirstTime ? '🌟' : '🦁'}
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-amber-950 font-['Fredoka',sans-serif]">
            {isFirstTime ? t.completeProfileTitle : t.editProfile}
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            {isFirstTime ? t.completeProfileDesc : `${initialProfile?.student_name || ''} • ${initialProfile?.level || ''}`}
          </p>
        </div>

        {/* Navigation Tabs (Only when not first time) */}
        {!isFirstTime && (
          <div className="flex items-center gap-2 p-1 bg-amber-100/70 rounded-2xl mb-5">
            <button
              type="button"
              onClick={() => setActiveTab('info')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'info'
                  ? 'bg-white text-amber-950 shadow-sm'
                  : 'text-amber-800/80 hover:bg-white/40'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>{t.badges.tabInfo}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('badges')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'badges'
                  ? 'bg-amber-400 text-amber-950 shadow-sm'
                  : 'text-amber-800/80 hover:bg-white/40'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>{t.badges.tabBadges}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-950 text-white ml-0.5">
                {unlockedBadgesCount}/{badges.length}
              </span>
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
            {errorMsg}
          </div>
        )}

        {/* ====================== TAB 1: PROFILE INFO & SETTINGS ====================== */}
        {activeTab === 'info' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quick Badges Preview Button in Info Tab */}
            {!isFirstTime && (
              <div
                onClick={() => setActiveTab('badges')}
                className="p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 flex items-center justify-between cursor-pointer hover:border-amber-400 transition"
              >
                <div className="flex items-center gap-2.5">
                  <div className="text-xl">🏅</div>
                  <div>
                    <h4 className="text-xs font-black text-amber-950">
                      {t.badges.myBadgesTitle}
                    </h4>
                    <p className="text-[11px] font-bold text-amber-800/80">
                      {t.badges.unlockedCount(unlockedBadgesCount, badges.length)} ({badgesPercent}%)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {badges.slice(0, 4).map((b) => (
                    <span
                      key={b.id}
                      className={`text-sm ${b.isUnlocked ? 'opacity-100 scale-110' : 'opacity-30 grayscale'}`}
                      title={(t.badges as any)[b.titleKey] || b.id}
                    >
                      {b.icon}
                    </span>
                  ))}
                  <span className="text-xs font-bold text-amber-700 ml-1">→</span>
                </div>
              </div>
            )}

            {/* Student Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t.studentName} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder={t.studentNamePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border-2 border-amber-200 rounded-2xl font-bold text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Parent Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t.parentName} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Heart className="w-4 h-4 text-rose-400" />
                </div>
                <input
                  type="text"
                  required
                  value={parentName}
                  onChange={(e) => setParentName(e.target.value)}
                  placeholder={t.parentNamePlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border-2 border-amber-200 rounded-2xl font-bold text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                {t.phoneNumber} *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4 text-emerald-500" />
                </div>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t.phoneNumberPlaceholder}
                  className="w-full pl-10 pr-4 py-2.5 bg-amber-50/50 border-2 border-amber-200 rounded-2xl font-bold text-sm text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            {/* Level Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-2 uppercase tracking-wider">
                {t.selectLevelTitle}
              </label>
              <LevelSelector
                selectedLevel={level}
                onSelectLevel={setLevel}
                lang={lang}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full mt-4 bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-300/50 border-2 border-amber-400 active:scale-98 transition disabled:opacity-50 font-['Fredoka',sans-serif] text-base cursor-pointer"
            >
              {isSubmitting ? t.saving : t.saveProfile}
            </button>
          </form>
        )}

        {/* ====================== TAB 2: MY BADGES SECTION ====================== */}
        {activeTab === 'badges' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Header Showcase Card */}
            <div className="p-4 bg-gradient-to-br from-amber-400 via-orange-400 to-amber-500 rounded-3xl text-amber-950 shadow-md border-2 border-amber-300">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-base font-['Fredoka',sans-serif]">
                    {t.badges.myBadgesTitle}
                  </h3>
                  <p className="text-xs font-bold text-amber-900 mt-0.5">
                    {t.badges.myBadgesSubtitle}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-white/30 flex items-center justify-center text-2xl shadow-inner shrink-0">
                  🎖️
                </div>
              </div>

              {/* Progress bar */}
              <div className="mt-3">
                <div className="flex items-center justify-between text-[11px] font-black mb-1">
                  <span>{t.badges.unlockedCount(unlockedBadgesCount, badges.length)}</span>
                  <span>{badgesPercent}%</span>
                </div>
                <div className="w-full h-2.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-950 rounded-full transition-all duration-500"
                    style={{ width: `${badgesPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {badges.map((badge) => {
                const title = (t.badges as any)[badge.titleKey] || badge.id;
                const desc = (t.badges as any)[badge.descKey] || '';

                return (
                  <div
                    key={badge.id}
                    className={`relative p-3.5 rounded-2xl border-2 transition-all flex flex-col justify-between ${
                      badge.isUnlocked
                        ? `bg-gradient-to-br ${badge.colorClasses.bg} ${badge.colorClasses.border} shadow-sm hover:shadow-md`
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div>
                      {/* Top icon and status */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-xs ${
                            badge.isUnlocked ? 'bg-white shadow-sm' : 'bg-slate-200 grayscale'
                          }`}
                        >
                          {badge.icon}
                        </div>

                        {badge.isUnlocked ? (
                          <span className="flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs">
                            <Check className="w-3 h-3 stroke-[3]" />
                            <span>{t.badges.unlocked}</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-500">
                            <Lock className="w-3 h-3" />
                            <span>{t.badges.locked}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Desc */}
                      <h4
                        className={`text-xs sm:text-sm font-black font-['Fredoka',sans-serif] leading-tight ${
                          badge.isUnlocked ? badge.colorClasses.text : 'text-slate-700'
                        }`}
                      >
                        {title}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium mt-1 leading-snug">
                        {desc}
                      </p>
                    </div>

                    {/* Footer: Progress or unlock date */}
                    <div className="mt-2.5 pt-2 border-t border-black/5 text-[10px] font-bold">
                      {badge.isUnlocked && badge.unlockedAt ? (
                        <div className="flex items-center gap-1 text-slate-500 font-normal">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(badge.unlockedAt).toLocaleDateString(
                              lang === 'vi' ? 'vi-VN' : 'en-US'
                            )}
                          </span>
                        </div>
                      ) : badge.progress ? (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-slate-500">
                            <span>Tiến độ</span>
                            <span>
                              {badge.progress.current}/{badge.progress.target}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-amber-500 rounded-full"
                              style={{
                                width: `${Math.round(
                                  (badge.progress.current / badge.progress.target) * 100
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">
                          {badge.isUnlocked ? '🌟 Hoàn thành xuất sắc' : 'Chưa hoàn thành'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
