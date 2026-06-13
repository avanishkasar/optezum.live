/**
 * @file Unit tests for Gemini service without API key configured
 * @module tests/unit/gemini-no-key
 */

describe('Gemini service without API key', () => {
  beforeEach(() => {
    jest.resetModules();
    delete process.env.GEMINI_API_KEY;
  });

  test('analyzeJournalEntry should throw when API key is missing', async () => {
    const { analyzeJournalEntry } = require('../../src/server/services/gemini');
    await expect(analyzeJournalEntry('Normal journal entry text', 3, 5)).rejects.toThrow(/Gemini API key/);
  });

  test('generateCopingStrategy should throw when API key is missing', async () => {
    const { generateCopingStrategy } = require('../../src/server/services/gemini');
    await expect(generateCopingStrategy('exam_anxiety', 'NEET')).rejects.toThrow(/Gemini API key/);
  });
});
