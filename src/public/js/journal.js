/**
 * @module journal
 * @description Journal module for Optezum. Handles mood logging, form submission,
 * AI analysis requests, and rendering past entries.
 */


/** @type {number|null} Currently selected mood value (1-5). */
let selectedMood = null;

/** @type {string} Current search filter for past entries. */
let entrySearchQuery = '';

/**
 * Initializes the journal module — sets up mood selectors, form listeners,
 * and renders any existing past entries.
 * @returns {void}
 */
function initJournal() {
  setupMoodSelector();
  setupFormListener();
  setupStressSlider();
  setupCharCounter();
  setupEntrySearch();
  syncExamTypeFromSettings();
  setupReflectionPrompt();
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
        b.setAttribute('aria-checked', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
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
 * Syncs the stress slider label with its current value.
 * @returns {void}
 */
function setupStressSlider() {
  const slider = document.getElementById('stress-level');
  const label = document.getElementById('stressValue');
  if (!slider || !label) return;

  const update = () => {
    label.textContent = slider.value;
  };
  slider.addEventListener('input', update);
  update();
}

/**
 * Updates the journal textarea character counter.
 * @returns {void}
 */
function setupCharCounter() {
  const textarea = document.getElementById('journal-text');
  const counter = document.getElementById('charCount');
  if (!textarea || !counter) return;

  textarea.addEventListener('input', () => {
    counter.textContent = String(textarea.value.length);
  });
}

/**
 * Post-study reflection prompts rotated on button click.
 * @type {string[]}
 */
const REFLECTION_PROMPTS = [
  'What topic did you study today, and how confident do you feel about it?',
  'What was the hardest part of today\'s study session, and why?',
  'Did anything distract you today? How can you reduce that tomorrow?',
  'Name one thing you understood better today than yesterday.',
  'How did your energy level change during study? What helped or hurt?',
  'What would you tell a friend who had the same study day as you?',
  'If you could redo one hour of today, what would you change?',
];

/**
 * Sets up the reflection prompt button for post-study journaling.
 * @returns {void}
 */
function setupReflectionPrompt() {
  const btn = document.getElementById('reflection-prompt-btn');
  const textarea = document.getElementById('journal-text');
  if (!btn || !textarea) return;

  btn.addEventListener('click', () => {
    const prompt = REFLECTION_PROMPTS[Math.floor(Math.random() * REFLECTION_PROMPTS.length)];
    textarea.value = prompt + (textarea.value ? `\n\n${textarea.value}` : '');
    textarea.focus();
    const counter = document.getElementById('charCount');
    if (counter) counter.textContent = String(textarea.value.length);
  });
}

/**
 * Sets up search/filter for past journal entries.
 * @returns {void}
 */
function setupEntrySearch() {
  const searchInput = document.getElementById('entry-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    entrySearchQuery = searchInput.value.trim().toLowerCase();
    renderPastEntries();
  });
}

/**
 * Pre-selects exam type from saved settings.
 * @returns {void}
 */
function syncExamTypeFromSettings() {
  if (typeof getSettings !== 'function') return;
  const settings = getSettings();
  const examSelect = document.getElementById('exam-type');
  if (examSelect && settings.examType) {
    examSelect.value = settings.examType;
  }
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

  const journalText = sanitizeInput(journalTextarea.value);

  const data = {
    entry: journalText,
    journalText,
    mood: selectedMood,
    stressLevel: parseInt(stressSlider.value, 10),
    stress: parseInt(stressSlider.value, 10),
    sleepHours: parseFloat(sleepInput.value) || 0,
    studyHours: parseFloat(studyInput.value) || 0,
    examType: examSelect.value,
  };

  const validation = validateJournalForm(data);
  if (!validation.valid) {
    if (errorSpan) {
      errorSpan.textContent = validation.errors[0].message;
    }
    return;
  }

  if (errorSpan) errorSpan.textContent = '';

  // Persist exam type preference
  if (typeof getSettings === 'function' && typeof saveSettings === 'function' && data.examType) {
    const settings = getSettings();
    settings.examType = data.examType;
    saveSettings(settings);
  }

  // Save to local storage
  const saved = saveEntry(data);
  if (!saved) {
    if (errorSpan) errorSpan.textContent = 'Failed to save entry. Please try again.';
    return;
  }

  // Update UI
  submitBtn.disabled = true;
  submitBtn.textContent = 'Analyzing...';
  showAnalysisLoading(true);

  try {
    const response = await fetch('/api/analyze-journal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        entry: data.entry,
        mood: data.mood,
        stressLevel: data.stressLevel,
        sleepHours: data.sleepHours,
        studyHours: data.studyHours,
        examType: data.examType,
      }),
    });

    showAnalysisLoading(false);

    if (response.ok) {
      const analysis = await response.json();
      if (analysis.crisis) {
        renderCrisisAnalysis(analysis);
      } else {
        renderAnalysis(analysis);
      }
    } else {
      renderAnalysis({
        emotionalState: 'Entry saved! AI analysis is currently unavailable.',
        recommendations: ['Take a short break', 'Practice deep breathing', 'Stay hydrated'],
      });
    }
  } catch {
    showAnalysisLoading(false);
    renderAnalysis({
      emotionalState: 'Entry saved locally. Connect to the internet for AI insights.',
      recommendations: ['Review your past entries', 'Try a mindfulness exercise'],
    });
  }

  // Reset form
  submitBtn.disabled = false;
  submitBtn.textContent = 'Analyze with AI';
  journalTextarea.value = '';
  const charCount = document.getElementById('charCount');
  if (charCount) charCount.textContent = '0';
  selectedMood = null;
  document.querySelectorAll('.mood-btn').forEach((b) => {
    b.classList.remove('active');
    b.setAttribute('aria-checked', 'false');
  });

  if (typeof updateStreak === 'function') updateStreak();
  renderPastEntries();
}

