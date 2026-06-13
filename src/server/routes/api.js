'use strict';

const express = require('express');
const { asyncHandler } = require('../middleware/asyncHandler');
const {
  validateJournalInput,
  validateChatInput,
  validateWeeklyInput,
  validateCopingInput,
} = require('../middleware/validation');
const {
  analyzeJournalEntry,
  chatWithCompanion,
  generateWeeklyInsights,
  generateCopingStrategy,
} = require('../services/gemini');
const { HTTP_STATUS, SERVER } = require('../../shared/constants');

/**
 * Creates the Optezum API router with per-route rate limiting.
 * @param {import('express').RequestHandler} analyzeLimiter - Stricter limiter for journal analysis.
 * @param {import('express').RequestHandler} chatLimiter - Stricter limiter for chat companion.
 * @returns {import('express').Router} Configured Express router.
 */
function createApiRouter(analyzeLimiter, chatLimiter) {
  const router = express.Router();

  /**
   * POST /api/analyze-journal — AI journal analysis endpoint.
   */
  router.post(
    '/analyze-journal',
    analyzeLimiter,
    validateJournalInput,
    asyncHandler(async (req, res) => {
      const { entry, mood, stressLevel, sleepHours, studyHours, examType } = req.body;
      const analysis = await analyzeJournalEntry(entry, mood, stressLevel, sleepHours, studyHours, examType);
      res.status(HTTP_STATUS.OK).json(analysis);
    }),
  );

  /**
   * POST /api/chat — empathetic AI companion chat endpoint.
   */
  router.post(
    '/chat',
    chatLimiter,
    validateChatInput,
    asyncHandler(async (req, res) => {
      const { message, history } = req.body;
      const response = await chatWithCompanion(message, history || []);

      if (typeof response === 'string') {
        return res.status(HTTP_STATUS.OK).json({ response, reply: response });
      }

      return res.status(HTTP_STATUS.OK).json({
        response: response.reply || response.response,
        reply: response.reply || response.response,
        ...response,
      });
    }),
  );

  /**
   * POST /api/weekly-insights — weekly mood pattern analysis.
   */
  router.post(
    '/weekly-insights',
    validateWeeklyInput,
    asyncHandler(async (req, res) => {
      const { entries } = req.body;
      const insights = await generateWeeklyInsights(entries);

      res.status(HTTP_STATUS.OK).json({
        overall_trend: insights.overall_trend || insights.moodTrend || 'stable',
        key_patterns: insights.key_patterns || insights.topConcerns || [],
        recommendations: insights.recommendations || insights.weeklyRecommendations || [],
        insight: insights.insight || insights.overallProgress || insights.overall_trend || 'Keep journaling for personalized insights!',
        tips: insights.tips || insights.recommendations || insights.weeklyRecommendations || [],
        ...insights,
      });
    }),
  );

  /**
   * POST /api/coping-strategy — personalized coping plan generator.
   */
  router.post(
    '/coping-strategy',
    validateCopingInput,
    asyncHandler(async (req, res) => {
      const { stressType, examType } = req.body;
      const strategy = await generateCopingStrategy(stressType, examType);

      res.status(HTTP_STATUS.OK).json({
        strategy: strategy.strategy || strategy.strategyName || 'Personalized Coping Plan',
        quote: strategy.quote || strategy.motivationalMessage || strategy.description || 'Keep going — you are stronger than you think.',
        text: strategy.text || strategy.motivationalMessage || strategy.description || 'Keep going — you are stronger than you think.',
        author: strategy.author || 'Optezum Companion',
        ...strategy,
      });
    }),
  );

  /**
   * GET /api/health — API health check endpoint.
   */
  router.get('/health', (req, res) => {
    res.status(HTTP_STATUS.OK).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: SERVER.SERVICE_NAME,
    });
  });

  return router;
}

module.exports = createApiRouter;
