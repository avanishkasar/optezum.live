/**
 * @file Unit tests for validation middleware
 * @module tests/unit/validation-middleware
 */

const {
  validateJournalInput,
  validateChatInput,
  validateWeeklyInput,
  validateCopingInput,
} = require('../../src/server/middleware/validation');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('Validation Middleware', () => {
  test('validateJournalInput should reject invalid mood via shared rules', () => {
    const req = { body: { entry: 'Valid entry text here', mood: 9, stressLevel: 5 } };
    const res = mockRes();
    const next = jest.fn();
    validateJournalInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  test('validateJournalInput should sanitize and pass valid payload', () => {
    const req = {
      body: {
        entry: '<b>Hello</b> journal',
        mood: 4,
        stressLevel: 6,
        examType: 'NEET',
      },
    };
    const res = mockRes();
    const next = jest.fn();
    validateJournalInput(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.entry).not.toContain('<');
  });

  describe('validateChatInput', () => {
    test('should reject invalid history shape', () => {
      const req = { body: { message: 'Hello', history: 'not-an-array' } };
      const res = mockRes();
      const next = jest.fn();
      validateChatInput(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('should sanitize valid chat payload', () => {
      const req = { body: { message: '<i>Hi</i>', history: [{ role: 'user' }] } };
      const res = mockRes();
      const next = jest.fn();
      validateChatInput(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(req.body.message).not.toContain('<');
    });
  });

  test('validateWeeklyInput should reject empty entries', () => {
    const req = { body: { entries: [] } };
    const res = mockRes();
    const next = jest.fn();
    validateWeeklyInput(req, res, next);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  test('validateWeeklyInput should sanitize mixed entry shapes', () => {
    const req = {
      body: {
        entries: [
          'plain string entry',
          { entry: '<i>Day 2</i>', journalText: '<b>Alt</b>', mood: '3' },
        ],
      },
    };
    const res = mockRes();
    const next = jest.fn();
    validateWeeklyInput(req, res, next);
    expect(next).toHaveBeenCalled();
    expect(req.body.entries[0]).not.toContain('<');
  });
});
