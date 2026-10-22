// Chạy mỗi ngày bởi GitHub Actions: đánh dấu học viên hết hạn và tạo báo cáo (không chứa thông tin cá nhân).
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'node:fs';

const DRY_RUN = process.env.DRY_RUN === 'true';
const DB_ID = process.env.FIRESTORE_DATABASE_ID || 'ai-studio-6f94b3ef-f7bb-4be7-b241-17da1bb830b6';
const PRIMARY_ADMINS = ['aidieu0411@gmail.com'];
const DAY = 86400000;

if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('Thiếu FIREBASE_SERVICE_ACCOUNT (secret trên GitHub).');
  process.exit(1);
}

const app = initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });
const db = getFirestore(app, DB_ID);

const settingsSnap = await db.doc('system_settings/config').get();
const settings = settingsSnap.exists ? settingsSnap.data() : {};
const weeks = settings.validityWeeks ?? 8;
if (weeks === 0) {
  console.log('Khóa học đang để "không giới hạn" - không có gì để kiểm tra.');
  process.exit(0);
}

const adminEmails = new Set(
  [...PRIMARY_ADMINS, ...(Array.isArray(settings.adminEmails) ? settings.adminEmails : [])]
    .map((e) => String(e).toLowerCase().trim())
);

const now = Date.now();
const usersSnap = await db.collection('users').get();
let checked = 0;
let newlyExpired = 0;
let totalExpired = 0;
const reminders = { 7: 0, 3: 0, 1: 0 };

for (const doc of usersSnap.docs) {
  const u = doc.data();
  const email = String(u.email || '').toLowerCase().trim();
  if (u.role === 'admin' || adminEmails.has(email) || email.endsWith('@eflita.com')) continue;
  checked++;

  const start = new Date(u.first_login_at || u.created_at || doc.createTime.toDate().toISOString());
  const standard = new Date(start.getTime() + weeks * 7 * DAY);
  let expires = u.expires_at ? new Date(u.expires_at) : standard;
  if (isNaN(expires.getTime()) || (expires.getTime() - start.getTime()) / DAY > 365) expires = standard;

  const daysLeft = Math.ceil((expires.getTime() - now) / DAY);

  if (daysLeft <= 0) {
    totalExpired++;
    if (u.status !== 'expired') {
      newlyExpired++;
      if (!DRY_RUN) {
        await doc.ref.update({ status: 'expired', updated_at: new Date().toISOString() });
      }
    }
  } else if (daysLeft === 7 || daysLeft === 3 || daysLeft === 1) {
    reminders[daysLeft]++;
  }
}

console.log(`Đã kiểm tra ${checked} học viên. Hết hạn: ${totalExpired} (mới đánh dấu: ${newlyExpired}).` +
  ` Còn 7 ngày: ${reminders[7]}, 3 ngày: ${reminders[3]}, 1 ngày: ${reminders[1]}.${DRY_RUN ? ' [CHẠY THỬ - không ghi dữ liệu]' : ''}`);

const hasReport = newlyExpired > 0 || reminders[7] + reminders[3] + reminders[1] > 0;
if (hasReport && !DRY_RUN) {
  const today = new Date().toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
  const body = [
    `Báo cáo hạn học viên KidShadow - ${today}`,
    '',
    `- Mới hết hạn hôm nay: ${newlyExpired}`,
    `- Còn 7 ngày: ${reminders[7]}`,
    `- Còn 3 ngày: ${reminders[3]}`,
    `- Còn 1 ngày: ${reminders[1]}`,
    '',
    'Mở trang Admin của app, vào các tab "Sắp hết hạn" / "Đã hết hạn" để xem tên học viên và gia hạn nếu cần.',
    '(Báo cáo này cố tình không ghi tên hay thông tin liên hệ vì kho mã đang công khai.)'
  ].join('\n');
  fs.writeFileSync('report.md', body);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'has_report=true\n');
}
