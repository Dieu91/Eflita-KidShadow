import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  setLogLevel,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserProfile, Submission, ReflectionPost, ContestRegistration, Lesson, SystemSettings } from '../types';
import { SAMPLE_LESSONS, getLessonDocId, STANDARD_LESSON_IDS, isStandardLessonDocId } from '../data/lessonsData';
import { sanitizeTeacherFeedback, isFeedbackFaultyOrWarning } from '../utils/sanitizeFeedback';
import { getDetailedPedagogicalFeedback } from '../utils/feedbackGenerator';

// Default system settings
export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  validityWeeks: 8, // Default 8 weeks
  expirationMode: 'lock', // 'lock' = lockout notification, 'delete' = auto delete records
  adminEmails: ['aidieu0411@gmail.com']
};

// Base configured admin emails
export const ADMIN_EMAILS = [
  'aidieu0411@gmail.com'
];

let cachedAdminEmails: string[] = ['aidieu0411@gmail.com'];

export const isUserAdmin = (email?: string | null, userProfile?: UserProfile | null): boolean => {
  // Lưu ý: chỉ dựa vào email/vai trò đã lưu. Không còn "chế độ test" trong localStorage
  // và không còn quy tắc "email chứa chữ admin" (ai cũng có thể đặt email như vậy).
  if (userProfile?.role === 'admin') {
    return true;
  }
  if (!email) {
    return false;
  }
  const lower = email.toLowerCase().trim();
  if (ADMIN_EMAILS.includes(lower) || lower.endsWith('@eflita.com')) {
    return true;
  }
  if (cachedAdminEmails.map(e => e.toLowerCase().trim()).includes(lower)) {
    return true;
  }
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem('eflita_admin_emails');
      if (stored) {
        const list: string[] = JSON.parse(stored);
        if (list.map(e => e.toLowerCase().trim()).includes(lower)) return true;
      }
    } catch {}
  }
  return false;
};

export const setAdminTestMode = (enabled: boolean): void => {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('eflita_admin_test_mode', 'true');
    } else {
      localStorage.removeItem('eflita_admin_test_mode');
    }
  }
};

export const isAdminTestModeActive = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('eflita_admin_test_mode') === 'true';
  }
  return false;
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// Silence Firestore's internal connection watchdog warnings in browser iframes/proxies
// (which by default prints an error after 10s before falling back to offline/long-polling)
setLogLevel('silent');

// Initialize Firestore with experimentalForceLongPolling to avoid 10s WebChannel timeout in iframes/proxies
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
    ignoreUndefinedProperties: true,
  },
  firebaseConfig.firestoreDatabaseId || 'ai-studio-6f94b3ef-f7bb-4be7-b241-17da1bb830b6'
);
export const auth = getAuth(app);

// Standard Google Auth Provider for frictionless sign-in (NO sensitive scopes, NO 403 blocks)
export const googleProvider = new GoogleAuthProvider();

// Dedicated Google Drive Provider (Only used on-demand when user authorizes Drive storage)
export const driveProvider = new GoogleAuthProvider();
driveProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token management
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const isOfflineOrNetworkError = (error: unknown): boolean => {
  if (!error) return false;
  const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
  const code = (error as any)?.code;
  return (
    msg.includes('offline') ||
    msg.includes('backend didn\'t respond') ||
    msg.includes('could not reach') ||
    msg.includes('timeout') ||
    msg.includes('network') ||
    msg.includes('failed to get document') ||
    code === 'unavailable' ||
    code === 'failed-precondition' ||
    code === 'deadline-exceeded'
  );
};

// Auth functions
export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) {
        onAuthSuccess(user, cachedAccessToken);
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) {
        onAuthFailure();
      }
    }
  });
};

export const signInWithGoogle = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    }
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    // Gracefully handle user cancelling or closing the popup
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Sign-in popup was closed or cancelled by user.');
      return null;
    }
    console.error('Google Sign In error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const connectGoogleDrive = async (): Promise<string | null> => {
  try {
    const result = await signInWithPopup(auth, driveProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
      return cachedAccessToken;
    }
    return null;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request'
    ) {
      console.warn('Google Drive authorization popup was closed by user.');
      return null;
    }
    console.warn('Google Drive authorization error (falling back to direct submission):', error);
    return null;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const setAccessToken = (token: string | null) => {
  cachedAccessToken = token;
};

export const logOutUser = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Firestore User Profile operations
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const path = `users/${uid}`;
  const cacheKey = `kidshadow_profile_${uid}`;

  // Retry up to 3 times in case connection is establishing
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        try {
          localStorage.setItem(cacheKey, JSON.stringify(data));
        } catch {}
        return data;
      }
      return null;
    } catch (error: any) {
      if (isOfflineOrNetworkError(error)) {
        if (attempt < 3) {
          await new Promise((r) => setTimeout(r, attempt * 400));
          continue;
        }
        console.warn(`[Firestore] Client offline when accessing ${path}. Using cache.`);
        try {
          const cached = localStorage.getItem(cacheKey);
          if (cached) {
            return JSON.parse(cached) as UserProfile;
          }
        } catch {}
        return null;
      }
      // If error is permission-related, conform to SKILL.md error format
      handleFirestoreError(error, OperationType.GET, path);
    }
  }
  return null;
};

