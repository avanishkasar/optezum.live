/**
 * @module mindfulness
 * @description Mindfulness and coping tools module for Optezum.
 * Includes breathing exercises, 5-4-3-2-1 grounding, Pomodoro timer,
 * and motivational quotes.
 */


/** @type {number|null} Active breathing animation interval ID. */
let breathingInterval = null;

/** @type {number|null} Active Pomodoro timer interval ID. */
let pomodoroInterval = null;

/** @type {boolean} Whether the Pomodoro is on a break phase. */
let isBreakPhase = false;

/** @type {number} Current grounding step (5 down to 1). */
let groundingStep = 0;

/**
 * Breathing technique configurations.
 * Each has inhale, hold, and exhale durations in seconds.
 * @type {Record<string, {inhale: number, hold: number, exhale: number, holdAfter?: number, label: string}>}
 */
const TECHNIQUES = {
  '4-7-8': { inhale: 4, hold: 7, exhale: 8, holdAfter: 0, label: '4-7-8 Relaxation' },
  'box': { inhale: 4, hold: 4, exhale: 4, holdAfter: 4, label: 'Box Breathing' },
  'deep-calm': { inhale: 5, hold: 5, exhale: 5, holdAfter: 0, label: 'Deep Calm' },
};

/**
 * 5-4-3-2-1 Grounding prompts for each sense/step.
 * @type {{ count: number, sense: string, prompt: string }[]}
 */
const GROUNDING_STEPS = [
  { count: 5, sense: 'See', prompt: 'Name 5 things you can SEE around you.' },
  { count: 4, sense: 'Touch', prompt: 'Name 4 things you can TOUCH or feel.' },
  { count: 3, sense: 'Hear', prompt: 'Name 3 things you can HEAR right now.' },
  { count: 2, sense: 'Smell', prompt: 'Name 2 things you can SMELL.' },
  { count: 1, sense: 'Taste', prompt: 'Name 1 thing you can TASTE.' },
];

/**
 * Initializes the mindfulness module — sets up technique selector,
 * breathing controls, grounding exercise, Pomodoro timer, and quote fetcher.
 * @returns {void}
 */
function initMindfulness() {
  setupBreathingControls();
  setupGroundingExercise();
  setupPomodoroTimer();
  setupQuoteFetcher();
}

/**
 * Sets up the breathing exercise controls: technique selector and start/stop buttons.
 * @returns {void}
 */
function setupBreathingControls() {
  const startBtn = document.getElementById('breathing-start');
  const stopBtn = document.getElementById('breathing-stop');
  const techniqueSelect = document.getElementById('breathing-technique');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      const tech = techniqueSelect ? techniqueSelect.value : '4-7-8';
      startBreathing(tech);
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      stopBreathing();
    });
  }
}

/**
 * Starts a breathing exercise animation with the given technique.
 * Controls the animated circle and displays phase labels (Inhale/Hold/Exhale).
 * @param {string} technique - The technique key ('4-7-8', 'box', 'deep-calm').
 * @returns {void}
 */
function startBreathing(technique) {
  stopBreathing(); // Clear any existing

  const config = TECHNIQUES[technique];
  if (!config) return;

  const circle = document.getElementById('breathing-circle');
  const phaseLabel = document.getElementById('breathing-phase');
  const timerLabel = document.getElementById('breathing-timer');
  const startBtn = document.getElementById('breathing-start');
  const stopBtn = document.getElementById('breathing-stop');

  if (startBtn) startBtn.classList.add('hidden');
  if (stopBtn) stopBtn.classList.remove('hidden');

  const phases = [
    { name: 'Inhale', duration: config.inhale, scale: 1.6 },
    { name: 'Hold', duration: config.hold, scale: 1.6 },
    { name: 'Exhale', duration: config.exhale, scale: 1 },
  ];

  if (config.holdAfter > 0) {
    phases.push({ name: 'Hold', duration: config.holdAfter, scale: 1 });
  }

  let phaseIdx = 0;
  let countdown = phases[0].duration;

  /**
   * Updates the breathing circle for the current phase.
   * @returns {void}
   */
  function updatePhase() {
    const phase = phases[phaseIdx];
    if (phaseLabel) phaseLabel.textContent = phase.name;
    if (circle) {
      circle.style.transform = `scale(${phase.scale})`;
      circle.style.transition = `transform ${phase.duration}s ease-in-out`;
    }
  }

  updatePhase();

  breathingInterval = setInterval(() => {
    countdown--;
    if (timerLabel) timerLabel.textContent = countdown;

    if (countdown <= 0) {
      phaseIdx = (phaseIdx + 1) % phases.length;
      countdown = phases[phaseIdx].duration;
      updatePhase();
    }
  }, 1000);
}

