/**
 * @module dashboard
 * @description Dashboard module for Optezum. Renders mood trends (SVG),
 * stress heatmap, sleep-mood correlation, stats cards, and weekly AI insights.
 * All charts built with DOM/SVG — no external libraries.
 */


/** @type {'7' | '30'} Current chart range selection. */
let chartRange = '7';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

/**
 * Initializes the dashboard — renders all charts and stats,
 * and sets up the range toggle.
 * @returns {void}
 */
function initDashboard() {
  setupRangeToggle();
  setupInsightsRefresh();
  refreshDashboard();
}

/**
 * Refreshes all dashboard components with current data.
 * @returns {void}
 */
function refreshDashboard() {
  const days = parseInt(chartRange, 10);
  const entries = getRecentEntries(days);
  const allEntries = getEntries();

  renderMoodChart(entries);
  renderStressHeatmap(entries);
  renderCorrelation(entries);
  renderStats(allEntries);
}

/**
 * Sets up the refresh button for weekly AI insights.
 * @returns {void}
 */
function setupInsightsRefresh() {
  const btn = document.getElementById('btnRefreshInsights');
  if (btn) {
    btn.addEventListener('click', () => requestWeeklyInsights());
  }
}

/**
 * Sets up the 7-day / 30-day toggle buttons for chart range.
 * @returns {void}
 */
function setupRangeToggle() {
  const toggle7 = document.getElementById('range-7');
  const toggle30 = document.getElementById('range-30');

  if (toggle7) {
    toggle7.addEventListener('click', () => {
      chartRange = '7';
      toggle7.classList.add('active');
      toggle30?.classList.remove('active');
      toggle7.setAttribute('aria-checked', 'true');
      toggle30?.setAttribute('aria-checked', 'false');
      refreshDashboard();
    });
  }

  if (toggle30) {
    toggle30.addEventListener('click', () => {
      chartRange = '30';
      toggle30.classList.add('active');
      toggle7?.classList.remove('active');
      toggle30.setAttribute('aria-checked', 'true');
      toggle7?.setAttribute('aria-checked', 'false');
      refreshDashboard();
    });
  }
}

/**
 * Renders an SVG-based line chart showing mood trends over time.
 * @param {object[]} entries - Array of journal entries with mood and timestamp.
 * @returns {void}
 */
function renderMoodChart(entries) {
  const container = document.getElementById('mood-chart');
  if (!container) return;

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (entries.length < 2) {
    const msg = document.createElement('p');
    msg.className = 'chart-empty';
    msg.textContent = 'Need at least 2 entries to show mood trends.';
    container.appendChild(msg);
    return;
  }

  const sorted = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  const ui = window.APP_CONSTANTS?.UI ?? {};
  const width = ui.CHART_WIDTH ?? 560;
  const height = ui.CHART_HEIGHT ?? 200;
  const padding = ui.CHART_PADDING ?? 40;

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', 'Mood trend line chart');
  svg.classList.add('mood-chart-svg');

  const title = document.createElementNS(svgNS, 'title');
  title.textContent = `Mood trend over last ${chartRange} days`;
  svg.appendChild(title);

  for (let i = 1; i <= 5; i++) {
    const y = height - padding - ((i - 1) / 4) * (height - 2 * padding);
    const line = document.createElementNS(svgNS, 'line');
    line.setAttribute('x1', padding);
    line.setAttribute('y1', y);
    line.setAttribute('x2', width - padding);
    line.setAttribute('y2', y);
    line.setAttribute('stroke', '#222');
    line.setAttribute('stroke-width', '1');
    svg.appendChild(line);

    const label = document.createElementNS(svgNS, 'text');
    label.setAttribute('x', padding - 8);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.setAttribute('fill', '#666');
    label.setAttribute('font-size', '11');
    label.textContent = i;
    svg.appendChild(label);
  }

  const points = sorted.map((entry, idx) => {
    const x = padding + (idx / (sorted.length - 1)) * (width - 2 * padding);
    const y = height - padding - ((entry.mood - 1) / 4) * (height - 2 * padding);
    return { x, y, entry };
  });

  const defs = document.createElementNS(svgNS, 'defs');
  const gradient = document.createElementNS(svgNS, 'linearGradient');
  gradient.setAttribute('id', 'mood-gradient');
  gradient.setAttribute('x1', '0');
  gradient.setAttribute('y1', '0');
  gradient.setAttribute('x2', '0');
  gradient.setAttribute('y2', '1');
  const stop1 = document.createElementNS(svgNS, 'stop');
  stop1.setAttribute('offset', '0%');
  stop1.setAttribute('stop-color', '#4fd1c5');
  stop1.setAttribute('stop-opacity', '0.3');
  const stop2 = document.createElementNS(svgNS, 'stop');
  stop2.setAttribute('offset', '100%');
  stop2.setAttribute('stop-color', '#4fd1c5');
  stop2.setAttribute('stop-opacity', '0.0');
  gradient.appendChild(stop1);
  gradient.appendChild(stop2);
  defs.appendChild(gradient);
  svg.appendChild(defs);

  const areaPath = document.createElementNS(svgNS, 'path');
  let areaD = `M ${points[0].x} ${points[0].y}`;
  points.slice(1).forEach((p) => { areaD += ` L ${p.x} ${p.y}`; });
  areaD += ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
  areaPath.setAttribute('d', areaD);
  areaPath.setAttribute('fill', 'url(#mood-gradient)');
  svg.appendChild(areaPath);

  const linePath = document.createElementNS(svgNS, 'path');
  let lineD = `M ${points[0].x} ${points[0].y}`;
  points.slice(1).forEach((p) => { lineD += ` L ${p.x} ${p.y}`; });
  linePath.setAttribute('d', lineD);
  linePath.setAttribute('fill', 'none');
  linePath.setAttribute('stroke', '#4fd1c5');
  linePath.setAttribute('stroke-width', '2.5');
  linePath.setAttribute('stroke-linecap', 'round');
  linePath.setAttribute('stroke-linejoin', 'round');
  svg.appendChild(linePath);

  points.forEach((p) => {
    const circle = document.createElementNS(svgNS, 'circle');
    circle.setAttribute('cx', p.x);
    circle.setAttribute('cy', p.y);
    circle.setAttribute('r', '4');
    circle.setAttribute('fill', '#4fd1c5');
    circle.setAttribute('stroke', '#0a0a0a');
    circle.setAttribute('stroke-width', '2');

    const dotTitle = document.createElementNS(svgNS, 'title');
    dotTitle.textContent = `Mood: ${p.entry.mood}/5 on ${new Date(p.entry.timestamp).toLocaleDateString()}`;
    circle.appendChild(dotTitle);

    svg.appendChild(circle);
  });

  container.appendChild(svg);
}