export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const path = `users/${profile.uid}`;
  const cacheKey = `kidshadow_profile_${profile.uid}`;

  // Automatically initialize first_login_at, expires_at, and role if not present
  const now = new Date().toISOString();
  if (!profile.first_login_at) {
    profile.first_login_at = profile.created_at || now;
  }
  if (!profile.role) {
    // Chỉ tài khoản admin gốc được ghi role 'admin' khi tự tạo hồ sơ (quy tắc Firebase yêu cầu).
    // Các admin khác vẫn được nhận diện qua email/danh sách admin.
    profile.role = ADMIN_EMAILS.includes((profile.email || '').toLowerCase().trim()) ? 'admin' : 'user';
  }
  if (!profile.status) {
    profile.status = 'active';
  }
  if (!profile.expires_at) {
    const dates = getUserDatesInfo(profile, DEFAULT_SYSTEM_SETTINGS);
    if (dates.expiresDate) {
      profile.expires_at = dates.expiresDate.toISOString();
    } else {
      profile.expires_at = new Date(Date.now() + 365 * 10 * 86400000).toISOString();
    }
  }

  try {
    localStorage.setItem(cacheKey, JSON.stringify(profile));
  } catch {}

  try {
    await setDoc(doc(db, 'users', profile.uid), profile, { merge: true });
  } catch (error: any) {
    if (isOfflineOrNetworkError(error)) {
      console.warn(`[Firestore] Client offline while saving ${path}. Cached locally.`);
      return;
    }
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export interface UserDatesInfo {
  startDate: Date;
  startDateFormatted: string;
  expiresDate: Date | null;
  expiresDateFormatted: string;
  diffDays: number | null;
  status: 'admin' | 'unlimited' | 'expired' | 'warning' | 'active';
  text: string;
  badgeClass: string;
}

export const getUserDatesInfo = (
  user: UserProfile,
  settings?: SystemSettings | null
): UserDatesInfo => {
  const isAdm = user.role === 'admin' || isUserAdmin(user.email, user);
  const startStr = user.first_login_at || user.created_at || new Date().toISOString();
  const startDate = new Date(startStr);
  const startDateFormatted = startDate.toLocaleDateString('vi-VN');

  if (isAdm) {
    return {
      startDate,
      startDateFormatted,
      expiresDate: null,
      expiresDateFormatted: 'Vô thời hạn (Admin)',
      diffDays: null,
      status: 'admin',
      text: 'Vô thời hạn (Admin)',
      badgeClass: 'bg-purple-100 text-purple-900 border-purple-200 font-black'
    };
  }

  const validityWeeks = settings?.validityWeeks ?? 8;
  if (validityWeeks === 0) {
    return {
      startDate,
      startDateFormatted,
      expiresDate: null,
      expiresDateFormatted: 'Vô thời hạn',
      diffDays: null,
      status: 'unlimited',
      text: 'Vô thời hạn',
      badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
    };
  }

  let expiresDate: Date;
  const standardExpiresDate = new Date(startDate.getTime() + validityWeeks * 7 * 86400000);

  if (user.expires_at) {
    const rawExp = new Date(user.expires_at);
    // Sanity check: If an account has role 'user' but has a 10-year admin expiry (> 365 days from start date),
    // it was previously granted admin rights and switched back without resetting expires_at.
    const diffFromStartDays = (rawExp.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffFromStartDays > 365) {
      expiresDate = standardExpiresDate;
    } else {
      expiresDate = rawExp;
    }
  } else {
    expiresDate = standardExpiresDate;
  }

  const expiresDateFormatted = expiresDate.toLocaleDateString('vi-VN');
  const now = Date.now();
  const diffDays = Math.ceil((expiresDate.getTime() - now) / (1000 * 60 * 60 * 24));

  if (diffDays <= 0 || user.status === 'expired') {
    return {
      startDate,
      startDateFormatted,
      expiresDate,
      expiresDateFormatted,
      diffDays,
      status: 'expired',
      text: 'Đã hết hạn',
      badgeClass: 'bg-rose-100 text-rose-800 border-rose-200 font-black'
    };
  }

  if (diffDays <= 7) {
    return {
      startDate,
      startDateFormatted,
      expiresDate,
      expiresDateFormatted,
      diffDays,
      status: 'warning',
      text: `Còn ${diffDays} ngày`,
      badgeClass: 'bg-amber-100 text-amber-900 border-amber-300 font-black animate-pulse'
    };
  }

  return {
    startDate,
    startDateFormatted,
    expiresDate,
    expiresDateFormatted,
    diffDays,
    status: 'active',
    text: `Còn ${diffDays} ngày`,
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200 font-bold'
  };
};

export const isUserExpired = (profile?: UserProfile | null, settings?: SystemSettings | null): boolean => {
  if (!profile) return false;
  if (isUserAdmin(profile.email, profile)) return false;
  if (profile.role === 'admin') return false;
  if (settings && settings.validityWeeks === 0) return false; // 0 = unlimited
  if (profile.status === 'expired') return true;
  const dates = getUserDatesInfo(profile, settings);
  if (dates.diffDays !== null && dates.diffDays <= 0) {
    return true;
  }
  return false;
};

// Firestore Lessons operations
export const seedLessonsIfNeeded = async (forceUpdateScripts = false): Promise<{ count: number; alreadySeeded: boolean }> => {
  const localSeedKey = 'kidshadow_lessons_seeded_v4';
  if (!forceUpdateScripts && typeof window !== 'undefined' && localStorage.getItem(localSeedKey) === 'true') {
    return { count: 63, alreadySeeded: true };
  }
  const path = 'lessons';
  try {
    const snap = await getDocs(collection(db, 'lessons'));
    const existingMap = new Map<string, any>();
    snap.forEach((d) => existingMap.set(d.id, d.data()));

    // Always ensure starter_w4_o3 has the updated active video
    const w4o3Doc = doc(db, 'lessons', 'starter_w4_o3');
    const existingW4O3 = existingMap.get('starter_w4_o3');
    if (existingW4O3) {
      if (!existingW4O3.embed_url || existingW4O3.embed_url.includes('0qhMN0fIqC4') || !existingW4O3.embed_url.includes('KVymeq5NSTI')) {
        await updateDoc(w4o3Doc, {
          embed_url: 'https://www.youtube.com/embed/KVymeq5NSTI',
          script: existingW4O3.script || 'I have five senses. I use my eyes to see. I use my hands to touch. I use my nose to smell. I use my ears to hear. I use my mouth to taste.'
        }).catch(() => {});
      }
    }

    // Always ensure movers_w3_o3 has the updated video and topic
    const w3o3Doc = doc(db, 'lessons', 'movers_w3_o3');
    const existingW3O3 = existingMap.get('movers_w3_o3');
    if (existingW3O3) {
      if (!existingW3O3.embed_url || existingW3O3.embed_url.includes('kOEsLO4ydK8') || !existingW3O3.embed_url.includes('t4gShXstMbM') || existingW3O3.topic !== 'Time: Early, Late, On Time') {
        await updateDoc(w3o3Doc, {
          topic: 'Time: Early, Late, On Time',
          embed_url: 'https://www.youtube.com/embed/t4gShXstMbM',
          script: existingW3O3.script || "What time is it? I am early. I am on time. Hurry up, I am late for school!"
        }).catch(() => {});
      }
    }

    // Always ensure movers_w4_o3 has the updated video
    const w4o3MDoc = doc(db, 'lessons', 'movers_w4_o3');
    const existingW4O3M = existingMap.get('movers_w4_o3');
    if (existingW4O3M) {
      if (!existingW4O3M.embed_url || existingW4O3M.embed_url.includes('J0Ji8hXcD44') || !existingW4O3M.embed_url.includes('AnZxeX_8mVk')) {
        await updateDoc(w4o3MDoc, {
          embed_url: 'https://www.youtube.com/embed/AnZxeX_8mVk',
          script: existingW4O3M.script || "What's your favorite subject? My favorite subject is English, Math, Science, and Music."
        }).catch(() => {});
      }
    }

    // Auto-clean any extra/unrecognized lesson documents from Firestore (e.g. custom_new_lesson_test, etc.)
    for (const [docId] of existingMap.entries()) {
      if (!isStandardLessonDocId(docId) || docId === 'custom_new_lesson_test' || docId === 'custom_new_lesson_test_2') {
        try {
          await deleteDoc(doc(db, 'lessons', docId));
          existingMap.delete(docId);
        } catch {}
      }
    }

    if (existingMap.size === 63 && !forceUpdateScripts) {
      try { localStorage.setItem(localSeedKey, 'true'); } catch {}
      return { count: 63, alreadySeeded: true };
    }

    let seeded = 0;
    for (const item of SAMPLE_LESSONS) {
      const docId = getLessonDocId(item.level, item.week, item.order);
      const existing = existingMap.get(docId);
      
      // CRITICAL: NEVER overwrite user-saved custom scripts in Firestore!
      const scriptToKeep = (!forceUpdateScripts && existing && existing.script)
        ? existing.script
        : item.script;

      await setDoc(doc(db, 'lessons', docId), {
        ...item,
        id: docId,
        script: scriptToKeep
      }, { merge: true });
      seeded++;
    }
    try { localStorage.setItem(localSeedKey, 'true'); } catch {}
    return { count: seeded, alreadySeeded: false };
  } catch (error) {
    console.warn('Lessons seeding skipped or already present:', error);
    return { count: 0, alreadySeeded: false };
  }
};

export const updateLessonScript = async (lessonId: string, script: string): Promise<void> => {
  const path = `lessons/${lessonId}`;
  try {
    const docRef = doc(db, 'lessons', lessonId);
    await updateDoc(docRef, { script: script.trim() });

    // Sync to localStorage caches so fresh scripts are instantly visible everywhere
    ['STARTER', 'MOVERS', 'FLYERS'].forEach((lvl) => {
      try {
        const cacheKey = `kidshadow_lessons_${lvl}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const list = JSON.parse(cached) as Lesson[];
          const updated = list.map((l) => (l.id === lessonId ? { ...l, script: script.trim() } : l));
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      } catch {}
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const deleteLessonFromFirestore = async (lessonId: string): Promise<void> => {
  const path = `lessons/${lessonId}`;
  try {
    const docRef = doc(db, 'lessons', lessonId);
    await deleteDoc(docRef);

    // Sync to localStorage caches
    ['STARTER', 'MOVERS', 'FLYERS'].forEach((lvl) => {
      try {
        const cacheKey = `kidshadow_lessons_${lvl}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const list = JSON.parse(cached) as Lesson[];
          const updated = list.filter((l) => l.id !== lessonId);
          localStorage.setItem(cacheKey, JSON.stringify(updated));
        }
      } catch {}
    });
  } catch (error: any) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const cleanupExtraLessonsInFirestore = async (): Promise<number> => {
  const path = 'lessons';
  try {
    const snap = await getDocs(collection(db, 'lessons'));
    let count = 0;
    for (const d of snap.docs) {
      if (!isStandardLessonDocId(d.id) || d.id === 'custom_new_lesson_test' || d.id === 'custom_new_lesson_test_2') {
        try {
          await deleteDoc(doc(db, 'lessons', d.id));
          count++;
        } catch {}
      }
    }
    return count;
  } catch (error: any) {
    console.error('Error cleaning up extra lessons:', error);
    return 0;
  }
};

export const getAllLessons = async (): Promise<Lesson[]> => {
  const path = 'lessons';
  try {
    const snap = await getDocs(collection(db, 'lessons'));
    const list: Lesson[] = [];
    for (const d of snap.docs) {
      // Auto-clean any unrecognized / extra video lessons from Firestore
      if (!isStandardLessonDocId(d.id) || d.id === 'custom_new_lesson_test' || d.id === 'custom_new_lesson_test_2') {
        deleteDoc(doc(db, 'lessons', d.id)).catch(() => {});
        continue;
      }

      const lesson = { ...(d.data() as Lesson), id: d.id };
      if (lesson.id === 'starter_w4_o3' && (!lesson.embed_url || lesson.embed_url.includes('0qhMN0fIqC4') || !lesson.embed_url.includes('KVymeq5NSTI'))) {
        lesson.embed_url = 'https://www.youtube.com/embed/KVymeq5NSTI';
        if (!lesson.script) {
          lesson.script = 'I have five senses. I use my eyes to see. I use my hands to touch. I use my nose to smell. I use my ears to hear. I use my mouth to taste.';
        }
      }
      if (lesson.id === 'movers_w3_o3' && (!lesson.embed_url || lesson.embed_url.includes('kOEsLO4ydK8') || !lesson.embed_url.includes('t4gShXstMbM') || lesson.topic !== 'Time: Early, Late, On Time')) {
        lesson.topic = 'Time: Early, Late, On Time';
        lesson.embed_url = 'https://www.youtube.com/embed/t4gShXstMbM';
        if (!lesson.script) {
          lesson.script = "What time is it? I am early. I am on time. Hurry up, I am late for school!";
        }
      }
      if (lesson.id === 'movers_w4_o3' && (!lesson.embed_url || lesson.embed_url.includes('J0Ji8hXcD44') || !lesson.embed_url.includes('AnZxeX_8mVk'))) {
        lesson.embed_url = 'https://www.youtube.com/embed/AnZxeX_8mVk';
        if (!lesson.script) {
          lesson.script = "What's your favorite subject? My favorite subject is English, Math, Science, and Music.";
        }
      }
      list.push(lesson);
    }
    if (list.length > 0) {
      // Deterministically sort by Level (STARTER -> MOVERS -> FLYERS), Week (1-7), and Order (1-3)
      const levelRank: Record<string, number> = { STARTER: 1, MOVERS: 2, FLYERS: 3 };
      list.sort((a, b) => {
        const rankA = levelRank[a.level] || 99;
        const rankB = levelRank[b.level] || 99;
        if (rankA !== rankB) return rankA - rankB;
        if (a.week !== b.week) return a.week - b.week;
        return a.order - b.order;
      });
      return list;
    }
  } catch (error) {
    console.warn('Error fetching all lessons from Firestore:', error);
  }
  return SAMPLE_LESSONS.map((item) => ({
    ...item,
    id: getLessonDocId(item.level, item.week, item.order),
  }));
};

export const getLessonsByLevel = async (level: string): Promise<Lesson[]> => {
  const path = 'lessons';
  const cacheKey = `kidshadow_lessons_${level}`;
  try {
    const q = query(
      collection(db, 'lessons'),
      where('level', '==', level)
    );
    const snap = await getDocs(q);
    const list: Lesson[] = [];
    snap.forEach((d) => {
      list.push({ ...(d.data() as Lesson), id: d.id });
    });
    if (list.length > 0) {
      const sorted = list.sort((a, b) => {
        if (a.week !== b.week) return a.week - b.week;
        return a.order - b.order;
      });
      // Ensure any outdated URL in starter_w4_o3, movers_w3_o3, or movers_w4_o3 is patched in-memory and in Firestore
      sorted.forEach((l) => {
        if (l.id === 'starter_w4_o3' && (!l.embed_url || l.embed_url.includes('0qhMN0fIqC4') || !l.embed_url.includes('KVymeq5NSTI'))) {
          l.embed_url = 'https://www.youtube.com/embed/KVymeq5NSTI';
          l.script = 'I have five senses. I use my eyes to see. I use my hands to touch. I use my nose to smell. I use my ears to hear. I use my mouth to taste.';
          updateDoc(doc(db, 'lessons', 'starter_w4_o3'), {
            embed_url: l.embed_url,
            script: l.script
          }).catch(() => {});
        }
        if (l.id === 'movers_w3_o3' && (!l.embed_url || l.embed_url.includes('kOEsLO4ydK8') || !l.embed_url.includes('t4gShXstMbM') || l.topic !== 'Time: Early, Late, On Time')) {
          l.topic = 'Time: Early, Late, On Time';
          l.embed_url = 'https://www.youtube.com/embed/t4gShXstMbM';
          if (!l.script) {
            l.script = "What time is it? I am early. I am on time. Hurry up, I am late for school!";
          }
          updateDoc(doc(db, 'lessons', 'movers_w3_o3'), {
            topic: l.topic,
            embed_url: l.embed_url,
            script: l.script
          }).catch(() => {});
        }
        if (l.id === 'movers_w4_o3' && (!l.embed_url || l.embed_url.includes('J0Ji8hXcD44') || !l.embed_url.includes('AnZxeX_8mVk'))) {
          l.embed_url = 'https://www.youtube.com/embed/AnZxeX_8mVk';
          if (!l.script) {
            l.script = "What's your favorite subject? My favorite subject is English, Math, Science, and Music.";
          }
          updateDoc(doc(db, 'lessons', 'movers_w4_o3'), {
            embed_url: l.embed_url,
            script: l.script
          }).catch(() => {});
        }
      });
      try {
        localStorage.setItem(cacheKey, JSON.stringify(sorted));
      } catch {}
      return sorted;
    }
  } catch (error: any) {
    if (isOfflineOrNetworkError(error)) {
      console.warn(`[Firestore] Client offline or reconnecting while fetching lessons. Using local/fallback cache.`);
    } else {
      console.warn('Lessons fetch notice:', error?.message || error);
    }
  }

  // Check local cache
  try {
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached) as Lesson[];
      parsed.forEach((l) => {
        if (l.id === 'starter_w4_o3' && (!l.embed_url || l.embed_url.includes('0qhMN0fIqC4') || !l.embed_url.includes('KVymeq5NSTI'))) {
          l.embed_url = 'https://www.youtube.com/embed/KVymeq5NSTI';
          l.script = 'I have five senses. I use my eyes to see. I use my hands to touch. I use my nose to smell. I use my ears to hear. I use my mouth to taste.';
        }
        if (l.id === 'movers_w3_o3' && (!l.embed_url || l.embed_url.includes('kOEsLO4ydK8') || !l.embed_url.includes('t4gShXstMbM') || l.topic !== 'Time: Early, Late, On Time')) {
          l.topic = 'Time: Early, Late, On Time';
          l.embed_url = 'https://www.youtube.com/embed/t4gShXstMbM';
          if (!l.script) {
            l.script = "What time is it? I am early. I am on time. Hurry up, I am late for school!";
          }
        }
        if (l.id === 'movers_w4_o3' && (!l.embed_url || l.embed_url.includes('J0Ji8hXcD44') || !l.embed_url.includes('AnZxeX_8mVk'))) {
          l.embed_url = 'https://www.youtube.com/embed/AnZxeX_8mVk';
          if (!l.script) {
            l.script = "What's your favorite subject? My favorite subject is English, Math, Science, and Music.";
          }
        }
      });
      return parsed;
    }
  } catch {}

  // Fallback to bundled sample lessons
  const fallback = SAMPLE_LESSONS.filter((item) => item.level === level).map((item) => ({
    ...item,
    id: getLessonDocId(item.level, item.week, item.order),
  }));
  return fallback.sort((a, b) => {
    if (a.week !== b.week) return a.week - b.week;
    return a.order - b.order;
  });
};

