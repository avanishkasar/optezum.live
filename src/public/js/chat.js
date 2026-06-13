/**
 * @module chat
 * @description AI Chat companion module for Optezum.
 * Handles message sending/receiving, typing indicators,
 * crisis detection, and conversation history management.
 */


/** @type {{ role: string, content: string }[]} Conversation history for context. */
let conversationHistory = [];

/** @type {boolean} Whether a message is currently being sent. */
let isSending = false;

/**
 * Crisis keywords for client-side detection.
 * If any are found, the crisis helpline banner is shown immediately.
 * @type {string[]}
 */
const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'end my life', 'want to die', 'self-harm',
  'self harm', 'cutting myself', 'no reason to live', 'better off dead',
  'hurt myself', 'ending it all', 'not worth living',
];

/**
 * Initializes the chat module — sets up input listeners, send button,
 * keyboard shortcut (Enter to send), and renders a welcome message.
 * @returns {void}
 */
function initChat() {
  const sendBtn = document.getElementById('chat-send-btn');
  const chatInput = document.getElementById('chat-input');

  if (sendBtn) {
    sendBtn.addEventListener('click', () => handleSend());
  }

  if (chatInput) {
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    });

    // Debounced input — no action needed for now, but structure is ready
    let debounceTimer = null;
    chatInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        // Could add typing detection or character count here
      }, 300);
    });
  }

  // Welcome message
  renderMessage('assistant', 'Hi! I\'m your Optezum wellness companion. 💙 I\'m here to listen, support, and help you navigate exam stress. How are you feeling today?');
}

/**
 * Handles the send action — reads input, validates, sends to API.
 * @returns {Promise<void>}
 */
async function handleSend() {
  if (isSending) return;

  const chatInput = document.getElementById('chat-input');
  if (!chatInput) return;

  const raw = chatInput.value;
  const text = sanitizeInput(raw, 2000);

  const validation = validateChatMessage(text);
  if (!validation.valid) return;

  chatInput.value = '';
  isSending = true;

  // Client-side crisis check
  checkCrisis(text);

  // Render user message
  renderMessage('user', text);
  conversationHistory.push({ role: 'user', content: text });

  showTypingIndicator();

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: text,
        history: conversationHistory.slice(-20), // Last 20 messages for context
      }),
    });

    hideTypingIndicator();

    if (response.ok) {
      const data = await response.json();
      const reply = data.reply || 'I\'m here for you. Could you tell me more about how you\'re feeling?';
      renderMessage('assistant', reply);
      conversationHistory.push({ role: 'assistant', content: reply });

      // Server may also flag crisis
      if (data.crisis) {
        showCrisisBanner();
      }
    } else {
      renderMessage('assistant', 'I\'m having trouble connecting right now. Please try again in a moment. Remember, you can always reach out to a helpline if you need immediate support.');
    }
  } catch {
    hideTypingIndicator();
    renderMessage('assistant', 'Connection lost. Your wellbeing matters — if you need immediate help, please call the crisis helpline shown below.');
  }

  isSending = false;
}

/**
 * Renders a chat message bubble into the messages container.
 * Uses textContent exclusively — no innerHTML with user data.
 * @param {'user' | 'assistant'} role - Who sent the message.
 * @param {string} content - The message text.
 * @returns {void}
 */
function renderMessage(role, content) {
  const container = document.getElementById('chat-messages');
  if (!container) return;

  const wrapper = document.createElement('div');
  wrapper.className = `chat-bubble chat-${role}`;
  wrapper.setAttribute('aria-label', `${role === 'user' ? 'You' : 'Optezum'} said`);

  const label = document.createElement('span');
  label.className = 'chat-role-label';
  label.textContent = role === 'user' ? 'You' : 'Optezum';
  wrapper.appendChild(label);

  const body = document.createElement('p');
  body.className = 'chat-text';
  body.textContent = escapeHtml(content);
  wrapper.appendChild(body);

  const time = document.createElement('span');
  time.className = 'chat-time';
  time.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  wrapper.appendChild(time);

  container.appendChild(wrapper);
  scrollToBottom();
}

/**
 * Shows the typing indicator in the chat.
 * @returns {void}
 */
function showTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.classList.add('visible');
    indicator.setAttribute('aria-hidden', 'false');
  }
}

/**
 * Hides the typing indicator in the chat.
 * @returns {void}
 */
function hideTypingIndicator() {
  const indicator = document.getElementById('typing-indicator');
  if (indicator) {
    indicator.classList.remove('visible');
    indicator.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Performs client-side crisis keyword detection on user messages.
 * If a crisis keyword is found, immediately displays the helpline banner.
 * @param {string} text - The user's message text to check.
 * @returns {void}
 */
function checkCrisis(text) {
  const lower = text.toLowerCase();
  const detected = CRISIS_KEYWORDS.some((kw) => lower.includes(kw));
  if (detected) {
    showCrisisBanner();
  }
}

/**
 * Shows the crisis helpline banner with emergency contact information.
 * @returns {void}
 */
function showCrisisBanner() {
  const banner = document.getElementById('crisis-banner');
  if (banner) {
    banner.classList.add('visible');
    banner.setAttribute('aria-hidden', 'false');
    banner.focus();
  }
}

/**
 * Scrolls the chat container to the bottom to show the latest message.
 * @returns {void}
 */
function scrollToBottom() {
  const container = document.getElementById('chat-messages');
  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}
