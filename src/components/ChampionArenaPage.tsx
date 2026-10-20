import React, { useState } from 'react';
import {
  Trophy,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  Calendar,
  Clock,
  Video,
  Upload,
  Send,
  Star,
  Award,
  Users,
  ShieldCheck,
  ExternalLink,
  Play,
  Volume2,
  Check,
  HelpCircle,
  FileText
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { UserProfile, ReflectionPost, ContestRegistration, Language, LevelType } from '../types';

interface ChampionArenaPageProps {
  userProfile: UserProfile;
  reflectionPost: ReflectionPost | null;
  contestRegistration: ContestRegistration | null;
  onBack: () => void;
  lang: Language;
  isAdmin?: boolean;
}

export const ChampionArenaPage: React.FC<ChampionArenaPageProps> = ({
  userProfile,
  reflectionPost,
  contestRegistration,
  onBack,
  lang,
  isAdmin = false,
}) => {
  const [activeTab, setActiveTab] = useState<'challenge' | 'schedule' | 'prizes'>('challenge');

  // Candidate Registration ID (generated from UID or timestamp)
  const candidateId = `EFLITA-SC26-${userProfile.uid ? userProfile.uid.substring(0, 5).toUpperCase() : '088'}`;

  // Submission state for Champion Round
  const [championVideoLink, setChampionVideoLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [hasSubmittedFinalVideo, setHasSubmittedFinalVideo] = useState(false);

  // Level-specific contest challenges
  const challengeData = {
    STARTER: {
      title: 'Vòng Thi Starter (6-7 Tuổi): "My Wonderful Superhero Family"',
      subtitle: 'Shadowing diễn cảm kết hợp cử chỉ đáng yêu giới thiệu về gia đình siêu nhân của con',
      duration: '60 - 90 giây',
      modelYoutubeId: '75NQK-Sm1YY',
      modelScript:
        "Hello everyone! Today, I want to tell you about my wonderful family. My dad is as strong as Superman, and my mom is as caring as Wonder Woman! I love them with all my heart. Thank you for listening!",
      breakdown: [
        { phrase: "Hello everyone!", tip: "Cười tươi, vẫy tay chào thân thiện với Ban Giám Khảo" },
        { phrase: "Today, I want to tell you about my wonderful family.", tip: "Nhấn rõ từ 'wonderful family'" },
        { phrase: "My dad is as strong as Superman,", tip: "Gồng tay tự tin biểu thị sức mạnh" },
        { phrase: "and my mom is as caring as Wonder Woman!", tip: "Đặt tay lên tim ấm áp" },
        { phrase: "I love them with all my heart. Thank you for listening!", tip: "Cúi đầu nhẹ chào kết bài duyên dáng" },
      ],
    },
    MOVERS: {
      title: 'Vòng Thi Movers (8-9 Tuổi): "A Day in My Dream School"',
      subtitle: 'Shadowing nhịp điệu tự nhiên chuẩn bản xứ & 30 giây tự giới thiệu năng khiếu tiếng Anh',
      duration: '90 - 120 giây',
      modelYoutubeId: 'u31qwQUeGuM',
      modelScript:
        "Good morning, respected judges! Welcome to my dream school, where books come to life and science is pure magic. Here, every student explores creativity and speaks English with joy every single day!",
      breakdown: [
        { phrase: "Good morning, respected judges!", tip: "Chào giám khảo dõng dạc, ánh mắt nhìn thẳng ống kính" },
        { phrase: "Welcome to my dream school,", tip: "Mở rộng 2 tay như đang chào đón mọi người" },
        { phrase: "where books come to life and science is pure magic.", tip: "Ngắt hơi nhẹ giữa 2 vế, nhấn mạnh 'pure magic'" },
        { phrase: "Here, every student explores creativity", tip: "Ngữ điệu đi lên thể hiện niềm hứng khởi" },
        { phrase: "and speaks English with joy every single day!", tip: "Phát âm rõ âm cuối 'speaks', 'joy', 'day'" },
      ],
    },
    FLYERS: {
      title: 'Vòng Thi Flyers (10-12 Tuổi): "Protecting Our Green Planet"',
      subtitle: 'Hùng biện Shadowing tiếng Anh truyền cảm hứng bảo vệ môi trường và tương lai Trái Đất',
      duration: '120 - 150 giây',
      modelYoutubeId: '36m1o-tM05g',
      modelScript:
        "Distinguished judges and friends, our planet is our only home. Small daily actions — planting trees, reducing plastics, and saving energy — create immense global impact. Let us stand united today for a greener tomorrow!",
      breakdown: [
        { phrase: "Distinguished judges and friends,", tip: "Phong thái chững chạc, giọng nói truyền cảm hứng" },
        { phrase: "our planet is our only home.", tip: "Trầm ấm, nhấn mạnh thông điệp sâu sắc" },
        { phrase: "Small daily actions — planting trees, reducing plastics,", tip: "Liệt kê nhịp 1-2-3 rõ ràng, có điểm dừng" },
        { phrase: "create immense global impact.", tip: "Nhấn mạnh 'immense global impact'" },
        { phrase: "Let us stand united today for a greener tomorrow!", tip: "Kết bài hào hùng, truyền lửa" },
      ],
    },
  }[userProfile.level || 'STARTER'];

  const handleSubmitFinal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!championVideoLink.trim()) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
      setHasSubmittedFinalVideo(true);
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    }, 900);
  };

  return (
    <div className="max-w-4xl w-full mx-auto py-4 sm:py-6 px-3 sm:px-4 relative pb-24 min-w-0">
      {/* Top Breadcrumb & Return to Map */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-1.5 bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 rounded-2xl border border-amber-200 shadow-2xs text-xs font-black transition active:scale-95 cursor-pointer font-['Fredoka',sans-serif]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{lang === 'vi' ? 'Quay lại Lộ trình' : 'Back to Path'}</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-black text-amber-900 bg-amber-100/80 px-3 py-1 rounded-full border border-amber-300">
          <Trophy className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
          <span>VÒNG THI CHUNG KẾT TOÀN QUỐC</span>
        </div>
      </div>

      {/* GRAND CHAMPION ARENA HEADER BANNER */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 rounded-3xl p-5 sm:p-7 text-amber-950 shadow-xl shadow-amber-300/40 border-4 border-yellow-300 relative overflow-hidden mb-6">
        {/* Decorative Golden Rays */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-48 h-48 bg-yellow-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/95 rounded-3xl p-2 shadow-lg border-2 border-yellow-300 flex items-center justify-center shrink-0 transform hover:scale-105 transition-transform">
              <span className="text-4xl sm:text-5xl">🏆</span>
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 bg-amber-950/20 rounded-full text-[11px] font-black uppercase tracking-wider text-amber-950 mb-1">
                <Sparkles className="w-3.5 h-3.5 fill-amber-300 text-amber-400" />
                <span>Đấu Trường Chung Kết Eflita</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-['Fredoka',sans-serif] tracking-tight leading-tight">
                Shadowing Champion 2026
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-950/90 mt-1 max-w-lg">
                Chúc mừng thí sinh xuất sắc đã chính thức góp mặt tại Vòng Tranh Tài Chung Kết Toàn Quốc!
              </p>
            </div>
          </div>

          {/* Official Candidate Pass Badge */}
          <div className="bg-white/95 backdrop-blur-md px-4 py-3.5 rounded-2xl border-2 border-yellow-300 shadow-md text-center min-w-[200px] shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Số Báo Danh (SBD)
            </span>
            <span className="font-mono font-black text-lg sm:text-xl text-amber-900 tracking-wider block">
              {candidateId}
            </span>
            <div className="flex items-center justify-center gap-1.5 mt-1 pt-1 border-t border-slate-100">
              <span className="text-xs font-black text-slate-800">{userProfile.student_name}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                {userProfile.level}
              </span>
            </div>
          </div>
        </div>

        {/* 4-Stage Contest Timeline Ribbon */}
        <div className="mt-6 pt-5 border-t-2 border-amber-950/15 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs font-black">
          <div className="bg-white/40 p-2.5 rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="text-[11px] text-amber-950">1. Vượt qua 21 Video ✓</span>
          </div>
          <div className="bg-white/40 p-2.5 rounded-2xl flex items-center justify-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-800 shrink-0" />
            <span className="text-[11px] text-amber-950">2. Bài Cảm Nhận ✓</span>
          </div>
          <div className="bg-white/95 p-2.5 rounded-2xl shadow-xs border border-yellow-400 flex items-center justify-center gap-2 text-amber-950">
            <span className="animate-pulse">🎯</span>
            <span className="text-[11px]">3. Bài Thi Chung Kết</span>
          </div>
          <div className="bg-white/40 p-2.5 rounded-2xl flex items-center justify-center gap-2 text-amber-950/80">
            <span>🎤</span>
            <span className="text-[11px]">4. Phỏng Vấn Giám Khảo</span>
          </div>
        </div>
      </div>

      {/* ARENA NAVIGATION TABS */}
      <div className="flex items-center gap-2 p-1.5 bg-white/90 rounded-2xl border border-amber-200 shadow-2xs mb-6 overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('challenge')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTab === 'challenge'
              ? 'bg-amber-400 text-amber-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Trophy className="w-4 h-4" />
          <span>Đề Thi & Nộp Bài Chung Kết</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTab === 'schedule'
              ? 'bg-amber-400 text-amber-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4 text-purple-600" />
          <span>Ban Giám Khảo & Lịch Phỏng Vấn</span>
        </button>

        <button
          onClick={() => setActiveTab('prizes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition cursor-pointer shrink-0 ${
            activeTab === 'prizes'
              ? 'bg-amber-400 text-amber-950 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Award className="w-4 h-4 text-rose-500" />
          <span>Bảng Vàng & Cơ Cấu Giải Thưởng</span>
        </button>
      </div>

      {/* ================= TAB 1: CHAMPIONSHIP CHALLENGE & SUBMISSION ================= */}
      {activeTab === 'challenge' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Challenge Prompt Box */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full inline-block">
                  ĐỀ THI CHÍNH THỨC • VÒNG CHUNG KẾT
                </span>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 font-['Fredoka',sans-serif] mt-1">
                  {challengeData.title}
                </h2>
                <p className="text-xs font-bold text-slate-500 mt-0.5">
                  {challengeData.subtitle} • Thời lượng: {challengeData.duration}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-100 text-amber-900 rounded-2xl flex items-center justify-center font-black text-xl shrink-0 shadow-2xs">
                🎬
              </div>
            </div>

            {/* Embedded Official Model Video */}
            <div className="rounded-2xl overflow-hidden border-2 border-amber-300 shadow-md bg-black aspect-video relative">
              <iframe
                src={`https://www.youtube.com/embed/${challengeData.modelYoutubeId}?rel=0&modestbranding=1`}
                title="Official Champion Model Video"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Model Script Display with Phrase Breakdown */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  Toàn văn câu mẫu chuẩn & Hướng dẫn diễn xuất từ Giám khảo:
                </h3>
              </div>

              <div className="p-4 bg-gradient-to-br from-amber-50/70 to-yellow-50/60 rounded-2xl border-2 border-amber-200 text-slate-800 text-xs sm:text-sm font-bold leading-relaxed space-y-2">
                <p className="font-extrabold text-amber-950 text-sm sm:text-base border-b border-amber-200 pb-2">
                  "{challengeData.modelScript}"
                </p>

                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 block">
                    Chi tiết từng câu & Cử chỉ biểu cảm gợi ý:
                  </span>
                  {challengeData.breakdown.map((item, idx) => (
                    <div key={idx} className="bg-white/90 p-2.5 rounded-xl border border-amber-200/80 flex items-start gap-2 text-xs">
                      <span className="w-5 h-5 rounded-full bg-amber-400 text-amber-950 font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="space-y-0.5">
                        <span className="font-black text-slate-900 block">{item.phrase}</span>
                        <span className="text-[11px] font-semibold text-amber-900 block">💡 {item.tip}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 100-Point Scoring Rubric */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                  <span>Thang Điểm & Tiêu Chí Chấm Của Hội Đồng Giám Khảo (100 Điểm)</span>
                </span>
                <span className="text-xs font-bold text-slate-500">Chấm điểm độc lập 3 Giám khảo</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-base font-black text-indigo-600 block">40 Điểm</span>
                  <span className="font-black text-slate-800 block">Phát Âm & Ngữ Điệu</span>
                  <span className="text-[10px] text-slate-500 block">Chuẩn âm cuối, nối từ, ngữ điệu tự nhiên</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-base font-black text-emerald-600 block">30 Điểm</span>
                  <span className="font-black text-slate-800 block">Nhịp Điệu Shadowing</span>
                  <span className="text-[10px] text-slate-500 block">Khớp tốc độ, nhịp thở bám sát bản ngữ</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-base font-black text-amber-600 block">20 Điểm</span>
                  <span className="font-black text-slate-800 block">Biểu Cảm & Tự Tin</span>
                  <span className="text-[10px] text-slate-500 block">Nụ cười, ánh mắt, cử chỉ sân khấu</span>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-200 text-center space-y-1">
                  <span className="text-base font-black text-rose-600 block">10 Điểm</span>
                  <span className="font-black text-slate-800 block">Hình Ảnh & Trang Phục</span>
                  <span className="text-[10px] text-slate-500 block">Góc quay sáng, âm thanh to rõ, lịch sự</span>
                </div>
              </div>
            </div>
          </div>

          {/* Submission Arena Card */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-300 shadow-md space-y-4">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="font-black text-base text-slate-900 font-['Fredoka',sans-serif]">
                  Khu Vực Nộp Bài Thi Video Vòng Chung Kết
                </h3>
                <p className="text-xs text-slate-500">
                  Học viên quay video thực hiện đề thi trên và gửi link Drive hoặc YouTube không công khai
                </p>
              </div>
            </div>

            {hasSubmittedFinalVideo ? (
              <div className="p-4 bg-emerald-50 border-2 border-emerald-300 rounded-2xl text-center space-y-2">
                <div className="w-12 h-12 mx-auto bg-emerald-100 rounded-2xl flex items-center justify-center text-2xl text-emerald-700">
                  🎉
                </div>
                <h4 className="font-black text-sm text-emerald-950 font-['Fredoka',sans-serif]">
                  Đã Nộp Bài Thi Chung Kết Thành Công!
                </h4>
                <p className="text-xs font-semibold text-emerald-800">
                  Hệ thống đã chuyển bài thi của SBD <strong>{candidateId}</strong> đến Hội đồng Giám khảo Eflita. Thầy cô sẽ chấm điểm và thông báo kết quả tại buổi Gala vinh danh!
                </p>
                <div className="pt-2">
                  <a
                    href={championVideoLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-900 text-xs font-bold rounded-xl border border-emerald-300 shadow-2xs hover:bg-emerald-100"
                  >
                    <span>Xem lại video đã nộp</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitFinal} className="space-y-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                    Đường link Video Bài Thi Vòng Chung Kết (Google Drive / YouTube / Facebook Video) *
                  </label>
                  <input
                    type="url"
                    required
                    value={championVideoLink}
                    onChange={(e) => setChampionVideoLink(e.target.value)}
                    placeholder="https://drive.google.com/file/d/... hoặc link video của con"
                    className="w-full px-4 py-3 bg-amber-50/50 border-2 border-amber-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-amber-400 transition"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    * Lưu ý: Nếu gửi link Google Drive, phụ huynh vui lòng mở quyền truy cập "Bất kỳ ai có đường liên kết" (Viewer) để Giám khảo có thể xem được bài nhé!
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting || !championVideoLink.trim()}
                    className="w-full sm:w-auto bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:from-yellow-500 hover:to-amber-500 text-amber-950 font-black py-3 px-6 rounded-2xl shadow-md border-2 border-yellow-400 font-['Fredoka',sans-serif] text-sm active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Đang gửi bài thi...' : 'Nộp Bài Thi Chung Kết ✨'}</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setChampionVideoLink('https://drive.google.com/file/d/test_final_video_2026/view')}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                    >
                      ⚡ Điền link mẫu (Admin Test)
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: JUDGES & INTERVIEW SCHEDULE ================= */}
      {activeTab === 'schedule' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Judges Board Grid */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-purple-200 shadow-sm space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full inline-block">
                HỘI ĐỒNG BAN GIÁM KHẢO CHUYÊN MÔN
              </span>
              <h3 className="text-lg font-black text-slate-900 font-['Fredoka',sans-serif] mt-1">
                Các Thầy Cô Giám Khảo Đồng Hành Cùng Thí Sinh
              </h3>
              <p className="text-xs text-slate-500">
                Đội ngũ chuyên gia ngôn ngữ tiếng Anh trẻ em hàng đầu tại Eflita English
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="p-4 rounded-2xl bg-gradient-to-b from-purple-50/60 to-indigo-50/40 border border-purple-200 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-200 flex items-center justify-center text-3xl shadow-xs">
                  👩‍🏫
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900">Cô Thảo Eflita</h4>
                  <span className="text-[10px] font-bold text-purple-700 block">Trưởng Ban Chuyên Môn</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Chuyên gia phương pháp Shadowing và phát triển ngữ điệu tự nhiên cho trẻ em
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-b from-sky-50/60 to-blue-50/40 border border-sky-200 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-sky-200 flex items-center justify-center text-3xl shadow-xs">
                  👨‍🏫
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900">Teacher David Miller</h4>
                  <span className="text-[10px] font-bold text-sky-700 block">Giám Khảo Bản Ngữ (USA)</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Hơn 10 năm kinh nghiệm giảng dạy tiếng Anh Cambridge Starter, Movers, Flyers
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-b from-emerald-50/60 to-teal-50/40 border border-emerald-200 text-center space-y-2">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-200 flex items-center justify-center text-3xl shadow-xs">
                  👩‍🎓
                </div>
                <div>
                  <h4 className="font-black text-xs sm:text-sm text-slate-900">Cô Phương Anh</h4>
                  <span className="text-[10px] font-bold text-emerald-700 block">Cố Vấn Tâm Lý Học Đường</span>
                  <p className="text-[11px] text-slate-500 mt-1 leading-snug">
                    Đồng hành khích lệ sự tự tin, kỹ năng thuyết trình và tỏa sáng trước ống kính
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 1-on-1 Live Interview Schedule */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-0.5 rounded-full inline-block">
                  PHÒNG THI PHỎNG VẤN TRỰC TIẾP
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Fredoka',sans-serif] mt-1">
                  Lịch Phỏng Vấn 1-1 Cùng Ban Giám Khảo (Zoom / Google Meet)
                </h3>
              </div>
              <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-900 rounded-full border border-amber-300">
                15 Phút / Thí Sinh
              </span>
            </div>

            <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs font-bold text-slate-800">
                  Thời gian thi dự kiến: <span className="text-amber-950 font-black">Thứ Bảy & Chủ Nhật hàng tuần</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-xs font-bold text-slate-800">
                  Khung giờ phỏng vấn: <span className="text-amber-950 font-black">09:00 - 11:30 & 14:30 - 17:00</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs text-slate-700 leading-relaxed">
                📌 Thầy cô Ban Thư Ký Eflita sẽ gọi điện thoại trực tiếp cho phụ huynh theo số <strong>{userProfile.phone}</strong> trước 48 giờ để xác nhận khung giờ chính xác và gửi link phòng thi Zoom an toàn.
              </div>
            </div>

            {/* Preparation Tips for Young Contestants */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700">
                Chuẩn bị gì trước khi vào phòng phỏng vấn:
              </h4>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Trang phục lịch sự, gọn gàng, tự tin</span>
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Phòng thi yên tĩnh, đủ ánh sáng chiếu vào mặt</span>
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Kiểm tra tai nghe, micro và đường truyền Internet</span>
                </li>
                <li className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Thả lỏng tinh thần, cười tươi và giao lưu vui vẻ</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 3: HALL OF FAME & PRIZES ================= */}
      {activeTab === 'prizes' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Grand Prizes Showcase */}
          <div className="bg-gradient-to-br from-amber-500 via-yellow-400 to-amber-500 rounded-3xl p-6 text-amber-950 border-4 border-yellow-300 shadow-lg space-y-4">
            <div className="text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider bg-amber-950/20 px-3 py-0.5 rounded-full inline-block">
                VINH DANH QUÁN QUÂN
              </span>
              <h3 className="text-2xl font-black font-['Fredoka',sans-serif]">
                Cơ Cấu Giải Thưởng Vòng Chung Kết 2026
              </h3>
              <p className="text-xs font-bold text-amber-950/80">
                Tổng giá trị giải thưởng và học bổng lên đến 50.000.000 VNĐ
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2">
              {/* Grand Champion */}
              <div className="bg-white/95 p-4 rounded-2xl border-2 border-yellow-400 shadow-md text-center space-y-2 transform sm:-translate-y-2 transition-transform">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center text-3xl shadow-xs">
                  🥇
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 block">
                    01 Giải Nhất
                  </span>
                  <h4 className="font-black text-sm text-slate-900 font-['Fredoka',sans-serif]">
                    QUÁN QUÂN TOÀN QUỐC
                  </h4>
                  <span className="font-extrabold text-xs text-amber-700 block mt-1">
                    Cúp Vàng Vô Địch + 10.000.000đ
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Học bổng Eflita 1 năm + Giấy khen Bộ phận Đào tạo + Quà tặng công nghệ
                  </p>
                </div>
              </div>

              {/* Runner-up */}
              <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shadow-xs">
                  🥈
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                    02 Giải Nhì
                  </span>
                  <h4 className="font-black text-sm text-slate-900 font-['Fredoka',sans-serif]">
                    Á QUÂN SHADOWING
                  </h4>
                  <span className="font-extrabold text-xs text-slate-700 block mt-1">
                    Cúp Bạc + 5.000.000đ
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Học bổng Eflita 6 tháng + Giấy khen + Bộ quà tặng lưu niệm độc quyền
                  </p>
                </div>
              </div>

              {/* Third Place & Special Awards */}
              <div className="bg-white/90 p-4 rounded-2xl border border-slate-200 shadow-sm text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 flex items-center justify-center text-2xl shadow-xs">
                  🥉
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                    05 Giải Chuyên Đề
                  </span>
                  <h4 className="font-black text-sm text-slate-900 font-['Fredoka',sans-serif]">
                    GIẢI ẤN TƯỢNG & TỰ TIN
                  </h4>
                  <span className="font-extrabold text-xs text-amber-800 block mt-1">
                    Huy Chương Đồng + Quà Tặng
                  </span>
                  <p className="text-[10px] text-slate-500 mt-1 leading-snug">
                    Giải Phát Âm Chuẩn Nhất, Giải Tự Tin Nhất, Giải Sáng Tạo Nhất
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualified Finalists Honor Roll */}
          <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-amber-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full inline-block">
                  DANH SÁCH THÍ SINH VÒNG CHUNG KẾT
                </span>
                <h3 className="text-base sm:text-lg font-black text-slate-900 font-['Fredoka',sans-serif] mt-1">
                  Bảng Vàng Danh Dự: Các Thí Sinh Đã Đủ Điều Kiện Dự Thi
                </h3>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Cập nhật tự động từ hệ thống
              </span>
            </div>

            <div className="space-y-2.5">
              {/* Current Student's Top Row */}
              <div className="p-3.5 bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 rounded-2xl border-2 border-yellow-300 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-yellow-950 font-black flex items-center justify-center text-lg shadow-2xs">
                    🌟
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-slate-900 text-sm">{userProfile.student_name}</span>
                      <span className="text-[10px] px-2 py-0.2 rounded-full font-black bg-amber-200 text-amber-900">
                        (Con)
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500 font-bold block">
                      SBD: {candidateId} • Cấp độ: {userProfile.level}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-700 block">Đủ Điều Kiện ✓</span>
                  <span className="text-[10px] text-slate-400 font-semibold">21/21 Video + Bài cảm nhận</span>
                </div>
              </div>

              {/* Sample Peer Finalists */}
              {[
                { name: 'Nguyễn Minh Khang', sbd: 'EFLITA-SC26-001', level: 'MOVERS', status: 'Đủ điều kiện ✓' },
                { name: 'Trần Bảo Anh', sbd: 'EFLITA-SC26-002', level: 'FLYERS', status: 'Đủ điều kiện ✓' },
                { name: 'Lê Gia Huy', sbd: 'EFLITA-SC26-003', level: 'STARTER', status: 'Đủ điều kiện ✓' },
              ].map((peer, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-400 font-black">#{i + 2}</span>
                    <div>
                      <span className="font-extrabold text-slate-800 block">{peer.name}</span>
                      <span className="text-[10px] font-mono text-slate-500">SBD: {peer.sbd} • {peer.level}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700">{peer.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