// Submissions operations
export const getUserSubmissions = async (userId: string): Promise<Submission[]> => {
  const path = 'submissions';
  const cacheKey = `kidshadow_subs_${userId}`;

  try {
    const q = query(
      collection(db, 'submissions'),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    const list: Submission[] = [];
    snap.forEach((d) => {
      const data = d.data() as Submission;
      const rawFeedback = data.pronunciation_feedback;
      let cleanFeedback = rawFeedback ? sanitizeTeacherFeedback(rawFeedback) : rawFeedback;
      
      // Auto-repair if submission was stuck with old false warning, 1-line phrase, profanity, or faulty output
      if (isFeedbackFaultyOrWarning(cleanFeedback)) {
        const matchingLesson = SAMPLE_LESSONS.find(
          (l) => l.level === data.level && l.week === data.week && l.order === data.order
        );
        const resolvedTopic = data.lesson_topic || matchingLesson?.topic || 'Luyện nói Tiếng Anh';
        const resolvedScript = matchingLesson?.script || '';
        cleanFeedback = getDetailedPedagogicalFeedback(resolvedTopic, resolvedScript, 'vi', data.level);
      }

      // Auto-repair existing doc in Firestore if modified
      if (rawFeedback && rawFeedback !== cleanFeedback) {
        updateDoc(doc(db, 'submissions', d.id), { pronunciation_feedback: cleanFeedback }).catch(() => {});
      }

      list.push({ ...data, pronunciation_feedback: cleanFeedback, id: d.id });
    });
    const sorted = list.sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());
    try {
      localStorage.setItem(cacheKey, JSON.stringify(sorted));
    } catch {}
    return sorted;
  } catch (error: any) {
    if (isOfflineOrNetworkError(error)) {
      console.warn(`[Firestore] Client offline while fetching submissions. Using local cache.`);
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached) as Submission[];
          return parsed.map((s) => {
            let clean = s.pronunciation_feedback
              ? sanitizeTeacherFeedback(s.pronunciation_feedback)
              : s.pronunciation_feedback;
            if (isFeedbackFaultyOrWarning(clean)) {
              const matchingLesson = SAMPLE_LESSONS.find(
                (l) => l.level === s.level && l.week === s.week && l.order === s.order
              );
              const resolvedTopic = s.lesson_topic || matchingLesson?.topic || 'Luyện nói Tiếng Anh';
              const resolvedScript = matchingLesson?.script || '';
              clean = getDetailedPedagogicalFeedback(resolvedTopic, resolvedScript, 'vi', s.level);
            }
            return {
              ...s,
              pronunciation_feedback: clean,
            };
          });
        }
      } catch {}
      return [];
    }
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const createSubmission = async (data: Omit<Submission, 'id'>): Promise<string> => {
  const path = 'submissions';
  try {
    const docRef = doc(collection(db, 'submissions'));
    const fullData: Submission = { ...data, id: docRef.id };
    await setDoc(docRef, fullData);

    try {
      const cacheKey = `kidshadow_subs_${data.user_id}`;
      const cached = localStorage.getItem(cacheKey);
      const list: Submission[] = cached ? JSON.parse(cached) : [];
      list.unshift(fullData);
      localStorage.setItem(cacheKey, JSON.stringify(list));
    } catch {}

    return docRef.id;
  } catch (error: any) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateSubmissionFeedback = async (
  subId: string,
  feedback: string,
  userId: string
): Promise<void> => {
  const path = `submissions/${subId}`;
  const cleanFeedback = sanitizeTeacherFeedback(feedback);
  try {
    const docRef = doc(db, 'submissions', subId);
    await updateDoc(docRef, { pronunciation_feedback: cleanFeedback });

    // Update local cache
    try {
      const cacheKey = `kidshadow_subs_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const list: Submission[] = JSON.parse(cached);
        const idx = list.findIndex((s) => s.id === subId);
        if (idx !== -1) {
          list[idx].pronunciation_feedback = cleanFeedback;
          localStorage.setItem(cacheKey, JSON.stringify(list));
        }
      }
    } catch {}
  } catch (error: any) {
    console.warn(`[Firestore] Failed to update pronunciation_feedback for ${path}:`, error);
  }
};

// Reflection Post operations
export const getUserReflectionPost = async (userId: string): Promise<ReflectionPost | null> => {
  const path = 'reflection_posts';
  try {
    const q = query(
      collection(db, 'reflection_posts'),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { ...(d.data() as ReflectionPost), id: d.id };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const submitReflectionPost = async (userId: string, postUrl: string): Promise<void> => {
  const path = 'reflection_posts';
  try {
    const docRef = doc(collection(db, 'reflection_posts'));
    const payload: ReflectionPost = {
      id: docRef.id,
      user_id: userId,
      post_url: postUrl,
      submitted_at: new Date().toISOString(),
      status: 'pending'
    };
    await setDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

export const updateReflectionStatus = async (postId: string, status: 'pending' | 'approved' | 'invalid'): Promise<void> => {
  const path = `reflection_posts/${postId}`;
  try {
    await updateDoc(doc(db, 'reflection_posts', postId), { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

// Contest Registration
export const getContestRegistration = async (userId: string): Promise<ContestRegistration | null> => {
  const path = 'contest_registrations';
  try {
    const q = query(
      collection(db, 'contest_registrations'),
      where('user_id', '==', userId)
    );
    const snap = await getDocs(q);
    if (!snap.empty) {
      const d = snap.docs[0];
      return { ...(d.data() as ContestRegistration), id: d.id };
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const registerContest = async (data: Omit<ContestRegistration, 'id'>): Promise<void> => {
  const path = 'contest_registrations';
  try {
    const docRef = doc(collection(db, 'contest_registrations'));
    await setDoc(docRef, { ...data, id: docRef.id });
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
};

// Admin operations: fetch all users, submissions, reflection posts
export const getAdminUsersData = async () => {
  const usersSnap = await getDocs(collection(db, 'users'));
  const submissionsSnap = await getDocs(collection(db, 'submissions'));
  const reflectionsSnap = await getDocs(collection(db, 'reflection_posts'));

  const systemSettings = await getSystemSettings().catch(() => DEFAULT_SYSTEM_SETTINGS);

  const users: UserProfile[] = [];
  usersSnap.forEach((d) => {
    const raw = d.data() as UserProfile;
    const u: UserProfile = { ...raw, uid: raw.uid || d.id };
    let needsUpdate = false;
    const updates: Partial<UserProfile> = {};

    const isAdm = u.role === 'admin' || isUserAdmin(u.email, u);
    const startStr = u.first_login_at || u.created_at || new Date().toISOString();

    if (!u.first_login_at) {
      u.first_login_at = startStr;
      updates.first_login_at = startStr;
      needsUpdate = true;
    }

    if (!u.role) {
      u.role = isAdm ? 'admin' : 'user';
      updates.role = u.role;
      needsUpdate = true;
    }

    if (!u.status) {
      u.status = 'active';
      updates.status = 'active';
      needsUpdate = true;
    }

    if (!u.expires_at) {
      const dates = getUserDatesInfo(u, systemSettings);
      if (dates.expiresDate) {
        u.expires_at = dates.expiresDate.toISOString();
      } else {
        u.expires_at = new Date(Date.now() + 365 * 10 * 86400000).toISOString();
      }
      updates.expires_at = u.expires_at;
      needsUpdate = true;
    } else if (!isAdm && (systemSettings.validityWeeks ?? 8) > 0) {
      // Check if user has leftover 10-year admin expiry (> 365 days from start date)
      const rawExp = new Date(u.expires_at);
      const start = new Date(startStr);
      const diffFromStartDays = (rawExp.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      if (diffFromStartDays > 365) {
        const weeks = systemSettings.validityWeeks ?? 8;
        const corrected = new Date(start.getTime() + weeks * 7 * 86400000);
        u.expires_at = corrected.toISOString();
        updates.expires_at = u.expires_at;
        needsUpdate = true;
      }
    }

    if (needsUpdate) {
      updateDoc(doc(db, 'users', d.id), updates).catch((err) => {
        console.warn(`Could not backfill user dates for ${d.id}:`, err);
      });
    }

    users.push(u);
  });

  const submissions: Submission[] = [];
  submissionsSnap.forEach(d => {
    const data = d.data() as Submission;
    const rawFeedback = data.pronunciation_feedback;
    let cleanFeedback = rawFeedback ? sanitizeTeacherFeedback(rawFeedback) : rawFeedback;
    if (isFeedbackFaultyOrWarning(cleanFeedback)) {
      const matchingLesson = SAMPLE_LESSONS.find(
        (l) => l.level === data.level && l.week === data.week && l.order === data.order
      );
      const resolvedTopic = data.lesson_topic || matchingLesson?.topic || 'Luyện nói Tiếng Anh';
      const resolvedScript = matchingLesson?.script || '';
      cleanFeedback = getDetailedPedagogicalFeedback(resolvedTopic, resolvedScript, 'vi', data.level);
    }
    
    // Auto-repair existing doc in Firestore
    if (rawFeedback && rawFeedback !== cleanFeedback) {
      updateDoc(doc(db, 'submissions', d.id), { pronunciation_feedback: cleanFeedback }).catch(() => {});
    }

    submissions.push({ ...data, pronunciation_feedback: cleanFeedback, id: d.id });
  });

  const reflections: ReflectionPost[] = [];
  reflectionsSnap.forEach(d => reflections.push({ ...(d.data() as ReflectionPost), id: d.id }));

  return { users, submissions, reflections };
};

// System Settings operations (Course validity and Expiration Mode)
export const getSystemSettings = async (): Promise<SystemSettings> => {
  try {
    const docRef = doc(db, 'system_settings', 'config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data() as SystemSettings;
      if (data.adminEmails && Array.isArray(data.adminEmails)) {
        cachedAdminEmails = [...new Set([...ADMIN_EMAILS, ...data.adminEmails])];
        if (typeof window !== 'undefined') {
          localStorage.setItem('eflita_admin_emails', JSON.stringify(cachedAdminEmails));
        }
      }
      return { ...DEFAULT_SYSTEM_SETTINGS, ...data };
    }
  } catch (e) {
    console.warn('Could not read system_settings, using defaults:', e);
  }
  return DEFAULT_SYSTEM_SETTINGS;
};

export const saveSystemSettings = async (settings: Partial<SystemSettings>): Promise<void> => {
  try {
    const docRef = doc(db, 'system_settings', 'config');
    await setDoc(docRef, {
      ...settings,
      updated_at: new Date().toISOString()
    }, { merge: true });

    if (settings.adminEmails && Array.isArray(settings.adminEmails)) {
      cachedAdminEmails = [...new Set([...ADMIN_EMAILS, ...settings.adminEmails])];
      if (typeof window !== 'undefined') {
        localStorage.setItem('eflita_admin_emails', JSON.stringify(cachedAdminEmails));
      }
    }
  } catch (e) {
    console.error('Error saving system settings:', e);
    throw e;
  }
};

// Role management
export const updateUserRole = async (uid: string, role: 'admin' | 'user'): Promise<void> => {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  const userData = snap.exists() ? (snap.data() as UserProfile) : null;
  const startStr = userData?.first_login_at || userData?.created_at || new Date().toISOString();
  const systemSettings = await getSystemSettings().catch(() => DEFAULT_SYSTEM_SETTINGS);
  const weeks = systemSettings.validityWeeks ?? 8;

  const updatePayload: Partial<UserProfile> = {
    role,
    updated_at: new Date().toISOString()
  };

  if (role === 'admin') {
    // Admins don't expire (10 years)
    updatePayload.expires_at = new Date(Date.now() + 365 * 10 * 86400000).toISOString();
    updatePayload.status = 'active';
  } else {
    // Switching back to student: reset to standard course validity from start date
    if (weeks === 0) {
      updatePayload.expires_at = new Date(Date.now() + 365 * 10 * 86400000).toISOString();
      updatePayload.status = 'active';
    } else {
      const startDate = new Date(startStr);
      startDate.setDate(startDate.getDate() + weeks * 7);
      updatePayload.expires_at = startDate.toISOString();
      updatePayload.status = startDate.getTime() < Date.now() ? 'expired' : 'active';
    }
  }

  await updateDoc(docRef, updatePayload);
};

// Extend / modify expiration date for a user
export const extendUserExpiration = async (uid: string, additionalWeeks: number): Promise<string> => {
  const docRef = doc(db, 'users', uid);
  const snap = await getDoc(docRef);
  let baseDate = new Date();
  if (snap.exists()) {
    const data = snap.data() as UserProfile;
    if (data.expires_at) {
      const existingExp = new Date(data.expires_at);
      if (existingExp > baseDate) {
        baseDate = existingExp;
      }
    } else {
      const dates = getUserDatesInfo(data);
      if (dates.expiresDate && dates.expiresDate > baseDate) {
        baseDate = dates.expiresDate;
      }
    }
  }
  baseDate.setDate(baseDate.getDate() + additionalWeeks * 7);
  const newExpiresAt = baseDate.toISOString();
  await updateDoc(docRef, {
    expires_at: newExpiresAt,
    status: 'active',
    updated_at: new Date().toISOString()
  });
  return newExpiresAt;
};

// Delete user account and all their learning records
export const deleteUserAccount = async (uid: string): Promise<void> => {
  // 1. Delete all user submissions
  try {
    const subsQ = query(collection(db, 'submissions'), where('user_id', '==', uid));
    const subsSnap = await getDocs(subsQ);
    for (const s of subsSnap.docs) {
      await deleteDoc(doc(db, 'submissions', s.id));
    }
  } catch (err) {
    console.warn(`Could not delete submissions for user ${uid}:`, err);
  }

  // 2. Delete user reflection post
  try {
    const refQ = query(collection(db, 'reflection_posts'), where('user_id', '==', uid));
    const refSnap = await getDocs(refQ);
    for (const r of refSnap.docs) {
      await deleteDoc(doc(db, 'reflection_posts', r.id));
    }
  } catch (err) {
    console.warn(`Could not delete reflection_posts for user ${uid}:`, err);
  }

  // 3. Delete contest registration
  try {
    const contestQ = query(collection(db, 'contest_registrations'), where('user_id', '==', uid));
    const contestSnap = await getDocs(contestQ);
    for (const c of contestSnap.docs) {
      await deleteDoc(doc(db, 'contest_registrations', c.id));
    }
  } catch (err) {
    console.warn(`Could not delete contest_registrations for user ${uid}:`, err);
  }

  // 4. Delete user doc
  await deleteDoc(doc(db, 'users', uid));

  // 5. Clean local cache if it is current user
  try {
    localStorage.removeItem(`kidshadow_profile_${uid}`);
    localStorage.removeItem(`kidshadow_subs_${uid}`);
  } catch {}
};
