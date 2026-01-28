# Architecture

**Analysis Date:** 2026-01-28

## Pattern Overview

**Overall:** Single Page Application (SPA) with Context-based state management and component-driven view layers.

**Key Characteristics:**
- View-centric architecture with stateful screen components
- Centralized authentication via React Context
- Custom hooks for feature domains (chronotype data, task management, AI planning)
- Supabase for backend services (auth, database, real-time subscriptions)
- Tailwind CSS for styling with RTL support (Hebrew language)

## Layers

**Presentation/View Layer:**
- Purpose: Render UI and handle user interactions
- Location: `src/components/`
- Contains: Screen components (Login, Hub, Quiz, Result), layout wrapper, common components
- Depends on: Hooks, Context, utilities
- Used by: App.js

**State Management Layer:**
- Purpose: Manage application state and side effects
- Location: `src/context/`, `src/hooks/`
- Contains: AuthContext for authentication state, custom hooks for feature logic
- Depends on: Supabase client
- Used by: Components and App

**Data/Service Layer:**
- Purpose: Interact with backend services and external APIs
- Location: `src/utils/`
- Contains: Supabase client initialization
- Depends on: @supabase/supabase-js, external APIs (Gemini)
- Used by: Hooks and Context

**Styling Layer:**
- Purpose: Define visual design system
- Location: `src/index.css`, Tailwind config
- Contains: Custom CSS classes, theme utilities, animations
- Depends on: Tailwind CSS
- Used by: All components

## Data Flow

**Authentication Flow:**

1. User opens app → App.js renders AppContent
2. AppContent checks auth state via useAuth hook (AuthContext)
3. AuthContext calls supabase.auth.getSession() on mount
4. If session exists, fetch user profile from `profiles` table
5. Loading state prevents UI render until auth is resolved
6. Authenticated users see hub, unauthenticated see login screen

**Quiz and Result Flow:**

1. User clicks "Start Quiz" on hub (mode: 'base' or 'status')
2. AppContent transitions to quiz view, sets progress
3. QuizScreen displays QUESTIONS or STATUS_OPTIONS based on mode
4. Each answer updates history array, calculates progress
5. When complete, calculateWinner determines result type
6. AppContent stores result and transitions to result screen
7. ResultScreen shows result data and provides AI planning features

**Task Management Flow:**

1. User adds task via HubScreen or ResultScreen form
2. useTasks.addTask() inserts to `tasks` table via Supabase
3. Optimistic update reflects task immediately in UI
4. Supabase real-time channel listens for changes via postgres_changes
5. toggleTask() and deleteTask() perform update/delete with optimistic revert

**AI Planning Flow:**

1. User clicks "היום", "מחר", or "שבוע" button in ResultScreen
2. usePlanner.generateSchedule() builds prompt from:
   - Timeframe (today/tomorrow/week)
   - Incomplete tasks (description, type, recurring flag)
   - Current chronotype/status data
3. Sends prompt to Gemini API via fetch POST
4. Marks down the response HTML
5. Shows plan in planHtml state
6. User can save plan to `plans` table or copy to clipboard

**State Management:**

- **Global Auth State:** AuthContext (user, userData, loading, signOut)
- **View State:** AppContent maintains view routing (login/hub/quiz/result), progress, resultData
- **Feature State:** Each hook manages isolated feature state (tasks, plan HTML)
- **Component State:** Screen components use local useState for UI toggles (showAdd, newTask, etc)

## Key Abstractions

**Custom Hooks:**
- Purpose: Encapsulate feature logic and side effects
- Examples: `useTasks`, `usePlanner`, `useChronotype` (data only, no state)
- Pattern: Each hook manages its own state and provides API methods

**Context-based Auth:**
- Purpose: Provide user/session state globally without prop drilling
- Example: `useAuth()` hook consumed in components, AuthProvider wraps App
- Pattern: useContext hook pattern for dependency injection

**Screen Components:**
- Purpose: Represent distinct app views/pages
- Examples: LoginScreen, HubScreen, QuizScreen, ResultScreen
- Pattern: Props-driven rendering, local state for forms

**Service Client:**
- Purpose: Single source of Supabase client initialization
- Example: `supabaseClient.js` exports singleton client
- Pattern: Environment variables for config, error handling

## Entry Points

**Application Entry:**
- Location: `src/index.js`
- Triggers: Browser loads HTML, DOM content loaded
- Responsibilities:
  - Suppresses AbortError overlays in development
  - Creates React root and renders App component
  - Handles unhandled promise rejections

**App Component:**
- Location: `src/App.js`
- Triggers: index.js ReactDOM.createRoot
- Responsibilities:
  - Wraps AppContent with AuthProvider
  - Provides auth context to entire app tree

**AppContent Component:**
- Location: `src/App.js` (AppContent function)
- Triggers: App component render
- Responsibilities:
  - Reads auth state via useAuth()
  - Manages view state (login/hub/quiz/result)
  - Routes between screen components
  - Handles quiz completion and progress updates
  - Manages result data

## Error Handling

**Strategy:** Multi-level suppression and graceful degradation

**Patterns:**

- **AbortError Suppression:** Catches Supabase cancellation errors at:
  - index.js console.error override
  - index.html script error handlers
  - AuthContext try-catch with AbortError check
  - useTasks catch with AbortError check

- **API Errors:** Try-catch blocks with user alerts:
  - LoginScreen: auth.signIn/signUp errors shown via alert()
  - useTasks: Database operation errors revert optimistic updates
  - usePlanner: Gemini API errors caught and user alerted in Hebrew

- **Missing Data:** Graceful fallbacks:
  - Missing userData.base_chronotype renders null
  - Missing Supabase env vars logged as error
  - Invalid API response throws with descriptive error

- **Async State:** Loading states prevent race conditions:
  - AuthContext.loading prevents UI render during session check
  - useTasks.loading flag
  - usePlanner.loading flag for schedule generation

## Cross-Cutting Concerns

**Logging:**
- console.error for errors (filtered for AbortError)
- No structured logging; errors only logged when meaningful

**Validation:**
- Form input validation before submission (empty checks)
- Supabase auth layer validates email/password
- No client-side schema validation beyond presence checks

**Authentication:**
- Supabase auth with email/password and OAuth (Google, GitHub)
- Session stored in Supabase client
- User profile upserted after signup with name from form
- Real-time auth state listener via onAuthStateChange

**Authorization:**
- Row-level security (RLS) assumed on Supabase tables
- user_id filtering on all queries (tasks, plans, profiles)
- No explicit role-based access control in frontend

**Internationalization:**
- Hebrew language throughout UI
- RTL layout in index.html (dir="rtl")
- No i18n library; hardcoded Hebrew strings

**Real-time Updates:**
- Supabase postgres_changes subscription in useTasks
- Listens to task table changes for current user
- Triggers refetch on any INSERT/UPDATE/DELETE

---

*Architecture analysis: 2026-01-28*
