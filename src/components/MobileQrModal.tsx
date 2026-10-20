import React, { useState } from 'react';
import { Smartphone, X, Copy, Check, ExternalLink, QrCode, Monitor, AlertCircle, Share2 } from 'lucide-react';
import { Language } from '../types';

interface MobileQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const MobileQrModal: React.FC<MobileQrModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  const [copied, setCopied] = useState(false);

  // The development URL that is currently active and running live
  const devUrl = 'https://ais-dev-cehtcjcael6oyemh2xes3a-80006356505.asia-southeast1.run.app';
  // The shared preview URL (requires clicking Share/Deploy in AI Studio to be active)
  const sharedUrl = 'https://ais-pre-cehtcjcael6oyemh2xes3a-80006356505.asia-southeast1.run.app';

  const [selectedLinkType, setSelectedLinkType] = useState<'dev' | 'shared'>('dev');

  if (!isOpen) return null;

  const activeUrl = selectedLinkType === 'dev' ? devUrl : sharedUrl;

  // QR Code image generator API
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    activeUrl
  )}&bgcolor=ffffff&color=451a03`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(activeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border-4 border-amber-300 relative my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-5 text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-2xl shadow-xs">
              📱
            </div>
            <div>
              <h3 className="font-black text-lg font-['Fredoka',sans-serif] leading-tight">
                {lang === 'vi' ? 'Xem Trên Điện Thoại' : 'View on Mobile'}
              </h3>
              <p className="text-xs font-bold text-amber-950/80">
                {lang === 'vi' ? 'Quét mã QR hoặc mở link trực tiếp' : 'Scan QR code or open direct link'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-amber-950/70 hover:text-amber-950 hover:bg-white/40 rounded-full transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 text-center">
          {/* QR Code Container */}
          <div className="inline-block p-3 bg-amber-50 rounded-3xl border-3 border-amber-200 shadow-inner">
            <img
              src={qrImageUrl}
              alt="Scan to open on mobile"
              className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl mx-auto block shadow-sm border border-amber-100"
            />
          </div>

          <div>
            <p className="text-xs sm:text-sm font-extrabold text-amber-950">
              {lang === 'vi'
                ? '👉 Mở ứng dụng Máy ảnh (Camera) trên điện thoại và quét mã QR'
                : '👉 Open your phone Camera app and point at the QR code'}
            </p>
          </div>

          {/* Copy Direct Link Section */}
          <div className="bg-slate-50 p-3 rounded-2xl border-2 border-slate-200 text-left space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase text-slate-500">
                {lang === 'vi' ? 'Đường link trực tiếp' : 'Direct Link'}
              </span>
              {copied && (
                <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{lang === 'vi' ? 'Đã sao chép!' : 'Copied!'}</span>
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={activeUrl}
                className="w-full text-xs bg-white border border-slate-200 rounded-xl px-2.5 py-2 font-mono text-slate-700 select-all focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="shrink-0 px-3 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-xs rounded-xl shadow-xs transition flex items-center gap-1 cursor-pointer font-['Fredoka',sans-serif]"
              >
                {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
                <span>{lang === 'vi' ? 'Sao chép' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Explanation if user sees "Page not found" */}
          <div className="p-3.5 bg-amber-50 rounded-2xl border-2 border-amber-300 text-left space-y-2">
            <div className="flex items-center gap-2 text-amber-900 font-black text-xs font-['Fredoka',sans-serif]">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{lang === 'vi' ? 'Tại sao báo "Page not found"?' : 'Why "Page not found"?'}</span>
            </div>
            <ul className="text-xs text-amber-900/90 space-y-1.5 list-disc list-inside font-medium leading-relaxed pl-1">
              <li>
                {lang === 'vi' ? (
                  <>
                    <strong>Nếu iPhone hiện thông báo "Action required to load your app":</strong> Chỉ cần bấm trực tiếp vào nút <strong>"Authenticate in new window"</strong> trên màn hình điện thoại (hoặc mở bằng Safari) để cấp quyền cookie xem trước là vào app ngay!
                  </>
                ) : (
                  <>
                    <strong>If iOS shows "Action required to load your app":</strong> Simply tap <strong>"Authenticate in new window"</strong> (or open in Safari) to grant preview security cookies!
                  </>
                )}
              </li>
              <li>
                {lang === 'vi' ? (
                  <>
                    <strong>Cách 1 (Kích hoạt link công khai):</strong> Trong màn hình quản trị trên máy tính, bấm nút <strong>"Share"</strong> (hoặc <strong>"Deploy"</strong>) ở góc trên bên phải để hệ thống xuất bản app.
                  </>
                ) : (
                  <>
                    <strong>Method 1:</strong> In the app dashboard, click <strong>"Share"</strong> or <strong>"Deploy"</strong> at the top right to publish the app.
                  </>
                )}
              </li>
              <li>
                {lang === 'vi' ? (
                  <>
                    <strong>Cách 2 (Mở bằng tài khoản Google):</strong> Trình duyệt trên điện thoại cần đăng nhập tài khoản Google của bạn để mở được link xem trước bảo mật.
                  </>
                ) : (
                  <>
                    <strong>Method 2:</strong> Your phone browser must be logged into your Google account to access private preview.
                  </>
                )}
              </li>
              <li>
                {lang === 'vi' ? (
                  <>
                    <strong>Cách 3 (Nhanh nhất không cần cài đặt):</strong> Nhấn phím <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-[10px]">F12</kbd> rồi bấm <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-[10px]">Ctrl + Shift + M</kbd> trên máy tính để xem giả lập điện thoại ngay lập tức!
                  </>
                ) : (
                  <>
                    <strong>Method 3 (Instant):</strong> Press <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-[10px]">F12</kbd> then <kbd className="px-1.5 py-0.5 bg-white border border-amber-300 rounded font-mono font-bold text-[10px]">Ctrl + Shift + M</kbd> to inspect in mobile mode.
                  </>
                )}
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-black rounded-xl transition cursor-pointer font-['Fredoka',sans-serif]"
          >
            {lang === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