/**
 * Stops the current breathing exercise and resets the UI.
 * @returns {void}
 */
function stopBreathing() {
  if (breathingInterval) {
    clearInterval(breathingInterval);
    breathingInterval = null;
  }

  const circle = document.getElementById('breathing-circle');
  const phaseLabel = document.getElementById('breathing-phase');
  const timerLabel = document.getElementById('breathing-timer');
  const startBtn = document.getElementById('breathing-start');
  const stopBtn = document.getElementById('breathing-stop');

  if (circle) {
    circle.style.transform = 'scale(1)';
    circle.style.transition = 'transform 0.5s ease';
  }
  if (phaseLabel) phaseLabel.textContent = 'Ready';
  if (timerLabel) timerLabel.textContent = '';
  if (startBtn) startBtn.classList.remove('hidden');
  if (stopBtn) stopBtn.classList.add('hidden');
}

/**
 * Sets up the 5-4-3-2-1 grounding exercise buttons and display.
 * @returns {void}
 */
function setupGroundingExercise() {
  const startBtn = document.getElementById('grounding-start');
  const nextBtn = document.getElementById('grounding-next');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      groundingStep = 0;
      renderGroundingStep();
      startBtn.classList.add('hidden');
      if (nextBtn) nextBtn.classList.remove('hidden');
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      groundingStep++;
      if (groundingStep >= GROUNDING_STEPS.length) {
        finishGrounding();
      } else {
        renderGroundingStep();
      }
    });
  }
}

/**
 * Renders the current grounding exercise step into the UI.
 * @returns {void}
 */
function renderGroundingStep() {
  const promptEl = document.getElementById('grounding-prompt');
  const progressEl = document.getElementById('grounding-progress');

  if (!promptEl) return;

  const step = GROUNDING_STEPS[groundingStep];
  promptEl.textContent = step.prompt;

  if (progressEl) {
    progressEl.textContent = `Step ${groundingStep + 1} of 5 — ${step.sense}`;
  }
}

/**
 * Completes the grounding exercise and shows a completion message.
 * @returns {void}
 */
function finishGrounding() {
  const promptEl = document.getElementById('grounding-prompt');
  const progressEl = document.getElementById('grounding-progress');
  const nextBtn = document.getElementById('grounding-next');
  const startBtn = document.getElementById('grounding-start');

  if (promptEl) promptEl.textContent = '🌟 Well done! You\'re grounded and present. Take a deep breath.';
  if (progressEl) progressEl.textContent = 'Complete';
  if (nextBtn) nextBtn.classList.add('hidden');
  if (startBtn) {
    startBtn.classList.remove('hidden');
    startBtn.textContent = 'Restart';
  }
}

/**
 * Sets up the Pomodoro timer controls (start/stop/reset).
 * @returns {void}
 */
