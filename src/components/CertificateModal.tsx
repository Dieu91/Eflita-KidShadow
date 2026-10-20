import React, { useState } from 'react';
import {
  X,
  Award,
  Download,
  Share2,
  Check,
  Sparkles,
  Printer,
  Calendar,
  Star
} from 'lucide-react';
import { UserProfile, Language, LevelType } from '../types';
import confetti from 'canvas-confetti';

interface CertificateModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  lang: Language;
}

export const CertificateModal: React.FC<CertificateModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  lang,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  React.useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const todayStr = new Date().toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const getLevelTitle = (level: LevelType) => {
    switch (level) {
      case 'STARTER':
        return 'Starter (6-7 Tuổi)';
      case 'MOVERS':
        return 'Movers (8-9 Tuổi)';
      case 'FLYERS':
        return 'Flyers (10-12 Tuổi)';
      default:
        return level;
    }
  };

  const handleShare = () => {
    const text = `🎉 Con ${userProfile.student_name} đã hoàn thành xuất sắc 21/21 bài luyện nói Shadowing Tiếng Anh cấp độ ${userProfile.level} tại Eflita!`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/75 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border-4 border-amber-300 relative my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-center">
        {/* Modal Top Bar */}
        <div className="bg-amber-100/80 px-4 py-2.5 border-b border-amber-200 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-1.5 text-xs font-black text-amber-900">
            <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
            <span>{lang === 'vi' ? 'Chứng Nhận Tốt Nghiệp Khóa Học' : 'Certificate of Completion'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-800 rounded-full hover:bg-white/60 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Certificate Printable Canvas */}
        <div className="p-6 sm:p-10 bg-gradient-to-b from-amber-50/50 via-white to-amber-50/40 relative">
          {/* Ornate Certificate Border */}
          <div className="border-4 border-double border-amber-400/90 rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-white/95 shadow-sm">
            {/* Corner Decorative Accents */}
            <div className="absolute top-2 left-2 text-amber-400 text-lg">✦</div>
            <div className="absolute top-2 right-2 text-amber-400 text-lg">✦</div>
            <div className="absolute bottom-2 left-2 text-amber-400 text-lg">✦</div>
            <div className="absolute bottom-2 right-2 text-amber-400 text-lg">✦</div>

            {/* Official Eflita Logo Header */}
            <div className="mb-4">
              <img
                src="/eflita-logo.png"
                alt="Eflita Education"
                className="h-10 sm:h-12 w-auto mx-auto object-contain"
              />
            </div>

            <div className="inline-block px-3 py-1 bg-amber-100 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-widest text-amber-900 border border-amber-300 mb-3">
              CHỨNG NHẬN HOÀN THÀNH • CERTIFICATE OF ACHIEVEMENT
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 font-['Fredoka',sans-serif] uppercase tracking-wide">
              VINH DANH HỌC VIÊN
            </h2>

            <div className="my-4">
              <h3 className="text-2xl sm:text-3xl font-black text-amber-800 font-['Fredoka',sans-serif] underline decoration-amber-400 decoration-wavy underline-offset-8">
                {userProfile.student_name}
              </h3>
            </div>

            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed mt-2 font-medium">
              Đã hoàn thành xuất sắc toàn bộ <strong>21/21 video bài học</strong> trong chương trình <strong>7 Tuần Luyện Nói Shadowing Tiếng Anh</strong>
            </p>

            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-orange-400 text-amber-950 font-black text-xs sm:text-sm shadow-xs">
              <Award className="w-4 h-4" />
              <span>Cấp độ: {getLevelTitle(userProfile.level)}</span>
            </div>

            {/* Date and Signature Footer */}
            <div className="mt-8 pt-4 border-t border-amber-200/80 flex items-center justify-between text-xs text-slate-600">
              <div className="text-left">
                <span className="text-[10px] text-slate-600 block">Ngày cấp:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>{todayStr}</span>
                </span>
              </div>

              <div className="text-right">
                <span className="text-[10px] text-slate-600 block">Hội đồng đào tạo:</span>
                <span className="font-black text-amber-800 font-['Fredoka',sans-serif] text-sm">
                  Eflita Education
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-amber-300 text-amber-900 font-bold text-xs hover:bg-amber-50 transition cursor-pointer shadow-2xs"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép lời chúc!' : 'Chia sẻ Zalo / Facebook'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>In / Lưu PDF</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
