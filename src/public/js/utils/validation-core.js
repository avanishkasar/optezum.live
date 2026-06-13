/**
 * @file Shared validation and sanitization rules for client and server.
 * @module validation-core
 * @description Single source of truth for input validation across Optezum.
 */
'use strict';

const VALIDATION = typeof module !== 'undefined' && module.exports
  ? require('../../../shared/constants').VALIDATION
  : (typeof window !== 'undefined' && window.APP_CONSTANTS
    ? window.APP_CONSTANTS.VALIDATION
    : {
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
    });

/** Maximum journal entry length (characters). @type {number} */
const MAX_JOURNAL_ENTRY_LENGTH = VALIDATION.MAX_JOURNAL_ENTRY_LENGTH;

/** Maximum chat message length (characters). @type {number} */
const MAX_CHAT_MESSAGE_LENGTH = VALIDATION.MAX_CHAT_MESSAGE_LENGTH;

/** Maximum API text field length after sanitization (characters). @type {number} */
const MAX_API_TEXT_LENGTH = VALIDATION.MAX_API_TEXT_LENGTH;

/**
 * Strips HTML tags from a string and trims whitespace.
 * @param {string} str - Raw input string.
 * @returns {string} Sanitized string with HTML tags removed.
 */
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/<[^>]*>/g, '').trim();
}

/**
 * Truncates a string to the maximum allowed length.
 * @param {string} str - String to truncate.
 * @param {number} [maxLength=MAX_API_TEXT_LENGTH] - Maximum character count.
 * @returns {string} Truncated string.
 */
function truncateString(str, maxLength = MAX_API_TEXT_LENGTH) {
  if (typeof str !== 'string') return '';
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}

/**
 * Sanitizes and truncates a string for safe API persistence.
 * @param {string} str - Raw input.
 * @param {number} [maxLength=MAX_API_TEXT_LENGTH] - Maximum length after cleaning.
 * @returns {string} Clean, length-limited string.
 */
function cleanInput(str, maxLength = MAX_API_TEXT_LENGTH) {
  return truncateString(sanitizeString(str), maxLength);
}

