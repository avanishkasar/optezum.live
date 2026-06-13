/**
 * @module storage
 * @description LocalStorage wrapper for Optezum data persistence.
 * Provides CRUD operations for journal entries and app settings.
 */

const ENTRIES_KEY = 'optezum_entries';
const SETTINGS_KEY = 'optezum_settings';

/**
 * Saves a journal entry to localStorage with an auto-generated ID and timestamp.
 * @param {object} entry - The journal entry data (mood, stress, sleepHours, etc.).
 * @returns {object|null} The saved entry with id and timestamp, or null on failure.
 */
function saveEntry(entry) {
  try {
    if (!entry || typeof entry !== 'object') {
      console.error('[Storage] Invalid entry data.');
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
  } catch (err) {
    console.error('[Storage] Failed to save entry:', err);
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
  } catch (err) {
    console.error('[Storage] Failed to read entries:', err);
    return [];
  }
}

/**
 * Retrieves journal entries from the last N days.
 * @param {number} days - Number of days to look back.
 * @returns {object[]} Array of entries within the specified timeframe.
 */
function getRecentEntries(days) {
  try {
    if (typeof days !== 'number' || days < 1) {
      console.error('[Storage] Invalid days parameter.');
      return [];
    }
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const entries = getEntries();
    return entries.filter((e) => new Date(e.timestamp) >= cutoff);
  } catch (err) {
    console.error('[Storage] Failed to get recent entries:', err);
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
      console.error('[Storage] Invalid entry ID.');
      return false;
    }
    const entries = getEntries();
    const filtered = entries.filter((e) => e.id !== id);
    if (filtered.length === entries.length) return false;
    localStorage.setItem(ENTRIES_KEY, JSON.stringify(filtered));
    return true;
  } catch (err) {
    console.error('[Storage] Failed to delete entry:', err);
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
  } catch (err) {
    console.error('[Storage] Failed to clear data:', err);
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
      return {
        examType: 'NEET',
        examDate: '',
        pomodoroWork: 25,
        pomodoroBreak: 5,
      };
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('[Storage] Failed to read settings:', err);
    return { examType: 'NEET', examDate: '', pomodoroWork: 25, pomodoroBreak: 5 };
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
      console.error('[Storage] Invalid settings data.');
      return false;
    }
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    return true;
  } catch (err) {
    console.error('[Storage] Failed to save settings:', err);
    return false;
  }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { saveEntry, getEntries, getRecentEntries, deleteEntry, clearAllData, getSettings, saveSettings };
}
