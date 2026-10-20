import { Submission, Language, LevelType } from '../types';
import { getTranslation } from '../i18n/translations';

/**
 * Calculate user study streak in days based on submission timestamps
 */
export function calculateStreak(submissions: Submission[]): number {
  if (!submissions || submissions.length === 0) return 0;

  // Extract distinct calendar days (YYYY-MM-DD)
  const uniqueDays = Array.from(
    new Set(
      submissions.map((sub) => {
        const d = new Date(sub.submitted_at);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })
    )
  ).sort().reverse();

  if (uniqueDays.length === 0) return 0;

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  // If latest submission was neither today nor yesterday, streak is broken
  const latestDay = uniqueDays[0];
  if (latestDay !== todayStr && latestDay !== yesterdayStr) {
    return 1; // still has at least 1 day recorded
  }

  let streak = 0;
  let checkDate = new Date(latestDay);

  for (const dayStr of uniqueDays) {
    const expectedStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
    if (dayStr === expectedStr) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export interface FeedbackRuleResult {
  message: string;
  ruleIndex: number;
  highlightIcon: string;
}

/**
 * Determine rule-based personalized feedback following strict priority order
 */
export function evaluateMotivationalFeedback(
  newSubmission: Submission,
  allSubmissionsIncludingNew: Submission[],
  userCreatedAt: string,
  lang: Language = 'vi'
): FeedbackRuleResult {
  const t = getTranslation(lang);
  const totalCount = allSubmissionsIncludingNew.length;

  // Prior submissions excluding the new one
  const priorSubmissions = allSubmissionsIncludingNew.filter(
    (s) => s.id !== newSubmission.id && s.submitted_at !== newSubmission.submitted_at
  );

  // 1. First submission of user
  if (priorSubmissions.length === 0 || totalCount === 1) {
    return {
      message: t.feedback.firstSubmission,
      ruleIndex: 1,
      highlightIcon: '🎉'
    };
  }

  // 2. Streak milestones: 3, 7, 14 continuous sessions
  const currentStreak = calculateStreak(allSubmissionsIncludingNew);
  if ([3, 7, 14].includes(currentStreak)) {
    return {
      message: t.feedback.streakMilestone(currentStreak),
      ruleIndex: 2,
      highlightIcon: '🔥'
    };
  }

  // 3. Completed full week (3rd submission in the same week & level)
  const submissionsInSameWeek = allSubmissionsIncludingNew.filter(
    (s) => s.level === newSubmission.level && s.week === newSubmission.week
  );
  if (submissionsInSameWeek.length === 3) {
    return {
      message: t.feedback.completedFullWeek,
      ruleIndex: 3,
      highlightIcon: '💪'
    };
  }

  // 4. Duration is longer than the duration of the most recent submission of the same level
  const priorSameLevel = priorSubmissions
    .filter((s) => s.level === newSubmission.level)
    .sort((a, b) => new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime());

  if (priorSameLevel.length > 0 && newSubmission.duration > 0) {
    const mostRecentDuration = priorSameLevel[0].duration;
    if (newSubmission.duration > mostRecentDuration) {
      return {
        message: t.feedback.longerDuration,
        ruleIndex: 4,
        highlightIcon: '⭐'
      };
    }
  }

  // 5. Total submissions reaches milestone 5, 10, 15, 20
  if ([5, 10, 15, 20].includes(totalCount)) {
    const remaining = Math.max(0, 21 - totalCount);
    return {
      message: t.feedback.submissionMilestone(totalCount, remaining),
      ruleIndex: 5,
      highlightIcon: '🏆'
    };
  }

  // 6. Submitted later than expected week deadline
  // Pacing: each week expected within (week * 7 days) of joining
  if (userCreatedAt) {
    const joinTime = new Date(userCreatedAt).getTime();
    const submissionTime = new Date(newSubmission.submitted_at).getTime();
    const expectedDeadline = joinTime + newSubmission.week * 7 * 24 * 60 * 60 * 1000;
    if (submissionTime > expectedDeadline) {
      return {
        message: t.feedback.lateSubmission,
        ruleIndex: 6,
        highlightIcon: '❤️'
      };
    }
  }

  // 7. Default
  return {
    message: t.feedback.defaultFeedback,
    ruleIndex: 7,
    highlightIcon: '✨'
  };
}
