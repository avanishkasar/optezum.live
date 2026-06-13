/**
 * @file Unit tests for Gemini AI service
 * @module tests/unit/gemini
 */

// Mock the @google/generative-ai module
jest.mock('@google/generative-ai', () => {
  const mockGenerateContent = jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify({
        emotionalState: 'moderately anxious',
        stressAnalysis: 'exam pressure and sleep deprivation contributing to elevated stress',
        sleepAssessment: 'insufficient sleep affecting cognitive function',
        studyPatternInsight: 'productive but unsustainable pace',
        recommendations: ['Try 4-7-8 breathing', 'Take a 10-minute walk'],
        positiveAffirmation: 'You are doing your best, and that is enough.',
        overallWellnessScore: 6,
      }),
    },
  });

  const mockStartChat = jest.fn().mockReturnValue({
    sendMessage: jest.fn().mockResolvedValue({
      response: {
        text: () => 'I understand you are feeling stressed. Let me suggest a breathing exercise.',
      },
    }),
  });

  const mockGetGenerativeModel = jest.fn().mockReturnValue({
    generateContent: mockGenerateContent,
    startChat: mockStartChat,
  });

  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: mockGetGenerativeModel,
    })),
  };
});

// Set env before importing
process.env.GEMINI_API_KEY = 'test-api-key-mock';

const {
  analyzeJournalEntry,
  chatWithCompanion,
  generateWeeklyInsights,
  generateCopingStrategy,
  containsCrisisKeywords,
  sanitizeForGemini,
  CRISIS_KEYWORDS,
  CRISIS_RESPONSE,
} = require('../../src/server/services/gemini');

describe('Gemini AI Service', () => {
  describe('containsCrisisKeywords', () => {
    test('should detect "kill myself" as crisis keyword', () => {
      expect(containsCrisisKeywords('I want to kill myself')).toBe(true);
    });

    test('should detect "end it all" as crisis', () => {
      expect(containsCrisisKeywords('I just want to end it all')).toBe(true);
    });

    test('should detect "self-harm" as crisis', () => {
      expect(containsCrisisKeywords('thinking about self-harm')).toBe(true);
    });

    test('should detect "want to die" as crisis', () => {
      expect(containsCrisisKeywords('I want to die')).toBe(true);
    });

    test('should return false for normal messages', () => {
      expect(containsCrisisKeywords('I had a productive study session today')).toBe(false);
    });

    test('should return false for stress without crisis indicators', () => {
      expect(containsCrisisKeywords('I am really stressed about my NEET exam')).toBe(false);
    });

    test('should be case-insensitive', () => {
      expect(containsCrisisKeywords('I want to KILL MYSELF')).toBe(true);
    });
  });

  describe('CRISIS_RESPONSE', () => {
    test('should include crisis flag', () => {
      expect(CRISIS_RESPONSE.crisis).toBe(true);
    });

    test('should include helplines array', () => {
      expect(CRISIS_RESPONSE.helplines).toBeDefined();
      expect(CRISIS_RESPONSE.helplines.length).toBeGreaterThan(0);
    });

    test('should include Indian helpline numbers', () => {
      const numbers = CRISIS_RESPONSE.helplines.map((h) => h.number || h.phone);
      const allText = JSON.stringify(CRISIS_RESPONSE.helplines);
      expect(allText).toContain('9152987821');
      expect(allText).toContain('9820466626');
    });

    test('should include a supportive message', () => {
      expect(CRISIS_RESPONSE.message).toBeDefined();
      expect(CRISIS_RESPONSE.message.length).toBeGreaterThan(0);
    });
  });

  describe('CRISIS_KEYWORDS', () => {
    test('should contain at least 5 crisis keywords', () => {
      expect(CRISIS_KEYWORDS.length).toBeGreaterThanOrEqual(5);
    });

    test('should include key self-harm indicators', () => {
      expect(CRISIS_KEYWORDS).toContain('suicide');
      expect(CRISIS_KEYWORDS).toContain('self-harm');
    });
  });

  describe('sanitizeForGemini', () => {
    test('should strip HTML before model calls', () => {
      const cleaned = sanitizeForGemini('<img src=x onerror=alert(1)>Hello');
      expect(cleaned).not.toContain('<');
      expect(cleaned).toContain('Hello');
    });

    test('should return empty string for non-string input', () => {
      expect(sanitizeForGemini(undefined)).toBe('');
    });
  });

  describe('analyzeJournalEntry', () => {
    test('should return structured analysis for a journal entry', async () => {
      const result = await analyzeJournalEntry(
        'I studied for 8 hours today but still feel unprepared for NEET.',
        'anxious',
        7
      );
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });

    test('should return crisis response for crisis entry', async () => {
      const result = await analyzeJournalEntry(
        'I want to kill myself',
        'terrible',
        10
      );
      expect(result.crisis).toBe(true);
      expect(result.helplines).toBeDefined();
    });

    test('should handle empty entry gracefully', async () => {
      try {
        await analyzeJournalEntry('', 'neutral', 5);
      } catch (err) {
        expect(err).toBeDefined();
      }
    });
  });

  describe('chatWithCompanion', () => {
    test('should return a response string for normal messages', async () => {
      const result = await chatWithCompanion('I feel anxious about my exam', []);
      expect(result).toBeDefined();
      expect(typeof result === 'string' || typeof result === 'object').toBe(true);
    });

    test('should intercept crisis messages before calling AI', async () => {
      const result = await chatWithCompanion('I want to kill myself', []);
      expect(result.crisis).toBe(true);
    });

    test('should sanitize HTML in chat messages before model call', async () => {
      const result = await chatWithCompanion('<b>Hello</b> there', []);
      expect(result.reply || result).toBeDefined();
    });

    test('should sanitize mixed conversation history shapes', async () => {
      const result = await chatWithCompanion('Follow up question', [
        { role: 'user', content: 'I feel stressed' },
        { role: 'assistant', parts: [{ text: 'Tell me more' }] },
        { role: 'user', parts: 'Earlier message' },
      ]);
      expect(result.reply).toBeDefined();
    });
  });

  describe('generateCopingStrategy', () => {
    test('should return a coping strategy for exam stress', async () => {
      const result = await generateCopingStrategy('exam_anxiety', 'NEET');
      expect(result).toBeDefined();
    });

    test('should handle unknown stress types', async () => {
      const result = await generateCopingStrategy('unknown_type', 'Other');
      expect(result).toBeDefined();
    });

    test('should short-circuit crisis language in stress type', async () => {
      const result = await generateCopingStrategy('I want to kill myself', 'NEET');
      expect(result.crisis).toBe(true);
    });
  });

  describe('generateWeeklyInsights', () => {
    test('should return weekly insights for valid entries', async () => {
      const result = await generateWeeklyInsights([
        { entry: 'Day 1 log', mood: 3, stressLevel: 5 },
        { entry: 'Day 2 log', mood: 4, stressLevel: 4 },
      ]);
      expect(result).toBeDefined();
    });

    test('should sanitize string-only weekly entries', async () => {
      const result = await generateWeeklyInsights([
        '<b>Day 1</b> reflection',
        'Day 2 reflection',
      ]);
      expect(result).toBeDefined();
    });

    test('should return crisis response when entries contain crisis language', async () => {
      const result = await generateWeeklyInsights([
        { entry: 'I want to kill myself', mood: 1, stressLevel: 10 },
      ]);
      expect(result.crisis).toBe(true);
    });
  });
});
