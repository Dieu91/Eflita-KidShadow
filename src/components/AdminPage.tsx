import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Download,
  ExternalLink,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Database,
  Users,
  Trophy,
  Video,
  Eye,
  Settings,
  Clock,
  UserCheck,
  Trash2,
  Plus,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { UserProfile, Submission, ReflectionPost, LevelType, Language, Lesson, SystemSettings } from '../types';
import { getTranslation } from '../i18n/translations';
import {
  getAdminUsersData,
  updateReflectionStatus,
  seedLessonsIfNeeded,
  isUserAdmin,
  getAllLessons,
  updateLessonScript,
  getSystemSettings,
  saveSystemSettings,
  updateUserRole,
  extendUserExpiration,
  deleteUserAccount,
  deleteLessonFromFirestore,
  cleanupExtraLessonsInFirestore,
  getUserDatesInfo,
  DEFAULT_SYSTEM_SETTINGS
} from '../services/firebase';
import { isStandardLessonDocId } from '../data/lessonsData';

interface AdminPageProps {
  currentUserEmail: string | null;
  lang: Language;
  onOpenBrandSettings?: () => void;
  onSimulate21?: () => void;
  onSimulate20?: () => void;
  onResetTest?: () => void;
  onOpenChampionModal?: () => void;
  onOpenChampionArena?: () => void;
  completedCount?: number;
}