/**
 * Validates journal form or API payload fields.
 * @param {object} data - Journal data to validate.
 * @param {string} [data.entry] - Journal entry text.
 * @param {number|string} [data.mood] - Mood value (1–5) or label.
 * @param {number} [data.stressLevel] - Stress level (1–10).
 * @param {number} [data.sleepHours] - Hours of sleep (0–24).
 * @param {number} [data.studyHours] - Hours of study (0–24).
 * @param {string} [data.examType] - Exam type identifier.
 * @param {object} [options] - Validation options.
 * @param {number} [options.minEntryLength=3] - Minimum entry length after trim.
 * @param {boolean} [options.allowStringMood=false] - Allow non-empty string mood (API).
 * @param {boolean} [options.requireStressLevel=true] - Require numeric stress level.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateJournalForm(data, options = {}) {
  const minEntryLength = options.minEntryLength ?? 3;
  const allowStringMood = options.allowStringMood ?? false;
  const requireStressLevel = options.requireStressLevel ?? true;
  const errors = [];

  if (typeof data.entry !== 'string' || data.entry.trim().length < minEntryLength) {
    errors.push({
      field: 'entry',
      message:
        minEntryLength <= 1
          ? '"entry" must be a non-empty string.'
          : 'Journal entry must be at least 3 characters.',
    });
  }
  if (typeof data.entry === 'string' && data.entry.length > MAX_JOURNAL_ENTRY_LENGTH) {
    errors.push({
      field: 'entry',
      message: 'Journal entry must not exceed 5000 characters.',
    });
  }

  if (data.mood === null || data.mood === undefined) {
    errors.push({ field: 'mood', message: 'Please select a mood (1-5).' });
  } else if (typeof data.mood === 'number') {
    if (data.mood < VALIDATION.MIN_MOOD || data.mood > VALIDATION.MAX_MOOD) {
      errors.push({ field: 'mood', message: '"mood" must be between 1 and 5.' });
    }
  } else if (typeof data.mood === 'string') {
    if (!allowStringMood) {
      errors.push({ field: 'mood', message: 'Please select a mood (1-5).' });
    } else if (data.mood.trim().length === 0) {
      errors.push({ field: 'mood', message: '"mood" must be a non-empty string.' });
    }
  } else {
    errors.push({ field: 'mood', message: '"mood" must be a string or a number.' });
  }

  if (requireStressLevel) {
    if (
      typeof data.stressLevel !== 'number'
      || !Number.isFinite(data.stressLevel)
      || data.stressLevel < VALIDATION.MIN_STRESS
      || data.stressLevel > VALIDATION.MAX_STRESS
    ) {
      errors.push({
        field: 'stressLevel',
        message: '"stressLevel" must be a number between 1 and 10.',
      });
    }
  } else if (data.stressLevel !== undefined) {
    if (typeof data.stressLevel !== 'number' || data.stressLevel < VALIDATION.MIN_STRESS || data.stressLevel > VALIDATION.MAX_STRESS) {
      errors.push({ field: 'stressLevel', message: 'Stress level must be between 1 and 10.' });
    }
  }

  if (data.sleepHours !== undefined && data.sleepHours !== null) {
    if (typeof data.sleepHours !== 'number' || !Number.isFinite(data.sleepHours) || data.sleepHours < VALIDATION.MIN_SLEEP_HOURS || data.sleepHours > VALIDATION.MAX_SLEEP_HOURS) {
      errors.push({ field: 'sleepHours', message: 'Sleep hours must be between 0 and 24.' });
    }
  }

  if (data.studyHours !== undefined && data.studyHours !== null) {
    if (typeof data.studyHours !== 'number' || !Number.isFinite(data.studyHours) || data.studyHours < VALIDATION.MIN_STUDY_HOURS || data.studyHours > VALIDATION.MAX_STUDY_HOURS) {
      errors.push({ field: 'studyHours', message: 'Study hours must be between 0 and 24.' });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a chat message before sending.
 * @param {string} msg - Chat message text.
 * @param {object} [options] - Validation options.
 * @param {number} [options.maxLength=MAX_CHAT_MESSAGE_LENGTH] - Maximum message length.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateChatMessage(msg, options = {}) {
  const maxLength = options.maxLength ?? MAX_CHAT_MESSAGE_LENGTH;
  const errors = [];

  if (!msg || typeof msg !== 'string' || msg.trim().length === 0) {
    errors.push({ field: 'message', message: 'Message cannot be empty.' });
  }

  if (msg && msg.length > maxLength) {
    errors.push({ field: 'message', message: 'Message must not exceed 5000 characters.' });
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates weekly insights entries array shape.
 * @param {unknown} entries - Request entries payload.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateWeeklyEntries(entries) {
  const errors = [];
  if (!Array.isArray(entries) || entries.length === 0) {
    errors.push({ field: 'entries', message: '"entries" must be a non-empty array.' });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates coping strategy request fields.
 * @param {object} data - Coping strategy payload.
 * @param {string} [data.stressType] - Stress type identifier.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateCopingRequest(data) {
  const errors = [];
  const stressType = data.stressType || data.type;
  if (typeof stressType !== 'string' || stressType.trim().length === 0) {
    errors.push({ field: 'stressType', message: '"stressType" must be a non-empty string.' });
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Validates chat history array structure for API requests.
 * @param {unknown} history - Conversation history array.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateChatHistory(history) {
  const errors = [];
  if (history === undefined || history === null) {
    return { valid: true, errors };
  }
  if (!Array.isArray(history)) {
    errors.push({ field: 'history', message: '"history" must be an array.' });
    return { valid: false, errors };
  }
  history.forEach((h, i) => {
    if (!h || typeof h.role !== 'string') {
      errors.push({ field: 'history', message: `history[${i}] must have a "role" string.` });
    }
  });
  return { valid: errors.length === 0, errors };
}

/**
 * Builds a standard API validation error response message.
 * @param {Array<{field: string, message: string}>} errors - Validation errors.
 * @returns {string} Formatted error string for HTTP 400 responses.
 */
function formatValidationError(errors) {
  if (!errors.length) return 'Validation failed.';
  return `Validation failed: ${errors[0].message}`;
}

const exportsObject = {
  MAX_JOURNAL_ENTRY_LENGTH,
  MAX_CHAT_MESSAGE_LENGTH,
  MAX_API_TEXT_LENGTH,
  sanitizeString,
  truncateString,
  cleanInput,
  validateJournalForm,
  validateChatMessage,
  validateWeeklyEntries,
  validateCopingRequest,
  validateChatHistory,
  formatValidationError,
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObject;
}

if (typeof window !== 'undefined') {
  window.ValidationCore = exportsObject;
}
