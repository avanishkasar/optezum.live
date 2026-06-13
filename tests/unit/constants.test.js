/**
 * @file Unit tests for shared application constants
 * @module tests/unit/constants
 */

const constants = require('../../src/shared/constants');

describe('Shared Constants', () => {
  test('should export rate limit configuration', () => {
    expect(constants.RATE_LIMIT.ANALYZE_MAX).toBeLessThan(constants.RATE_LIMIT.GENERAL_MAX);
    expect(constants.RATE_LIMIT.CHAT_MAX).toBeLessThan(constants.RATE_LIMIT.GENERAL_MAX);
  });

  test('should export validation bounds', () => {
    expect(constants.VALIDATION.MAX_MOOD).toBe(5);
    expect(constants.VALIDATION.MAX_STRESS).toBe(10);
  });

  test('should export crisis helplines with Indian numbers', () => {
    expect(constants.CRISIS_HELPLINES.length).toBeGreaterThanOrEqual(3);
    expect(constants.CRISIS_HELPLINES[0].number).toMatch(/\d/);
  });

  test('should default server port to 3000', () => {
    expect(constants.SERVER.DEFAULT_PORT).toBe(3000);
  });

  test('should include all supported exam types', () => {
    expect(constants.EXAM_TYPES).toEqual(expect.arrayContaining(['NEET', 'JEE', 'UPSC']));
  });

  test('should export UI display constants', () => {
    expect(constants.UI.CHART_WIDTH).toBeGreaterThan(0);
    expect(constants.UI.STREAK_MAX_LOOKBACK_DAYS).toBe(365);
    expect(constants.UI.LUCIDE_DEBOUNCE_MS).toBeGreaterThan(0);
    expect(constants.UI.CHART_RANGE_SHORT_DAYS).toBe(7);
    expect(constants.UI.CHART_RANGE_LONG_DAYS).toBe(30);
  });

  test('should export cache TTL constants', () => {
    expect(constants.CACHE.JOURNAL_ANALYSIS_TTL_MS).toBeGreaterThan(0);
  });
});
