/**
 * @file Main application orchestrator for Optezum
 * @description Initializes navigation, view switching, icon rendering, and all feature modules
 * @module app
 */
'use strict';

/* ========================================
   NAVIGATION & VIEW MANAGEMENT
   ======================================== */

/** @type {Object<string, {title: string, subtitle: string}>} View metadata */
const VIEW_META = {
  journal: { title: 'Daily Journal', subtitle: 'Record your thoughts and track your wellness' },
  chat: { title: 'Wellness Companion', subtitle: 'Chat with your AI support companion' },
  dashboard: { title: 'Mood Dashboard', subtitle: 'Visualize your emotional patterns' },
  mindfulness: { title: 'Mindfulness Tools', subtitle: 'Breathing exercises, grounding, and focus timers' },
  profile: { title: 'Profile & Settings', subtitle: 'Manage your data and exam countdown' },
};

/**
 * Switch to a specific view pane
 * @param {string} viewName - Name of the view to switch to
 */
function switchView(viewName) {
  const navBtns = document.querySelectorAll('.nav-btn');
  const viewPanes = document.querySelectorAll('.view-pane');
  const titleEl = document.getElementById('viewTitle');
  const subtitleEl = document.getElementById('viewSubtitle');

  // Update nav buttons
  navBtns.forEach((btn) => {
    const isActive = btn.getAttribute('data-view') === viewName;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });

  // Update view panes
  viewPanes.forEach((pane) => {
    const isActive = pane.id === `view-${viewName}`;
    pane.classList.toggle('active', isActive);
    if (isActive) {
      pane.removeAttribute('hidden');
    } else {
      pane.setAttribute('hidden', '');
    }
  });

  // Update header
  const meta = VIEW_META[viewName];
  if (meta && titleEl && subtitleEl) {
    titleEl.textContent = meta.title;
    subtitleEl.textContent = meta.subtitle;
  }

  // Close mobile sidebar
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) sidebar.classList.remove('open');
}

/**
 * Initialize navigation event listeners
 */
