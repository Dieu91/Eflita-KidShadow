export type LevelType = 'STARTER' | 'MOVERS' | 'FLYERS';

export type Language = 'vi' | 'en';

export interface UserProfile {
  uid: string;
  student_name: string;
  parent_name: string;
  phone: string;
  level: LevelType;
  email: string;
  photo_url?: string;
  role?: 'admin' | 'user';
  first_login_at?: string;
  expires_at?: string;
  status?: 'active' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface SystemSettings {
  id?: string;
  validityWeeks: number; // e.g. 8, 10, 12, 0 (unlimited)
  expirationMode: 'lock' | 'delete'; // 'lock' or 'delete'
  adminEmails: string[];
  updated_at?: string;
}

export interface Lesson {
  id: string;
  level: LevelType;
  week: number;
  order: number;
  topic: string;
  embed_url: string;
  script?: string;
}

export interface Submission {
  id?: string;
  user_id: string;
  lesson_id: string;
  drive_link: string;
  duration: number; // in seconds
  submitted_at: string; // ISO string
  level: LevelType;
  week: number;
  order: number;
  lesson_topic?: string;
  pronunciation_feedback?: string;
}

export interface ReflectionPost {
  id?: string;
  user_id: string;
  post_url: string;
  submitted_at: string;
  status: 'pending' | 'approved' | 'invalid';
}

export interface ContestRegistration {
  id?: string;
  user_id: string;
  registered_at: string;
  student_name?: string;
  parent_name?: string;
  phone?: string;
  level?: LevelType;
}

export interface WeekProgress {
  week: number;
  total: number;
  completed: number;
  isUnlocked: boolean;
}

export interface BrandConfig {
  brandName: string;
  brandSubtitle?: string;
  logoUrl?: string; // Image URL or base64 data URI
  websiteUrl?: string;
}
