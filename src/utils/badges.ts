import { Submission, Language } from '../types';
import { calculateStreak } from './feedbackRules';

export interface Badge {
  id: string;
  icon: string;
  titleKey: string;
  descKey: string;
  isUnlocked: boolean;
  unlockedAt?: string;
  progress?: {
    current: number;
    target: number;
  };
  colorClasses: {
    bg: string;
    border: string;
    text: string;
    glow: string;
  };
}

export function evaluateBadges(
  submissions: Submission[],
  streak: number
): Badge[] {
  // 1. Early Bird: Submitted before 9:00 AM
  const earlyBirdSub = submissions.find((sub) => {
    const d = new Date(sub.submitted_at);
    return d.getHours() < 9;
  });

  // 2. Weekly Star: Completed >= 3 submissions in any single week
  const weekCounts: { [week: number]: number } = {};
  submissions.forEach((s) => {
    weekCounts[s.week] = (weekCounts[s.week] || 0) + 1;
  });
  const maxInAWeek = Object.values(weekCounts).reduce((max, count) => Math.max(max, count), 0);
  const isWeeklyStar = maxInAWeek >= 3;

  // 3. Streak Master: Streak >= 7 days
  const isStreakMaster = streak >= 7;

  // 4. First Step: At least 1 submission
  const isFirstStep = submissions.length >= 1;

  // 5. Night Owl: Submitted after 8:00 PM (hour >= 20)
  const nightOwlSub = submissions.find((sub) => {
    const d = new Date(sub.submitted_at);
    return d.getHours() >= 20;
  });

  // 6. Fluent Speaker: Video duration >= 45 seconds
  const isFluentSpeaker = submissions.some((sub) => sub.duration >= 45);

  // 7. Halfway Hero: Total >= 10 submissions
  const uniqueLessonsCount = new Set(submissions.map((s) => s.lesson_id)).size;
  const isHalfwayHero = uniqueLessonsCount >= 10;

  // 8. Shadowing Champion: 21/21 submissions
  const isChampion = uniqueLessonsCount >= 21;

  return [
    {
      id: 'early_bird',
      icon: '🌅',
      titleKey: 'earlyBirdTitle',
      descKey: 'earlyBirdDesc',
      isUnlocked: !!earlyBirdSub,
      unlockedAt: earlyBirdSub?.submitted_at,
      colorClasses: {
        bg: 'from-amber-100 to-yellow-100',
        border: 'border-amber-300',
        text: 'text-amber-900',
        glow: 'shadow-amber-200/50',
      },
    },
    {
      id: 'weekly_star',
      icon: '🌟',
      titleKey: 'weeklyStarTitle',
      descKey: 'weeklyStarDesc',
      isUnlocked: isWeeklyStar,
      progress: {
        current: Math.min(3, maxInAWeek),
        target: 3,
      },
      colorClasses: {
        bg: 'from-yellow-100 to-amber-200',
        border: 'border-yellow-400',
        text: 'text-yellow-950',
        glow: 'shadow-yellow-300/60',
      },
    },
    {
      id: 'streak_master',
      icon: '🔥',
      titleKey: 'streakMasterTitle',
      descKey: 'streakMasterDesc',
      isUnlocked: isStreakMaster,
      progress: {
        current: Math.min(7, streak),
        target: 7,
      },
      colorClasses: {
        bg: 'from-orange-100 to-rose-100',
        border: 'border-orange-400',
        text: 'text-orange-950',
        glow: 'shadow-orange-300/50',
      },
    },
    {
      id: 'first_step',
      icon: '🚀',
      titleKey: 'firstStepTitle',
      descKey: 'firstStepDesc',
      isUnlocked: isFirstStep,
      unlockedAt: submissions.length > 0 ? submissions[submissions.length - 1].submitted_at : undefined,
      colorClasses: {
        bg: 'from-blue-100 to-sky-100',
        border: 'border-sky-300',
        text: 'text-sky-950',
        glow: 'shadow-sky-200/50',
      },
    },
    {
      id: 'night_owl',
      icon: '🌙',
      titleKey: 'nightOwlTitle',
      descKey: 'nightOwlDesc',
      isUnlocked: !!nightOwlSub,
      unlockedAt: nightOwlSub?.submitted_at,
      colorClasses: {
        bg: 'from-indigo-100 to-purple-100',
        border: 'border-indigo-300',
        text: 'text-indigo-950',
        glow: 'shadow-indigo-200/50',
      },
    },
    {
      id: 'fluent_speaker',
      icon: '🎙️',
      titleKey: 'fluentSpeakerTitle',
      descKey: 'fluentSpeakerDesc',
      isUnlocked: isFluentSpeaker,
      colorClasses: {
        bg: 'from-teal-100 to-emerald-100',
        border: 'border-emerald-300',
        text: 'text-emerald-950',
        glow: 'shadow-emerald-200/50',
      },
    },
    {
      id: 'halfway_hero',
      icon: '🛡️',
      titleKey: 'halfwayHeroTitle',
      descKey: 'halfwayHeroDesc',
      isUnlocked: isHalfwayHero,
      progress: {
        current: Math.min(10, uniqueLessonsCount),
        target: 10,
      },
      colorClasses: {
        bg: 'from-violet-100 to-purple-200',
        border: 'border-purple-300',
        text: 'text-purple-950',
        glow: 'shadow-purple-200/50',
      },
    },
    {
      id: 'champion',
      icon: '🏆',
      titleKey: 'championBadgeTitle',
      descKey: 'championBadgeDesc',
      isUnlocked: isChampion,
      progress: {
        current: Math.min(21, uniqueLessonsCount),
        target: 21,
      },
      colorClasses: {
        bg: 'from-amber-200 via-yellow-300 to-amber-300',
        border: 'border-yellow-500',
        text: 'text-yellow-950',
        glow: 'shadow-yellow-400/60',
      },
    },
  ];
}
