/**
 * @module validators
 * @description Validation utilities for forms and user input across Optezum.
 */
'use strict';

/**
 * Validates journal form data before submission.
 * @param {object} data - The journal form data object.
 * @param {string} data.entry - The journal entry text.
 * @param {number} data.mood - Selected mood value (1-5).
 * @param {number} data.stressLevel - Stress level (1-10).
 * @param {number} [data.sleepHours] - Hours of sleep (0-24).
 * @param {number} [data.studyHours] - Hours of study (0-24).
 * @param {string} [data.examType] - Exam type identifier.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateJournalForm(data) {
  const errors = [];

  if (!data.entry || typeof data.entry !== 'string' || data.entry.trim().length < 3) {
    errors.push({ field: 'entry', message: 'Journal entry must be at least 3 characters.' });
  }
  if (data.entry && data.entry.length > 5000) {
    errors.push({ field: 'entry', message: 'Journal entry must not exceed 5000 characters.' });
  }

  if (data.mood === null || data.mood === undefined || data.mood < 1 || data.mood > 5) {
    errors.push({ field: 'mood', message: 'Please select a mood (1-5).' });
  }

  if (data.stressLevel !== undefined) {
    if (typeof data.stressLevel !== 'number' || data.stressLevel < 1 || data.stressLevel > 10) {
      errors.push({ field: 'stressLevel', message: 'Stress level must be between 1 and 10.' });
    }
  }

  if (data.sleepHours !== undefined) {
    if (typeof data.sleepHours !== 'number' || data.sleepHours < 0 || data.sleepHours > 24) {
      errors.push({ field: 'sleepHours', message: 'Sleep hours must be between 0 and 24.' });
    }
  }

  if (data.studyHours !== undefined) {
    if (typeof data.studyHours !== 'number' || data.studyHours < 0 || data.studyHours > 24) {
      errors.push({ field: 'studyHours', message: 'Study hours must be between 0 and 24.' });
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validates a chat message before sending.
 * @param {string} msg - The chat message to validate.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateChatMessage(msg) {
  const errors = [];

  if (!msg || typeof msg !== 'string' || msg.trim().length === 0) {
    errors.push({ field: 'message', message: 'Message cannot be empty.' });
  }

  if (msg && msg.length > 5000) {
    errors.push({ field: 'message', message: 'Message must not exceed 5000 characters.' });
  }

  return { valid: errors.length === 0, errors };
}

// Export for Node.js testing, no-op in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateJournalForm, validateChatMessage };
}
