import React, { useState, useEffect } from 'react';
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
  isAdminTestModeActive,
  setAdminTestMode,
  isUserExpired,
  getSystemSettings,
  deleteUserAccount,
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
import { MobileQrModal } from './components/MobileQrModal';
import { BrandModal } from './components/BrandModal';
import { StudentGuideModal } from './components/StudentGuideModal';
import { ExpiredNoticeModal } from './components/ExpiredNoticeModal';
import { SAMPLE_LESSONS, getLessonDocId } from './data/lessonsData';
import { getStoredBrandConfig, saveBrandConfig, DEFAULT_BRAND_CONFIG } from './services/brandService';
import { getTranslation } from './i18n/translations';

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

  // Mobile QR modal
  const [showMobileQrModal, setShowMobileQrModal] = useState<boolean>(false);

  // Student Learning Guide & FAQ modal
  const [showStudentGuide, setShowStudentGuide] = useState<boolean>(false);

  // Custom Brand & Logo state
  const [brandConfig, setBrandConfig] = useState<BrandConfig>(DEFAULT_BRAND_CONFIG);
  const [showBrandModal, setShowBrandModal] = useState<boolean>(false);

  // Expiration & System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);

  // Load brand config and system settings on mount
  useEffect(() => {
    getStoredBrandConfig().then((cfg) => {
      if (cfg) {
        setBrandConfig(cfg);
        // Persist cleaned brand config if it had old naming
        saveBrandConfig(cfg).catch(console.warn);
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
      const profile = await getUserProfile(user.uid);

      if (!profile || !profile.student_name || !profile.level) {
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
            if (currentSettings.expirationMode === 'delete' && !isUserAdmin(profile.email, profile) && profile.role !== 'admin') {
              try {
                await deleteUserAccount(profile.uid);
              } catch (delErr) {
                console.warn('Auto delete expired user failed:', delErr);
              }
              alert(lang === 'vi' 
                ? 'Thời hạn tham gia khóa học đã kết thúc. Tài khoản và dữ liệu đã được hệ thống tự động dọn dẹp theo chính sách khóa học. Cảm ơn con và gia đình đã đồng hành!' 
                : 'Your course challenge period has ended. The account has been automatically cleaned up according to system policy.');
              await handleLogout();
              return;
            }
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
      // Safe fallback profile so UI remains responsive
      const fallbackProfile: UserProfile = {
        uid: user.uid,
        student_name: user.displayName || '',
        parent_name: '',
        phone: '',
        level: 'STARTER',
        email: user.email || '',
        photo_url: user.photoURL || undefined,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setUserProfile((prev) => prev || fallbackProfile);
      setShowFirstTimeProfile(true);
      await loadLessonsAndSubmissions(fallbackProfile).catch(console.warn);
    } finally {
      setIsAuthLoading(false);
      setIsDataLoading(false);
    }
  };

  // 3. Load lessons and submissions by user level
  const loadLessonsAndSubmissions = async (profile: UserProfile) => {
    try {
      // Ensure seed lessons exist
      seedLessonsIfNeeded().catch(console.warn);

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

  // Handle Google Sign In
  const handleSignIn = async () => {
    try {
      setAuthError(null);
      setIsSigningIn(true);
      const result = await signInWithGoogle();
      if (result?.user) {
        setCurrentUser(result.user);
        await loadUserProfileAndData(result.user);
      }
    } catch (err: any) {
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        if (err?.code === 'auth/popup-blocked') {
          setAuthError(
            lang === 'vi'
              ? 'Trình duyệt đang chặn cửa sổ đăng nhập (popup). Ba mẹ vui lòng cho phép cửa sổ bật lên để tiếp tục nhé.'
              : 'Popup was blocked by the browser. Please allow popups to continue.'
          );
        } else {
          setAuthError(
            err instanceof Error ? err.message : 'Đăng nhập không thành công. Vui lòng thử lại.'
          );
        }
      }
    } finally {
      setIsSigningIn(false);
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
    const updated: UserProfile = {
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
    saveUserProfile(updated).catch((err) => {
      console.warn('Background profile save warning:', err);
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

  // Check if champion qualified (>= 21 submissions)
  const completedLessonsCount = new Set(submissions.map((s) => s.lesson_id)).size;
  const isChampionQualified = completedLessonsCount >= 21;

  // Handle "Học ngay" button click from weekly reminder toast
  const handleLearnNow = () => {
    setActiveTab('map');
    const currentWeek = calculateCurrentStudyWeek(userProfile?.created_at);
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
          onOpenMobileQr={() => setShowMobileQrModal(true)}
          brandConfig={brandConfig}
          isLoading={isSigningIn}
          lang={lang}
          onToggleLang={handleToggleLang}
          errorMessage={authError}
        />
        <MobileQrModal
          isOpen={showMobileQrModal}
          onClose={() => setShowMobileQrModal(false)}
          lang={lang}
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
        onOpenMobileQr={() => setShowMobileQrModal(true)}
        onOpenBrandSettings={() => setShowBrandModal(true)}
        onOpenStudentGuide={() => setShowStudentGuide(true)}
        onToggleAdminTestBar={() => setShowAdminTestBar((prev) => !prev)}
        isAdminTestActive={showAdminTestBar}
      />

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
          currentWeek={calculateCurrentStudyWeek(userProfile.created_at)}
          submittedCountInWeek={
            submissions.filter(
              (s) => s.week === calculateCurrentStudyWeek(userProfile.created_at)
            ).length
          }
          onLearnNow={handleLearnNow}
          onDismiss={() => setIsWeeklyToastDismissed(true)}
          lang={lang}
        />
      )}

      {/* Mobile QR Modal */}
      <MobileQrModal
        isOpen={showMobileQrModal}
        onClose={() => setShowMobileQrModal(false)}
        lang={lang}
      />

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
        <ExpiredNoticeModal
          isOpen={showExpiredModal}
          userProfile={userProfile}
          lang={lang}
          validityWeeks={systemSettings?.validityWeeks || 8}
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
