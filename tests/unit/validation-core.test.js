/**
 * @file Unit tests for shared validation-core module
 * @module tests/unit/validation-core
 */

const {
  sanitizeString,
  cleanInput,
  validateJournalForm,
  validateChatMessage,
  validateWeeklyEntries,
  validateCopingRequest,
  validateChatHistory,
  formatValidationError,
} = require('../../src/public/js/utils/validation-core');

describe('validation-core', () => {
  describe('sanitizeString', () => {
    test('should strip HTML tags', () => {
      expect(sanitizeString('<script>alert(1)</script>hello')).toBe('alert(1)hello');
    });

    test('should return empty string for non-string input', () => {
      expect(sanitizeString(null)).toBe('');
    });
  });

  describe('cleanInput', () => {
    test('should strip tags and truncate long input', () => {
      const cleaned = cleanInput(`<b>${'x'.repeat(3000)}</b>`, 100);
      expect(cleaned.length).toBeLessThanOrEqual(100);
      expect(cleaned).not.toContain('<');
    });
  });

  describe('validateJournalForm', () => {
    test('should reject missing mood', () => {
      const result = validateJournalForm({ entry: 'Valid entry text', stressLevel: 5 });
      expect(result.valid).toBe(false);
    });

    test('should allow string mood for API mode', () => {
      const result = validateJournalForm(
        { entry: 'Valid entry', mood: 'anxious', stressLevel: 5 },
        { minEntryLength: 1, allowStringMood: true, requireStressLevel: true },
      );
      expect(result.valid).toBe(true);
    });

    test('should reject invalid mood type', () => {
      const result = validateJournalForm({ entry: 'Valid entry text', mood: {}, stressLevel: 5 });
      expect(result.valid).toBe(false);
    });

    test('should reject string mood when not allowed', () => {
      const result = validateJournalForm({ entry: 'Valid entry text', mood: 'happy', stressLevel: 5 });
      expect(result.valid).toBe(false);
    });

    test('should validate optional stress when not required', () => {
      const result = validateJournalForm(
        { entry: 'Valid entry text', mood: 4 },
        { requireStressLevel: false },
      );
      expect(result.valid).toBe(true);
    });
  });

  describe('validateChatMessage', () => {
    test('should reject script-heavy messages over limit', () => {
      const result = validateChatMessage('a'.repeat(5001));
      expect(result.valid).toBe(false);
    });
  });

  describe('validateWeeklyEntries', () => {
    test('should reject empty arrays', () => {
      expect(validateWeeklyEntries([]).valid).toBe(false);
    });
  });

  describe('validateCopingRequest', () => {
    test('should accept type alias', () => {
      expect(validateCopingRequest({ type: 'exam_anxiety' }).valid).toBe(true);
    });
  });

  describe('validateChatHistory', () => {
    test('should reject non-array history', () => {
      expect(validateChatHistory('bad').valid).toBe(false);
    });

    test('should reject history items without role', () => {
      expect(validateChatHistory([{}]).valid).toBe(false);
    });
  });

  describe('formatValidationError', () => {
    test('should handle empty formatValidationError list', () => {
      expect(formatValidationError([])).toBe('Validation failed.');
    });
  });
});