/**
 * Converts JS day index (0=Sun) to Mon-first index (0=Mon).
 * @param {number} day - getDay() value.
 * @returns {number} Mon-first index.
 */
function toMondayFirstIndex(day) {
  return day === 0 ? 6 : day - 1;
}

/**
 * Renders a stress heatmap grouped by day of week.
 * @param {object[]} entries - Array of journal entries with stress and timestamp.
 * @returns {void}
 */
function renderStressHeatmap(entries) {
  const container = document.getElementById('stress-heatmap');
  if (!container) return;

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (entries.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'chart-empty';
    msg.textContent = 'No data for stress heatmap yet.';
    container.appendChild(msg);
    return;
  }

  const dayBuckets = Array.from({ length: 7 }, () => []);
  entries.forEach((entry) => {
    const stress = entry.stress ?? entry.stressLevel;
    if (typeof stress !== 'number') return;
    const dayIdx = toMondayFirstIndex(new Date(entry.timestamp).getDay());
    dayBuckets[dayIdx].push(stress);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'heatmap-week-grid';
  wrapper.setAttribute('role', 'img');
  wrapper.setAttribute('aria-label', 'Stress level heatmap by day of week');

  DAY_LABELS.forEach((label, idx) => {
    const col = document.createElement('div');
    col.className = 'heatmap-day-col';

    const dayLabel = document.createElement('span');
    dayLabel.className = 'heatmap-day-label';
    dayLabel.textContent = label;
    col.appendChild(dayLabel);

    const cell = document.createElement('div');
    cell.className = 'heatmap-cell heatmap-cell-week';

    const values = dayBuckets[idx];
    if (values.length === 0) {
      cell.style.backgroundColor = '#1a1a1a';
      cell.setAttribute('aria-label', `${label}: no data`);
      cell.setAttribute('title', `${label}: no entries`);
    } else {
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const ratio = (avg - 1) / 9;
      const r = Math.round(79 + ratio * (220 - 79));
      const g = Math.round(209 + ratio * (50 - 209));
      const b = Math.round(197 + ratio * (50 - 197));
      cell.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
      cell.setAttribute('aria-label', `${label}: average stress ${avg.toFixed(1)}/10`);
      cell.setAttribute('title', `${label}: avg stress ${avg.toFixed(1)}/10 (${values.length} entries)`);
    }

    col.appendChild(cell);
    wrapper.appendChild(col);
  });

  container.appendChild(wrapper);
}

/**
 * Renders a simple sleep vs mood correlation display.
 * @param {object[]} entries - Array of journal entries with sleepHours and mood.
 * @returns {void}
 */
function renderCorrelation(entries) {
  const container = document.getElementById('correlation-chart');
  if (!container) return;

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  if (entries.length === 0) {
    const msg = document.createElement('p');
    msg.className = 'chart-empty';
    msg.textContent = 'No data for correlation analysis yet.';
    container.appendChild(msg);
    return;
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'correlation-bars';
  wrapper.setAttribute('role', 'img');
  wrapper.setAttribute('aria-label', 'Sleep versus mood correlation chart');

  const sorted = [...entries].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)).slice(-14);

  sorted.forEach((entry) => {
    const pair = document.createElement('div');
    pair.className = 'corr-pair';

    const sleepBar = document.createElement('div');
    sleepBar.className = 'corr-bar corr-sleep';
    sleepBar.style.height = `${(entry.sleepHours / 12) * 100}%`;
    sleepBar.setAttribute('aria-label', `Sleep: ${entry.sleepHours} hours`);
    sleepBar.setAttribute('title', `Sleep: ${entry.sleepHours}h`);

    const moodBar = document.createElement('div');
    moodBar.className = 'corr-bar corr-mood';
    moodBar.style.height = `${(entry.mood / 5) * 100}%`;
    moodBar.setAttribute('aria-label', `Mood: ${entry.mood}/5`);
    moodBar.setAttribute('title', `Mood: ${entry.mood}/5`);

    pair.appendChild(sleepBar);
    pair.appendChild(moodBar);

    const dateLabel = document.createElement('span');
    dateLabel.className = 'corr-date';
    dateLabel.textContent = new Date(entry.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    pair.appendChild(dateLabel);

    wrapper.appendChild(pair);
  });

  const legend = document.createElement('div');
  legend.className = 'corr-legend';

  const sleepLeg = document.createElement('span');
  sleepLeg.className = 'legend-item legend-sleep';
  sleepLeg.textContent = '● Sleep';
  legend.appendChild(sleepLeg);

  const moodLeg = document.createElement('span');
  moodLeg.className = 'legend-item legend-mood';
  moodLeg.textContent = '● Mood';
  legend.appendChild(moodLeg);

  container.appendChild(wrapper);
  container.appendChild(legend);
}

/**
 * Renders summary stat cards: average mood, journal streak, total entries, avg sleep.
 * @param {object[]} entries - All journal entries.
 * @returns {void}
 */
function renderStats(entries) {
  const avgMoodEl = document.getElementById('avgMood');
  const streakEl = document.getElementById('streakStat');
  const totalEl = document.getElementById('totalEntries');
  const avgSleepEl = document.getElementById('avgSleep');

  if (totalEl) totalEl.textContent = String(entries.length);

  if (avgMoodEl) {
    if (entries.length === 0) {
      avgMoodEl.textContent = '—';
    } else {
      const avg = entries.reduce((sum, e) => sum + (e.mood || 0), 0) / entries.length;
      avgMoodEl.textContent = avg.toFixed(1);
    }
  }

  if (avgSleepEl) {
    if (entries.length === 0) {
      avgSleepEl.textContent = '—';
    } else {
      const avg = entries.reduce((sum, e) => sum + (e.sleepHours || 0), 0) / entries.length;
      avgSleepEl.textContent = `${avg.toFixed(1)}h`;
    }
  }

  if (streakEl) {
    streakEl.textContent = String(calculateStreak(entries));
  }
}

/**
 * Normalizes journal entries for API consumption.
 * @param {object[]} entries - Raw stored entries.
 * @returns {object[]} Entries with entry text field populated.
 */
function normalizeEntriesForApi(entries) {
  return entries.map((e) => ({
    ...e,
    entry: e.entry || e.journalText || '',
    stressLevel: e.stressLevel ?? e.stress,
  }));
}

/**
 * Requests weekly AI insights from the backend and renders them.
 * @returns {Promise<void>}
 */
async function requestWeeklyInsights() {
  const container = document.getElementById('weeklyInsightsContent');
  if (!container) return;

  const recent = getRecentEntries(7);
  if (recent.length < 3) {
    while (container.firstChild) container.removeChild(container.firstChild);
    const msg = document.createElement('p');
    msg.textContent = 'Log at least 3 entries this week to unlock AI-powered pattern insights.';
    container.appendChild(msg);
    return;
  }

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  const loadingP = document.createElement('p');
  loadingP.textContent = 'Generating weekly insights...';
  loadingP.className = 'loading-text';
  container.appendChild(loadingP);

  try {
    const entries = normalizeEntriesForApi(recent);
    const response = await fetch('/api/weekly-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entries }),
    });

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    if (response.ok) {
      const data = await response.json();

      if (data.crisis) {
        const crisisP = document.createElement('p');
        crisisP.textContent = data.message || 'Please reach out to a helpline if you need support.';
        container.appendChild(crisisP);
        return;
      }

      const heading = document.createElement('h3');
      heading.textContent = 'Weekly Pattern Insights';
      container.appendChild(heading);

      const insightText = data.insight || data.overallProgress || data.overall_trend || data.moodTrend;
      if (insightText) {
        const insightP = document.createElement('p');
        insightP.textContent = escapeHtml(insightText);
        container.appendChild(insightP);
      }

      const tips = data.tips || data.recommendations || data.weeklyRecommendations || data.key_patterns || [];
      if (tips.length > 0) {
        const tipsList = document.createElement('ul');
        tipsList.className = 'insights-tips';
        tips.forEach((tip) => {
          const li = document.createElement('li');
          li.textContent = escapeHtml(typeof tip === 'string' ? tip : JSON.stringify(tip));
          tipsList.appendChild(li);
        });
        container.appendChild(tipsList);
      }
    } else {
      const msg = document.createElement('p');
      msg.textContent = 'Weekly insights will appear after a few days of journaling.';
      container.appendChild(msg);
    }
  } catch {
    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }
    const msg = document.createElement('p');
    msg.textContent = 'Could not load insights. Check your connection and try again.';
    container.appendChild(msg);
  }
}
