/**
 * @module journal
 * @description Journal module for Optezum. Handles mood logging, form submission,
 * AI analysis requests, and rendering past entries.
 */


/** @type {number|null} Currently selected mood value (1-5). */
let selectedMood = null;

/**
 * Initializes the journal module — sets up mood selectors, form listeners,
 * and renders any existing past entries.
 * @returns {void}
 */
function initJournal() {
  setupMoodSelector();
  setupFormListener();
  renderPastEntries();
  setTodayDate();
}

/**
 * Sets the journal date display to today's date.
 * @returns {void}
 */
function setTodayDate() {
  const dateEl = document.getElementById('journal-date');
  if (dateEl) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString('en-IN', options);
  }
}

/**
 * Sets up the mood emoji button selector with keyboard and click support.
 * Updates aria-selected attributes on selection.
 * @returns {void}
 */
function setupMoodSelector() {
  const buttons = document.querySelectorAll('.mood-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
      selectedMood = parseInt(btn.dataset.mood, 10);
    });

    btn.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        btn.click();
      }
    });
  });
}

/**
 * Sets up the journal form submission listener with validation and API call.
 * @returns {void}
 */
function setupFormListener() {
  const form = document.getElementById('journal-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleJournalSubmit();
  });
}

/**
 * Handles journal form submission: validates input, saves entry to storage,
 * sends data to the AI analysis API, and renders results.
 * @returns {Promise<void>}
 */
async function handleJournalSubmit() {
  const stressSlider = document.getElementById('stress-level');
  const sleepInput = document.getElementById('sleep-hours');
  const studyInput = document.getElementById('study-hours');
  const examSelect = document.getElementById('exam-type');
  const journalTextarea = document.getElementById('journal-text');
  const errorSpan = document.getElementById('journal-error');
  const submitBtn = document.getElementById('journal-submit');

  const data = {
    mood: selectedMood,
    stress: parseInt(stressSlider.value, 10),
    sleepHours: parseFloat(sleepInput.value) || 0,
    studyHours: parseFloat(studyInput.value) || 0,
    examType: examSelect.value,
    journalText: sanitizeInput(journalTextarea.value),
  };

  const validation = validateJournalForm(data);
  if (!validation.valid) {
    if (errorSpan) {
      errorSpan.textContent = validation.errors[0];
    }
    return;
  }

  if (errorSpan) errorSpan.textContent = '';

  // Save to local storage
  const saved = saveEntry(data);
  if (!saved) {
    if (errorSpan) errorSpan.textContent = 'Failed to save entry. Please try again.';
    return;
  }

  // Update UI
  submitBtn.disabled = true;
  submitBtn.textContent = 'Analyzing...';

  try {
    const response = await fetch('/api/analyze-journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      const analysis = await response.json();
      renderAnalysis(analysis);
    } else {
      renderAnalysis({
        summary: 'Entry saved! AI analysis is currently unavailable.',
        suggestions: ['Take a short break', 'Practice deep breathing', 'Stay hydrated'],
        moodTrend: 'stable',
      });
    }
  } catch {
    renderAnalysis({
      summary: 'Entry saved locally. Connect to the internet for AI insights.',
      suggestions: ['Review your past entries', 'Try a mindfulness exercise'],
      moodTrend: 'unknown',
    });
  }

  // Reset form
  submitBtn.disabled = false;
  submitBtn.textContent = 'Save & Analyze';
  journalTextarea.value = '';
  selectedMood = null;
  document.querySelectorAll('.mood-btn').forEach((b) => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  renderPastEntries();
}

/**
 * Renders AI analysis results into the analysis card.
 * Uses textContent exclusively — never innerHTML with user data.
 * @param {object} data - The analysis response from the API.
 * @param {string} data.summary - AI-generated summary text.
 * @param {string[]} data.suggestions - Array of suggestion strings.
 * @param {string} data.moodTrend - Trend direction (up/down/stable/unknown).
 * @returns {void}
 */
function renderAnalysis(data) {
  const container = document.getElementById('analysis-results');
  if (!container) return;

  // Clear previous analysis
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  container.classList.add('visible');

  // Summary
  const summaryHeading = document.createElement('h3');
  summaryHeading.textContent = 'AI Analysis';
  summaryHeading.className = 'analysis-heading';
  container.appendChild(summaryHeading);

  const summaryP = document.createElement('p');
  summaryP.textContent = escapeHtml(data.summary || 'No summary available.');
  summaryP.className = 'analysis-summary';
  container.appendChild(summaryP);

  // Mood trend badge
  if (data.moodTrend && data.moodTrend !== 'unknown') {
    const badge = document.createElement('span');
    badge.className = `trend-badge trend-${data.moodTrend}`;
    const trendLabels = { up: '↑ Improving', down: '↓ Declining', stable: '→ Stable' };
    badge.textContent = trendLabels[data.moodTrend] || data.moodTrend;
    container.appendChild(badge);
  }

  // Suggestions
  if (data.suggestions && data.suggestions.length > 0) {
    const sugHeading = document.createElement('h4');
    sugHeading.textContent = 'Suggestions';
    sugHeading.className = 'suggestions-heading';
    container.appendChild(sugHeading);

    const list = document.createElement('ul');
    list.className = 'suggestions-list';
    data.suggestions.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = escapeHtml(s);
      list.appendChild(li);
    });
    container.appendChild(list);
  }
}

/**
 * Renders the list of past journal entries below the journal form.
 * Uses DOM API (textContent) only — never innerHTML.
 * @returns {void}
 */
function renderPastEntries() {
  const container = document.getElementById('past-entries');
  if (!container) return;

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const entries = getEntries();
  if (entries.length === 0) {
    const emptyMsg = document.createElement('p');
    emptyMsg.className = 'empty-state';
    emptyMsg.textContent = 'No entries yet. Start journaling to track your wellness!';
    container.appendChild(emptyMsg);
    return;
  }

  const moodEmojis = { 1: '😫', 2: '😟', 3: '😐', 4: '🙂', 5: '😄' };

  entries.slice(0, 20).forEach((entry) => {
    const card = document.createElement('article');
    card.className = 'entry-card glass-card';
    card.setAttribute('aria-label', `Journal entry from ${new Date(entry.timestamp).toLocaleDateString()}`);

    const header = document.createElement('div');
    header.className = 'entry-header';

    const dateSpan = document.createElement('span');
    dateSpan.className = 'entry-date';
    dateSpan.textContent = new Date(entry.timestamp).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    header.appendChild(dateSpan);

    const moodSpan = document.createElement('span');
    moodSpan.className = 'entry-mood';
    moodSpan.textContent = moodEmojis[entry.mood] || '😐';
    moodSpan.setAttribute('aria-label', `Mood: ${entry.mood} out of 5`);
    header.appendChild(moodSpan);

    card.appendChild(header);

    const metaDiv = document.createElement('div');
    metaDiv.className = 'entry-meta';
    metaDiv.textContent = `Stress: ${entry.stress}/10 · Sleep: ${entry.sleepHours}h · Study: ${entry.studyHours}h · ${entry.examType}`;
    card.appendChild(metaDiv);

    const textP = document.createElement('p');
    textP.className = 'entry-text';
    textP.textContent = escapeHtml(entry.journalText).slice(0, 200);
    if (entry.journalText.length > 200) {
      const ellipsis = document.createTextNode('...');
      textP.appendChild(ellipsis);
    }
    card.appendChild(textP);

    container.appendChild(card);
  });
}
