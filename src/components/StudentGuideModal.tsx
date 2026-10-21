import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Video,
  Upload,
  Trophy,
  Flame,
  HelpCircle,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Language } from '../types';

interface StudentGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const StudentGuideModal: React.FC<StudentGuideModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'faq'>('steps');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl border-4 border-amber-300 relative my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-left">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-5 text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/40 flex items-center justify-center text-2xl shadow-xs shrink-0">
              💡
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl font-['Fredoka',sans-serif] leading-tight">
                {lang === 'vi' ? 'Hướng Dẫn Tự Học Cùng KidShadow' : 'KidShadow Self-Paced Learning Guide'}
              </h3>
              <p className="text-xs font-bold text-amber-950/85 mt-0.5">
                {lang === 'vi'
                  ? 'Quy trình học đơn giản • Tự động ghi nhận tiến độ • Luyện tập mỗi ngày'
                  : 'Simple 3-step routine • Automatic progress tracking • Practice every day'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-950/70 hover:text-amber-950 hover:bg-white/40 rounded-full transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-amber-200 bg-amber-50/60 px-5 pt-3 gap-2">
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-extrabold text-xs sm:text-sm border-b-3 transition cursor-pointer ${
              activeTab === 'steps'
                ? 'border-amber-600 text-amber-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Quy Trình 3 Bước Luyện Tập' : '3-Step Routine'}</span>
          </button>
          <button
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 pb-2.5 px-3 font-extrabold text-xs sm:text-sm border-b-3 transition cursor-pointer ${
              activeTab === 'faq'
                ? 'border-amber-600 text-amber-950'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>{lang === 'vi' ? 'Câu Hỏi Thường Gặp (FAQ)' : 'FAQ & Troubleshooting'}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto space-y-4">
          {activeTab === 'steps' ? (
            <div className="space-y-4">
              {/* Step 1 */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border-2 border-amber-200 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  1
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>Xem video & Luyện nói đuổi (Shadowing)</span>
                    <span className="text-[10px] bg-amber-200 text-amber-900 px-2 py-0.2 rounded-md font-bold">5-7 phút</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Học viên xem video mẫu trực tiếp trong app, luyện tập nói theo ngữ điệu, nhấn âm và tốc độ của người bản xứ. Có thể tua lại từng đoạn để luyện nói thật tự nhiên.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-4 rounded-2xl bg-sky-50/80 border-2 border-sky-200 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>Quay video bài nói & Bấm "Nộp bài"</span>
                    <span className="text-[10px] bg-sky-200 text-sky-900 px-2 py-0.2 rounded-md font-bold">Lưu vào Drive</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Dùng điện thoại quay video bài nói của bé rồi bấm <strong>"Tải video của con lên"</strong>. Video được lưu vào Google Drive của gia đình và hệ thống tự động ghi nhận bài nộp. Bài nộp chỉ được tính khi video đã lưu thành công.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 border-2 border-emerald-200 flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-xs">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                    <span>Tích lũy Streak & Tham gia Shadowing Champion</span>
                    <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.2 rounded-md font-bold">Huy hiệu & Bằng khen</span>
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Hoàn thành 3 video/tuần trong 7 tuần (tổng 21 bài) để mở khóa Giấy khen tốt nghiệp. Sau đó đăng bài cảm nhận lên cộng đồng Eflita để đủ điều kiện tham dự vòng thi Chung kết Shadowing Champion có ban giám khảo chấm giải!
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="text-amber-500">❓</span>
                  <span>Khóa học có yêu cầu cài đặt phần mềm phức tạp không?</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  Không. Ứng dụng chạy trực tiếp trên trình duyệt Web (Chrome, Safari, Cốc Cốc) của Điện thoại, iPad và Máy tính. Phụ huynh chỉ cần lưu trang vào màn hình chính (Add to Home Screen) là sử dụng như một ứng dụng thông thường.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="text-amber-500">❓</span>
                  <span>Video bài tập của con được lưu ở đâu? Có yêu cầu cấp quyền gì không?</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  Video được lưu vào thư mục "Shadowing Submissions" trên Google Drive của riêng gia đình. Khi nộp bài lần đầu, phụ huynh cần cho phép ứng dụng kết nối Google Drive. Video cũng được chia sẻ cho giáo viên Eflita để tổng hợp tư liệu cho cuộc thi. Bài nộp chỉ được tính khi video đã lưu thành công, vì vậy hãy chắc chắn Drive còn đủ dung lượng trống (nếu Drive đầy, phụ huynh dọn bớt dung lượng rồi nộp lại).
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="text-amber-500">❓</span>
                  <span>Bé có thể chuyển đổi cấp độ (Starter, Movers, Flyers) không?</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  Hoàn toàn được! Phụ huynh hoặc học viên có thể bấm vào nút Cấp độ ở thanh tiêu đề (Navbar) hoặc thanh đổi cấp độ trên bản đồ bài học bất kỳ lúc nào để chuyển đổi phù hợp với độ tuổi và năng lực của con mà không cần nhân viên hỗ trợ.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <h5 className="font-black text-slate-900 mb-1 flex items-center gap-1.5">
                  <span className="text-amber-500">❓</span>
                  <span>Video luyện tập hàng tuần có được giáo viên chấm không?</span>
                </h5>
                <p className="text-slate-600 leading-relaxed">
                  Không. Video luyện tập hàng tuần giúp con rèn thói quen luyện nói và theo dõi tiến độ, không được chấm điểm. Vòng thi chính thức "Shadowing Champion" do Hội đồng giám khảo chuyên môn của Eflita đánh giá video tham gia thi của các thí sinh đủ điều kiện.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Eflita Education • KidShadow</span>
          </span>
          <button
            onClick={onClose}
            className="bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs px-4 py-2 rounded-xl transition cursor-pointer"
          >
            {lang === 'vi' ? 'Đã hiểu, bắt đầu luyện tập!' : 'Got it, let\'s practice!'}
          </button>
        </div>
      </div>
    </div>
  );
};
