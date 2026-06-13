'use strict';

const { CACHE } = require('../../shared/constants');

/** @type {Map<string, { value: unknown, expiresAt: number }>} In-memory TTL cache store. */
const store = new Map();

/**
 * Builds a deterministic cache key from a prefix and payload object.
 * @param {string} prefix - Namespace prefix (e.g. "journal").
 * @param {object} payload - Serializable payload used for the key.
 * @returns {string} Cache key string.
 */
function getCacheKey(prefix, payload) {
  return `${prefix}:${JSON.stringify(payload)}`;
}

/**
 * Retrieves a cached value when present and not expired.
 * @param {string} key - Cache key.
 * @returns {unknown|null} Cached value or null when missing/expired.
 */
function getFromCache(key) {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.value;
}

/**
 * Stores a value in the cache with a TTL.
 * @param {string} key - Cache key.
 * @param {unknown} value - Value to cache.
 * @param {number} [ttlMs=CACHE.JOURNAL_ANALYSIS_TTL_MS] - Time-to-live in milliseconds.
 * @returns {void}
 */
function setCache(key, value, ttlMs = CACHE.JOURNAL_ANALYSIS_TTL_MS) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
}

/**
 * Clears all entries from the in-memory cache (used in tests).
 * @returns {void}
 */
function clearCache() {
  store.clear();
}

module.exports = { getCacheKey, getFromCache, setCache, clearCache };
