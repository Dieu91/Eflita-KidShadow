import { BrandConfig } from '../types';
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const DEFAULT_BRAND_CONFIG: BrandConfig = {
  brandName: 'KidShadow',
  brandSubtitle: 'Shadowing Champion',
  logoUrl: '/kidshadow-logo.svg',
  websiteUrl: 'https://eflita.com',
};

const LOCAL_STORAGE_KEY = 'kidshadow_brand_config_v2';

export const getStoredBrandConfig = async (): Promise<BrandConfig> => {
  // First check localStorage for instant synchronous-like render
  try {
    const local = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (local) {
      const parsed = JSON.parse(local);
      if (parsed && typeof parsed.brandName === 'string') {
        const cleanedBrandName = parsed.brandName.replace(/eflita\s*/i, '').trim() || 'KidShadow';
        const cleanedLogoUrl = (parsed.logoUrl && parsed.logoUrl !== '/eflita-logo.png' && !parsed.logoUrl.startsWith('data:image')) 
          ? parsed.logoUrl 
          : '/kidshadow-logo.svg';
        return { 
          ...DEFAULT_BRAND_CONFIG, 
          ...parsed, 
          brandName: cleanedBrandName,
          brandSubtitle: 'Shadowing Champion',
          logoUrl: cleanedLogoUrl
        };
      }
    }
  } catch (e) {
    console.warn('Failed to parse local brand config:', e);
  }

  // Then try to fetch global brand setting from Firestore
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    const snap = await getDoc(brandDocRef);
    if (snap.exists()) {
      const data = snap.data() as BrandConfig;
      const cleanedBrandName = (data.brandName || 'KidShadow').replace(/eflita\s*/i, '').trim() || 'KidShadow';
      const cleanedLogoUrl = (data.logoUrl && data.logoUrl !== '/eflita-logo.png' && !data.logoUrl.startsWith('data:image')) 
        ? data.logoUrl 
        : '/kidshadow-logo.svg';
      const cleanData: BrandConfig = {
        ...DEFAULT_BRAND_CONFIG,
        ...data,
        brandName: cleanedBrandName,
        brandSubtitle: 'Shadowing Champion',
        logoUrl: cleanedLogoUrl
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanData));
      return cleanData;
    }
  } catch (err) {
    console.warn('Could not fetch brand from Firestore, using default:', err);
  }

  return DEFAULT_BRAND_CONFIG;
};

export const saveBrandConfig = async (config: BrandConfig): Promise<void> => {
  // Save locally
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(config));

  // Try to persist to Firestore
  try {
    const brandDocRef = doc(db, 'settings', 'brand');
    await setDoc(brandDocRef, config, { merge: true });
  } catch (err) {
    console.warn('Failed to persist brand config to Firestore:', err);
  }
};
