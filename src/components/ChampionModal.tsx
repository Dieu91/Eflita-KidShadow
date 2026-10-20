import React, { useState } from 'react';
import { Trophy, Sparkles, X, CheckCircle2, Send, ExternalLink, Award, User, Phone, Check, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, ReflectionPost, ContestRegistration, Language } from '../types';
import { getTranslation } from '../i18n/translations';
import { submitReflectionPost, registerContest } from '../services/firebase';

interface ChampionModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  reflectionPost: ReflectionPost | null;
  contestRegistration: ContestRegistration | null;
  onUpdateState: (newReflection: ReflectionPost | null, newReg?: ContestRegistration | null) => void;
  lang: Language;
  isAdmin?: boolean;
  onEnterArena?: () => void;
}

export const ChampionModal: React.FC<ChampionModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  reflectionPost,
  contestRegistration,
  onUpdateState,
  lang,
  isAdmin = false,
  onEnterArena,
}) => {
  const t = getTranslation(lang);

  // If user already submitted reflection post, they are fully qualified
  const isAlreadySubmittedReflection = !!reflectionPost;

  // Step 1 state
  const [postUrl, setPostUrl] = useState('');
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);
  const [step1Error, setStep1Error] = useState('');

  if (!isOpen) return null;

  // Submit reflection link and automatically record qualification in contest_registrations
  const handleSubmitPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postUrl.trim() || !postUrl.startsWith('http')) {
      setStep1Error(
        lang === 'vi'
          ? 'Vui lòng nhập đường link bài viết hợp lệ (bắt đầu bằng http hoặc https)'
          : 'Please enter a valid URL (starting with http or https)'
      );
      return;
    }

    try {
      setIsSubmittingPost(true);
      setStep1Error('');
      await submitReflectionPost(userProfile.uid, postUrl.trim());

      const newPost: ReflectionPost = {
        user_id: userProfile.uid,
        post_url: postUrl.trim(),
        submitted_at: new Date().toISOString(),
        status: 'pending',
      };

      // Automatically record qualification in contest_registrations using existing profile info
      const autoRegData: Omit<ContestRegistration, 'id'> = {
        user_id: userProfile.uid,
        registered_at: new Date().toISOString(),
        student_name: userProfile.student_name,
        parent_name: userProfile.parent_name,
        phone: userProfile.phone,
        level: userProfile.level,
      };
      await registerContest(autoRegData).catch(() => {});

      // Celebration confetti explosion!
      confetti({
        particleCount: 130,
        spread: 90,
        origin: { y: 0.5 },
      });

      onUpdateState(newPost, autoRegData);
    } catch (err) {
      setStep1Error(err instanceof Error ? err.message : 'Error submitting post');
    } finally {
      setIsSubmittingPost(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-lg w-full bg-white rounded-3xl shadow-2xl border-4 border-yellow-400 relative my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-400 p-6 text-center text-yellow-950 border-b-2 border-yellow-400 relative">
          <div className="w-16 h-16 mx-auto mb-2 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-md">
            🏆
          </div>
          <h2 className="text-xl sm:text-2xl font-black font-['Fredoka',sans-serif]">
            Shadowing Champion
          </h2>
          <p className="text-xs font-bold text-yellow-900 mt-0.5">
            {isAlreadySubmittedReflection
              ? 'Chúc mừng con đã đủ điều kiện tham dự Vòng Chung Kết! 🌟'
              : t.championStep1Title}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {!isAlreadySubmittedReflection ? (
            /* =================== STEP 1: SUBMIT REFLECTION POST =================== */
            <div className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-2xl border-2 border-amber-200 text-xs sm:text-sm font-semibold text-amber-950 leading-relaxed">
                <p className="flex items-start gap-2">
                  <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{t.championStep1Prompt}</span>
                </p>
              </div>

              {step1Error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                  {step1Error}
                </div>
              )}

              <form onSubmit={handleSubmitPost} className="space-y-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 mb-1.5 uppercase tracking-wider">
                    {lang === 'vi' ? 'Link bài viết trên cộng đồng Eflita' : 'Eflita Community Post URL'} *
                  </label>
                  <input
                    type="url"
                    required
                    value={postUrl}
                    onChange={(e) => setPostUrl(e.target.value)}
                    placeholder={t.postUrlPlaceholder}
                    className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-500 transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPost}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-amber-950 font-black py-3.5 px-6 rounded-2xl shadow-lg border-2 border-yellow-400 font-['Fredoka',sans-serif] text-sm active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>{isSubmittingPost ? t.saving : 'Xác nhận hoàn tất & Mở khóa Chung Kết'}</span>
                </button>

                {/* Admin Test Helpers */}
                {isAdmin && (
                  <div className="pt-2 border-t border-amber-200 flex flex-wrap items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setPostUrl('https://facebook.com/groups/eflita/posts/test_champion_2026')}
                      className="px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[11px] font-bold rounded-xl transition cursor-pointer"
                    >
                      ⚡ Điền link test nhanh
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const mockPost: ReflectionPost = {
                          user_id: userProfile.uid,
                          post_url: 'https://facebook.com/groups/eflita/posts/test_champion_2026',
                          submitted_at: new Date().toISOString(),
                          status: 'approved',
                        };
                        const autoRegData: Omit<ContestRegistration, 'id'> = {
                          user_id: userProfile.uid,
                          registered_at: new Date().toISOString(),
                          student_name: userProfile.student_name,
                          parent_name: userProfile.parent_name,
                          phone: userProfile.phone,
                          level: userProfile.level,
                        };
                        await submitReflectionPost(userProfile.uid, mockPost.post_url).catch(() => {});
                        await registerContest(autoRegData).catch(() => {});
                        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
                        onUpdateState(mockPost, autoRegData);
                      }}
                      className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 text-[11px] font-bold rounded-xl transition cursor-pointer"
                    >
                      ⏩ Mở khóa ngay (Test Admin)
                    </button>
                  </div>
                )}
              </form>
            </div>
          ) : (
            /* =================== QUALIFIED: CELEBRATION & FINALIST CARD =================== */
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Unlocked Banner */}
              <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-100 via-teal-100 to-green-100 border-2 border-emerald-300 shadow-xs text-center space-y-1">
                <div className="text-3xl">🎉</div>
                <h3 className="font-black text-emerald-950 text-base font-['Fredoka',sans-serif]">
                  Bạn Đã Đủ Điều Kiện Dự Thi Shadowing Champion! 🌟
                </h3>
                <p className="text-xs font-semibold text-emerald-800">
                  Tuyệt vời! Con đã vượt qua trọn vẹn 21 thử thách video và chia sẻ cảm nhận hành trình.
                </p>
              </div>

              {/* Official Finalist Certificate Pass Card */}
              <div className="bg-gradient-to-br from-amber-50/70 via-white to-yellow-50/60 p-4 sm:p-5 rounded-3xl border-2 border-yellow-300 shadow-sm space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-yellow-200 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-400 text-yellow-950 flex items-center justify-center font-black shadow-xs">
                      🏆
                    </div>
                    <div>
                      <div className="text-[10px] uppercase font-black tracking-wider text-amber-800">
                        Thẻ Thí Sinh Chính Thức
                      </div>
                      <div className="text-sm font-black text-slate-800 font-['Fredoka',sans-serif]">
                        Vòng Chung Kết Shadowing Champion
                      </div>
                    </div>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                    userProfile.level === 'STARTER'
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : userProfile.level === 'MOVERS'
                      ? 'bg-sky-100 text-sky-800 border-sky-300'
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {userProfile.level}
                  </span>
                </div>

                {/* Candidate Info Grid */}
                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="bg-white/80 p-2.5 rounded-2xl border border-yellow-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block">Học viên:</span>
                    <span className="font-black text-slate-800 text-xs sm:text-sm">
                      {userProfile.student_name}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-2xl border border-yellow-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block">Phụ huynh:</span>
                    <span className="font-extrabold text-slate-700">
                      {userProfile.parent_name}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-2xl border border-yellow-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block">Số điện thoại:</span>
                    <span className="font-mono font-bold text-slate-800">
                      {userProfile.phone}
                    </span>
                  </div>

                  <div className="bg-white/80 p-2.5 rounded-2xl border border-yellow-200/80">
                    <span className="text-[10px] text-slate-400 font-bold block">Thành tích:</span>
                    <span className="font-black text-emerald-700">
                      21/21 Video (100%) ⭐
                    </span>
                  </div>
                </div>

                {/* Reflection link pill */}
                {reflectionPost && (
                  <div className="p-2.5 bg-white/90 rounded-2xl border border-yellow-200 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-600">Bài cảm nhận:</span>
                    <div className="flex items-center gap-2">
                      <a
                        href={reflectionPost.post_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sky-700 font-bold hover:underline flex items-center gap-1"
                      >
                        <span>Xem link</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          reflectionPost.status === 'invalid'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {reflectionPost.status === 'approved' ? 'Đã duyệt ✓' : reflectionPost.status === 'invalid' ? 'Không hợp lệ' : 'Đã gửi'}
                      </span>
                    </div>
                  </div>
                )}

                {/* Automatic Record Confirmation */}
                <div className="p-3 bg-emerald-50 border-2 border-emerald-300 rounded-2xl flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div className="text-[11px] font-bold text-emerald-950 leading-relaxed">
                    Hệ thống đã tự động ghi nhận hồ sơ của con vào <span className="font-black text-emerald-900">Danh sách Thí sinh Chung Kết chính thức</span>!
                  </div>
                </div>
              </div>

              {/* Next Steps Guidance */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                  <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Bước tiếp theo:</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Thầy cô Ban Tổ Chức Eflita sẽ chủ động liên hệ với phụ huynh qua số điện thoại <strong>{userProfile.phone}</strong> để thông báo lịch thi đấu và thể lệ Vòng Chung Kết.
                </p>
                <p className="text-slate-600 leading-relaxed text-[11px]">
                  Con hãy giữ vững tinh thần và tiếp tục ôn tập các bài học để tự tin tỏa sáng tại Vòng Chung Kết nhé! 🌟
                </p>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onEnterArena) onEnterArena();
                  }}
                  className="w-full bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-amber-950 font-black py-4 px-6 rounded-2xl shadow-lg border-2 border-yellow-300 font-['Fredoka',sans-serif] text-sm sm:text-base active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trophy className="w-5 h-5 text-amber-950 fill-amber-950 shrink-0" />
                  <span>Bước Vào Vòng Thi Shadowing Champion Ngay 🏆</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold transition cursor-pointer"
                >
                  Để sau, tiếp tục xem lộ trình bài học
                </button>
              </div>

              {/* Admin Reset Test Button */}
              {isAdmin && (
                <div className="pt-2 text-center border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateState(null, null);
                      setPostUrl('');
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    🔄 Reset luồng Champion để test lại từ đầu (Admin)
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
