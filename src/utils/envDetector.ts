// Phát hiện trình duyệt nhúng (Zalo, Messenger, Facebook, Instagram, TikTok...)
export interface EnvInfo {
  os: 'ios' | 'android' | 'other';
  inApp: boolean;
}

const IN_APP_REGEX =
  /Zalo|FBAN|FBAV|FB_IAB|Instagram|Messenger|TikTok|Line\/|MicroMessenger|Snapchat|Twitter|GSA\/|LinkedInApp|KAKAOTALK|Viber|Pinterest/i;

export function detectEnv(): EnvInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { os: 'other', inApp: false };
  }

  const ua = navigator.userAgent || '';

  let os: EnvInfo['os'] = 'other';
  if (/iPhone|iPad|iPod/i.test(ua)) os = 'ios';
  else if (/Android/i.test(ua)) os = 'android';

  // App đã thêm ra màn hình chính (PWA) cũng thiếu chữ "Safari" nhưng KHÔNG phải trình duyệt nhúng.
  let standalone = false;
  try {
    standalone =
      (navigator as any).standalone === true ||
      (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches);
  } catch {}
  if (standalone) return { os, inApp: false };

  let inApp = false;
  if (IN_APP_REGEX.test(ua)) {
    inApp = true;
  } else if (os === 'ios') {
    // WebView của iOS có AppleWebKit nhưng không có chữ "Safari" (CriOS/FxiOS vẫn có "Safari")
    inApp = /AppleWebKit/i.test(ua) && !/Safari/i.test(ua);
  } else if (os === 'android') {
    inApp = /;\s*wv\)/i.test(ua);
  }

  return { os, inApp };
}
