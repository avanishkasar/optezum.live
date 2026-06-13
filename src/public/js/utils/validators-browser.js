/**
 * @file Browser validation facade (loaded after validation-core.js).
 * @description Exposes client-default wrappers without shadowing core implementations.
 */
'use strict';

/**
 * Validates journal form data before client submission.
 * @param {object} data - Journal form data object.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateJournalForm(data) {
  const minLength = window.APP_CONSTANTS
    ? window.APP_CONSTANTS.VALIDATION.MIN_CLIENT_ENTRY_LENGTH
    : 3;
  return ValidationCore.validateJournalForm(data, { minEntryLength: minLength, requireStressLevel: true });
}

/**
 * Validates a chat message before sending.
 * @param {string} msg - Chat message text.
 * @returns {{ valid: boolean, errors: Array<{field: string, message: string}> }}
 */
function validateChatMessage(msg) {
  return ValidationCore.validateChatMessage(msg);
}
