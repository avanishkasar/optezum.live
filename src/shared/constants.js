/**
 * @file Application-wide constants for Optezum.
 * @module constants
 * @description Single source of truth for magic numbers, limits, and repeated literals.
 */
'use strict';

/** Rate-limit configuration for API routes. @type {object} */
const RATE_LIMIT = {
  GENERAL_WINDOW_MS: 15 * 60 * 1000,
  GENERAL_MAX: 100,
  ANALYZE_WINDOW_MS: 10 * 60 * 1000,
  ANALYZE_MAX: 15,
  CHAT_WINDOW_MS: 10 * 60 * 1000,
  CHAT_MAX: 25,
};

/** HTTP Strict Transport Security settings. @type {object} */
const HSTS = {
  MAX_AGE: 31536000,
  INCLUDE_SUBDOMAINS: true,
  PRELOAD: true,
};

/** Input validation bounds and length limits. @type {object} */
const VALIDATION = {
  MAX_JOURNAL_ENTRY_LENGTH: 5000,
  MAX_CHAT_MESSAGE_LENGTH: 5000,
  MAX_API_TEXT_LENGTH: 2000,
  MIN_MOOD: 1,
  MAX_MOOD: 5,
  MIN_STRESS: 1,
  MAX_STRESS: 10,
  MIN_SLEEP_HOURS: 0,
  MAX_SLEEP_HOURS: 24,
  MIN_STUDY_HOURS: 0,
  MAX_STUDY_HOURS: 24,
  MIN_CLIENT_ENTRY_LENGTH: 3,
  MIN_SERVER_ENTRY_LENGTH: 1,
  WEEKLY_INSIGHTS_MIN_ENTRIES: 3,
};

/** Server and deployment defaults. @type {object} */
const SERVER = {
  DEFAULT_PORT: 3000,
  JSON_BODY_LIMIT: '1mb',
  SERVICE_NAME: 'Optezum Mental Wellness API',
};

/** Google Gemini configuration. @type {object} */
const GEMINI = {
  MODEL: 'gemini-2.5-flash',
  API_KEY_PLACEHOLDER: 'your_gemini_api_key_here',
  API_KEY_ERROR_FRAGMENT: 'Gemini API key',
};

/** Crisis helpline numbers (India). @type {Array<{name: string, number: string, description: string}>} */
const CRISIS_HELPLINES = [
  { name: 'iCall', number: '9152987821', description: 'Psychosocial helpline by TISS' },
  { name: 'Vandrevala Foundation', number: '1860-2662-345', description: '24/7 mental health support' },
  { name: 'AASRA', number: '9820466626', description: '24/7 crisis intervention' },
];

/** Crisis keywords for safety short-circuit. @type {string[]} */
const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end it all',
  'self-harm',
  "don't want to live",
  'want to die',
  'hurt myself',
];

/** Allowed CORS origins in production. @type {string[]} */
const ALLOWED_ORIGINS = [
  'https://www.optezum.live',
  'https://optezum.live',
  'https://warmup-challenge-production.up.railway.app',
];

/** Supported competitive exams. @type {string[]} */
const EXAM_TYPES = ['NEET', 'JEE', 'CUET', 'CAT', 'GATE', 'UPSC'];

/** HTTP status codes used by the API. @type {object} */
const HTTP_STATUS = {
  OK: 200,
  BAD_REQUEST: 400,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

/** Front-end UI limits and display constants. @type {object} */
const UI = {
  STREAK_MAX_LOOKBACK_DAYS: 365,
  ENTRY_PREVIEW_LENGTH: 200,
  RECENT_ENTRIES_DISPLAY: 20,
  CHAT_HISTORY_LIMIT: 20,
  CHART_WIDTH: 560,
  CHART_HEIGHT: 200,
  CHART_PADDING: 40,
  MS_PER_DAY: 86400000,
  MS_PER_HOUR: 3600000,
  POMODORO_WORK_MINUTES: 25,
  POMODORO_BREAK_MINUTES: 5,
  LUCIDE_DEBOUNCE_MS: 80,
};

const exportsObject = {
  RATE_LIMIT,
  HSTS,
  VALIDATION,
  SERVER,
  GEMINI,
  CRISIS_HELPLINES,
  CRISIS_KEYWORDS,
  ALLOWED_ORIGINS,
  EXAM_TYPES,
  HTTP_STATUS,
  UI,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObject;
}

if (typeof window !== 'undefined') {
  window.APP_CONSTANTS = exportsObject;
}
