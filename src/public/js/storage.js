/**
 * @module storage
 * @description LocalStorage wrapper for Optezum data persistence.
 * Provides CRUD operations for journal entries and app settings.
 */

const ENTRIES_KEY = 'optezum_entries';
const SETTINGS_KEY = 'optezum_settings';

/** @returns {number} Default recent-entries lookback in days. */
function getDefaultRecentDays() {
  if (typeof window !== 'undefined' && window.APP_CONSTANTS) {
    return window.APP_CONSTANTS.UI.DEFAULT_RECENT_ENTRIES_DAYS;
  }
  return 7;
}

/** @returns {{ examType: string, examDate: string, pomodoroWork: number, pomodoroBreak: number }} Default settings. */
function getDefaultSettings() {
  const ui = (typeof window !== 'undefined' && window.APP_CONSTANTS)
    ? window.APP_CONSTANTS.UI
    : null;
  return {
    examType: 'NEET',
    examDate: '',
    pomodoroWork: ui?.POMODORO_WORK_MINUTES ?? 25,
    pomodoroBreak: ui?.POMODORO_BREAK_MINUTES ?? 5,
  };
}

/**
 * Saves a journal entry to localStorage with an auto-generated ID and timestamp.
 * @param {object} entry - The journal entry data (mood, stress, sleepHours, etc.).
 * @returns {object|null} The saved entry with id and timestamp, or null on failure.
 */
function saveEntry(entry) {
  try {
    if (!entry || typeof entry !== 'object') {
      return null;
    }
    const entries = getEntries();
    const newEntry = {
      ...entry,
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
      timestamp: new Date().toISOString(),
    };
    entries.unshift(newEntry);
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(entries));
    return newEntry;
  } catch {
    return null;
  }
}

/**
 * Retrieves all journal entries from localStorage.
 * @returns {object[]} Array of journal entry objects, newest first.
 */
function getEntries() {
  try {
    const raw = localStorage.getItem(ENTRIES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Retrieves journal entries from the last N days.
 * @param {number} [days] - Number of days to look back (defaults to UI constant).
 * @returns {object[]} Array of entries within the specified timeframe.
 */
function getRecentEntries(days) {
  try {
    const lookback = (typeof days === 'number' && days >= 1) ? days : getDefaultRecentDays();
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - lookback);
    const entries = getEntries();
    return entries.filter((e) => new Date(e.timestamp) >= cutoff);
  } catch {
    return [];
  }
}

/**
 * Deletes a journal entry by its unique ID.
 * @param {string} id - The unique identifier of the entry to delete.
 * @returns {boolean} True if the entry was found and deleted, false otherwise.
 */
function deleteEntry(id) {
  try {
    if (!id || typeof id !== 'string') {
      return false;
    }
    const entries = getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    if (filtered.length === entries.length) return false;
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
    return true;
  } catch {
    return false;
  }
}

/**
 * Clears all Optezum data from localStorage (entries + settings).
 * @returns {boolean} True if data was cleared successfully.
 */
function clearAllData() {
  try {
    localStorage.removeItem(ENTRIES_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    return true;
  } catch {
    return false;
  }
}

/**
 * Retrieves app settings from localStorage.
 * @returns {object} The settings object, or defaults if none saved.
 */
function getSettings() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      return getDefaultSettings();
    }
    return JSON.parse(raw);
  } catch {
    return getDefaultSettings();
  }
}

/**
 * Saves app settings to localStorage.
 * @param {object} settings - The settings object to persist.
 * @returns {boolean} True if settings were saved successfully.
 */
function saveSettings(settings) {
  try {
    if (!settings || typeof settings !== 'object') {
      return false;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch {
    return false;
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { saveEntry, getEntries, getRecentEntries, deleteEntry, clearAllData, getSettings, saveSettings };
}
