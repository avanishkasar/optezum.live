/**
 * @file Unit tests for async route handler wrapper
 * @module tests/unit/asyncHandler
 */

const { asyncHandler } = require('../../src/server/middleware/asyncHandler');

describe('asyncHandler', () => {
  test('should forward resolved handlers', async () => {
    const handler = asyncHandler(async (req, res) => {
      res.status(200).json({ ok: true });
    });
    const req = {};
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    await handler(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(next).not.toHaveBeenCalled();
  });

  test('should forward rejected errors to next', async () => {
    const handler = asyncHandler(async () => {
      throw new Error('boom');
    });
    const next = jest.fn();
    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
