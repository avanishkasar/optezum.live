/**
 * @file Unit tests for localStorage storage wrapper
 * @module tests/unit/storage
 */

// Mock localStorage for Node test environment
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn((key) => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn((key) => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn((i) => Object.keys(store)[i] || null),
  };
})();

Object.defineProperty(global, 'localStorage', { value: localStorageMock });

const { saveEntry, getEntries, getRecentEntries, deleteEntry, clearAllData, getSettings, saveSettings } = require('../../src/public/js/storage');

describe('Storage Wrapper', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('saveEntry', () => {
    test('should save an entry to localStorage', () => {
      const entry = {
        entry: 'Test journal entry',
        mood: 4,
        stressLevel: 3,
        sleepHours: 7,
        studyHours: 5,
        examType: 'JEE',
      };
      const saved = saveEntry(entry);
      expect(saved).toBeDefined();
      expect(saved.id).toBeDefined();
      expect(saved.timestamp).toBeDefined();
      expect(localStorage.setItem).toHaveBeenCalled();
    });

    test('should generate unique IDs for each entry', () => {
      const entry1 = saveEntry({ entry: 'Entry 1', mood: 3, stressLevel: 5 });
      const entry2 = saveEntry({ entry: 'Entry 2', mood: 4, stressLevel: 2 });
      expect(entry1.id).not.toBe(entry2.id);
    });
  });

  describe('getEntries', () => {
    test('should return empty array when no entries exist', () => {
      const entries = getEntries();
      expect(Array.isArray(entries)).toBe(true);
      expect(entries).toHaveLength(0);
    });

    test('should return saved entries', () => {
      saveEntry({ entry: 'First', mood: 3, stressLevel: 5 });
      saveEntry({ entry: 'Second', mood: 4, stressLevel: 3 });
      const entries = getEntries();
      expect(entries.length).toBe(2);
    });
  });

  describe('getRecentEntries', () => {
    test('should return entries from last N days', () => {
      const entry = saveEntry({ entry: 'Today entry', mood: 4, stressLevel: 3 });
      const recent = getRecentEntries(7);
      expect(recent.length).toBeGreaterThanOrEqual(1);
    });

    test('should default to 7 days', () => {
      saveEntry({ entry: 'Recent entry', mood: 3, stressLevel: 5 });
      const recent = getRecentEntries();
      expect(Array.isArray(recent)).toBe(true);
    });
  });

  describe('deleteEntry', () => {
    test('should remove an entry by ID', () => {
      const saved = saveEntry({ entry: 'To delete', mood: 2, stressLevel: 8 });
      deleteEntry(saved.id);
      const entries = getEntries();
      expect(entries.find((e) => e.id === saved.id)).toBeUndefined();
    });

    test('should not throw when deleting non-existent entry', () => {
      expect(() => deleteEntry('non-existent-id')).not.toThrow();
    });
  });

  describe('clearAllData', () => {
    test('should remove all entries', () => {
      saveEntry({ entry: 'Entry A', mood: 3, stressLevel: 4 });
      saveEntry({ entry: 'Entry B', mood: 5, stressLevel: 2 });
      clearAllData();
      const entries = getEntries();
      expect(entries).toHaveLength(0);
    });
  });

  describe('Settings', () => {
    test('should save and retrieve settings', () => {
      const settings = { examType: 'NEET', examDate: '2025-05-04' };
      saveSettings(settings);
      const retrieved = getSettings();
      expect(retrieved.examType).toBe('NEET');
    });

    test('should return default settings when none saved', () => {
      const settings = getSettings();
      expect(settings).toBeDefined();
      expect(typeof settings).toBe('object');
    });
  });
});
