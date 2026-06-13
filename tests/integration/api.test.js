/**
 * @file Integration tests for Express API endpoints
 * @module tests/integration/api
 */

// Mock Gemini service before requiring app
jest.mock('../../src/server/services/gemini', () => ({
  analyzeJournalEntry: jest.fn().mockResolvedValue({
    mood_score: 6,
    stress_triggers: ['exam pressure'],
    emotional_patterns: ['pre-exam anxiety'],
    coping_suggestions: ['Deep breathing', 'Short walks'],
    affirmation: 'You are capable and resilient.',
  }),
  chatWithCompanion: jest.fn().mockResolvedValue(
    'I hear you. Exam stress is very common. Let me suggest a technique: try the 4-7-8 breathing exercise.'
  ),
  generateWeeklyInsights: jest.fn().mockResolvedValue({
    overall_trend: 'improving',
    key_patterns: ['stress peaks on weekdays'],
    recommendations: ['Increase sleep duration'],
  }),
  generateCopingStrategy: jest.fn().mockResolvedValue({
    strategy: 'Progressive Muscle Relaxation',
    steps: ['Find a quiet place', 'Tense each muscle group', 'Release slowly'],
    duration: '10 minutes',
  }),
  detectCrisis: jest.fn().mockReturnValue(null),
}));

process.env.GEMINI_API_KEY = 'test-key';
process.env.NODE_ENV = 'test';

const request = require('supertest');
const { app } = require('../../src/server/server');

describe('API Endpoints', () => {
  describe('GET /api/health', () => {
    test('should return 200 with status ok', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /health', () => {
    test('should return 200 with status ok at root health endpoint', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('POST /api/analyze-journal', () => {
    const validBody = {
      entry: 'I studied hard today but feel tired and anxious about NEET.',
      mood: 3,
      stressLevel: 7,
      sleepHours: 6,
      studyHours: 8,
      examType: 'NEET',
    };

    test('should return 200 with analysis for valid input', async () => {
      const res = await request(app)
        .post('/api/analyze-journal')
        .send(validBody);
      expect(res.statusCode).toBe(200);
      expect(res.body.mood_score).toBeDefined();
      expect(res.body.coping_suggestions).toBeDefined();
    });

    test('should return crisis payload when analysis detects crisis', async () => {
      const gemini = require('../../src/server/services/gemini');
      gemini.analyzeJournalEntry.mockResolvedValueOnce({
        crisis: true,
        message: 'Please seek help',
        helplines: [{ name: 'AASRA', number: '9820466626' }],
      });
      const res = await request(app)
        .post('/api/analyze-journal')
        .send(validBody);
      expect(res.statusCode).toBe(200);
      expect(res.body.crisis).toBe(true);
    });

    test('should return 400 when entry is missing', async () => {
      const res = await request(app)
        .post('/api/analyze-journal')
        .send({ ...validBody, entry: '' });
      expect(res.statusCode).toBe(400);
    });

    test('should return 400 when mood is invalid', async () => {
      const res = await request(app)
        .post('/api/analyze-journal')
        .send({ ...validBody, mood: 10 });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/chat', () => {
    test('should return 200 with response for valid message', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'I feel stressed about JEE', history: [] });
      expect(res.statusCode).toBe(200);
      expect(res.body.response).toBeDefined();
      expect(typeof res.body.response).toBe('string');
    });

    test('should return normalized object when companion returns crisis payload', async () => {
      const gemini = require('../../src/server/services/gemini');
      gemini.chatWithCompanion.mockResolvedValueOnce({
        crisis: true,
        message: 'Please reach out',
        helplines: [{ name: 'AASRA', number: '9820466626' }],
      });
      const res = await request(app)
        .post('/api/chat')
        .send({ message: 'I feel overwhelmed', history: [] });
      expect(res.statusCode).toBe(200);
      expect(res.body.crisis).toBe(true);
    });

    test('should return 400 when message is empty', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: '', history: [] });
      expect(res.statusCode).toBe(400);
    });

    test('should return 400 when message is missing', async () => {
      const res = await request(app)
        .post('/api/chat')
        .send({ history: [] });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/weekly-insights', () => {
    test('should return 200 with insights for valid entries', async () => {
      const res = await request(app)
        .post('/api/weekly-insights')
        .send({
          entries: [
            { entry: 'Day 1 study log', mood: 3, stressLevel: 6 },
            { entry: 'Day 2 study log', mood: 4, stressLevel: 4 },
          ],
        });
      expect(res.statusCode).toBe(200);
      expect(res.body.overall_trend).toBeDefined();
    });

    test('should return 400 when entries is empty', async () => {
      const res = await request(app)
        .post('/api/weekly-insights')
        .send({ entries: [] });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('POST /api/coping-strategy', () => {
    test('should return 200 with strategy for valid input', async () => {
      const res = await request(app)
        .post('/api/coping-strategy')
        .send({ stressType: 'exam_anxiety', examType: 'NEET' });
      expect(res.statusCode).toBe(200);
      expect(res.body.strategy).toBeDefined();
    });

    test('should return 400 when stressType is missing', async () => {
      const res = await request(app)
        .post('/api/coping-strategy')
        .send({ examType: 'NEET' });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('Security Headers', () => {
    test('should include X-Content-Type-Options header', async () => {
      const res = await request(app).get('/api/health');
      expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should include X-Frame-Options or CSP frame-ancestors', async () => {
      const res = await request(app).get('/api/health');
      const hasFrameProtection =
        res.headers['x-frame-options'] ||
        (res.headers['content-security-policy'] &&
          res.headers['content-security-policy'].includes('frame-ancestors'));
      expect(hasFrameProtection).toBeTruthy();
      expect(res.headers['strict-transport-security']).toMatch(/max-age=31536000/);
    });
  });
});
