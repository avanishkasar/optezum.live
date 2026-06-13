'use strict';

const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

/**
 * Crisis keywords that trigger an immediate safe response
 * instead of forwarding the message to Gemini.
 * @type {string[]}
 */
const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it all',
  'self-harm',
  "don't want to live",
  'want to die',
  'hurt myself',
];

/**
 * Hardcoded crisis response with Indian mental-health helplines.
 * Returned immediately when crisis keywords are detected.
 * @type {object}
 */
const CRISIS_RESPONSE = {
  crisis: true,
  message:
    'I care about you and your safety. What you are feeling is serious, and you deserve support from a trained professional right now. Please reach out to one of these helplines immediately:',
  helplines: [
    { name: 'iCall', number: '9152987821', description: 'Psychosocial helpline by TISS' },
    { name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 mental health support' },
    { name: 'AASRA', number: '9820466626', description: '24/7 crisis intervention' },
  ],
  disclaimer:
    'You are not alone. A trained counselor can help you through this. Please call one of the numbers above right now.',
};

/**
 * Checks whether the given text contains any crisis keywords.
 * Comparison is case-insensitive.
 * @param {string} text - The text to scan for crisis keywords.
 * @returns {boolean} True if a crisis keyword is found.
 */
function containsCrisisKeywords(text) {
  if (typeof text !== 'string') return false;
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/* ---------- Gemini client initialization ---------- */

const apiKey = process.env.GEMINI_API_KEY;

/** @type {import('@google/generative-ai').GoogleGenerativeAI | null} */
let genAI = null;

/** @type {import('@google/generative-ai').GenerativeModel | null} */
let model = null;

if (apiKey && apiKey !== 'your_gemini_api_key_here') {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
}

/* ---------- System prompts ---------- */

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

/* ---------- Service functions ---------- */

/**
 * Analyzes a student journal entry using Gemini and returns structured wellness insights.
 * If crisis keywords are detected the function short-circuits with helpline information.
 *
 * @param {string} entry - The journal text written by the student.
 * @param {string} mood - The self-reported mood (e.g. "anxious", "happy").
 * @param {number} stressLevel - Self-reported stress level (1-10).
 * @param {number} [sleepHours] - Hours of sleep the student got.
 * @param {number} [studyHours] - Hours spent studying.
 * @param {string} [examType] - The exam the student is preparing for.
 * @returns {Promise<object>} Structured analysis or crisis response.
 */
async function analyzeJournalEntry(entry, mood, stressLevel, sleepHours, studyHours, examType) {
  if (containsCrisisKeywords(entry)) {
    return CRISIS_RESPONSE;
  }

  if (!model) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.');
  }

  const userPrompt = `Journal Entry: "${entry}"
Mood: ${mood}
Stress Level: ${stressLevel}/10
Sleep Hours: ${sleepHours ?? 'Not provided'}
Study Hours: ${studyHours ?? 'Not provided'}
Exam: ${examType ?? 'Not specified'}`;

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: JOURNAL_SYSTEM_PROMPT }] },
  });

  const text = result.response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { rawResponse: text };
  }
}

/**
 * Conducts a conversation with the empathetic AI companion.
 * Crisis keywords in the message trigger an immediate safe response.
 *
 * @param {string} message - The latest user message.
 * @param {Array<{role: string, parts: string}>} history - Previous conversation turns.
 * @returns {Promise<object>} Object containing the AI's reply text.
 */
async function chatWithCompanion(message, history) {
  if (containsCrisisKeywords(message)) {
    return CRISIS_RESPONSE;
  }

  if (!model) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.');
  }

  const formattedHistory = Array.isArray(history)
    ? history.map((h) => ({
        role: h.role === 'user' ? 'user' : 'model',
        parts: [{ text: typeof h.parts === 'string' ? h.parts : String(h.parts) }],
      }))
    : [];

  const contents = [
    ...formattedHistory,
    { role: 'user', parts: [{ text: message }] },
  ];

  const result = await model.generateContent({
    contents,
    systemInstruction: { parts: [{ text: CHAT_SYSTEM_PROMPT }] },
  });

  return { reply: result.response.text() };
}

/**
 * Generates weekly insights by analyzing an array of journal entries.
 *
 * @param {Array<object>} entries - Array of journal entry objects from the past week.
 * @returns {Promise<object>} Structured weekly insights or crisis response.
 */
async function generateWeeklyInsights(entries) {
  const combinedText = entries.map((e) => e.entry || e.text || JSON.stringify(e)).join('\n');
  if (containsCrisisKeywords(combinedText)) {
    return CRISIS_RESPONSE;
  }

  if (!model) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.');
  }

  const userPrompt = `Here are the journal entries from this week:\n${JSON.stringify(entries, null, 2)}`;

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
 * Generates a personalized coping strategy based on the student's stress type and exam.
 *
 * @param {string} stressType - The kind of stress (e.g. "pre-exam anxiety", "burnout").
 * @param {string} [examType] - The exam the student is preparing for.
 * @returns {Promise<object>} Structured coping plan.
 */
async function generateCopingStrategy(stressType, examType) {
  if (containsCrisisKeywords(stressType)) {
    return CRISIS_RESPONSE;
  }

  if (!model) {
    throw new Error('Gemini API key is not configured. Set GEMINI_API_KEY in your .env file.');
  }

  const userPrompt = `Stress Type: ${stressType}\nExam: ${examType ?? 'General competitive exam'}`;

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
  CRISIS_KEYWORDS,
  CRISIS_RESPONSE,
};