function initNavigation() {
  const navBtns = document.querySelectorAll('.nav-btn');
  navBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const viewName = btn.getAttribute('data-view');
      if (viewName) switchView(viewName);
    });
  });

  // Mobile menu toggle
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const sidebar = document.querySelector('.sidebar');
  if (mobileMenuBtn && sidebar) {
    mobileMenuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

/* ========================================
   ICON MANAGEMENT
   ======================================== */

/**
 * Initialize Lucide icons and setup observer for dynamic content
 */
function initIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();

    // MutationObserver to auto-create icons in dynamically added content
    const observer = new MutationObserver(() => {
      lucide.createIcons();
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

/* ========================================
   STREAK COUNTER
   ======================================== */

/**
 * Calculate and display current journaling streak
 */
function updateStreak() {
  if (typeof getEntries !== 'function') return;

  const entries = getEntries();
  const streakEl = document.getElementById('streakCount');
  const streakStatEl = document.getElementById('streakStat');

  if (!entries.length) {
    if (streakEl) streakEl.textContent = '0';
    if (streakStatEl) streakStatEl.textContent = '0';
    return;
  }

  // Calculate streak
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 365; i++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - i);
    const dateStr = checkDate.toISOString().split('T')[0];

    const hasEntry = entries.some((e) => {
      const entryDate = new Date(e.timestamp);
      return entryDate.toISOString().split('T')[0] === dateStr;
    });

    if (hasEntry) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  if (streakEl) streakEl.textContent = String(streak);
  if (streakStatEl) streakStatEl.textContent = String(streak);
}

/* ========================================
   DATE DISPLAY
   ======================================== */

/**
 * Set today's date on the journal form
 */
function setTodayDate() {
  const dateEl = document.getElementById('journal-date');
  if (dateEl) {
    const today = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateEl.textContent = today.toLocaleDateString('en-IN', options);
  }
}

/* ========================================
   PROFILE: EXPORT, CLEAR, COUNTDOWN
   ======================================== */

/** Default syllabus subjects by exam type. @type {Record<string, string[]>} */
const SYLLABUS_SUBJECTS = {
  NEET: ['Physics', 'Chemistry', 'Biology'],
  JEE: ['Physics', 'Chemistry', 'Mathematics'],
  CUET: ['Language', 'Domain Subject', 'General Test'],
  CAT: ['VARC', 'DILR', 'Quantitative Aptitude'],
  GATE: ['Engineering Maths', 'Core Subject', 'Aptitude'],
  UPSC: ['Prelims GS', 'CSAT', 'Optional Subject'],
  default: ['Subject 1', 'Subject 2', 'Subject 3'],
};

/**
 * Initialize profile view features
 */
function initProfile() {
  // Export Data
  const btnExport = document.getElementById('btnExportData');
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      if (typeof getEntries !== 'function') return;
      const entries = getEntries();
      const blob = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `optezum-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Clear Data
  const btnClear = document.getElementById('btnClearData');
  if (btnClear) {
    btnClear.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete all your data? This cannot be undone.')) {
        if (typeof clearAllData === 'function') clearAllData();
        updateStreak();
        if (typeof renderPastEntries === 'function') renderPastEntries();
        if (typeof initDashboard === 'function') initDashboard();
      }
    });
  }

  // Exam Countdown
  const examDateInput = document.getElementById('examDateInput');
  if (examDateInput) {
    // Load saved date
    if (typeof getSettings === 'function') {
      const settings = getSettings();
      if (settings.examDate) {
        examDateInput.value = settings.examDate;
        updateCountdown(settings.examDate);
      }
    }

    examDateInput.addEventListener('change', () => {
      const date = examDateInput.value;
      if (typeof saveSettings === 'function') {
        const settings = typeof getSettings === 'function' ? getSettings() : {};
        settings.examDate = date;
        saveSettings(settings);
      }
      updateCountdown(date);
    });
  }

  initSyllabusProgress();
  initAnxietyAssessment();
}

/**
 * Renders and persists syllabus progress sliders.
 * @returns {void}
 */
function initSyllabusProgress() {
  const container = document.getElementById('syllabusProgress');
  if (!container || typeof getSettings !== 'function') return;

  const settings = getSettings();
  const examType = settings.examType || 'NEET';
  const subjects = SYLLABUS_SUBJECTS[examType] || SYLLABUS_SUBJECTS.default;
  if (!settings.syllabusProgress) settings.syllabusProgress = {};

  while (container.firstChild) container.removeChild(container.firstChild);

  subjects.forEach((subject) => {
    const value = settings.syllabusProgress[subject] ?? 0;

    const row = document.createElement('div');
    row.className = 'syllabus-row';

    const label = document.createElement('label');
    label.textContent = `${subject}: ${value}%`;
    label.setAttribute('for', `syllabus-${subject.replace(/\s+/g, '-')}`);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = '0';
    slider.max = '100';
    slider.value = String(value);
    slider.id = `syllabus-${subject.replace(/\s+/g, '-')}`;
    slider.setAttribute('aria-label', `${subject} syllabus progress`);

    slider.addEventListener('input', () => {
      const pct = parseInt(slider.value, 10);
      label.textContent = `${subject}: ${pct}%`;
      settings.syllabusProgress[subject] = pct;
      if (typeof saveSettings === 'function') saveSettings(settings);
    });

    row.appendChild(label);
    row.appendChild(slider);
    container.appendChild(row);
  });
}

/**
 * Handles pre-exam anxiety self-assessment form.
 * @returns {void}
 */
function initAnxietyAssessment() {
  const form = document.getElementById('anxiety-form');
  const resultEl = document.getElementById('anxietyResult');
  if (!form || !resultEl) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const scores = [1, 2, 3, 4, 5].map((i) => {
      const el = document.getElementById(`anxiety-q${i}`);
      return el ? parseInt(el.value, 10) : 3;
    });
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const level = avg <= 2 ? 'Low' : avg <= 3.5 ? 'Moderate' : 'High';

    resultEl.textContent = `Your anxiety level: ${level} (${avg.toFixed(1)}/5). Generating personalized tips...`;

    try {
      const settings = typeof getSettings === 'function' ? getSettings() : {};
      const response = await fetch('/api/coping-strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stressType: `pre-exam anxiety (${level.toLowerCase()})`,
          examType: settings.examType || 'NEET',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const tip = data.motivationalMessage || data.quote || data.text || 'Try a breathing exercise and break your study into smaller chunks.';
        resultEl.textContent = `Anxiety level: ${level} (${avg.toFixed(1)}/5). ${tip}`;
      } else {
        resultEl.textContent = `Anxiety level: ${level} (${avg.toFixed(1)}/5). Consider a mindfulness exercise or talking to your wellness companion.`;
      }
    } catch {
      resultEl.textContent = `Anxiety level: ${level} (${avg.toFixed(1)}/5). Consider a mindfulness exercise or talking to your wellness companion.`;
    }
  });
}

/**
 * Update the exam countdown display
 * @param {string} dateStr - ISO date string for the exam date
 */
function updateCountdown(dateStr) {
  const display = document.getElementById('countdownDisplay');
  if (!display || !dateStr) return;

  const examDate = new Date(dateStr);
  const now = new Date();
  const diff = examDate - now;

  if (diff <= 0) {
    display.textContent = '';
    const msg = document.createElement('p');
    msg.style.color = 'var(--accent)';
    msg.style.fontWeight = '600';
    msg.textContent = 'Exam day has arrived! You\'ve got this! 💪';
    display.appendChild(msg);
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  display.innerHTML = '';
  const numEl = document.createElement('div');
  numEl.className = 'countdown-num';
  numEl.textContent = `${days}d ${hours}h`;

  const labelEl = document.createElement('div');
  labelEl.className = 'countdown-label';
  labelEl.textContent = 'until your exam';

  display.appendChild(numEl);
  display.appendChild(labelEl);
}

/* ========================================
   INITIALIZATION
   ======================================== */

/**
 * Main app initialization — called on DOMContentLoaded
 */
function initApp() {
  initIcons();
  initNavigation();
  setTodayDate();
  updateStreak();
  initProfile();

  // Initialize feature modules (defined in their own files)
  if (typeof initJournal === 'function') initJournal();
  if (typeof initChat === 'function') initChat();
  if (typeof initDashboard === 'function') initDashboard();
  if (typeof initMindfulness === 'function') initMindfulness();
}

// Boot
document.addEventListener('DOMContentLoaded', initApp);
