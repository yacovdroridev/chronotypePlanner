# Architecture Research: Reliability Patterns for React + Supabase + LLM

**Research Date:** 2026-01-28
**Focus:** Component boundaries, data flow, and reliability patterns

## Current Architecture Assessment

### Layers (Existing)
```
┌─────────────────────────────────────┐
│  Presentation (Screen Components)   │  LoginScreen, HubScreen, QuizScreen, ResultScreen
├─────────────────────────────────────┤
│  State Management (Context + Hooks) │  AuthContext, useTasks, usePlanner
├─────────────────────────────────────┤
│  Data/Service (Supabase Client)     │  supabaseClient.js
└─────────────────────────────────────┘
```

### Gaps in Current Architecture

| Layer | Gap | Impact |
|-------|-----|--------|
| Error Handling | No ErrorBoundary | White screen on crash |
| Auth | No timeout/retry | Hangs on slow network |
| Tasks | Optimistic updates don't fully rollback | UI/DB mismatch |
| Planner | Raw HTML injection | XSS vulnerability |
| Planner | Client-exposed API key | Security risk |

## Recommended 5-Layer Architecture

```
┌─────────────────────────────────────┐
│  1. Error Handling & Resilience     │  ErrorBoundary, NetworkDetector, RetryQueue
├─────────────────────────────────────┤
│  2. Authentication & Session        │  AuthContext (hardened with retry/timeout)
├─────────────────────────────────────┤
│  3. Data Access & State             │  useTasks, usePlanner, useProfile (new)
├─────────────────────────────────────┤
│  4. External Service Integration    │  Supabase wrapper, Gemini client (with sanitization)
├─────────────────────────────────────┤
│  5. Presentation & UI               │  Screens + Common components
└─────────────────────────────────────┘
```

## Build Order (Dependency-Based)

### Phase 1: Foundation (Error Handling)
1. Add ErrorBoundary component (global + per-screen)
2. Add loading skeletons for async operations
3. Replace alerts with inline error messages

### Phase 2: Auth Hardening
1. Add 5s timeout to auth operations
2. Add retry logic for transient failures
3. Handle session expiry gracefully

### Phase 3: Data Layer
1. Fix optimistic updates with proper rollback (save previous state)
2. Add subscription deduplication (prevent connection leaks)
3. Add loading states to all async operations

### Phase 4: External Services
1. Sanitize AI HTML output with DOMPurify
2. Add retry logic to Gemini API calls
3. (Future) Move API key to Supabase Edge Function

### Phase 5: UI Polish
1. Replace "Loading..." with skeleton screens
2. Add offline indicator
3. Improve error messages (Hebrew, user-friendly)

## Data Flow Patterns

### Authentication Flow (Hardened)
```
User → Login Form
  ↓
signIn(email, password) with 5s timeout
  ↓
Success? → onAuthStateChange → fetchProfile() → Hub
  ↓
Failure? → Inline error message (not alert)
  ↓
Network error? → Retry with exponential backoff (max 3)
```

### Task Management Flow (With Rollback)
```
User → Add Task
  ↓
Save previous state (rollback point)
  ↓
Optimistic update UI
  ↓
Insert to Supabase
  ↓
Success? → Real-time subscription confirms
  ↓
Failure? → Restore previous state, show error
```

### AI Planning Flow (Secured)
```
User → Click "היום" / "מחר" / "שבוע"
  ↓
Build prompt (tasks + chronotype + timeframe)
  ↓
Call Gemini API with retry (max 3, exponential backoff)
  ↓
Parse response
  ↓
Sanitize HTML with DOMPurify  ← CRITICAL
  ↓
Display plan
```

## Critical Security Fixes

| Priority | Issue | Fix |
|----------|-------|-----|
| P0 | XSS via dangerouslySetInnerHTML | Sanitize with DOMPurify before render |
| P0 | Client-exposed Gemini API key | Move to Supabase Edge Function (future) |
| P1 | No input validation | Validate task inputs before insert |
| P1 | No rate limiting | Add client-side throttle (10 plans/hour) |

## Error Boundary Strategy

```javascript
// Global boundary (catches everything)
<ErrorBoundary fallback={<AppCrashScreen />}>
  <App />
</ErrorBoundary>

// Screen-level boundaries (isolated failures)
<ErrorBoundary fallback={<ScreenError />}>
  <ResultScreen />
</ErrorBoundary>

// Critical section boundaries
<ErrorBoundary fallback={<PlanError />}>
  <PlanDisplay html={planHtml} />
</ErrorBoundary>
```

## Testing Strategy by Layer

| Layer | Test Type | Coverage Target |
|-------|-----------|-----------------|
| Error Handling | Unit | Error scenarios render fallback |
| Auth | Integration | Login success/failure/timeout |
| Data (useTasks) | Unit | CRUD + rollback on failure |
| Data (usePlanner) | Unit | API call + sanitization |
| Presentation | Snapshot + RTL | Key screens render correctly |

## Migration Path (Estimated Effort)

| Change | Effort | Risk |
|--------|--------|------|
| Add ErrorBoundary | 1 hour | Low |
| Add DOMPurify | 30 min | Low |
| Fix optimistic rollback | 2 hours | Medium |
| Add retry logic | 2 hours | Low |
| Auth timeout | 1 hour | Low |
| Replace alerts with inline | 2 hours | Low |

**Total stability fixes: ~8-10 hours of focused work**

---

*Research conducted: 2026-01-28*