/**
 * Shows or hides the analysis loading card.
 * @param {boolean} loading - Whether loading state is active.
 * @returns {void}
 */
function showAnalysisLoading(loading) {
  const loadingCard = document.getElementById('analysisLoading');
  const analysisCard = document.getElementById('analysisCard');
  if (loadingCard) loadingCard.classList.toggle('is-hidden', !loading);
  if (analysisCard && loading) analysisCard.classList.add('is-hidden');
}

/**
 * Renders crisis helpline information in the analysis area.
 * @param {object} data - Crisis response from the API.
 * @returns {void}
 */
function renderCrisisAnalysis(data) {
  const analysisCard = document.getElementById('analysisCard');
  const container = document.getElementById('analysis-results');
  if (!container) return;

  if (analysisCard) analysisCard.classList.remove('is-hidden');

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const heading = document.createElement('h3');
  heading.textContent = 'Your Safety Matters';
  heading.className = 'analysis-heading crisis-heading';
  container.appendChild(heading);

  const msg = document.createElement('p');
  msg.className = 'analysis-summary';
  msg.textContent = data.message || 'Please reach out to a trained professional right now.';
  container.appendChild(msg);

  if (data.helplines && data.helplines.length > 0) {
    const list = document.createElement('ul');
    list.className = 'suggestions-list crisis-helplines';
    data.helplines.forEach((line) => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `tel:${line.number.replace(/-/g, '')}`;
      link.textContent = `${line.name}: ${line.number}`;
      li.appendChild(link);
      if (line.description) {
        li.appendChild(document.createTextNode(` — ${line.description}`));
      }
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  if (data.disclaimer) {
    const disclaimer = document.createElement('p');
    disclaimer.className = 'crisis-disclaimer';
    disclaimer.textContent = data.disclaimer;
    container.appendChild(disclaimer);
  }
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
  const analysisCard = document.getElementById('analysisCard');
  const container = document.getElementById('analysis-results');
  if (!container) return;

  if (analysisCard) analysisCard.classList.remove('is-hidden');

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const summary = data.emotionalState || data.summary || data.stressAnalysis || 'Analysis complete.';
  const suggestions = data.recommendations || data.coping_suggestions || data.suggestions || [];
  const affirmation = data.positiveAffirmation || data.affirmation;
  const wellnessScore = data.overallWellnessScore || data.mood_score;

  const summaryHeading = document.createElement('h3');
  summaryHeading.textContent = 'AI Analysis';
  summaryHeading.className = 'analysis-heading';
  container.appendChild(summaryHeading);

  const summaryP = document.createElement('p');
  summaryP.textContent = escapeHtml(summary);
  summaryP.className = 'analysis-summary';
  container.appendChild(summaryP);

  if (data.stressAnalysis) {
    const stressP = document.createElement('p');
    stressP.className = 'analysis-detail';
    stressP.textContent = escapeHtml(data.stressAnalysis);
    container.appendChild(stressP);
  }

  if (data.sleepAssessment) {
    const sleepP = document.createElement('p');
    sleepP.className = 'analysis-detail';
    sleepP.textContent = `Sleep: ${escapeHtml(data.sleepAssessment)}`;
    container.appendChild(sleepP);
  }

  if (data.studyPatternInsight) {
    const studyP = document.createElement('p');
    studyP.className = 'analysis-detail';
    studyP.textContent = `Study: ${escapeHtml(data.studyPatternInsight)}`;
    container.appendChild(studyP);
  }

  if (wellnessScore !== undefined && wellnessScore !== null) {
    const scoreBadge = document.createElement('span');
    scoreBadge.className = 'trend-badge trend-stable';
    scoreBadge.textContent = `Wellness Score: ${wellnessScore}/10`;
    container.appendChild(scoreBadge);
  }

  if (data.emotional_patterns && data.emotional_patterns.length > 0) {
    const patternsHeading = document.createElement('h4');
    patternsHeading.textContent = 'Emotional Patterns';
    patternsHeading.className = 'suggestions-heading';
    container.appendChild(patternsHeading);

    const patternsList = document.createElement('ul');
    patternsList.className = 'suggestions-list';
    data.emotional_patterns.forEach((p) => {
      const li = document.createElement('li');
      li.textContent = escapeHtml(p);
      patternsList.appendChild(li);
    });
    container.appendChild(patternsList);
  }

  if (data.stress_triggers && data.stress_triggers.length > 0) {
    const triggersHeading = document.createElement('h4');
    triggersHeading.textContent = 'Stress Triggers';
    triggersHeading.className = 'suggestions-heading';
    container.appendChild(triggersHeading);

    const triggersList = document.createElement('ul');
    triggersList.className = 'suggestions-list';
    data.stress_triggers.forEach((t) => {
      const li = document.createElement('li');
      li.textContent = escapeHtml(t);
      triggersList.appendChild(li);
    });
    container.appendChild(triggersList);
  }

  if (suggestions.length > 0) {
    const sugHeading = document.createElement('h4');
    sugHeading.textContent = 'Coping Suggestions';
    sugHeading.className = 'suggestions-heading';
    container.appendChild(sugHeading);

    const list = document.createElement('ul');
    list.className = 'suggestions-list';
    suggestions.forEach((s) => {
      const li = document.createElement('li');
      li.textContent = escapeHtml(s);
      list.appendChild(li);
    });
    container.appendChild(list);
  }

  if (affirmation) {
    const affBlock = document.createElement('blockquote');
    affBlock.className = 'analysis-affirmation';
    affBlock.textContent = escapeHtml(affirmation);
    container.appendChild(affBlock);
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

  const entries = getEntries().filter((entry) => {
    if (!entrySearchQuery) return true;
    const text = (entry.journalText || entry.entry || '').toLowerCase();
    const exam = (entry.examType || '').toLowerCase();
    return text.includes(entrySearchQuery) || exam.includes(entrySearchQuery);
  });
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
    metaDiv.textContent = `Stress: ${entry.stress || entry.stressLevel}/10 · Sleep: ${entry.sleepHours}h · Study: ${entry.studyHours}h · ${entry.examType}`;
    card.appendChild(metaDiv);

    const entryText = entry.journalText || entry.entry || '';
    const textP = document.createElement('p');
    textP.className = 'entry-text';
    textP.textContent = escapeHtml(entryText).slice(0, 200);
    if (entryText.length > 200) {
      const ellipsis = document.createTextNode('...');
      textP.appendChild(ellipsis);
    }
    card.appendChild(textP);

    container.appendChild(card);
  });
}
