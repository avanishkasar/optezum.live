/**
 * @file Unit tests for in-memory TTL cache
 * @module tests/unit/cache
 */

const { getCacheKey, getFromCache, setCache, clearCache } = require('../../src/server/utils/cache');

describe('TTL cache', () => {
  beforeEach(() => {
    clearCache();
  });

  test('should store and retrieve values before expiry', () => {
    setCache('key-a', { ok: true }, 5000);
    expect(getFromCache('key-a')).toEqual({ ok: true });
  });

  test('should return null after TTL expires', () => {
    jest.useFakeTimers();
    setCache('key-b', 'value', 1000);
    jest.advanceTimersByTime(1001);
    expect(getFromCache('key-b')).toBeNull();
    jest.useRealTimers();
  });

  test('getCacheKey should produce stable keys for same payload', () => {
    const payload = { entry: 'test', mood: 3 };
    expect(getCacheKey('journal', payload)).toBe(getCacheKey('journal', payload));
  });
});
