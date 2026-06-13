'use strict';

const express = require('express');
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

const router = express.Router();

/**
 * POST /api/analyze-journal
 * Analyzes a student's journal entry and returns structured wellness insights.
 *
 * @name AnalyzeJournal
 * @route {POST} /api/analyze-journal
 * @bodyparam {string} entry - The journal text.
 * @bodyparam {string} mood - Self-reported mood.
 * @bodyparam {number} stressLevel - Stress level (1-10).
 * @bodyparam {number} [sleepHours] - Hours of sleep.
 * @bodyparam {number} [studyHours] - Hours of study.
 * @bodyparam {string} [examType] - Exam being prepared for.
 */
router.post('/analyze-journal', validateJournalInput, async (req, res) => {
  try {
    const { entry, mood, stressLevel, sleepHours, studyHours, examType } = req.body;
    const analysis = await analyzeJournalEntry(entry, mood, stressLevel, sleepHours, studyHours, examType);
    return res.status(200).json(analysis);
  } catch (err) {
    console.error('[API] analyze-journal error:', err.message);
    if (err.message && err.message.includes('Gemini API key')) {
      return res.status(503).json({ success: false, error: 'Gemini API not configured. Set GEMINI_API_KEY in .env.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to analyze journal entry. Please try again.' });
  }
});

/**
 * POST /api/chat
 * Sends a message to the empathetic AI companion and returns a reply.
 *
 * @name Chat
 * @route {POST} /api/chat
 * @bodyparam {string} message - The user's message.
 * @bodyparam {Array} [history] - Previous conversation turns.
 */
router.post('/chat', validateChatInput, async (req, res) => {
  try {
    const { message, history } = req.body;
    const response = await chatWithCompanion(message, history || []);
    
    // Normalize response for integration test expectations and frontend client
    let normalized = {};
    if (typeof response === 'string') {
      normalized = { response, reply: response };
    } else {
      normalized = {
        response: response.reply || response.response,
        reply: response.reply || response.response,
        ...response
      };
    }
    
    return res.status(200).json(normalized);
  } catch (err) {
    console.error('[API] chat error:', err.message);
    if (err.message && err.message.includes('Gemini API key')) {
      return res.status(503).json({ success: false, error: 'Gemini API not configured. Set GEMINI_API_KEY in .env.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to get a response. Please try again.' });
  }
});

/**
 * POST /api/weekly-insights
 * Analyzes patterns across multiple journal entries for the week.
 *
 * @name WeeklyInsights
 * @route {POST} /api/weekly-insights
 * @bodyparam {Array<object>} entries - Array of journal entries.
 */
router.post('/weekly-insights', validateWeeklyInput, async (req, res) => {
  try {
    const { entries } = req.body;
    const insights = await generateWeeklyInsights(entries);
    
    // Normalize weekly insights for integration tests and frontend dashboard
    const normalized = {
      overall_trend: insights.overall_trend || insights.moodTrend || 'stable',
      key_patterns: insights.key_patterns || insights.topConcerns || [],
      recommendations: insights.recommendations || insights.weeklyRecommendations || [],
      insight: insights.insight || insights.overallProgress || insights.overall_trend || 'Keep journaling for personalized insights!',
      tips: insights.tips || insights.recommendations || insights.weeklyRecommendations || [],
      ...insights
    };
    
    return res.status(200).json(normalized);
  } catch (err) {
    console.error('[API] weekly-insights error:', err.message);
    if (err.message && err.message.includes('Gemini API key')) {
      return res.status(503).json({ success: false, error: 'Gemini API not configured. Set GEMINI_API_KEY in .env.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to generate weekly insights. Please try again.' });
  }
});

/**
 * POST /api/coping-strategy
 * Returns a personalized coping plan based on stress type and exam.
 *
 * @name CopingStrategy
 * @route {POST} /api/coping-strategy
 * @bodyparam {string} stressType - Type of stress experienced.
 * @bodyparam {string} [examType] - The exam being prepared for.
 */
router.post('/coping-strategy', validateCopingInput, async (req, res) => {
  try {
    const { stressType, examType } = req.body;
    const strategy = await generateCopingStrategy(stressType, examType);
    
    // Normalize for integration tests, frontend motivational quote, and service model
    const normalized = {
      strategy: strategy.strategy || strategy.strategyName || 'Personalized Coping Plan',
      quote: strategy.quote || strategy.motivationalMessage || strategy.description || 'Keep going — you are stronger than you think.',
      text: strategy.text || strategy.motivationalMessage || strategy.description || 'Keep going — you are stronger than you think.',
      author: strategy.author || 'Optezum Companion',
      ...strategy
    };
    
    return res.status(200).json(normalized);
  } catch (err) {
    console.error('[API] coping-strategy error:', err.message);
    if (err.message && err.message.includes('Gemini API key')) {
      return res.status(503).json({ success: false, error: 'Gemini API not configured. Set GEMINI_API_KEY in .env.' });
    }
    return res.status(500).json({ success: false, error: 'Failed to generate coping strategy. Please try again.' });
  }
});

/**
 * GET /api/health
 * Simple health check endpoint.
 *
 * @name HealthCheck
 * @route {GET} /api/health
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Optezum Mental Wellness API',
  });
});

module.exports = router;
