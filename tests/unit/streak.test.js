/**
 * @file Unit tests for shared streak calculation
 * @module tests/unit/streak
 */

const { calculateStreak } = require('../../src/public/js/utils/streak');

describe('calculateStreak', () => {
  test('returns 0 for empty entries', () => {
    expect(calculateStreak([])).toBe(0);
  });

  test('counts consecutive days including today', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const entries = [
      { timestamp: today.toISOString() },
      { timestamp: yesterday.toISOString() },
    ];

    expect(calculateStreak(entries)).toBe(2);
  });

  test('allows streak starting yesterday when today has no entry', () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(12, 0, 0, 0);

    expect(calculateStreak([{ timestamp: yesterday.toISOString() }])).toBe(1);
  });

  test('breaks streak after a gap day', () => {
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const entries = [
      { timestamp: today.toISOString() },
      { timestamp: threeDaysAgo.toISOString() },
    ];

    expect(calculateStreak(entries)).toBe(1);
  });
});
