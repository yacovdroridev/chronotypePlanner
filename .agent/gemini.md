# Chronotype Planner - Project Constitution

**Last Updated:** 2026-01-26

---

## 🎯 Project Identity

**Name:** Chronotype Planner (מבוך האנרגיה)  
**Purpose:** A React-based web application that helps users optimize their daily schedules based on their chronotype (biological clock patterns).

**North Star:** Enable users to plan their tasks according to their natural energy rhythms, improving productivity and well-being.

---

## 📊 Data Schemas

### User Profile Schema
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "base_chronotype": "bear | lion | wolf | dolphin",
  "created_at": "timestamp"
}
```

### Task Schema
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "description": "string",
  "duration": "string (e.g., '30 min', '1 hour')",
  "type": "string (e.g., 'focus', 'creative', 'admin')",
  "recurring": "boolean",
  "completed": "boolean",
  "created_at": "timestamp"
}
```

### Chronotype Types
```json
{
  "bear": {
    "name": "דוב",
    "title": "דוב - עוקב אחרי השמש",
    "icon": "🐻",
    "peak_hours": "10:00-14:00",
    "description": "Most productive during mid-morning to early afternoon"
  },
  "lion": {
    "name": "אריה",
    "title": "אריה - מנהיג הבוקר",
    "icon": "🦁",
    "peak_hours": "06:00-12:00",
    "description": "Early riser, most productive in the morning"
  },
  "wolf": {
    "name": "זאב",
    "title": "זאב - לוחם הלילה",
    "icon": "🐺",
    "peak_hours": "17:00-00:00",
    "description": "Night owl, most productive in the evening"
  },
  "dolphin": {
    "name": "דולפין",
    "title": "דולפין - ישן בחצי מוח",
    "icon": "🐬",
    "peak_hours": "Variable",
    "description": "Light sleeper, works best in short bursts"
  }
}
```

### Status Types (Daily Check-in)
```json
{
  "energized": {
    "title": "מלא/ה אנרגיה",
    "description": "Ready for challenging tasks"
  },
  "focused": {
    "title": "ממוקד/ת",
    "description": "Good for deep work"
  },
  "tired": {
    "title": "עייף/ה",
    "description": "Better for light tasks"
  },
  "creative": {
    "title": "יצירתי/ת",
    "description": "Ideal for brainstorming"
  }
}
```

---

## 🏗️ Architecture Invariants

### Technology Stack
- **Frontend:** React 19.2.3
- **Styling:** TailwindCSS 3.4.13
- **Authentication:** Supabase Auth
- **Database:** Supabase (PostgreSQL)
- **AI Integration:** Google Gemini 1.5 Flash
- **Routing:** React Router DOM 7.12.0
- **Markdown Rendering:** marked 17.0.1

### Component Structure
```
src/
├── components/
│   ├── common/          # Reusable UI components
│   │   └── ProgressBar.jsx
│   ├── layout/          # Layout wrappers
│   │   └── MainLayout.jsx
│   └── screens/         # Page-level components
│       ├── LoginScreen.jsx
│       ├── HubScreen.jsx
│       ├── QuizScreen.jsx
│       └── ResultScreen.jsx
├── context/             # React Context providers
│   └── AuthContext.js
├── hooks/               # Custom React hooks
│   ├── useChronotype.js
│   └── usePlanner.js
└── utils/               # Utility functions
    └── supabaseClient.js
```

### State Management Rules
1. **Authentication state** is managed globally via `AuthContext`
2. **User profile data** is fetched and cached in `AuthContext`
3. **Application view state** (login/hub/quiz/result) is managed in `App.js`
4. **Task management** uses optimistic UI updates with Supabase realtime

---

## 🔐 Security & Environment

### Required Environment Variables
```bash
REACT_APP_SUPABASE_URL=https://mtbwpweisvrvpwckkwaq.supabase.co
REACT_APP_SUPABASE_ANON_KEY=sb_publishable_oLyhvM3VOylqTHR3iAuMwg_E183UkPx
REACT_APP_GEMINI_API_KEY=<user_provided>
```

**Storage:** `.env.local` (gitignored)  
**Example:** `.env.example` (committed to repo)

---

## 🎨 Behavioral Rules

### UI/UX Guidelines
1. **Language:** Hebrew (RTL layout)
2. **Accessibility:** All interactive elements must have unique IDs
3. **Responsiveness:** Mobile-first design with Tailwind breakpoints
4. **Loading States:** Always show loading indicators for async operations
5. **Error Handling:** User-friendly Hebrew error messages

### Business Logic
1. **Base Quiz:** 3 questions to determine chronotype (bear/lion/wolf/dolphin)
2. **Status Check:** Single question for current energy state (bypasses base quiz)
3. **Task Planning:** AI-generated schedules based on chronotype + current status
4. **Recurring Tasks:** Suggest habit stacking in AI prompts

### Critical Fix (Implemented)
- **Status Check Mode:** Must show "How do you feel right now?" immediately, NOT the 3-question base quiz
- **Implementation:** `QuizScreen` checks `mode === 'status'` and renders `STATUS_OPTIONS` directly

---

## 🐛 Known Issues & Solutions

### AbortError in Development
**Issue:** Supabase auth checks trigger `AbortError` in React Strict Mode  
**Solution:** Implemented multi-layer suppression:
1. Inline script in `public/index.html` (capture phase)
2. Event listeners in `src/index.js`
3. Console.error override

**Status:** ✅ Resolved

### Jest ESM Module Issues
**Issue:** `marked` library uses ESM, Jest fails to parse  
**Solution:** Manual browser testing prioritized over unit tests  
**Status:** ⚠️ Workaround in place

---

## 📋 Maintenance Log

### 2026-01-26: Refactoring & Testing
- Refactored from monolithic Vanilla JS to modular React architecture
- Created `AuthContext`, `MainLayout`, screen components
- Fixed Status Check regression (was showing base quiz instead of feeling selector)
- Implemented AbortError suppression (3-layer approach)
- Verified end-to-end functionality via browser testing

### Database Schema
- Tables: `profiles`, `tasks`, `plans`
- RLS policies enabled for user isolation
- Realtime subscriptions available for `tasks` table

---

## 🚀 Deployment

**Production URL:** https://yacovdroridev.github.io/chronotypePlanner/  
**Build Command:** `npm run build`  
**Deploy Command:** `npm run deploy` (GitHub Pages)

---

## 📚 External Integrations

### Supabase
- **Auth:** Email/Password, Google OAuth, GitHub OAuth
- **Database:** PostgreSQL with RLS
- **Realtime:** WebSocket subscriptions for live task updates

### Google Gemini
- **Model:** gemini-1.5-flash
- **Purpose:** Generate personalized daily schedules
- **Prompt Engineering:** Chronotype-aware, Hebrew output, HTML formatting

---

*This document is the single source of truth for the Chronotype Planner project. All architectural decisions, schema changes, and behavioral rules must be documented here.*
