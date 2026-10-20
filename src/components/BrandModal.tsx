import React, { useState } from 'react';
import { X, Upload, Link as LinkIcon, Check, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';
import { BrandConfig, Language } from '../types';
import { DEFAULT_BRAND_CONFIG } from '../services/brandService';

interface BrandModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandConfig: BrandConfig;
  onSave: (newConfig: BrandConfig) => Promise<void>;
  lang: Language;
}

export const BrandModal: React.FC<BrandModalProps> = ({
  isOpen,
  onClose,
  brandConfig,
  onSave,
  lang,
}) => {
  const [brandName, setBrandName] = useState(brandConfig.brandName || 'KidShadow');
  const [brandSubtitle, setBrandSubtitle] = useState(brandConfig.brandSubtitle || 'Eflita English');
  const [logoUrl, setLogoUrl] = useState(brandConfig.logoUrl || '');
  const [inputUrl, setInputUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  // Handle local file upload (converts to base64 for instant display and persistence)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(lang === 'vi' ? 'Vui lòng chọn file hình ảnh (PNG, JPG, SVG, WebP)' : 'Please select an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(lang === 'vi' ? 'File ảnh không nên vượt quá 2MB' : 'Image file should be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setLogoUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = () => {
    if (inputUrl.trim()) {
      setLogoUrl(inputUrl.trim());
      setInputUrl('');
    }
  };

  const handleResetDefault = () => {
    setBrandName(DEFAULT_BRAND_CONFIG.brandName);
    setBrandSubtitle(DEFAULT_BRAND_CONFIG.brandSubtitle || 'Shadowing Champion');
    setLogoUrl('/kidshadow-logo.svg');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave({
        brandName: brandName.trim() || 'KidShadow',
        brandSubtitle: brandSubtitle.trim(),
        logoUrl: logoUrl.trim(),
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 800);
    } catch (err) {
      console.error('Failed to save brand config:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/65 backdrop-blur-xs overflow-y-auto">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl border-4 border-amber-300 relative my-6 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 p-5 text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/40 flex items-center justify-center text-2xl shadow-xs">
              🎨
            </div>
            <div>
              <h3 className="font-black text-lg font-['Fredoka',sans-serif] leading-tight">
                {lang === 'vi' ? 'Cấu Hình Logo & Thương Hiệu' : 'Brand & Logo Settings'}
              </h3>
              <p className="text-xs font-bold text-amber-950/80">
                {lang === 'vi' ? 'Thêm logo và tên thương hiệu của bạn vào app' : 'Add your logo and brand identity'}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Live Preview Card */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-4 rounded-2xl border-2 border-amber-200 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full inline-block mb-3">
              {lang === 'vi' ? 'Xem trước hiển thị (Live Preview)' : 'Live Preview'}
            </span>
            <div className="flex items-center justify-center gap-3 bg-white p-3 rounded-2xl border border-amber-200 shadow-sm max-w-xs mx-auto">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Brand Logo"
                  className="h-10 w-auto max-w-[150px] object-contain rounded-xl border border-amber-200 bg-white p-1"
                  onError={() => {
                    alert(lang === 'vi' ? 'Không thể tải ảnh từ link này. Vui lòng kiểm tra lại URL.' : 'Failed to load image from URL.');
                    setLogoUrl('');
                  }}
                />
              ) : (
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-orange-400 flex items-center justify-center text-2xl shadow-xs">
                  🦁
                </div>
              )}
              <div className="text-left">
                <h4 className="font-black text-base text-slate-800 font-['Fredoka',sans-serif] leading-tight">
                  {brandName || 'KidShadow'}
                </h4>
                <p className="text-[11px] font-bold text-amber-700">
                  {brandSubtitle || 'Eflita English'}
                </p>
              </div>
            </div>
          </div>

          {/* Logo Upload / URL Options */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              {lang === 'vi' ? 'Logo Thương Hiệu' : 'Brand Logo'}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* File upload button */}
              <label className="border-2 border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/50 hover:bg-amber-100/50 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center">
                <Upload className="w-5 h-5 text-amber-600" />
                <span className="text-xs font-extrabold text-amber-950 font-['Fredoka',sans-serif]">
                  {lang === 'vi' ? 'Tải ảnh lên (File)' : 'Upload File'}
                </span>
                <span className="text-[10px] text-amber-700">PNG, JPG, SVG (&lt;2MB)</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Reset to Default */}
              <button
                type="button"
                onClick={handleResetDefault}
                className="border-2 border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 p-3 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition text-center"
              >
                <RefreshCw className="w-5 h-5 text-slate-500" />
                <span className="text-xs font-extrabold text-slate-700 font-['Fredoka',sans-serif]">
                  {lang === 'vi' ? 'Dùng Logo KidShadow' : 'Use KidShadow Logo'}
                </span>
                <span className="text-[10px] text-slate-500">Logo chuẩn bản quyền app</span>
              </button>
            </div>

            {/* Quick Logo Presets */}
            <div className="pt-1">
              <span className="text-[11px] font-bold text-slate-500 block mb-1.5">
                {lang === 'vi' ? 'Bộ sưu tập logo có sẵn:' : 'Available Logo Presets:'}
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl('/kidshadow-logo.svg');
                    setBrandName('KidShadow');
                    setBrandSubtitle('Shadowing Champion');
                  }}
                  className={`p-2 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    logoUrl === '/kidshadow-logo.svg'
                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <img src="/kidshadow-logo.svg" alt="KidShadow" className="h-6 w-auto" />
                  <span className="truncate">Logo KidShadow</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLogoUrl('/eflita-logo.png');
                    setBrandName('Eflita');
                    setBrandSubtitle('English');
                  }}
                  className={`p-2 rounded-xl border text-left text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                    logoUrl === '/eflita-logo.png'
                      ? 'bg-amber-100 border-amber-400 text-amber-950'
                      : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <img src="/eflita-logo.png" alt="Eflita" className="h-6 w-auto" />
                  <span className="truncate">Logo Eflita</span>
                </button>
              </div>
            </div>

            {/* Direct URL input */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-500">
                {lang === 'vi' ? 'Hoặc dán đường link ảnh logo (URL):' : 'Or paste an image URL:'}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  placeholder="https://example.com/logo.png"
                  value={inputUrl}
                  onChange={(e) => setInputUrl(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-700 focus:outline-none focus:border-amber-400"
                />
                <button
                  type="button"
                  onClick={handleApplyUrl}
                  disabled={!inputUrl.trim()}
                  className="shrink-0 px-3 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  {lang === 'vi' ? 'Áp dụng' : 'Apply'}
                </button>
              </div>
            </div>
          </div>

          {/* Brand Name Input */}
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              {lang === 'vi' ? 'Tên Thương Hiệu / Trung Tâm' : 'Brand Name'}
            </label>
            <input
              type="text"
              required
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="VD: KidShadow, Eflita English, ..."
              className="w-full text-sm bg-slate-50 border-2 border-slate-300 focus:border-amber-400 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:outline-none"
            />
          </div>

          {/* Brand Subtitle / Slogan */}
          <div className="space-y-1">
            <label className="block text-xs font-black uppercase tracking-wider text-slate-600">
              {lang === 'vi' ? 'Slogan / Mô Tả Phụ' : 'Brand Slogan / Subtitle'}
            </label>
            <input
              type="text"
              value={brandSubtitle}
              onChange={(e) => setBrandSubtitle(e.target.value)}
              placeholder="VD: Shadowing Tiếng Anh Tiểu Học"
              className="w-full text-sm bg-slate-50 border-2 border-slate-300 focus:border-amber-400 rounded-xl px-3.5 py-2.5 font-bold text-slate-800 focus:outline-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-black rounded-xl transition cursor-pointer font-['Fredoka',sans-serif]"
            >
              {lang === 'vi' ? 'Hủy' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black text-xs rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer font-['Fredoka',sans-serif] disabled:opacity-60"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{lang === 'vi' ? 'Đã lưu!' : 'Saved!'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-800" />
                  <span>{isSaving ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : (lang === 'vi' ? 'Lưu Thương Hiệu' : 'Save Brand')}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
