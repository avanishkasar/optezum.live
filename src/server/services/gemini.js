'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const { cleanInput, sanitizeString } = require('../../public/js/utils/validation-core');
const {
  GEMINI,
  CRISIS_HELPLINES,
  CRISIS_KEYWORDS,
  CACHE,
} = require('../../shared/constants');
const { getCacheKey, getFromCache, setCache, clearCache } = require('../utils/cache');

/**
 * Hardcoded crisis response with Indian mental-health helplines.
 * @type {object}
 */
const CRISIS_RESPONSE = {
  crisis: true,
  message:
    'I care about you and your safety. What you are feeling is serious, and you deserve support from a trained professional right now. Please reach out to one of these helplines immediately:',
  helplines: CRISIS_HELPLINES,
  disclaimer:
    'You are not alone. A trained counselor can help you through this. Please call one of the numbers above right now.',
};

/**
 * Sanitizes user-provided text before any Gemini API call.
 * Strips HTML/script tags and enforces length limits.
 * @param {unknown} value - Raw user input.
 * @returns {string} Sanitized plain text safe for model prompts.
 */
function sanitizeForGemini(value) {
  if (typeof value !== 'string') return '';
  return cleanInput(sanitizeString(value));
}

/**
 * Checks whether the given text contains any crisis keywords.
 * @param {string} text - Text to scan.
 * @returns {boolean} True when a crisis keyword is detected.
 */
function containsCrisisKeywords(text) {
  if (typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));
}

const apiKey = process.env.GEMINI_API_KEY;

/** @type {import('@google/generative-ai').GoogleGenerativeAI | null} */
let genAI = null;

/** @type {import('@google/generative-ai').GenerativeModel | null} */
let model = null;

if (apiKey && apiKey !== GEMINI.API_KEY_PLACEHOLDER) {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: GEMINI.MODEL });
}

const JOURNAL_SYSTEM_PROMPT = `You are a compassionate mental wellness AI for students preparing for competitive exams in India (NEET, JEE, CUET, CAT, GATE, UPSC). Analyze this journal entry and return ONLY valid JSON with the following structure:
{
  "emotionalState": "string describing the student's emotional state",
  "stressAnalysis": "string with stress level assessment and contributing factors",
  "sleepAssessment": "string evaluating sleep quality and its impact",
  "studyPatternInsight": "string analyzing study habits and productivity",
  "recommendations": ["array", "of", "actionable", "recommendations"],
  "positiveAffirmation": "a warm, encouraging message for the student",
  "overallWellnessScore": number between 1 and 10
}
Do NOT include any markdown formatting, code fences, or extra text outside the JSON.`;

const CHAT_SYSTEM_PROMPT = `You are an empathetic, always-available digital companion for students preparing for competitive exams in India. You provide coping strategies, mindfulness exercises, and motivational encouragement. You are NOT a therapist. Never diagnose. If someone is in crisis, direct them to professional help. Keep responses concise, warm, and actionable. Use simple language. You can suggest breathing exercises, study techniques, time management tips, and emotional regulation strategies.`;

const WEEKLY_SYSTEM_PROMPT = `You are a mental wellness AI that analyzes weekly journal entries for students preparing for competitive exams. Detect patterns, trends, and provide actionable insights. Return ONLY valid JSON with this structure:
{
  "moodTrend": "string describing mood pattern over the week",
  "stressTrend": "string describing stress pattern",
  "sleepTrend": "string describing sleep pattern",
  "studyTrend": "string describing study pattern",
  "topConcerns": ["array", "of", "primary", "concerns"],
  "improvements": ["array", "of", "positive", "changes"],
  "weeklyRecommendations": ["array", "of", "recommendations", "for", "next", "week"],
  "overallProgress": "string summarizing the week"
}
Do NOT include any markdown formatting, code fences, or extra text outside the JSON.`;

const COPING_SYSTEM_PROMPT = `You are a mental wellness expert specializing in helping students manage exam-related stress in India. Generate a personalized coping strategy. Return ONLY valid JSON with this structure:
{
  "strategyName": "name of the coping plan",
  "description": "brief description",
  "immediateActions": ["quick", "actions", "for", "right", "now"],
  "dailyPractices": ["daily", "habits", "to", "build"],
  "weeklyGoals": ["weekly", "goals"],
  "breathingExercise": { "name": "string", "steps": ["step1", "step2"], "duration": "string" },
  "motivationalMessage": "personalized motivational message"
}
Do NOT include any markdown formatting, code fences, or extra text outside the JSON.`;

/**
 * Analyzes a student journal entry using Gemini.
 * @param {string} entry - Journal text.
 * @param {string|number} mood - Self-reported mood.
 * @param {number} stressLevel - Stress level (1-10).
 * @param {number} [sleepHours] - Hours of sleep.
 * @param {number} [studyHours] - Hours studied.
 * @param {string} [examType] - Target exam.
 * @returns {Promise<object>} Structured analysis or crisis response.
 */