interface UserAdminRow {
  user: UserProfile;
  submissionsCount: number;
  percent: number;
  weeksStatus: { week: number; count: number }[];
  reflection: ReflectionPost | null;
  isQualified: boolean;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUserEmail,
  lang,
  onOpenBrandSettings,
  onSimulate21,
  onSimulate20,
  onResetTest,
  onOpenChampionModal,
  onOpenChampionArena,
  completedCount = 0,
}) => {
  const t = getTranslation(lang);
  const isAdmin = isUserAdmin(currentUserEmail);

  const [loading, setLoading] = useState<boolean>(true);
  const [userRows, setUserRows] = useState<UserAdminRow[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [updatingPostId, setUpdatingPostId] = useState<string | null>(null);
  const [seedMessage, setSeedMessage] = useState<string>('');
  const [showQualifiedModal, setShowQualifiedModal] = useState<boolean>(false);

  // System Settings & Expiration State
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
  const [loadingSettings, setLoadingSettings] = useState<boolean>(false);
  const [savingSettings, setSavingSettings] = useState<boolean>(false);
  const [newAdminEmail, setNewAdminEmail] = useState<string>('');
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [userRoleUpdatingId, setUserRoleUpdatingId] = useState<string | null>(null);
  const [userExtendingId, setUserExtendingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'WARNING' | 'EXPIRED' | 'ADMIN'>('ALL');
  const [customWeeksInput, setCustomWeeksInput] = useState<string>('');
  const [cleaningExpired, setCleaningExpired] = useState<boolean>(false);

  // Lesson Script Management State & Champion Test & Settings Tab
  const [adminTab, setAdminTabState] = useState<'students' | 'scripts' | 'champion-test' | 'settings'>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem('kidshadow_admin_active_tab');
        if (saved && ['students', 'scripts', 'champion-test', 'settings'].includes(saved)) {
          return saved as any;
        }
      } catch {}
    }
    return 'students';
  });

  const setAdminTab = (tab: 'students' | 'scripts' | 'champion-test' | 'settings') => {
    setAdminTabState(tab);
    try {
      sessionStorage.setItem('kidshadow_admin_active_tab', tab);
    } catch {}
  };
  const [lessonsList, setLessonsList] = useState<Lesson[]>([]);
  const [loadingLessons, setLoadingLessons] = useState<boolean>(false);
  const [savingLessonId, setSavingLessonId] = useState<string | null>(null);
  const [deletingLessonId, setDeletingLessonId] = useState<string | null>(null);
  const [cleaningExtraLessons, setCleaningExtraLessons] = useState<boolean>(false);
  const [editingScripts, setEditingScripts] = useState<Record<string, string>>({});
  const [scriptFilterLevel, setScriptFilterLevel] = useState<string>('ALL');
  const [scriptSearch, setScriptSearch] = useState<string>('');
  const [scriptFeedbackMsg, setScriptFeedbackMsg] = useState<string>('');

  const loadLessons = async () => {
    try {
      setLoadingLessons(true);
      const list = await getAllLessons();
      setLessonsList(list);
      const initialMap: Record<string, string> = {};
      list.forEach((l) => {
        initialMap[l.id] = l.script || '';
      });
      setEditingScripts(initialMap);
    } catch (err) {
      console.error('Failed to load lessons:', err);
    } finally {
      setLoadingLessons(false);
    }
  };

  const handleSaveLessonScript = async (lessonId: string) => {
    try {
      setSavingLessonId(lessonId);
      const scriptText = editingScripts[lessonId] || '';
      await updateLessonScript(lessonId, scriptText);
      setLessonsList((prev) =>
        prev.map((l) => (l.id === lessonId ? { ...l, script: scriptText } : l))
      );
      setScriptFeedbackMsg('Đã lưu câu mẫu bài học thành công!');
      setTimeout(() => setScriptFeedbackMsg(''), 3000);
    } catch (err) {
      console.error('Failed to update script:', err);
      setScriptFeedbackMsg('Lỗi khi lưu câu mẫu. Vui lòng thử lại.');
      setTimeout(() => setScriptFeedbackMsg(''), 3000);
    } finally {
      setSavingLessonId(null);
    }
  };

  const handleDeleteLesson = async (lessonId: string, topic?: string) => {
    if (
      !confirm(
        `⚠️ XÁC NHẬN XÓA VIDEO/BÀI HỌC:\n\nBạn có chắc chắn muốn xóa bài học "${topic || lessonId}" khỏi cơ sở dữ liệu Firestore không?\n\nHành động này không thể hoàn tác.`
      )
    ) {
      return;
    }
    try {
      setDeletingLessonId(lessonId);
      await deleteLessonFromFirestore(lessonId);
      setLessonsList((prev) => prev.filter((l) => l.id !== lessonId));
      setScriptFeedbackMsg('Đã xóa bài học thành công khỏi cơ sở dữ liệu!');
      setTimeout(() => setScriptFeedbackMsg(''), 3000);
    } catch (err) {
      console.error('Failed to delete lesson:', err);
      setScriptFeedbackMsg('Lỗi khi xóa bài học. Vui lòng thử lại.');
      setTimeout(() => setScriptFeedbackMsg(''), 3000);
    } finally {
      setDeletingLessonId(null);
    }
  };

  const handleCleanupExtraLessons = async () => {
    try {
      setCleaningExtraLessons(true);
      const cleaned = await cleanupExtraLessonsInFirestore();
      await loadLessons();
      setScriptFeedbackMsg(
        cleaned > 0
          ? `Đã dọn dẹp và xóa vĩnh viễn ${cleaned} video bị dư thừa trong hệ thống!`
          : 'Hệ thống đã chuẩn hóa đúng 63 bài học tiêu chuẩn, không còn video thừa nào!'
      );
      setTimeout(() => setScriptFeedbackMsg(''), 4000);
    } catch (err) {
      console.error('Failed to clean extra lessons:', err);
      setScriptFeedbackMsg('Lỗi khi dọn dẹp video thừa. Vui lòng thử lại.');
      setTimeout(() => setScriptFeedbackMsg(''), 3000);
    } finally {
      setCleaningExtraLessons(false);
    }
  };

  const handleSyncAllDefaultScripts = async () => {
    try {
      setSeedMessage('Đang đồng bộ câu mẫu mặc định vào Firestore...');
      const result = await seedLessonsIfNeeded(true);
      await loadLessons();
      setSeedMessage(`Đã đồng bộ thành công ${result.count} bài học với trường câu mẫu (script)!`);
      setTimeout(() => setSeedMessage(''), 4000);
    } catch (err) {
      console.error(err);
      setSeedMessage('Lỗi khi đồng bộ.');
      setTimeout(() => setSeedMessage(''), 4000);
    }
  };

  // Load all user data, submissions, and reflections
  const loadData = async () => {
    try {
      setLoading(true);
      const { users, submissions, reflections } = await getAdminUsersData();

      const reflectionMap = new Map<string, ReflectionPost>();
      reflections.forEach((r) => reflectionMap.set(r.user_id, r));

      const rows: UserAdminRow[] = users.map((u) => {
        const userSubs = submissions.filter((s) => s.user_id === u.uid);
        const uniqueLessonIds = new Set(userSubs.map((s) => s.lesson_id));
        const count = Math.min(21, uniqueLessonIds.size);
        const percent = Math.min(100, Math.round((count / 21) * 100));

        // Group by weeks 1 to 7
        const weeksStatus: { week: number; count: number }[] = [];
        for (let w = 1; w <= 7; w++) {
          const weekSubs = userSubs.filter((s) => s.week === w);
          const weekLessons = new Set(weekSubs.map((s) => s.order));
          weeksStatus.push({ week: w, count: weekLessons.size });
        }

        const reflection = reflectionMap.get(u.uid) || null;
        const isQualified = count >= 21 && !!reflection && reflection.status !== 'invalid';

        return {
          user: u,
          submissionsCount: count,
          percent,
          weeksStatus,
          reflection,
          isQualified,
        };
      });

      setUserRows(rows);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      setLoadingSettings(true);
      const s = await getSystemSettings();
      setSettings(s);
    } catch (err) {
      console.warn('Could not load system settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (newConfig?: Partial<SystemSettings>) => {
    try {
      setSavingSettings(true);
      const toSave = newConfig ? { ...settings, ...newConfig } : settings;
      await saveSystemSettings(toSave);
      setSettings(toSave);
      setSeedMessage('Đã lưu cấu hình thời hạn và hệ thống thành công!');
      setTimeout(() => setSeedMessage(''), 3500);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi lưu cấu hình.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddAdminEmail = async () => {
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      alert('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    const clean = newAdminEmail.trim().toLowerCase();
    if (settings.adminEmails.includes(clean)) {
      alert('Email này đã có trong danh sách quản trị viên.');
      return;
    }
    const updatedEmails = [...settings.adminEmails, clean];
    const updatedSettings = { ...settings, adminEmails: updatedEmails };
    setSettings(updatedSettings);
    await saveSystemSettings(updatedSettings);
    setNewAdminEmail('');
    setSeedMessage(`Đã cấp quyền Admin cho ${clean}!`);
    setTimeout(() => setSeedMessage(''), 3000);
  };

  const handleRemoveAdminEmail = async (emailToRemove: string) => {
    if (emailToRemove.toLowerCase() === 'aidieu0411@gmail.com') {
      alert('Không thể xóa tài khoản Admin sáng lập chính.');
      return;
    }
    if (!confirm(`Bạn có chắc chắn muốn bỏ quyền Admin của ${emailToRemove}?`)) return;
    const updatedEmails = settings.adminEmails.filter(e => e.toLowerCase() !== emailToRemove.toLowerCase());
    const updatedSettings = { ...settings, adminEmails: updatedEmails };
    setSettings(updatedSettings);
    await saveSystemSettings(updatedSettings);
    setSeedMessage(`Đã thu hồi quyền Admin của ${emailToRemove}`);
    setTimeout(() => setSeedMessage(''), 3000);
  };

  const handleToggleUserRole = async (user: UserProfile) => {
    const nextRole = user.role === 'admin' ? 'user' : 'admin';
    try {
      setUserRoleUpdatingId(user.uid);
      await updateUserRole(user.uid, nextRole);
      let updatedExpiresAt = user.expires_at;
      if (nextRole === 'admin') {
        updatedExpiresAt = new Date(Date.now() + 365 * 10 * 86400000).toISOString();
      } else {
        const startStr = user.first_login_at || user.created_at || new Date().toISOString();
        const weeks = settings.validityWeeks ?? 8;
        if (weeks > 0) {
          const d = new Date(startStr);
          d.setDate(d.getDate() + weeks * 7);
          updatedExpiresAt = d.toISOString();
        }
      }
      setUserRows(prev => prev.map(r => {
        if (r.user.uid === user.uid) {
          return { ...r, user: { ...r.user, role: nextRole, expires_at: updatedExpiresAt } };
        }
        return r;
      }));
      setSeedMessage(`Đã cập nhật quyền của ${user.student_name} thành ${nextRole === 'admin' ? 'Quản trị viên 👑' : 'Học viên 👤'}!`);
      setTimeout(() => setSeedMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi cập nhật quyền.');
    } finally {
      setUserRoleUpdatingId(null);
    }
  };

  const handleExtendUser = async (user: UserProfile, weeks: number = 2) => {
    try {
      setUserExtendingId(user.uid);
      const newExpiresAt = await extendUserExpiration(user.uid, weeks);
      setUserRows(prev => prev.map(r => {
        if (r.user.uid === user.uid) {
          return { ...r, user: { ...r.user, expires_at: newExpiresAt, status: 'active' } };
        }
        return r;
      }));
      setSeedMessage(`Đã gia hạn thêm ${weeks} tuần cho học viên ${user.student_name}!`);
      setTimeout(() => setSeedMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi gia hạn.');
    } finally {
      setUserExtendingId(null);
    }
  };

  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`⚠️ XÁC NHẬN XÓA TÀI KHOẢN:\n\nBạn có chắc chắn muốn xóa vĩnh viễn học viên "${user.student_name}" (Phụ huynh: ${user.parent_name} - ${user.phone})?\n\nHành động này sẽ xóa toàn bộ bài nộp video, điểm số và bài viết cảm nhận trong hệ thống và không thể hoàn tác.`)) {
      return;
    }
    try {
      setDeletingUserId(user.uid);
      await deleteUserAccount(user.uid);
      setUserRows(prev => prev.filter(r => r.user.uid !== user.uid));
      setSeedMessage(`Đã xóa tài khoản học viên ${user.student_name} thành công.`);
      setTimeout(() => setSeedMessage(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi xóa tài khoản học viên.');
    } finally {
      setDeletingUserId(null);
    }
  };

  const handleBatchCleanupExpired = async () => {
    const expiredList = userRows.filter(r => formatValidityInfo(r.user).status === 'expired');
    if (expiredList.length === 0) {
      alert('Hiện không có học viên nào đã hết hạn cần dọn dẹp!');
      return;
    }

    if (!confirm(`⚠️ XÁC NHẬN DỌN DẸP HÀNG LOẠT:\n\nBạn có chắc chắn muốn xóa vĩnh viễn ${expiredList.length} tài khoản học viên đã hết hạn?\n\nToàn bộ dữ liệu bài nộp video và kết quả của các học viên này sẽ được xóa để dọn dẹp hệ thống.`)) {
      return;
    }

    try {
      setCleaningExpired(true);
      let count = 0;
      for (const row of expiredList) {
        await deleteUserAccount(row.user.uid);
        count++;
      }
      setUserRows(prev => prev.filter(r => formatValidityInfo(r.user).status !== 'expired'));
      setSeedMessage(`Đã dọn dẹp thành công ${count} tài khoản học viên đã hết hạn.`);
      setTimeout(() => setSeedMessage(''), 4000);
    } catch (err) {
      console.error(err);
      alert('Lỗi khi dọn dẹp tài khoản hết hạn.');
    } finally {
      setCleaningExpired(false);
    }
  };

  const formatValidityInfo = (user: UserProfile) => {
    return getUserDatesInfo(user, settings);
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
      loadSettings();
      if (adminTab === 'scripts') {
        loadLessons();
      }
    }
  }, [isAdmin, adminTab]);

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center">
        <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">
          {t.accessDenied}
        </h2>
        <p className="text-xs text-slate-500 mt-2">
          Email: {currentUserEmail || 'None'}
        </p>
      </div>
    );
  }

  // Handle status toggle for reflection post
  const handleToggleStatus = async (post: ReflectionPost, nextStatus: 'pending' | 'invalid' | 'approved') => {
    if (!post.id) return;
    try {
      setUpdatingPostId(post.id);
      await updateReflectionStatus(post.id, nextStatus);
      setUserRows((prev) =>
        prev.map((r) => {
          if (r.reflection && r.reflection.id === post.id) {
            const updatedReflection: ReflectionPost = {
              ...r.reflection,
              user_id: r.reflection.user_id,
              post_url: r.reflection.post_url,
              submitted_at: r.reflection.submitted_at,
              status: nextStatus,
            };
            const isQualified = r.submissionsCount >= 21 && nextStatus !== 'invalid';
            return { ...r, reflection: updatedReflection, isQualified };
          }
          return r;
        })
      );
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingPostId(null);
    }
  };

  // Seed sample lessons to Firestore if needed
  const handleSeed = async () => {
    setSeedMessage('Đang nạp bài học...');
    const result = await seedLessonsIfNeeded();
    if (result.alreadySeeded) {
      setSeedMessage(`Cơ sở dữ liệu đã có sẵn ${result.count} bài học.`);
    } else {
      setSeedMessage(`Đã nạp thành công ${result.count} bài học mới!`);
    }
    setTimeout(() => setSeedMessage(''), 4000);
  };

  // Filtered rows
  const filteredRows = userRows.filter((r) => {
    if (filterLevel !== 'ALL' && r.user.level !== filterLevel) {
      return false;
    }
    if (filterStatus !== 'ALL') {
      const v = formatValidityInfo(r.user);
      if (filterStatus === 'ACTIVE' && v.status !== 'active' && v.status !== 'unlimited') return false;
      if (filterStatus === 'WARNING' && v.status !== 'warning') return false;
      if (filterStatus === 'EXPIRED' && v.status !== 'expired') return false;
      if (filterStatus === 'ADMIN' && v.status !== 'admin') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = r.user.student_name.toLowerCase().includes(q);
      const matchParent = r.user.parent_name.toLowerCase().includes(q);
      const matchPhone = r.user.phone.toLowerCase().includes(q);
      const matchEmail = (r.user.email || '').toLowerCase().includes(q);
      return matchName || matchParent || matchPhone || matchEmail;
    }
    return true;
  });

  const activeCount = userRows.filter((r) => {
    const s = formatValidityInfo(r.user).status;
    return s === 'active' || s === 'unlimited';
  }).length;
  const warningCount = userRows.filter((r) => formatValidityInfo(r.user).status === 'warning').length;
  const expiredCount = userRows.filter((r) => formatValidityInfo(r.user).status === 'expired').length;
  const adminUsersCount = userRows.filter((r) => formatValidityInfo(r.user).status === 'admin').length;

  const qualifiedList = userRows.filter((r) => r.isQualified);

  // Export CSV
  const handleExportCSV = (onlyQualified: boolean = false) => {
    const listToExport = onlyQualified ? qualifiedList : (filteredRows.length > 0 ? filteredRows : userRows);

    if (listToExport.length === 0) {
      alert('Không có học viên nào trong danh sách xuất.');
      return;
    }

    const headers = [
      'Tên học viên',
      'Tên phụ huynh',
      'Số điện thoại',
      'Email',
      'Cấp độ',
      'Quyền hạn',
      'Ngày bắt đầu',
      'Ngày hết hạn',
      'Tình trạng hạn dùng',
      'Số video nộp (trên 21)',
      '% Hoàn thành',
      'Trạng thái tiến độ',
      'Link bài cảm nhận',
      'Trạng thái bài cảm nhận',
      'Đủ điều kiện thi'
    ];

    const rows = listToExport.map((r) => {
      const v = formatValidityInfo(r.user);
      const userIsAdmin = r.user.role === 'admin' || isUserAdmin(r.user.email, r.user);
      return [
        `"${r.user.student_name}"`,
        `"${r.user.parent_name}"`,
        `"${r.user.phone}"`,
        `"${r.user.email || ''}"`,
        `"${r.user.level}"`,
        userIsAdmin ? '"Quản trị viên (Admin)"' : '"Học viên"',
        `"${v.startDateFormatted}"`,
        `"${v.expiresDateFormatted}"`,
        `"${v.text}"`,
        r.submissionsCount,
        `${r.percent}%`,
        r.percent === 100 ? '"Hoàn thành 100%"' : (r.percent >= 50 ? '"Tiến độ tốt"' : '"Cần nhắc nhở"'),
        `"${r.reflection?.post_url || ''}"`,
        `"${r.reflection?.status || ''}"`,
        r.isQualified ? '"Có"' : '"Chưa"'
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const filename = onlyQualified
      ? `Eflita_Thi_Sinh_Chung_Ket_${new Date().toISOString().slice(0, 10)}.csv`
      : `Eflita_Danh_Sach_Hoc_Vien_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl w-full mx-auto py-4 sm:py-6 px-2.5 sm:px-6 space-y-5 sm:space-y-6 pb-28 min-w-0">
      {/* Admin Header */}
      <div className="bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 rounded-3xl p-4 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
            🛡️ Hệ thống Quản trị
          </span>
          <h2 className="text-xl sm:text-2xl font-black font-['Fredoka',sans-serif] mt-2">
            {t.adminTitle}
          </h2>
          <p className="text-xs font-medium text-rose-100 mt-1">
            Email xác thực: {currentUserEmail}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {onOpenBrandSettings && (
            <button
              onClick={onOpenBrandSettings}
              className="bg-amber-400 hover:bg-amber-300 text-amber-950 font-black text-xs px-3.5 py-2 rounded-2xl shadow-md flex items-center gap-1.5 transition active:scale-95 cursor-pointer font-['Fredoka',sans-serif]"
            >
              <span>🎨</span>
              <span>Cấu hình Logo Thương Hiệu</span>
            </button>
          )}

          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Làm mới</span>
          </button>

          <button
            onClick={handleSeed}
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Nạp dữ liệu bài học"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{t.seedLessonsBtn}</span>
          </button>

          <button
            onClick={() => handleExportCSV(false)}
            className="px-3.5 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
            title="Xuất danh sách tất cả học viên đang hiển thị ra file Excel/CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel ({filteredRows.length})</span>
          </button>

          <button
            onClick={() => handleExportCSV(true)}
            disabled={qualifiedList.length === 0}
            className="px-4 py-2 bg-white text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Xuất danh sách thí sinh đã hoàn thành 21/21 để chấm giải"
          >
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            <span>Thí sinh chung kết ({qualifiedList.length})</span>
          </button>
        </div>
      </div>

      {seedMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-2xl animate-in fade-in">
          {seedMessage}
        </div>
      )}

      {/* Admin Tab Switcher */}
      <div className="flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-100 rounded-2xl w-full max-w-full overflow-x-auto scrollbar-none pb-1.5 sm:pb-1.5">
        <button
          onClick={() => setAdminTab('students')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            adminTab === 'students'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Quản lý Học viên ({userRows.length})</span>
        </button>
        <button
          onClick={() => {
            setAdminTab('scripts');
            loadLessons();
          }}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            adminTab === 'scripts'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Video className="w-4 h-4 text-purple-600" />
          <span>🎙️ Quản lý Câu mẫu Shadowing (Script)</span>
        </button>
        <button
          onClick={() => setAdminTab('champion-test')}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            adminTab === 'champion-test'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>🏆 Test Luồng Shadowing Champion</span>
        </button>
        <button
          onClick={() => {
            setAdminTab('settings');
            loadSettings();
          }}
          className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
            adminTab === 'settings'
              ? 'bg-white text-slate-800 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-4 h-4 text-rose-500" />
          <span>⚙️ Thời Hạn & Phân Quyền</span>
        </button>
      </div>

      {adminTab === 'scripts' ? (
        /* LESSON SCRIPT MANAGEMENT VIEW (Requirement 1) */
        <div className="space-y-4">
          {/* Header Controls for Scripts */}
          <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-base sm:text-lg text-slate-800 font-['Fredoka',sans-serif]">
                    Quản lý Câu mẫu chuẩn cho 63 Bài học Shadowing
                  </h3>
                  <span
                    className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                      lessonsList.length === 63
                        ? 'bg-emerald-100 text-emerald-800'
                        : lessonsList.length > 63
                        ? 'bg-rose-100 text-rose-800 animate-pulse'
                        : 'bg-purple-100 text-purple-800'
                    }`}
                  >
                    {lessonsList.length}/63 bài học
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thầy cô có thể nhập hoặc chỉnh sửa câu mẫu (script) của từng video để hệ thống đối chiếu khi nhận xét phát âm.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {lessonsList.length > 63 && (
                  <button
                    onClick={handleCleanupExtraLessons}
                    disabled={cleaningExtraLessons}
                    className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition cursor-pointer shadow-xs animate-pulse"
                    title="Xóa ngay các video bị dư thừa khỏi Firestore"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Dọn dẹp video thừa ({lessonsList.length - 63})</span>
                  </button>
                )}

                <button
                  onClick={handleCleanupExtraLessons}
                  disabled={cleaningExtraLessons}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Dọn dẹp và chuẩn hóa danh sách video (loại bỏ video thừa)"
                >
                  <Trash2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>Dọn dẹp video thừa</span>
                </button>

                <button
                  onClick={loadLessons}
                  disabled={loadingLessons}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLessons ? 'animate-spin' : ''}`} />
                  <span>Tải lại</span>
                </button>

                <button
                  onClick={handleSyncAllDefaultScripts}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                  title="Đồng bộ tất cả câu mẫu mặc định vào Firestore"
                >
                  <Database className="w-3.5 h-3.5" />
                  <span>Đồng bộ câu mẫu vào Firestore</span>
                </button>
              </div>
            </div>

            {scriptFeedbackMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-xl animate-in fade-in">
                {scriptFeedbackMsg}
              </div>
            )}

            {/* Filter and Search Bar for Scripts */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
              <div className="relative w-full sm:w-80">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={scriptSearch}
                  onChange={(e) => setScriptSearch(e.target.value)}
                  placeholder="Tìm kiếm chủ đề hoặc câu mẫu..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-purple-400 focus:bg-white"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['ALL', 'STARTER', 'MOVERS', 'FLYERS'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setScriptFilterLevel(lvl)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      scriptFilterLevel === lvl
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {lvl === 'ALL' ? 'Tất cả cấp độ' : lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lessons List Table */}
          <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
            {loadingLessons ? (
              <div className="py-12 text-center text-slate-500 text-xs font-bold">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-purple-500" />
                <span>Đang tải danh sách bài học...</span>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase text-[10px] tracking-wider">
                      <th className="py-3.5 px-4 w-28">Bài học</th>
                      <th className="py-3.5 px-4 w-44">Chủ đề</th>
                      <th className="py-3.5 px-4">Câu mẫu Shadowing (Script đối chiếu)</th>
                      <th className="py-3.5 px-4 w-28 text-right">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {lessonsList
                      .filter((lesson) => {
                        if (scriptFilterLevel !== 'ALL' && lesson.level !== scriptFilterLevel) return false;
                        if (scriptSearch.trim()) {
                          const q = scriptSearch.toLowerCase();
                          const matchTopic = (lesson.topic || '').toLowerCase().includes(q);
                          const matchScript = (editingScripts[lesson.id] || lesson.script || '').toLowerCase().includes(q);
                          return matchTopic || matchScript;
                        }
                        return true;
                      })
                      .map((lesson) => {
                        const isStandard = isStandardLessonDocId(lesson.id);
                        const currentVal = editingScripts[lesson.id] !== undefined ? editingScripts[lesson.id] : (lesson.script || '');
                        const isSaving = savingLessonId === lesson.id;
                        const isDeleting = deletingLessonId === lesson.id;
                        return (
                          <tr
                            key={lesson.id}
                            className={`transition ${
                              !isStandard
                                ? 'bg-rose-50/80 hover:bg-rose-100/80 border-l-4 border-l-rose-500'
                                : 'hover:bg-slate-50/80'
                            }`}
                          >
                            <td className="py-3 px-4 align-top">
                              {isStandard ? (
                                <>
                                  <span
                                    className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                      lesson.level === 'STARTER'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : lesson.level === 'MOVERS'
                                        ? 'bg-sky-100 text-sky-800'
                                        : 'bg-amber-100 text-amber-800'
                                    }`}
                                  >
                                    {lesson.level}
                                  </span>
                                  <div className="font-extrabold text-slate-800 mt-1">
                                    Tuần {lesson.week} • Video {lesson.order}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-rose-200 text-rose-900 animate-pulse">
                                    VIDEO DƯ THỪA
                                  </span>
                                  <div className="text-[11px] font-mono text-rose-700 mt-1 font-bold">
                                    {lesson.id}
                                  </div>
                                </>
                              )}
                            </td>

                            <td className="py-3 px-4 align-top">
                              <div className="font-bold text-slate-800">{lesson.topic || '(Chưa có chủ đề)'}</div>
                              {lesson.embed_url && (
                                <a
                                  href={lesson.embed_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-sky-600 hover:underline flex items-center gap-1 mt-1"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>Xem video</span>
                                </a>
                              )}
                            </td>

                            <td className="py-3 px-4 align-top">
                              <textarea
                                rows={4}
                                value={currentVal}
                                onChange={(e) =>
                                  setEditingScripts((prev) => ({
                                    ...prev,
                                    [lesson.id]: e.target.value,
                                  }))
                                }
                                placeholder="Nhập kịch bản/đoạn hội thoại mẫu cho bài học này..."
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-purple-400 transition leading-relaxed whitespace-pre-wrap"
                              />
                            </td>

                            <td className="py-3 px-4 align-top text-right space-x-1.5 whitespace-nowrap">
                              <button
                                onClick={() => handleSaveLessonScript(lesson.id)}
                                disabled={isSaving || isDeleting}
                                className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95 cursor-pointer disabled:opacity-50"
                              >
                                {isSaving ? 'Đang lưu...' : 'Lưu'}
                              </button>
                              <button
                                onClick={() => handleDeleteLesson(lesson.id, lesson.topic)}
                                disabled={isDeleting}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer inline-flex items-center justify-center align-middle"
                                title="Xóa video khỏi Firestore"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : adminTab === 'champion-test' ? (
        /* CHAMPION TEST TAB */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Header Info Banner */}
          <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-6 rounded-3xl text-yellow-950 border-2 border-yellow-400 shadow-md relative overflow-hidden">
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/40 backdrop-blur-xs rounded-full text-xs font-black mb-2">
                <Trophy className="w-4 h-4 text-yellow-950" />
                <span>CHẾ ĐỘ TEST ADMIN & DEMO NỘI BỘ</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black font-['Fredoka',sans-serif]">
                Thử Nghiệm Toàn Diện Luồng Mở Khóa Shadowing Champion 🏆
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-yellow-900 mt-1.5 max-w-2xl leading-relaxed">
                Công cụ dành riêng cho Admin và Team nội bộ để mô phỏng, kiểm thử từng bước trong hành trình 7 tuần từ lúc học viên chuẩn bị về đích cho đến khi đăng ký Vòng Chung Kết chính thức.
              </p>
            </div>
          </div>

          {/* Real-time Status Card */}
          <div className="bg-white p-5 rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider block">Trạng thái phiên test hiện tại</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-slate-800 font-['Fredoka',sans-serif]">
                    {completedCount} / 21 video hoàn thành
                  </span>
                  <span
                    className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                      completedCount >= 21
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                  >
                    {completedCount >= 21 ? 'Đã đủ điều kiện dự thi 🌟' : 'Chưa đủ điều kiện (cần 21 bài)'}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full sm:w-48 bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
                <div
                  className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.round((completedCount / 21) * 100))}%` }}
                />
              </div>
            </div>

            {/* Simulation Action Buttons */}
            <div>
              <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider mb-2.5">
                Các nút điều khiển mô phỏng tức thì:
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 21/21 */}
                <button
                  type="button"
                  onClick={onSimulate21}
                  className="p-3.5 bg-emerald-50 hover:bg-emerald-100 border-2 border-emerald-400 text-emerald-950 rounded-2xl text-left transition cursor-pointer active:scale-98 shadow-xs flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">⚡</span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full">Kịch bản 1</span>
                  </div>
                  <div>
                    <div className="font-black text-xs">Mô phỏng 21/21 bài</div>
                    <div className="text-[11px] text-emerald-800 mt-0.5 font-medium leading-snug">
                      Đạt mốc 21 bài ngay lập tức để mở khóa Cúp vàng trên Navbar và Lâu đài Champion.
                    </div>
                  </div>
                </button>

                {/* 20/21 */}
                <button
                  type="button"
                  onClick={onSimulate20}
                  className="p-3.5 bg-amber-50 hover:bg-amber-100 border-2 border-amber-400 text-amber-950 rounded-2xl text-left transition cursor-pointer active:scale-98 shadow-xs flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🎯</span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full">Kịch bản 2 (Khuyên dùng)</span>
                  </div>
                  <div>
                    <div className="font-black text-xs">Mô phỏng 20/21 bài</div>
                    <div className="text-[11px] text-amber-800 mt-0.5 font-medium leading-snug">
                      Đặt 20 bài, sau đó bạn vào Bản đồ nộp bài 21 để thấy pháo hoa & popup tự động nổ.
                    </div>
                  </div>
                </button>

                {/* Open Modal */}
                <button
                  type="button"
                  onClick={onOpenChampionModal}
                  className="p-3.5 bg-yellow-50 hover:bg-yellow-100 border-2 border-yellow-400 text-yellow-950 rounded-2xl text-left transition cursor-pointer active:scale-98 shadow-xs flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🏆</span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-yellow-200 text-yellow-900 rounded-full">Kịch bản 3</span>
                  </div>
                  <div>
                    <div className="font-black text-xs">Mở Modal Champion</div>
                    <div className="text-[11px] text-yellow-800 mt-0.5 font-medium leading-snug">
                      Mở popup ghi nhận điều kiện & chúc mừng thí sinh Vòng Chung Kết.
                    </div>
                  </div>
                </button>

                {/* Open Champion Arena Page */}
                {onOpenChampionArena && (
                  <button
                    type="button"
                    onClick={onOpenChampionArena}
                    className="p-3.5 bg-gradient-to-br from-yellow-100 via-amber-100 to-yellow-200 hover:from-yellow-200 hover:to-amber-200 border-2 border-yellow-500 text-yellow-950 rounded-2xl text-left transition cursor-pointer active:scale-98 shadow-sm flex flex-col justify-between gap-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🏛️</span>
                      <span className="text-[10px] font-black px-2 py-0.5 bg-amber-400 text-amber-950 rounded-full">Trực quan</span>
                    </div>
                    <div>
                      <div className="font-black text-xs text-amber-950">Vào Đấu Trường Chung Kết</div>
                      <div className="text-[11px] text-amber-900 mt-0.5 font-medium leading-snug">
                        Xem trọn vẹn bên trong Vòng Thi: đề thi, video mẫu, tiêu chí 100 điểm, ban giám khảo.
                      </div>
                    </div>
                  </button>
                )}

                {/* Reset */}
                <button
                  type="button"
                  onClick={onResetTest}
                  className="p-3.5 bg-slate-50 hover:bg-slate-100 border-2 border-slate-300 text-slate-800 rounded-2xl text-left transition cursor-pointer active:scale-98 shadow-xs flex flex-col justify-between gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🔄</span>
                    <span className="text-[10px] font-black px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full">Reset</span>
                  </div>
                  <div>
                    <div className="font-black text-xs">Khôi phục ban đầu</div>
                    <div className="text-[11px] text-slate-600 mt-0.5 font-medium leading-snug">
                      Xóa toàn bộ bài nộp test và đặt lại trạng thái về ban đầu để kiểm thử lại từ đầu.
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Test Guide & Scenarios for internal team */}
          <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-xs space-y-4">
            <h4 className="font-black text-base text-slate-800 font-['Fredoka',sans-serif] flex items-center gap-2">
              <span>📋</span>
              <span>Hướng Dẫn 4 Bước Test Luồng Cho Team Nội Bộ</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-semibold text-slate-700 leading-relaxed">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-yellow-950 flex items-center justify-center text-xs">1</span>
                  <span>Test hiệu ứng về đích tự động:</span>
                </div>
                <p className="text-slate-600">
                  Bấm <strong>"Mô phỏng 20/21 bài"</strong> ở trên → Chuyển sang tab <strong>Bản đồ học tập</strong> → Chọn bài thứ 21 (Tuần 7, Video 3) → Ghi âm hoặc tải video ngắn bất kỳ → Bấm <strong>Nộp bài</strong> → Quan sát nhận xét của giáo viên và hiệu ứng pháo hoa mở khóa tự động bật lên sau 1.5 giây!
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-yellow-950 flex items-center justify-center text-xs">2</span>
                  <span>Test Bước 1: Gửi link bài cảm nhận:</span>
                </div>
                <p className="text-slate-600">
                  Trong popup Shadowing Champion, bạn sẽ thấy yêu cầu gửi link bài viết cảm nghĩ 7 tuần trên Facebook cộng đồng Eflita. Trong chế độ Admin, có sẵn nút <strong>"⚡ Điền link test nhanh"</strong> để bạn không phải tìm link thật. Sau khi bấm Gửi, pháo hoa sẽ nổ rực rỡ và mở khóa Bước 2!
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-yellow-950 flex items-center justify-center text-xs">3</span>
                  <span>Test Bước 2: Đăng ký Vòng Chung Kết:</span>
                </div>
                <p className="text-slate-600">
                  Form đăng ký hiện ra gồm Họ tên bé, Họ tên phụ huynh, SĐT và Cấp độ. Có sẵn nút <strong>"⚡ Điền thông tin mẫu"</strong>. Bấm nút <strong>Đăng ký ngay</strong> để hoàn tất quy trình. Sau khi đăng ký thành công, sẽ có thông báo xác nhận và nút reset nếu muốn thử lại.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-yellow-950 flex items-center justify-center text-xs">4</span>
                  <span>Kiểm tra danh sách & Xuất Excel cho Giám khảo:</span>
                </div>
                <p className="text-slate-600">
                  Chuyển sang tab <strong>👥 Quản lý Học viên</strong> → Bạn sẽ thấy học viên được gắn cúp vàng và nhãn <strong>"Đủ điều kiện"</strong>. Phía trên có nút <strong>"Thí sinh chung kết (X)"</strong> để tải ngay file Excel danh sách các bé đủ điều kiện gửi cho Ban giám khảo chấm giải.
                </p>
              </div>
          </div>
        </div>
      </div>
      ) : adminTab === 'settings' ? (
        /* SYSTEM SETTINGS & RBAC VIEW */
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-rose-600 rounded-3xl p-6 text-white shadow-lg relative overflow-hidden">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full w-fit mb-2">
              <Settings className="w-3.5 h-3.5" />
              <span>Cấu hình Hệ thống</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black font-['Fredoka',sans-serif]">
              Thời Hạn Khóa Học & Phân Quyền Quản Trị Viên ⚙️
            </h3>
            <p className="text-xs sm:text-sm text-purple-100 mt-1 max-w-2xl leading-relaxed font-medium">
              Tùy chỉnh thời gian học viên được phép trải nghiệm (8 tuần, 10 tuần, hoặc vô thời hạn), lựa chọn hình thức xử lý khi hết hạn và quản lý danh sách Quản trị viên của trung tâm.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card 1: Course Validity */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base font-['Fredoka',sans-serif]">
                      Thời Hạn Trải Nghiệm Khóa Học
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Thời gian tính từ lần đầu tiên học viên đăng nhập vào hệ thống
                    </p>
                  </div>
                </div>

                {/* Validity Weeks Options */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Chọn thời hạn áp dụng cho học viên:
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {[
                      { weeks: 8, label: '8 tuần (56 ngày)', desc: 'Chuẩn 7 tuần học + 1 tuần đệm' },
                      { weeks: 10, label: '10 tuần (70 ngày)', desc: 'Khuyên dùng (Thêm 2 tuần ôn tập)' },
                      { weeks: 12, label: '12 tuần (84 ngày)', desc: 'Lộ trình mở rộng 3 tháng' },
                      { weeks: 0, label: 'Không giới hạn', desc: 'Vĩnh viễn không hết hạn' },
                    ].map((opt) => (
                      <button
                        key={opt.weeks}
                        type="button"
                        onClick={() => setSettings(prev => ({ ...prev, validityWeeks: opt.weeks }))}
                        className={`p-3 rounded-2xl border-2 text-left transition cursor-pointer ${
                          settings.validityWeeks === opt.weeks
                            ? 'border-purple-500 bg-purple-50/70 text-purple-950 font-black shadow-xs ring-2 ring-purple-400/20'
                            : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-black">
                          <span>{opt.label}</span>
                          {settings.validityWeeks === opt.weeks && <span className="text-purple-600">✓</span>}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>

                  {/* Custom weeks input */}
                  <div className="mt-2.5 p-2.5 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700">Hoặc nhập số tuần tùy chỉnh:</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="52"
                        value={customWeeksInput}
                        onChange={(e) => setCustomWeeksInput(e.target.value)}
                        placeholder="VD: 6, 16..."
                        className="w-24 px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl text-slate-800 text-center focus:outline-none focus:border-purple-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = parseInt(customWeeksInput, 10);
                          if (isNaN(val) || val < 1) {
                            alert('Vui lòng nhập số tuần hợp lệ (từ 1 đến 52 tuần).');
                            return;
                          }
                          setSettings(prev => ({ ...prev, validityWeeks: val }));
                          setSeedMessage(`Đã chọn mốc thời hạn ${val} tuần!`);
                          setTimeout(() => setSeedMessage(''), 2500);
                        }}
                        className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition active:scale-95 cursor-pointer shadow-2xs"
                      >
                        Áp dụng {customWeeksInput ? `(${customWeeksInput}w)` : ''}
                      </button>
                    </div>
                  </div>
                  {settings.validityWeeks > 0 && ![8, 10, 12].includes(settings.validityWeeks) && (
                    <div className="mt-1 text-[11px] font-black text-purple-700">
                      ★ Đang chọn thời hạn tùy biến: <strong>{settings.validityWeeks} tuần</strong> ({settings.validityWeeks * 7} ngày)
                    </div>
                  )}
                </div>

                {/* Expiration Mode */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2">
                    Hành động khi học viên hết thời hạn:
                  </label>
                  <div className="space-y-2">
                    <div
                      onClick={() => setSettings(prev => ({ ...prev, expirationMode: 'lock' }))}
                      className={`p-3 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        settings.expirationMode === 'lock'
                          ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 ring-1 ring-emerald-400/30'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="expirationMode"
                        checked={settings.expirationMode === 'lock'}
                        onChange={() => {}}
                        className="mt-0.5 text-emerald-600"
                      />
                      <div className="text-xs">
                        <div className="font-black text-slate-800 flex items-center gap-1.5">
                          <span>Khóa quyền nộp bài & Báo hoàn tất khóa học</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.2 rounded-full">Khuyên dùng</span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Khi học viên vào app sau thời hạn, màn hình sẽ hiện thông báo chúc mừng hoàn thành khóa học và hướng dẫn gia hạn. Toàn bộ video và điểm số cũ được lưu trữ an toàn để báo cáo và đối soát.
                        </p>
                      </div>
                    </div>

                    <div
                      onClick={() => setSettings(prev => ({ ...prev, expirationMode: 'delete' }))}
                      className={`p-3 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition ${
                        settings.expirationMode === 'delete'
                          ? 'border-rose-500 bg-rose-50/50 text-rose-950 ring-1 ring-rose-400/30'
                          : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="expirationMode"
                        checked={settings.expirationMode === 'delete'}
                        onChange={() => {}}
                        className="mt-0.5 text-rose-600"
                      />
                      <div className="text-xs">
                        <div className="font-black text-slate-800">
                          Tự động xóa dữ liệu học viên (Auto Cleanup)
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                          Tài khoản và toàn bộ bài nộp sẽ được tự động xóa bỏ khỏi hệ thống sau khi hết hạn để dọn dẹp dung lượng.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Flexible Mechanism Highlight Notice */}
                <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200 text-[11px] text-purple-950 space-y-1">
                  <div className="font-black text-purple-800 flex items-center gap-1">
                    <span>💡 Cơ chế hoàn toàn linh hoạt:</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Bạn <strong>không cần phải quyết định cố định ngay bây giờ</strong>! Bạn có thể tự do thay đổi thời hạn (8 tuần, 10 tuần, số tuần bất kỳ) hoặc đổi chế độ bất cứ lúc nào khi trung tâm có chiến dịch mới.
                  </p>
                </div>

                {/* Batch cleanup status and button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2">
                  <div className="text-xs">
                    <span className="font-bold text-slate-700">Học viên đã hết hạn hiện tại: </span>
                    <span className={`font-black px-2 py-0.5 rounded-full text-[11px] ${expiredCount > 0 ? 'bg-rose-100 text-rose-800 border border-rose-200' : 'bg-slate-100 text-slate-600'}`}>
                      {expiredCount} học viên
                    </span>
                  </div>
                  {expiredCount > 0 && (
                    <button
                      type="button"
                      onClick={handleBatchCleanupExpired}
                      disabled={cleaningExpired}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1 active:scale-95 disabled:opacity-50 shadow-2xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{cleaningExpired ? 'Đang dọn...' : `Dọn dẹp ${expiredCount} bạn hết hạn`}</span>
                    </button>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleSaveSettings()}
                disabled={savingSettings}
                className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md transition active:scale-98 cursor-pointer disabled:opacity-50"
              >
                {savingSettings ? 'Đang lưu cấu hình...' : 'Lưu Cài Đặt Thời Hạn'}
              </button>
            </div>

            {/* Card 2: Admin Roles */}
            <div className="bg-white p-5 sm:p-6 rounded-3xl border-2 border-slate-200 shadow-xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                  <div className="w-9 h-9 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 text-base font-['Fredoka',sans-serif]">
                      Danh Sách Quản Trị Viên (Admin)
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Các tài khoản có toàn quyền quản lý học viên, script câu mẫu và cấu hình
                    </p>
                  </div>
                </div>

                {/* Add admin input */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Thêm Quản trị viên mới bằng email:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newAdminEmail}
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      placeholder="ví dụ: giaovien@eflita.com"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-purple-400"
                    />
                    <button
                      type="button"
                      onClick={handleAddAdminEmail}
                      className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black shadow-xs transition active:scale-95 cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm Admin</span>
                    </button>
                  </div>
                </div>

                {/* Admin emails list */}
                <div>
                  <span className="text-xs font-bold text-slate-700 block mb-2">
                    Các email đang có quyền Admin ({settings.adminEmails.length}):
                  </span>
                  <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                    {settings.adminEmails.map((email) => {
                      const isOwner = email.toLowerCase() === 'aidieu0411@gmail.com';
                      return (
                        <div
                          key={email}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-base">🛡️</span>
                            <span className="font-bold text-slate-800">{email}</span>
                            {isOwner && (
                              <span className="text-[10px] font-black px-2 py-0.2 bg-purple-100 text-purple-800 rounded-full">
                                Chủ sở hữu
                              </span>
                            )}
                          </div>
                          {!isOwner && (
                            <button
                              type="button"
                              onClick={() => handleRemoveAdminEmail(email)}
                              className="text-slate-400 hover:text-rose-600 text-xs p-1 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              title="Gỡ quyền Admin"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-black text-slate-700">📌 Quyền hạn của Quản trị viên:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                    <li>Xem bảng điểm, tiến độ và xuất danh sách Excel toàn bộ học viên.</li>
                    <li>Chỉnh sửa và đồng bộ kịch bản câu mẫu cho 63 video bài học.</li>
                    <li>Duyệt bài cảm nhận Facebook và cấp quyền thí sinh Vòng Chung Kết.</li>
                    <li>Thay đổi logo và tên thương hiệu hiển thị trên app.</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* STUDENTS & PROGRESS VIEW */
        <>
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-slate-500">
            <span>{t.totalStudents}</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2 font-['Fredoka',sans-serif]">
            {userRows.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-emerald-700">
            <span>{t.qualifiedStudents}</span>
            <Trophy className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-950 mt-2 font-['Fredoka',sans-serif]">
            {qualifiedList.length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-amber-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-amber-700">
            <span>Starter Học viên</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-100 rounded text-emerald-800">S</span>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2 font-['Fredoka',sans-serif]">
            {userRows.filter((r) => r.user.level === 'STARTER').length}
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border-2 border-sky-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-extrabold text-sky-700">
            <span>Movers / Flyers</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-sky-100 rounded text-sky-800">M/F</span>
          </div>
          <div className="text-2xl font-black text-slate-800 mt-2 font-['Fredoka',sans-serif]">
            {userRows.filter((r) => r.user.level !== 'STARTER').length}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border-2 border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.searchUserPlaceholder}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-rose-400 transition"
            />
          </div>

          {/* Level Filter Tabs */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(['ALL', 'STARTER', 'MOVERS', 'FLYERS'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterLevel(lvl)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterLevel === lvl
                    ? 'bg-rose-500 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {lvl === 'ALL' ? t.allLevels : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Status Filter Bar & Batch Cleanup */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Trạng thái:</span>
            {[
              { id: 'ALL', label: `Tất cả (${userRows.length})` },
              { id: 'ACTIVE', label: `Đang học (${activeCount})` },
              { id: 'WARNING', label: `Sắp hết hạn (${warningCount})` },
              { id: 'EXPIRED', label: `Đã hết hạn (${expiredCount})` },
              { id: 'ADMIN', label: `Admin (${adminUsersCount})` },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer whitespace-nowrap ${
                  filterStatus === st.id
                    ? 'bg-purple-600 text-white shadow-2xs font-black'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {expiredCount > 0 && (
            <button
              type="button"
              onClick={handleBatchCleanupExpired}
              disabled={cleaningExpired}
              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-[11px] font-black transition cursor-pointer flex items-center gap-1 shadow-2xs"
              title="Xóa nhanh tất cả tài khoản học viên đã quá hạn"
            >
              <Trash2 className="w-3 h-3" />
              <span>{cleaningExpired ? 'Đang dọn...' : `Dọn dẹp ${expiredCount} bạn hết hạn`}</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[11px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <th className="py-3 px-4">{t.colStudent}</th>
                <th className="py-3 px-4">{t.colParent} & SĐT</th>
                <th className="py-3 px-4">{t.colLevel}</th>
                <th className="py-3 px-4">Quyền hạn</th>
                <th className="py-3 px-4">Ngày vào & Hạn dùng</th>
                <th className="py-3 px-4">{t.colProgress}</th>
                <th className="py-3 px-4">{t.colWeeks}</th>
                <th className="py-3 px-4">{t.colReflection}</th>
                <th className="py-3 px-4 text-right">{t.colActions}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-bold">
                    Không tìm thấy học viên nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const validity = formatValidityInfo(row.user);
                  const isMainAdmin = row.user.email?.toLowerCase().trim() === 'aidieu0411@gmail.com';
                  const userIsAdmin = row.user.role === 'admin' || isUserAdmin(row.user.email, row.user);

                  return (
                    <tr
                      key={row.user.uid}
                      className={`hover:bg-slate-50/80 transition ${
                        row.isQualified ? 'bg-emerald-50/30' : ''
                      }`}
                    >
                      {/* Student */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center shrink-0">
                            {row.user.student_name.slice(0, 1)}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-800 flex items-center gap-1">
                              <span>{row.user.student_name}</span>
                              {row.isQualified && (
                                <span title="Đủ điều kiện dự thi">🏆</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-normal">
                              {row.user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Parent & Phone */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-700">{row.user.parent_name}</div>
                        <div className="text-[11px] text-slate-500 font-mono">📞 {row.user.phone}</div>
                      </td>

                      {/* Level */}
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                            row.user.level === 'STARTER'
                              ? 'bg-emerald-100 text-emerald-800'
                              : row.user.level === 'MOVERS'
                              ? 'bg-sky-100 text-sky-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {row.user.level}
                        </span>
                      </td>

                      {/* Role Toggle Button */}
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleUserRole(row.user)}
                          disabled={userRoleUpdatingId === row.user.uid || isMainAdmin}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-black border transition cursor-pointer flex items-center gap-1 shadow-2xs ${
                            userIsAdmin
                              ? 'bg-purple-100 text-purple-900 border-purple-300 hover:bg-purple-200'
                              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                          }`}
                          title={isMainAdmin ? 'Chủ sở hữu chính' : 'Bấm để đổi quyền giữa Học viên và Quản trị viên'}
                        >
                          <span>{userIsAdmin ? '👑 Admin' : '👤 Học viên'}</span>
                        </button>
                      </td>

                      {/* Ngày bắt đầu & Hạn dùng */}
                      <td className="py-3 px-4">
                        <div className="space-y-1">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] border shadow-2xs ${validity.badgeClass}`}>
                            {validity.text}
                          </span>
                          <div className="text-[10px] text-slate-600 font-medium flex items-center gap-1.5 whitespace-nowrap">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block shrink-0"></span>
                            <span className="text-slate-400 font-normal">Bắt đầu:</span>
                            <span className="font-bold text-slate-700">{validity.startDateFormatted}</span>
                          </div>
                          <div className={`text-[10px] font-medium flex items-center gap-1.5 whitespace-nowrap ${
                            validity.status === 'expired'
                              ? 'text-rose-600 font-bold'
                              : validity.status === 'warning'
                              ? 'text-amber-700 font-bold'
                              : 'text-slate-600'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block shrink-0 ${
                              validity.status === 'expired'
                                ? 'bg-rose-500'
                                : validity.status === 'warning'
                                ? 'bg-amber-500'
                                : validity.status === 'admin'
                                ? 'bg-purple-500'
                                : 'bg-sky-500'
                            }`}></span>
                            <span className="text-slate-400 font-normal">Hết hạn:</span>
                            <span className="font-bold">{validity.expiresDateFormatted}</span>
                          </div>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800">
                          {row.submissionsCount}/21 ({row.percent}%)
                        </div>
                        <div className="w-24 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              row.percent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${row.percent}%` }}
                          />
                        </div>
                      </td>

                      {/* Week-by-week pill badges */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          {row.weeksStatus.map((w) => (
                            <span
                              key={w.week}
                              title={`Tuần ${w.week}: ${w.count}/3`}
                              className={`w-5 h-5 rounded-md text-[10px] font-black flex items-center justify-center ${
                                w.count === 3
                                  ? 'bg-emerald-500 text-white'
                                  : w.count > 0
                                  ? 'bg-amber-400 text-amber-950'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                            >
                              {w.count}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Reflection Post Column */}
                      <td className="py-3 px-4">
                        {row.reflection ? (
                          <div className="space-y-1">
                            <a
                              href={row.reflection.post_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sky-600 hover:text-sky-800 font-bold flex items-center gap-1 hover:underline truncate max-w-[150px]"
                              title={row.reflection.post_url}
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">Xem bài đăng</span>
                            </a>
                            <span
                              className={`inline-block text-[10px] font-extrabold px-2 py-0.2 rounded-full ${
                                row.reflection.status === 'invalid'
                                  ? 'bg-rose-100 text-rose-800'
                                  : row.reflection.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              {row.reflection.status}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">
                            {t.noPostYet}
                          </span>
                        )}
                      </td>

                      {/* Actions: Review, Extend, Delete */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {row.reflection && (
                            row.reflection.status !== 'invalid' ? (
                              <button
                                onClick={() => row.reflection && handleToggleStatus(row.reflection, 'invalid')}
                                disabled={updatingPostId === row.reflection.id}
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                title="Đánh dấu link không hợp lệ"
                              >
                                {t.markInvalid}
                              </button>
                            ) : (
                              <button
                                onClick={() => row.reflection && handleToggleStatus(row.reflection, 'approved')}
                                disabled={updatingPostId === row.reflection.id}
                                className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                title="Duyệt bài hợp lệ"
                              >
                                Duyệt
                              </button>
                            )
                          )}

                          {/* Quick Extend buttons (+2w, +4w) */}
                          {!userIsAdmin && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleExtendUser(row.user, 2)}
                                disabled={userExtendingId === row.user.uid}
                                className="px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                                title="Gia hạn thêm 2 tuần học cho học viên"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>2w</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExtendUser(row.user, 4)}
                                disabled={userExtendingId === row.user.uid}
                                className="px-1.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 rounded-lg text-[10px] font-bold transition cursor-pointer flex items-center gap-0.5 shadow-2xs"
                                title="Gia hạn thêm 4 tuần (1 tháng) cho học viên"
                              >
                                <Plus className="w-2.5 h-2.5" />
                                <span>4w</span>
                              </button>
                            </div>
                          )}

                          {/* Delete Account button */}
                          {!isMainAdmin && (
                            <button
                              type="button"
                              onClick={() => handleDeleteUser(row.user)}
                              disabled={deletingUserId === row.user.uid}
                              className="p-1 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-300 rounded-lg text-xs transition cursor-pointer"
                              title="Xóa vĩnh viễn tài khoản và toàn bộ bài nộp của học viên này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
};
