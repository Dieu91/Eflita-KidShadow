import React, { useState, useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import {
  initAuth,
  signInWithGoogle,
  logOutUser,
  getUserProfile,
  saveUserProfile,
  getLessonsByLevel,
  getUserSubmissions,
  getUserReflectionPost,
  getContestRegistration,
  seedLessonsIfNeeded,
  isUserAdmin,
  ADMIN_EMAILS,
  isAdminTestModeActive,
  setAdminTestMode,
  isUserExpired,
  getUserDatesInfo,
  getSystemSettings,
  auth
} from './services/firebase';
import { UserProfile, Lesson, Submission, ReflectionPost, ContestRegistration, Language, LevelType, BrandConfig, SystemSettings } from './types';
import confetti from 'canvas-confetti';
import { calculateStreak, FeedbackRuleResult } from './utils/feedbackRules';
import { Navbar } from './components/Navbar';
import { AuthScreen } from './components/AuthScreen';
import { ProfileModal } from './components/ProfileModal';
import { LevelModal } from './components/LevelModal';
import { PathMap } from './components/PathMap';
import { LessonModal } from './components/LessonModal';
import { ProgressPage } from './components/ProgressPage';
import { ChampionModal } from './components/ChampionModal';
import { ChampionArenaPage } from './components/ChampionArenaPage';
import { AdminPage } from './components/AdminPage';
import { AdminChampionTestBar } from './components/AdminChampionTestBar';
import { WeeklyReminderToast, WEEKLY_TARGET } from './components/WeeklyReminderToast';
import { BrandModal } from './components/BrandModal';
import { StudentGuideModal } from './components/StudentGuideModal';
import { ActivationScreen } from './components/ActivationScreen';
import { ActivationCodesPanel } from './components/ActivationCodesPanel';
import { ExpiredRenewalModal } from './components/ExpiredRenewalModal';
import { SAMPLE_LESSONS, getLessonDocId } from './data/lessonsData';
import { getStoredBrandConfig, saveBrandConfig, DEFAULT_BRAND_CONFIG } from './services/brandService';
import { getTranslation } from './i18n/translations';
import { detectEnv } from './utils/envDetector';

/**
 * Calculate user's current study week:
 * floor((today - registration_date) / 7 days) + 1, capped at 7.
 */
export const calculateCurrentStudyWeek = (registrationDate?: string): number => {
  if (!registrationDate) return 1;
  const regDate = new Date(registrationDate);
  const now = new Date();
  const diffMs = Math.max(0, now.getTime() - regDate.getTime());
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const week = Math.floor(diffDays / 7) + 1;
  return Math.min(7, Math.max(1, week));
};

export default function App() {
  // Language state (persisted in localStorage, default 'vi')
  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('shadowing_lang') as Language) || 'vi';
  });

  const t = getTranslation(lang);

  const handleToggleLang = () => {
    setLang((prev) => {
      const next: Language = prev === 'vi' ? 'en' : 'vi';
      localStorage.setItem('shadowing_lang', next);
      return next;
    });
  };

  // Auth & Profile state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [forceInAppCard, setForceInAppCard] = useState<boolean>(false);
  const [showFirstTimeProfile, setShowFirstTimeProfile] = useState<boolean>(false);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showLevelModal, setShowLevelModal] = useState<boolean>(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'map' | 'progress' | 'admin' | 'champion'>('map');

  // Lessons & Submissions data
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reflectionPost, setReflectionPost] = useState<ReflectionPost | null>(null);
  const [contestRegistration, setContestRegistration] = useState<ContestRegistration | null>(null);
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);

  // Selected lesson modal
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  // Champion modal
  const [showChampionModal, setShowChampionModal] = useState<boolean>(false);

  // Weekly Goal Reminder Toast dismiss state
  const [isWeeklyToastDismissed, setIsWeeklyToastDismissed] = useState<boolean>(false);

  // Guest preview mode without login
  const [isGuestPreview, setIsGuestPreview] = useState<boolean>(false);

  // Admin Champion Test Dock state
  const [showAdminTestBar, setShowAdminTestBar] = useState<boolean>(() => isAdminTestModeActive());

  // Student Learning Guide & FAQ modal
  const [showStudentGuide, setShowStudentGuide] = useState<boolean>(false);

  // Custom Brand & Logo state
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND_CONFIG);
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);

  // Expiration & System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);
  const [isExpiryBannerDismissed, setIsExpiryBannerDismissed] = useState<boolean>(false);

  // Activation code gate (học viên mới phải nhập mã kích hoạt)
  const [needsActivation, setNeedsActivation] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const activationCodeRef = useRef<string | null>(null);

  // Load brand config and system settings on mount
  useEffect(() => {
    getStoredBrandConfig().then((cfg) => {
      if (cfg) {
        setBrandConfig(cfg);
      }
    });
    getSystemSettings().then((s) => {
      if (s) setSystemSettings(s);
    }).catch(console.warn);
  }, []);

  const handleSaveBrandConfig = async (newConfig: BrandConfig) => {
    setBrandConfig(newConfig);
    await saveBrandConfig(newConfig);
  };

  // 1. Initialize Firebase Auth listener
  useEffect(() => {
    const unsubscribe = initAuth(
      async (user) => {
        setCurrentUser(user);
        if (user) {
          await loadUserProfileAndData(user);
        } else {
          setUserProfile(null);
          setLessons([]);
          setSubmissions([]);
          setIsAuthLoading(false);
        }
      },
      () => {
        setCurrentUser(null);
        setUserProfile(null);
        setLessons([]);
        setSubmissions([]);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // 2. Load User Profile and associated user data
  const loadUserProfileAndData = async (user: User) => {
    try {
      setIsDataLoading(true);
      setLoadError(false);
      const profile = await getUserProfile(user.uid);

      if (!profile || !profile.student_name || !profile.level) {
        // Học viên mới: cần mã kích hoạt (admin/giám khảo được miễn)
        if (!activationCodeRef.current && !profile?.activation_code) {
          await getSystemSettings().catch(() => null); // làm mới danh sách admin
          if (!isUserAdmin(user.email)) {
            setNeedsActivation(true);
            return;
          }
        }
        // Needs first-time onboarding
        const initialProfile: UserProfile = {
          uid: user.uid,
          student_name: profile?.student_name || user.displayName || '',
          parent_name: profile?.parent_name || '',
          phone: profile?.phone || '',
          level: profile?.level || 'STARTER',
          email: user.email || '',
          photo_url: user.photoURL || undefined,
          created_at: profile?.created_at || new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setUserProfile(initialProfile);
        setShowFirstTimeProfile(true);
        // Pre-populate lessons locally so UI is immediately ready
        const starterLessons = SAMPLE_LESSONS.filter((item) => item.level === (initialProfile.level || 'STARTER')).map((item) => ({
          ...item,
          id: getLessonDocId(item.level, item.week, item.order),
        })).sort((a, b) => (a.week !== b.week ? a.week - b.week : a.order - b.order));
        setLessons(starterLessons);
        loadLessonsAndSubmissions(initialProfile).catch(console.warn);
      } else {
        setUserProfile(profile);
        setShowFirstTimeProfile(false);
        // Check course validity expiration
        const currentSettings = systemSettings || (await getSystemSettings().catch(() => null));
        if (currentSettings) {
          setSystemSettings(currentSettings);
          if (isUserExpired(profile, currentSettings)) {
            setShowExpiredModal(true);
          } else {
            setShowExpiredModal(false);
          }
        }
        // Load lessons and submissions for this profile
        await loadLessonsAndSubmissions(profile);
      }
    } catch (err) {
      console.warn('Profile load warning:', err);
      // Không giả làm "học viên mới" khi lỗi mạng/quyền: báo lỗi và cho thử lại
      setLoadError(true);
    } finally {
      setIsAuthLoading(false);
      setIsDataLoading(false);
    }
  };

  // 3. Load lessons and submissions by user level
  const loadLessonsAndSubmissions = async (profile: UserProfile) => {
    try {
      // Ensure seed lessons exist
      if (isUserAdmin(profile.email, profile)) seedLessonsIfNeeded().catch(console.warn);

      const [lessonsList, userSubs, reflection, reg] = await Promise.all([
        getLessonsByLevel(profile.level).catch(() => []),
        getUserSubmissions(profile.uid).catch(() => []),
        getUserReflectionPost(profile.uid).catch(() => null),
        getContestRegistration(profile.uid).catch(() => null),
      ]);

      if (lessonsList.length > 0) {
        setLessons(lessonsList);
      }
      setSubmissions(userSubs);
      setReflectionPost(reflection);
      setContestRegistration(reg);
    } catch (err) {
      console.warn('Failed to load lessons or submissions:', err);
    }
  };

  // Handle Google Sign In - called directly in click event without preceding await
  const handleSignIn = () => {
    setAuthError(null);
    setIsSigningIn(true);
    const env = detectEnv();

    // Call signInWithGoogle directly in the user click event
    signInWithGoogle()
      .then(async (result) => {
        if (result?.user) {
          // Hồ sơ sẽ được tải bởi bộ lắng nghe đăng nhập (initAuth), không tải lần hai ở đây.
          setCurrentUser(result.user);
        }
      })
      .catch((err: any) => {
        const errorCode = err?.code || '';
        const isPopupBlockedOrRestricted = [
          'auth/popup-blocked',
          'auth/popup-closed-by-user',
          'auth/cancelled-popup-request',
          'auth/operation-not-supported-in-this-environment',
          'auth/web-storage-unsupported',
        ].includes(errorCode);

        if (isPopupBlockedOrRestricted) {
          if (env.inApp) {
            setForceInAppCard(true);
          } else {
            setAuthError(
              'Điện thoại đang chặn cửa sổ đăng nhập. Ba mẹ vui lòng cho phép cửa sổ bật lên (pop-up) cho trang này, hoặc thử mở bằng Chrome/Safari, rồi bấm đăng nhập lại.'
            );
          }
        } else {
          // Never display raw Firebase technical errors in UI
          setAuthError(
            lang === 'vi'
              ? 'Đăng nhập chưa hoàn tất hoặc bị gián đoạn. Ba mẹ vui lòng thử lại nhé.'
              : 'Sign-in was not completed or was interrupted. Please try again.'
          );
        }
      })
      .finally(() => {
        setIsSigningIn(false);
      });
  };

  // Học viên nhập mã đúng -> tiếp tục điền hồ sơ lần đầu
  const handleActivationVerified = async (code: string) => {
    activationCodeRef.current = code;
    setActivationError(null);
    setNeedsActivation(false);
    if (currentUser) {
      await loadUserProfileAndData(currentUser);
    }
  };

  // Handle Guest Preview Mode
  const handleExploreGuest = async () => {
    setIsGuestPreview(true);
    const guestProfile: UserProfile = {
      uid: 'guest',
      student_name: lang === 'vi' ? 'Học viên xem trước' : 'Guest Student',
      parent_name: lang === 'vi' ? 'Phụ huynh' : 'Parent',
      phone: '0900000000',
      level: 'STARTER',
      email: 'guest@kidshadow.app',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setUserProfile(guestProfile);
    setShowFirstTimeProfile(false);
    await loadLessonsAndSubmissions(guestProfile);
  };

  // Handle Log Out
  const handleLogout = async () => {
    try {
      if (isGuestPreview) {
        setIsGuestPreview(false);
        setUserProfile(null);
        setSubmissions([]);
        setLessons([]);
        setActiveTab('map');
        return;
      }
      setShowExpiredModal(false);
      setNeedsActivation(false);
      setActivationError(null);
      activationCodeRef.current = null;
      await logOutUser();
      setCurrentUser(null);
      setUserProfile(null);
      setSubmissions([]);
      setLessons([]);
      setActiveTab('map');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  // Save / Update User Profile with Instant Optimistic UI (Zero Latency)
  const handleSaveProfile = async (data: {
    student_name: string;
    parent_name: string;
    phone: string;
    level: LevelType;
  }) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    // Giữ nguyên các trường hạn học/vai trò đã có (role, status, expires_at, first_login_at...)
    // để việc sửa hồ sơ không làm đổi hạn học của học viên.
    const updated: UserProfile = {
      ...(userProfile || {}),
      uid: currentUser.uid,
      student_name: data.student_name,
      parent_name: data.parent_name,
      phone: data.phone,
      level: data.level,
      email: currentUser.email || '',
      photo_url: currentUser.photoURL || undefined,
      created_at: userProfile?.created_at || now,
      updated_at: now,
    };

    // 1. INSTANT optimistic state update (0ms delay) - modal closes immediately
    setUserProfile(updated);
    setShowFirstTimeProfile(false);
    setShowEditProfile(false);

    // 2. Pre-populate lessons locally so user sees the learning map immediately
    const localLessons = SAMPLE_LESSONS.filter((item) => item.level === data.level).map((item) => ({
      ...item,
      id: getLessonDocId(item.level, item.week, item.order),
    })).sort((a, b) => (a.week !== b.week ? a.week - b.week : a.order - b.order));
    setLessons(localLessons);

    // 3. Celebratory confetti effect for completing profile
    try {
      confetti({
        particleCount: 45,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    // 4. Save to Firestore in background without blocking the UI
    const codeToClaim = activationCodeRef.current || undefined;
    saveUserProfile(updated, codeToClaim)
      .then(() => {
        if (codeToClaim) activationCodeRef.current = null;
      })
      .catch((err) => {
        console.warn('Background profile save warning:', err);
        if (codeToClaim) {
          // Mã không dùng được (ví dụ vừa có người khác dùng): quay lại màn hình nhập mã
          activationCodeRef.current = null;
          setUserProfile(null);
          setShowFirstTimeProfile(false);
          setActivationError(
            lang === 'vi'
              ? 'Mã kích hoạt không dùng được (có thể vừa được người khác sử dụng). Ba mẹ nhập lại mã hoặc liên hệ Eflita nhé.'
              : 'The activation code could not be used (it may have just been taken). Please re-enter it or contact Eflita.'
          );
          setNeedsActivation(true);
        }
      });

    // 5. Background sync for latest submissions and reflection
    loadLessonsAndSubmissions(updated).catch(console.warn);
  };

  // Quick Level Switch with Instant Optimistic UI (Zero Latency)
  const handleQuickChangeLevel = (newLevel: LevelType) => {
    if (!userProfile) return;
    if (userProfile.level === newLevel) return;

    // 1. INSTANT optimistic state update (0ms lag)
    const updated: UserProfile = {
      ...userProfile,
      level: newLevel,
      updated_at: new Date().toISOString(),
    };
    setUserProfile(updated);

    // 2. INSTANT local lessons update for new level
    const localLessons = SAMPLE_LESSONS.filter((item) => item.level === newLevel).map((item) => ({
      ...item,
      id: getLessonDocId(item.level, item.week, item.order),
    })).sort((a, b) => (a.week !== b.week ? a.week - b.week : a.order - b.order));

    setLessons(localLessons);

    // 3. Save to Firestore in background without blocking UI
    saveUserProfile(updated).catch(console.warn);

    // 4. Background sync lessons from Firestore
    getLessonsByLevel(newLevel).then((firestoreLessons) => {
      if (firestoreLessons && firestoreLessons.length > 0) {
        setLessons(firestoreLessons);
      }
    }).catch(console.warn);
  };

  // Handle submission success from LessonModal
  const handleSubmissionSuccess = (newSub: Submission, feedback: FeedbackRuleResult) => {
    setSubmissions((prev) => [newSub, ...prev]);

    // Check if 21 submissions achieved for Champion modal
    const uniqueLessonIds = new Set([newSub.lesson_id, ...submissions.map((s) => s.lesson_id)]);
    if (uniqueLessonIds.size >= 21 && !reflectionPost) {
      setTimeout(() => {
        setShowChampionModal(true);
      }, 1500);
    }
  };

  // Check if current user is admin
  const isAdmin = isUserAdmin(currentUser?.email || userProfile?.email);

  // Admin Simulation: Simulate 21 completed lessons (unlocks Champion immediately)
  const handleSimulate21Lessons = () => {
    if (!userProfile) return;
    const currentLevel = userProfile.level;
    const mockSubs: Submission[] = [];
    const now = new Date();

    for (let w = 1; w <= 7; w++) {
      for (let o = 1; o <= 3; o++) {
        const lessonId = getLessonDocId(currentLevel, w, o);
        mockSubs.push({
          id: `sub_test_${lessonId}`,
          user_id: userProfile.uid,
          lesson_id: lessonId,
          drive_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 60,
          level: currentLevel,
          week: w,
          order: o,
          submitted_at: new Date(now.getTime() - (7 - w) * 86400000 * 7).toISOString(),
          pronunciation_feedback: '👏 Con phát âm rất tự tin, nhịp điệu bài học rất tốt!\n🎯 Con chú ý phát âm rõ hơn âm cuối nhé!',
        });
      }
    }

    setSubmissions(mockSubs);
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
  };

  // Admin Simulation: Simulate 20 completed lessons (leaves 21st lesson open for testing submission flow)
  const handleSimulate20Lessons = () => {
    if (!userProfile) return;
    const currentLevel = userProfile.level;
    const mockSubs: Submission[] = [];
    const now = new Date();

    for (let w = 1; w <= 7; w++) {
      for (let o = 1; o <= 3; o++) {
        if (w === 7 && o === 3) continue; // Leave 21st lesson open
        const lessonId = getLessonDocId(currentLevel, w, o);
        mockSubs.push({
          id: `sub_test_${lessonId}`,
          user_id: userProfile.uid,
          lesson_id: lessonId,
          drive_link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          duration: 60,
          level: currentLevel,
          week: w,
          order: o,
          submitted_at: new Date(now.getTime() - (7 - w) * 86400000 * 7).toISOString(),
          pronunciation_feedback: '👏 Con phát âm rất tự tin, nhịp điệu bài học rất tốt!\n🎯 Con chú ý phát âm rõ hơn âm cuối nhé!',
        });
      }
    }

    setSubmissions(mockSubs);
  };

  // Admin Simulation: Reset all test submissions and registration
  const handleResetTestSubmissions = () => {
    setSubmissions([]);
    setReflectionPost(null);
    setContestRegistration(null);
  };

  // Calculate Streak
  const streak = calculateStreak(submissions);

  // Cảnh báo sắp hết hạn khóa học (còn <= 7 ngày) cho học viên
  const expiryInfo =
    userProfile && !isGuestPreview && !showFirstTimeProfile && !isAdmin
      ? getUserDatesInfo(userProfile, systemSettings)
      : null;
  const expiryBannerText =
    expiryInfo && expiryInfo.status === 'warning' && expiryInfo.diffDays !== null
      ? lang === 'vi'
        ? `Khóa học của con còn ${expiryInfo.diffDays} ngày (đến hết ngày ${expiryInfo.expiresDateFormatted}). Con hãy hoàn thành các video còn lại nhé!`
        : `Your course has ${expiryInfo.diffDays} day(s) left (until ${expiryInfo.expiresDateFormatted}). Let's finish the remaining videos!`
      : null;

  // Check if champion qualified (>= 21 submissions)
  const completedLessonsCount = new Set(submissions.map((s) => s.lesson_id)).size;
  const isChampionQualified = completedLessonsCount >= 21;

  // Handle "Học ngay" button click from weekly reminder toast
  const handleLearnNow = () => {
    setActiveTab('map');
    const currentWeek = calculateCurrentStudyWeek(userProfile?.first_login_at || userProfile?.created_at);
    const completedLessonIds = new Set(submissions.map((s) => s.lesson_id));

    // First try finding uncompleted lesson in the current week
    let targetLesson = lessons.find(
      (l) => l.week === currentWeek && !completedLessonIds.has(l.id)
    );

    // If all in current week are completed (or not found), find the first uncompleted lesson overall
    if (!targetLesson) {
      targetLesson = lessons.find((l) => !completedLessonIds.has(l.id));
    }

    // Fallback to first lesson
    if (!targetLesson && lessons.length > 0) {
      targetLesson = lessons[0];
    }

    if (targetLesson) {
      setSelectedLesson(targetLesson);
    }
  };

  // Render Loading screen
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-3xl bg-amber-400 flex items-center justify-center text-3xl font-black mx-auto animate-bounce shadow-md">
            🦁
          </div>
          <p className="font-extrabold text-amber-900 font-['Fredoka',sans-serif] text-base">
            KidShadow
          </p>
          <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Render Login screen if not signed in
  if (!currentUser && !isGuestPreview) {
    return (
      <>
        <AuthScreen
          onSignIn={handleSignIn}
          brandConfig={brandConfig}
          isLoading={isSigningIn}
          lang={lang}
          onToggleLang={handleToggleLang}
          errorMessage={authError}
          forceInAppCard={forceInAppCard}
        />
        <BrandModal
          isOpen={showBrandModal}
          onClose={() => setShowBrandModal(false)}
          brandConfig={brandConfig}
          onSave={handleSaveBrandConfig}
          lang={lang}
        />
      </>
    );
  }

  // Lỗi tải dữ liệu (mất mạng, hết quota, bị từ chối quyền): không cho vào như học viên mới
  if (currentUser && loadError && !isGuestPreview) {
    return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full bg-white rounded-3xl border-4 border-amber-200 shadow-xl p-6 text-center space-y-4">
          <div className="text-4xl">📶</div>
          <h2 className="font-black text-amber-950 text-lg font-['Fredoka',sans-serif]">
            {lang === 'vi' ? 'Chưa tải được dữ liệu của con' : 'We could not load your data'}
          </h2>
          <p className="text-sm font-bold text-amber-900/80 leading-relaxed">
            {lang === 'vi'
              ? 'Ba mẹ kiểm tra kết nối mạng rồi bấm "Thử lại" nhé. Dữ liệu học của con vẫn an toàn.'
              : 'Please check your connection and tap "Try again". Your learning data is safe.'}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => { setIsAuthLoading(true); loadUserProfileAndData(currentUser); }}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-500 text-amber-950 font-black rounded-2xl text-sm cursor-pointer"
            >
              {lang === 'vi' ? 'Thử lại' : 'Try again'}
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-white border-2 border-amber-300 text-amber-900 font-black rounded-2xl text-sm cursor-pointer"
            >
              {t.logout}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (currentUser && needsActivation) {
    return (
      <ActivationScreen
        lang={lang}
        uid={currentUser.uid}
        email={currentUser.email || ''}
        errorMessage={activationError}
        onVerified={handleActivationVerified}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-amber-50/40 text-slate-800 flex flex-col font-['Nunito',sans-serif]">
      {/* Top Banner when in Guest Preview Mode */}
      {isGuestPreview && !currentUser && (
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white px-4 py-2 text-xs font-black flex flex-wrap items-center justify-between gap-2 shadow-sm z-30">
          <div className="flex items-center gap-2">
            <span className="text-base">🎬</span>
            <span>{t.guestNotice}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsGuestPreview(false);
                handleSignIn();
              }}
              className="bg-white text-amber-950 px-3 py-1 rounded-xl text-xs font-black shadow-xs hover:bg-amber-100 transition active:scale-95 cursor-pointer font-['Fredoka',sans-serif]"
            >
              {t.signInWithGoogle}
            </button>
            <button
              onClick={() => {
                setIsGuestPreview(false);
                setUserProfile(null);
              }}
              className="text-white/80 hover:text-white text-xs underline cursor-pointer"
            >
              {t.logout}
            </button>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        userProfile={userProfile}
        userEmail={currentUser?.email || (isGuestPreview ? 'guest@kidshadow.app' : null)}
        brandConfig={brandConfig}
        lang={lang}
        onToggleLang={handleToggleLang}
        streak={streak}
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        onOpenProfile={() => setShowEditProfile(true)}
        onOpenLevelSelector={() => setShowLevelModal(true)}
        onSelectLevel={handleQuickChangeLevel}
        onLogout={handleLogout}
        onOpenChampionModal={() => setShowChampionModal(true)}
        isChampionQualified={isChampionQualified}
        onOpenBrandSettings={() => setShowBrandModal(true)}
        onOpenStudentGuide={() => setShowStudentGuide(true)}
        onToggleAdminTestBar={() => setShowAdminTestBar((prev) => !prev)}
        isAdminTestActive={showAdminTestBar}
      />

      {/* Expiry warning banner (<= 7 days left) */}
      {expiryBannerText && !isExpiryBannerDismissed && !showExpiredModal && (
        <div className="bg-amber-100 border-b-2 border-amber-300 px-4 py-2 text-xs sm:text-sm font-bold text-amber-950 flex items-center justify-between gap-3">
          <span>⏰ {expiryBannerText}</span>
          <button
            onClick={() => setIsExpiryBannerDismissed(true)}
            className="shrink-0 text-amber-900/70 hover:text-amber-950 px-2 cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full min-w-0 max-w-full overflow-x-hidden">
        {activeTab === 'map' && (
          <PathMap
            lessons={lessons}
            submissions={submissions}
            onSelectLesson={(lesson) => setSelectedLesson(lesson)}
            onOpenChampionModal={() => setShowChampionModal(true)}
            lang={lang}
            currentLevel={userProfile?.level}
            onChangeLevel={handleQuickChangeLevel}
          />
        )}

        {activeTab === 'progress' && userProfile && (
          <ProgressPage
            userProfile={userProfile}
            submissions={submissions}
            streak={streak}
            onOpenChampionModal={() => setShowChampionModal(true)}
            lang={lang}
          />
        )}

        {activeTab === 'admin' && ADMIN_EMAILS.includes((currentUser?.email || '').toLowerCase().trim()) && (
          <ActivationCodesPanel />
        )}

        {activeTab === 'admin' && (
          <AdminPage
            currentUserEmail={currentUser?.email || null}
            lang={lang}
            onOpenBrandSettings={() => setShowBrandModal(true)}
            onSimulate21={handleSimulate21Lessons}
            onSimulate20={handleSimulate20Lessons}
            onResetTest={handleResetTestSubmissions}
            onOpenChampionModal={() => setShowChampionModal(true)}
            onOpenChampionArena={() => setActiveTab('champion')}
            completedCount={completedLessonsCount}
          />
        )}

        {activeTab === 'champion' && userProfile && (
          <ChampionArenaPage
            userProfile={userProfile}
            reflectionPost={reflectionPost}
            contestRegistration={contestRegistration}
            onBack={() => setActiveTab('map')}
            lang={lang}
            isAdmin={isAdmin}
          />
        )}
      </main>

      {/* Lesson View Modal */}
      {selectedLesson && userProfile && (
        <LessonModal
          lesson={selectedLesson}
          userProfile={userProfile}
          existingSubmissions={submissions}
          onClose={() => setSelectedLesson(null)}
          onSubmissionSuccess={handleSubmissionSuccess}
          lang={lang}
        />
      )}

      {/* First-time Onboarding Profile Modal */}
      {showFirstTimeProfile && (
        <ProfileModal
          isOpen={showFirstTimeProfile}
          isFirstTime={true}
          initialProfile={userProfile || undefined}
          onSave={handleSaveProfile}
          lang={lang}
        />
      )}

      {/* Edit Profile Modal */}
      {showEditProfile && userProfile && (
        <ProfileModal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          isFirstTime={false}
          initialProfile={userProfile}
          submissions={submissions}
          streak={streak}
          onSave={handleSaveProfile}
          lang={lang}
        />
      )}

      {/* Quick Level Modal */}
      {showLevelModal && userProfile && (
        <LevelModal
          isOpen={showLevelModal}
          onClose={() => setShowLevelModal(false)}
          currentLevel={userProfile.level}
          onSelectLevel={handleQuickChangeLevel}
          lang={lang}
        />
      )}

      {/* Champion Modal (Step 1 & Step 2) */}
      {showChampionModal && userProfile && (
        <ChampionModal
          isOpen={showChampionModal}
          onClose={() => setShowChampionModal(false)}
          userProfile={userProfile}
          reflectionPost={reflectionPost}
          contestRegistration={contestRegistration}
          onUpdateState={(newRef, newReg) => {
            setReflectionPost(newRef);
            if (newReg !== undefined) setContestRegistration(newReg);
          }}
          lang={lang}
          isAdmin={isAdmin}
          onEnterArena={() => {
            setShowChampionModal(false);
            setActiveTab('champion');
          }}
        />
      )}

      {/* Weekly Target Reminder Toast (Shows when submissions in current week < WEEKLY_TARGET) */}
      {userProfile && !isGuestPreview && !showFirstTimeProfile && !isWeeklyToastDismissed && (
        <WeeklyReminderToast
          currentWeek={calculateCurrentStudyWeek(userProfile.first_login_at || userProfile.created_at)}
          submittedCountInWeek={
            submissions.filter(
              (s) => s.week === calculateCurrentStudyWeek(userProfile.first_login_at || userProfile.created_at)
            ).length
          }
          onLearnNow={handleLearnNow}
          onDismiss={() => setIsWeeklyToastDismissed(true)}
          lang={lang}
        />
      )}

      {/* Brand & Logo Settings Modal */}
      <BrandModal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        brandConfig={brandConfig}
        onSave={handleSaveBrandConfig}
        lang={lang}
      />

      {/* Student Learning Guide & FAQ Modal */}
      <StudentGuideModal
        isOpen={showStudentGuide}
        onClose={() => setShowStudentGuide(false)}
        lang={lang}
      />

      {/* Course Expiration Notice Modal */}
      {userProfile && showExpiredModal && !isAdmin && (
        <ExpiredRenewalModal
          userProfile={userProfile}
          lang={lang}
          validityWeeks={systemSettings?.validityWeeks || 8}
          onRenewed={(renewed) => {
            setUserProfile(renewed);
            setShowExpiredModal(false);
            setIsExpiryBannerDismissed(false);
          }}
          onLogout={handleLogout}
        />
      )}

      {/* Floating Admin Champion Test Dock */}
      {isAdmin && showAdminTestBar && userProfile && (
        <AdminChampionTestBar
          lessons={lessons}
          submissions={submissions}
          reflectionPost={reflectionPost}
          contestRegistration={contestRegistration}
          onSimulate21={handleSimulate21Lessons}
          onSimulate20={handleSimulate20Lessons}
          onReset={handleResetTestSubmissions}
          onOpenChampionModal={() => setShowChampionModal(true)}
          onOpenChampionArena={() => setActiveTab('champion')}
          onCloseTestMode={() => {
            setShowAdminTestBar(false);
            setAdminTestMode(false);
          }}
          lang={lang}
        />
      )}
    </div>
  );
}