async function analyzeJournalEntry(entry, mood, stressLevel, sleepHours, studyHours, examType) {
  const safeEntry = sanitizeForGemini(entry);
  if (containsCrisisKeywords(safeEntry)) return CRISIS_RESPONSE;

  if (!model) {
    throw new Error(`${GEMINI.API_KEY_ERROR_FRAGMENT} is not configured. Set GEMINI_API_KEY in your .env file.`);
  }

  const safeExamType = sanitizeForGemini(examType || 'Not specified');
  const cacheKey = getCacheKey('journal', {
    entry: safeEntry,
    mood,
    stressLevel,
    sleepHours: sleepHours ?? null,
    studyHours: studyHours ?? null,
    examType: safeExamType,
  });
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const userPrompt = `Journal Entry: "${safeEntry}"
Mood: ${mood}
Stress Level: ${stressLevel}/10
Sleep Hours: ${sleepHours ?? 'Not provided'}
Study Hours: ${studyHours ?? 'Not provided'}
Exam: ${safeExamType}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: JOURNAL_SYSTEM_PROMPT }] },
  });

  const text = result.response.text();
  try {
    const parsed = JSON.parse(text);
    setCache(cacheKey, parsed, CACHE.JOURNAL_ANALYSIS_TTL_MS);
    return parsed;
  } catch {
    const fallback = { rawResponse: text };
    setCache(cacheKey, fallback, CACHE.JOURNAL_ANALYSIS_TTL_MS);
    return fallback;
  }
}

/**
 * Conducts a conversation with the empathetic AI companion.
 * @param {string} message - Latest user message.
 * @param {Array<object>} history - Previous conversation turns.
 * @returns {Promise<object>} AI reply object or crisis response.
 */
async function chatWithCompanion(message, history) {
  const safeMessage = sanitizeForGemini(message);
  if (containsCrisisKeywords(safeMessage)) return CRISIS_RESPONSE;

  if (!model) {
    throw new Error(`${GEMINI.API_KEY_ERROR_FRAGMENT} is not configured. Set GEMINI_API_KEY in your .env file.`);
  }

  const formattedHistory = Array.isArray(history)
    ? history.map((h) => {
        const raw = typeof h.parts === 'string'
          ? h.parts
          : (h.content || (Array.isArray(h.parts) ? h.parts[0]?.text : '') || '');
        return {
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: sanitizeForGemini(String(raw)) }],
        };
      })
    : [];

  const contents = [
    ...formattedHistory,
    { role: 'user', parts: [{ text: safeMessage }] },
  ];

  const result = await model.generateContent({
    contents,
    systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }] },
  });

  return { reply: result.response.text() };
}

/**
 * Generates weekly insights from journal entries.
 * @param {Array<object>} entries - Weekly journal entries.
 * @returns {Promise<object>} Weekly insight object or crisis response.
 */
async function generateWeeklyInsights(entries) {
  const sanitizedEntries = entries.map((entry) => {
    if (typeof entry === 'string') return sanitizeForGemini(entry);
    return {
      ...entry,
      entry: sanitizeForGemini(entry.entry || entry.journalText || entry.text || ''),
      journalText: sanitizeForGemini(entry.journalText || entry.entry || ''),
      text: sanitizeForGemini(entry.text || ''),
    };
  });

  const combinedText = sanitizedEntries.map((e) => (
    typeof e === 'string' ? e : (e.entry || e.text || '')
  )).join('\n');

  if (containsCrisisKeywords(combinedText)) return CRISIS_RESPONSE;

  if (!model) {
    throw new Error(`${GEMINI.API_KEY_ERROR_FRAGMENT} is not configured. Set GEMINI_API_KEY in your .env file.`);
  }

  const userPrompt = `Here are the journal entries from this week:\n${JSON.stringify(sanitizedEntries, null, 2)}`;
  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: WEEKLY_SYSTEM_PROMPT }] },
  });

  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawResponse: text };
  }
}

/**
 * Generates a personalized coping strategy.
 * @param {string} stressType - Stress category.
 * @param {string} [examType] - Target exam.
 * @returns {Promise<object>} Coping strategy object or crisis response.
 */
async function generateCopingStrategy(stressType, examType) {
  const safeStressType = sanitizeForGemini(stressType);
  if (containsCrisisKeywords(safeStressType)) return CRISIS_RESPONSE;

  if (!model) {
    throw new Error(`${GEMINI.API_KEY_ERROR_FRAGMENT} is not configured. Set GEMINI_API_KEY in your .env file.`);
  }

  const safeExamType = sanitizeForGemini(examType || 'General competitive exam');
  const userPrompt = `Stress Type: ${safeStressType}\nExam: ${safeExamType}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: COPING_SYSTEM_PROMPT }] },
  });

  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawResponse: text };
  }
}

module.exports = {
  analyzeJournalEntry,
  chatWithCompanion,
  generateWeeklyInsights,
  generateCopingStrategy,
  containsCrisisKeywords,
  sanitizeForGemini,
  CRISIS_KEYWORDS,
  CRISIS_RESPONSE,
  clearJournalAnalysisCache: clearCache,
};
