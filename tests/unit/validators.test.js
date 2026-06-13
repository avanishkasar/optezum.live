/**
 * @file Unit tests for input validators
 * @module tests/unit/validators
 */

const { validateJournalForm, validateChatMessage } = require('../../src/public/js/utils/validators');

describe('Input Validators', () => {
  describe('validateJournalForm', () => {
    const validEntry = {
      entry: 'Today was a productive study day for NEET preparation.',
      mood: 4,
      stressLevel: 5,
      sleepHours: 7,
      studyHours: 6,
      examType: 'NEET',
    };

    test('should pass validation for complete valid entry', () => {
      const result = validateJournalForm(validEntry);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail when journal entry is empty', () => {
      const result = validateJournalForm({ ...validEntry, entry: '' });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some((e) => e.field === 'entry')).toBe(true);
    });

    test('should fail when mood is out of range', () => {
      const result = validateJournalForm({ ...validEntry, mood: 6 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'mood')).toBe(true);
    });

    test('should fail when mood is zero', () => {
      const result = validateJournalForm({ ...validEntry, mood: 0 });
      expect(result.valid).toBe(false);
    });

    test('should fail when stress level exceeds 10', () => {
      const result = validateJournalForm({ ...validEntry, stressLevel: 11 });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.field === 'stressLevel')).toBe(true);
    });

    test('should fail when sleep hours are negative', () => {
      const result = validateJournalForm({ ...validEntry, sleepHours: -1 });
      expect(result.valid).toBe(false);
    });

    test('should fail when sleep hours exceed 24', () => {
      const result = validateJournalForm({ ...validEntry, sleepHours: 25 });
      expect(result.valid).toBe(false);
    });

    test('should fail when study hours are negative', () => {
      const result = validateJournalForm({ ...validEntry, studyHours: -2 });
      expect(result.valid).toBe(false);
    });

    test('should fail when entry exceeds max length', () => {
      const result = validateJournalForm({
        ...validEntry,
        entry: 'x'.repeat(5001),
      });
      expect(result.valid).toBe(false);
    });

    test('should collect multiple errors', () => {
      const result = validateJournalForm({
        entry: '',
        mood: 0,
        stressLevel: 15,
        sleepHours: -1,
        studyHours: -1,
        examType: '',
      });
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(3);
    });

    test('should accept boundary values', () => {
      const result = validateJournalForm({
        ...validEntry,
        mood: 1,
        stressLevel: 1,
        sleepHours: 0,
        studyHours: 0,
      });
      expect(result.valid).toBe(true);
    });
  });

  describe('validateChatMessage', () => {
    test('should pass for a normal message', () => {
      const result = validateChatMessage('How can I manage exam stress?');
      expect(result.valid).toBe(true);
    });

    test('should fail for empty message', () => {
      const result = validateChatMessage('');
      expect(result.valid).toBe(false);
    });

    test('should fail for whitespace-only message', () => {
      const result = validateChatMessage('   ');
      expect(result.valid).toBe(false);
    });

    test('should fail for null message', () => {
      const result = validateChatMessage(null);
      expect(result.valid).toBe(false);
    });

    test('should fail for excessively long message', () => {
      const result = validateChatMessage('a'.repeat(5001));
      expect(result.valid).toBe(false);
    });

    test('should pass for message at boundary length', () => {
      const result = validateChatMessage('a'.repeat(5000));
      expect(result.valid).toBe(true);
    });
  });
});
