/**
 * @module validators
 * @description Client and test facade over shared validation-core rules.
 */
'use strict';

const {
  validateJournalForm: validateJournalCore,
  validateChatMessage: validateChatCore,
} = require('./validation-core');
const { VALIDATION } = require('../../../shared/constants');

/**
 * Validates journal form data before client submission.
 * @param {object} data - Journal form data object.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }} Validation result.
 */
function validateJournalForm(data) {
  return validateJournalCore(data, {
    minEntryLength: VALIDATION.MIN_CLIENT_ENTRY_LENGTH,
    requireStressLevel: true,
  });
}

/**
 * Validates a chat message before sending.
 * @param {string} msg - Chat message text.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }} Validation result.
 */
function validateChatMessage(msg) {
  return validateChatCore(msg);
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { validateJournalForm, validateChatMessage };
}
