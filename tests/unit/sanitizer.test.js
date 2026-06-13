/**
 * @file Unit tests for input sanitizer utilities
 * @module tests/unit/sanitizer
 */

const { escapeHtml, sanitizeInput } = require('../../src/public/js/utils/sanitizer');

describe('Sanitizer Utilities', () => {
  describe('escapeHtml', () => {
    test('should escape angle brackets', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe(
        '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;'
      );
    });

    test('should escape ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    test('should escape single quotes', () => {
      expect(escapeHtml("it's")).toBe('it&#039;s');
    });

    test('should escape double quotes', () => {
      expect(escapeHtml('say "hello"')).toBe('say &quot;hello&quot;');
    });

    test('should return empty string for empty input', () => {
      expect(escapeHtml('')).toBe('');
    });

    test('should handle null/undefined gracefully', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });

    test('should not alter safe strings', () => {
      expect(escapeHtml('Hello World 123')).toBe('Hello World 123');
    });

    test('should handle multiple special characters', () => {
      expect(escapeHtml('<div class="test">&</div>')).toBe(
        '&lt;div class=&quot;test&quot;&gt;&amp;&lt;/div&gt;'
      );
    });
  });

  describe('sanitizeInput', () => {
    test('should strip HTML tags', () => {
      expect(sanitizeInput('<b>bold</b> text')).toBe('bold text');
    });

    test('should trim whitespace', () => {
      expect(sanitizeInput('  hello  ')).toBe('hello');
    });

    test('should limit string length to maxLength', () => {
      const longString = 'a'.repeat(3000);
      const result = sanitizeInput(longString, 2000);
      expect(result.length).toBeLessThanOrEqual(2000);
    });

    test('should use default maxLength of 2000', () => {
      const longString = 'b'.repeat(3000);
      const result = sanitizeInput(longString);
      expect(result.length).toBeLessThanOrEqual(2000);
    });

    test('should handle empty string', () => {
      expect(sanitizeInput('')).toBe('');
    });

    test('should handle null/undefined', () => {
      expect(sanitizeInput(null)).toBe('');
      expect(sanitizeInput(undefined)).toBe('');
    });

    test('should remove script tags and content markers', () => {
      const input = 'hello <script>alert(1)</script> world';
      const result = sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('</script>');
    });
  });
});
