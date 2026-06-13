# 🧠 Optezum — AI-Powered Mental Wellness Tracker for Students

> An empathetic, always-available digital companion that helps students monitor and improve their mental well-being during high-stakes board exams and competitive entrance tests (NEET, JEE, CUET, CAT, GATE, UPSC).

[![CI — Lint & Test](https://github.com/avanishkasar/optezum.live/actions/workflows/ci.yml/badge.svg)](https://github.com/avanishkasar/optezum.live/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

🌐 **Live Demo:** [https://www.optezum.live](https://www.optezum.live)
📦 **Repository:** [github.com/avanishkasar/optezum.live](https://github.com/avanishkasar/optezum.live)

---

## 📋 Table of Contents

- [Problem Statement](#-problem-statement)
- [Solution Overview](#-solution-overview)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [API Reference](#-api-reference)
- [Testing](#-testing)
- [Security](#-security)
- [Accessibility](#-accessibility)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Safety & Ethics](#-safety--ethics)
- [License](#-license)

---

## 🎯 Problem Statement

Students preparing for high-stakes competitive exams (NEET, JEE, CUET, CAT, GATE, UPSC) often face severe **stress, burnout, and self-doubt**. Standard wellness trackers fail to understand the unique pressures of academic preparation. Optezum uses **Generative AI** to analyze open-ended daily journaling and mood logs, uncovering hidden stress triggers and emotional patterns that standard trackers miss — providing hyper-personalized, contextual wellness support.

---

## 💡 Solution Overview

Optezum acts as an **empathetic digital companion** throughout a student's academic journey by:

1. **Analyzing journal entries** with Google Gemini AI to detect hidden stress triggers, cognitive distortions, and emotional patterns
2. **Providing a conversational AI companion** for real-time coping strategies, adaptive mindfulness, and motivational encouragement
3. **Visualizing mood trends** across days/weeks to help students recognize their emotional patterns
4. **Offering guided wellness exercises** — breathing techniques, grounding exercises, and study-break timers
5. **Personalizing everything** to the specific exam (NEET vs JEE vs CUET etc.) and the student's unique emotional profile

---

## ✨ Features

### 📝 Smart Journal & Mood Logger
- Free-text journaling with AI analysis
- 5-point mood scale with emoji selectors
- Stress level, sleep, and study hour tracking
- Exam-specific context tagging
- Past entry history with search

### 💬 AI Wellness Companion (Chat)
- Conversational AI powered by Google Gemini
- Context-aware responses based on mood history
- Real-time coping strategies and motivational support
- Crisis detection with immediate helpline display
- Empathetic, non-clinical communication style

### 📊 Mood Analytics Dashboard
- 7-day and 30-day mood trend visualization
- Stress heatmap by day of week
- Sleep vs. mood correlation display
- AI-generated weekly insight reports
- Streak tracking and stats

### 🧘 Adaptive Mindfulness Tools
- Guided breathing exercises (4-7-8, Box Breathing, Deep Calm)
- 5-4-3-2-1 sensory grounding exercise
- Pomodoro study timer with wellness breaks
- Exam-specific motivational quotes

### 👤 Student Profile & Exam Support
- Exam countdown timer
- Syllabus progress tracker by subject
- Pre-exam anxiety self-assessment with AI coping tips
- Post-study reflection prompts in the journal
- Data export (JSON)
- Privacy-first local storage
- Customizable settings

### 🎯 Problem Statement Alignment

Optezum directly addresses every core requirement:

| Requirement | How Optezum Delivers |
|---|---|
| **Daily journaling & mood logs** | Smart journal with 5-point mood scale, stress, sleep, and study tracking |
| **Stress triggers & emotional patterns** | Gemini AI analysis surfaces hidden triggers, cognitive distortions, and weekly patterns |
| **Coping strategies** | Personalized recommendations after every journal entry and via the AI companion |
| **Adaptive mindfulness** | Guided breathing (4-7-8, Box, Deep Calm), grounding, and Pomodoro wellness breaks |
| **Motivational encouragement** | Exam-specific quotes, affirmations, and empathetic companion chat |
| **Empathetic digital companion** | Context-aware Gemini chat with crisis-safe helpline routing |
| **Academic journey support** | Exam tags (NEET/JEE/CUET/CAT/GATE/UPSC), countdown, syllabus tracker, anxiety check |

---

## 🛠 Tech Stack

| Component | Technology |
|-----------|-----------|
| **Frontend** | HTML5, Vanilla JavaScript (ES2022), CSS3 |
| **Backend** | Node.js, Express.js |
| **AI Engine** | Google Gemini API (`@google/generative-ai`) |
| **Data Storage** | localStorage (privacy-first, no external DB) |
| **Security** | Helmet.js, express-rate-limit, CSP headers |
| **Testing** | Jest, Supertest |
| **Linting** | ESLint |
| **CI/CD** | GitHub Actions |
| **Deployment** | Railway |

---

## 🏗 Architecture

```
┌──────────────────────────────────────────────┐
│                  CLIENT                       │
│  ┌─────────┐ ┌──────┐ ┌─────────┐ ┌────────┐│
│  │ Journal │ │ Chat │ │Dashboard│ │Mindful ││
│  └────┬────┘ └──┬───┘ └────┬────┘ └────────┘│
│       │         │          │                  │
│  ┌────┴─────────┴──────────┴──────────────┐  │
│  │        storage.js (localStorage)        │  │
│  └────────────────────────────────────────┘  │
└──────────────────┬───────────────────────────┘
                   │ fetch API
┌──────────────────┴───────────────────────────┐
│                  SERVER                       │
│  ┌────────────────────────────────────────┐  │
│  │  Express.js + Helmet + Rate Limiter    │  │
│  │  ┌────────────────────────────────┐    │  │
│  │  │      Validation Middleware      │    │  │
│  │  └────────────┬───────────────────┘    │  │
│  │               │                        │  │
│  │  ┌────────────┴───────────────────┐    │  │
│  │  │     Gemini AI Service          │    │  │
│  │  │  • Journal Analysis            │    │  │
│  │  │  • Chat Companion              │    │  │
│  │  │  • Weekly Insights             │    │  │
│  │  │  • Coping Strategies           │    │  │
│  │  │  • Crisis Detection            │    │  │
│  │  └────────────┬───────────────────┘    │  │
│  └───────────────┼────────────────────────┘  │
└──────────────────┼───────────────────────────┘
                   │
         ┌─────────┴─────────┐
         │  Google Gemini API │
         │  (gemini-2.5-flash)│
         └───────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- Google Gemini API key ([Get one free](https://aistudio.google.com/))

### Installation

```bash
# Clone the repository
git clone https://github.com/avanishkasar/optezum.live.git
cd optezum.live

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env and add your GEMINI_API_KEY

# Start the development server
npm run dev

# Open in browser
# http://localhost:8080
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_API_KEY` | Google Gemini API key | ✅ |
| `PORT` | Server port (default: 8080) | ❌ |
| `NODE_ENV` | Environment mode | ❌ |

---

## 📡 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/analyze-journal` | POST | AI analysis of journal entry |
| `/api/chat` | POST | Conversational AI companion |
| `/api/weekly-insights` | POST | Weekly pattern analysis |
| `/api/coping-strategy` | POST | Personalized coping strategy |

---

## 🧪 Testing

```bash
# Run all tests with coverage
npm test

# Run specific test file
npx jest tests/unit/gemini.test.js
```

**Test Coverage:**
- Unit tests: Gemini service, sanitizer, validators, storage
- Integration tests: All API endpoints, error handling, security headers
- Crisis detection: Keyword matching, helpline response validation

---

## 🔒 Security

- **Helmet.js** with strict Content Security Policy
- **Rate limiting** (100 requests / 15 min per IP)
- **Input sanitization** — HTML stripping, length limits, type checking
- **No innerHTML** — all dynamic content rendered via `textContent`
- **Environment variables** for API keys (never hardcoded)
- **CORS** configured for production domains
- Static files served from dedicated `/public` directory only

---

## ♿ Accessibility

- **WCAG 2.1 AA** compliant design
- Full **ARIA** attributes on all interactive elements
- **Skip navigation** link for keyboard users
- **Semantic HTML5** landmarks (`<nav>`, `<main>`, `<header>`, `<footer>`)
- Visible **:focus-visible** indicators
- Proper heading hierarchy (H1→H2→H3)
- Color contrast ratios meeting 4.5:1 minimum
- `aria-live` regions for dynamic content updates
- All forms with associated `<label>` elements

---

## 🚢 Deployment

Deployed on Railway with automatic builds on push to `main`.

```bash
# Production start
npm start
```

---

## 📁 Project Structure

```
optezum.live/
├── .github/workflows/ci.yml     # CI pipeline
├── src/
│   ├── public/                  # Static frontend files
│   │   ├── index.html
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── app.js           # Main orchestrator
│   │       ├── journal.js       # Journal module
│   │       ├── chat.js          # Chat companion
│   │       ├── dashboard.js     # Mood analytics
│   │       ├── mindfulness.js   # Wellness tools
│   │       ├── storage.js       # localStorage wrapper
│   │       └── utils/
│   │           ├── sanitizer.js # XSS prevention
│   │           └── validators.js
│   └── server/
│       ├── server.js            # Express server
│       ├── routes/api.js        # API endpoints
│       ├── middleware/
│       │   ├── security.js      # Helmet, rate-limit
│       │   └── validation.js    # Input validation
│       └── services/gemini.js   # Gemini AI wrapper
├── tests/
│   ├── unit/                    # Unit tests
│   └── integration/             # API tests
├── .eslintrc.json
├── .prettierrc
├── .editorconfig
├── .env.example
├── jest.config.js
├── package.json
├── LICENSE
└── README.md
```

---

## ⚠️ Safety & Ethics

> **Optezum is NOT a substitute for professional mental health care.**

- **Crisis Detection**: The system monitors for self-harm indicators and immediately displays verified Indian helpline numbers
- **No Diagnosis**: The AI companion never provides medical diagnoses or treatment advice
- **Privacy-First**: All data stored locally in the browser — no external databases, no data collection
- **Helplines Available**:
  - iCall: **9152987821**
  - Vandrevala Foundation: **1860-2662-345**
  - AASRA: **9820466626**

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

Built with ❤️ for students, by [Avanish Kasar](https://github.com/avanishkasar)
