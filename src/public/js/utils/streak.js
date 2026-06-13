/**
 * @module streak
 * @description Shared journaling streak calculation for header and dashboard stats.
 */
'use strict';

const STREAK_MAX_LOOKBACK = (typeof window !== 'undefined' && window.APP_CONSTANTS)
  ? window.APP_CONSTANTS.UI?.STREAK_MAX_LOOKBACK_DAYS ?? 365
  : 365;

/**
 * Calculates the current consecutive journaling streak in days.
 * @param {object[]} entries - All journal entries.
 * @returns {number} Streak count in days.
 */
function calculateStreak(entries) {
  if (!entries.length) return 0;

  const sorted = [...entries].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const datesSet = new Set(
    sorted.map((e) => {
      const d = new Date(e.timestamp);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    }),
  );

  const checkDate = new Date(today);
  if (!datesSet.has(checkDate.getTime())) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  let guard = 0;
  while (datesSet.has(checkDate.getTime()) && guard < STREAK_MAX_LOOKBACK) {
    streak++;
    checkDate.setDate(checkDate.getDate() - 1);
    guard++;
  }

  return streak;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { calculateStreak };
}