function setupPomodoroTimer() {
  const startBtn = document.getElementById('pomodoro-start');
  const stopBtn = document.getElementById('pomodoro-stop');
  const resetBtn = document.getElementById('pomodoro-reset');

  if (startBtn) {
    startBtn.addEventListener('click', () => {
      startPomodoro();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener('click', () => {
      stopPomodoro();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      resetPomodoro();
    });
  }
}

/**
 * Starts the Pomodoro timer: 25 min work, then 5 min break.
 * Displays a visual countdown in the timer element.
 * @returns {void}
 */
function startPomodoro() {
  stopPomodoro();

  const timerDisplay = document.getElementById('pomodoro-display');
  const statusLabel = document.getElementById('pomodoro-status');
  const startBtn = document.getElementById('pomodoro-start');
  const stopBtn = document.getElementById('pomodoro-stop');

  if (startBtn) startBtn.classList.add('hidden');
  if (stopBtn) stopBtn.classList.remove('hidden');

  const workDuration = (typeof getSettings === 'function' ? getSettings().pomodoroWork : 25) * 60;
  const breakDuration = (typeof getSettings === 'function' ? getSettings().pomodoroBreak : 5) * 60;
  let remaining = isBreakPhase ? breakDuration : workDuration;

  if (statusLabel) {
    statusLabel.textContent = isBreakPhase ? '☕ Break Time' : '📚 Focus Time';
  }

  /**
   * Formats seconds into MM:SS display.
   * @param {number} secs - Total seconds.
   * @returns {string} Formatted time string.
   */
  function formatTime(secs) {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  if (timerDisplay) timerDisplay.textContent = formatTime(remaining);

  pomodoroInterval = setInterval(() => {
    remaining--;
    if (timerDisplay) timerDisplay.textContent = formatTime(remaining);

    if (remaining <= 0) {
      clearInterval(pomodoroInterval);
      pomodoroInterval = null;

      if (!isBreakPhase) {
        isBreakPhase = true;
        if (statusLabel) statusLabel.textContent = '✅ Work session complete! Starting break...';
        setTimeout(() => startPomodoro(), 2000);
      } else {
        isBreakPhase = false;
        if (statusLabel) statusLabel.textContent = '🎉 Break over! Ready for another session.';
        if (startBtn) startBtn.classList.remove('hidden');
        if (stopBtn) stopBtn.classList.add('hidden');
      }
    }
  }, 1000);
}

/**
 * Stops the currently running Pomodoro timer without resetting.
 * @returns {void}
 */
function stopPomodoro() {
  if (pomodoroInterval) {
    clearInterval(pomodoroInterval);
    pomodoroInterval = null;
  }
  const startBtn = document.getElementById('pomodoro-start');
  const stopBtn = document.getElementById('pomodoro-stop');
  if (startBtn) startBtn.classList.remove('hidden');
  if (stopBtn) stopBtn.classList.add('hidden');
}

/**
 * Fully resets the Pomodoro timer to initial state.
 * @returns {void}
 */
function resetPomodoro() {
  stopPomodoro();
  isBreakPhase = false;
  const timerDisplay = document.getElementById('pomodoro-display');
  const statusLabel = document.getElementById('pomodoro-status');
  const settings = typeof getSettings === 'function' ? getSettings() : { pomodoroWork: 25 };
  if (timerDisplay) timerDisplay.textContent = `${String(settings.pomodoroWork).padStart(2, '0')}:00`;
  if (statusLabel) statusLabel.textContent = 'Ready to focus';
}

/**
 * Sets up the motivational quote fetcher button.
 * @returns {void}
 */
function setupQuoteFetcher() {
  const btn = document.getElementById('quote-refresh');
  if (btn) {
    btn.addEventListener('click', () => fetchMotivationalQuote());
  }
}

/**
 * Fetches an exam-specific motivational quote from the API
 * and renders it into the quote card.
 * @returns {Promise<void>}
 */
async function fetchMotivationalQuote() {
  const quoteText = document.getElementById('quote-text');
  const quoteAuthor = document.getElementById('quote-author');

  if (!quoteText) return;

  quoteText.textContent = 'Finding inspiration...';
  if (quoteAuthor) quoteAuthor.textContent = '';

  const fallbackQuotes = [
    { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
    { text: 'Believe you can and you\'re halfway there.', author: 'Theodore Roosevelt' },
    { text: 'It does not matter how slowly you go as long as you do not stop.', author: 'Confucius' },
    { text: 'Your limitation — it\'s only your imagination.', author: '' },
    { text: 'Difficult roads often lead to beautiful destinations.', author: '' },
    { text: 'The only way to do great work is to love what you do.', author: 'Steve Jobs' },
    { text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.', author: 'Winston Churchill' },
  ];

  try {
    const settings = typeof getSettings === 'function' ? getSettings() : {};
    const examType = settings.examType || 'NEET';
    const response = await fetch('/api/coping-strategy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'motivational-quote', stressType: 'motivational-quote', examType }),
    });

    if (response.ok) {
      const data = await response.json();
      quoteText.textContent = escapeHtml(data.quote || data.text || 'Keep going — you are stronger than you think.');
      if (quoteAuthor) quoteAuthor.textContent = data.author ? `— ${escapeHtml(data.author)}` : '';
    } else {
      const fallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
      quoteText.textContent = fallback.text;
      if (quoteAuthor) quoteAuthor.textContent = fallback.author ? `— ${fallback.author}` : '';
    }
  } catch {
    const fallback = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
    quoteText.textContent = fallback.text;
    if (quoteAuthor) quoteAuthor.textContent = fallback.author ? `— ${fallback.author}` : '';
  }
}
