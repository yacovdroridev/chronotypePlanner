# Stack Research: React SPA + Supabase + LLM

**Research Date:** 2026-01-28
**Focus:** Testing, error handling, and reliability patterns for brownfield stabilization

## Current State

| Component | Version | Status |
|-----------|---------|--------|
| React | 19.2.3 | Current |
| Create React App | 5.0.1 | **Deprecated** (unmaintained since 2022) |
| Supabase JS | 2.91.0 | Current |
| Tailwind CSS | 3.4.13 | Current |
| Testing | Jest (via CRA) | Minimal (1 test file) |
| Error Handling | Manual console.error + alerts | **Gap** |

## Critical Gaps Identified

1. **No retry logic** for Supabase or Gemini API calls
2. **CRA is deprecated** — consider Vite migration (future milestone)
3. **No error boundaries** — crashes show white screen
4. **XSS vulnerability** — unsanitized HTML via `dangerouslySetInnerHTML`
5. **Client-exposed API key** — Gemini key visible in browser
6. **Minimal test coverage** — only one basic render test

## Recommended Stack for Stability Milestone

### Phase 1: Critical (Must-Have for Stability)

| Library | Version | Purpose | Priority |
|---------|---------|---------|----------|
| react-error-boundary | 4.1.2 | Catch component crashes gracefully | P0 |
| dompurify | 3.2.2 | Sanitize AI HTML output (XSS fix) | P0 |
| Custom retry logic | N/A | Exponential backoff for API calls | P0 |

### Phase 2: Important (Should-Have)

| Library | Version | Purpose | Priority |
|---------|---------|---------|----------|
| @sentry/react | 8.46.0 | Production error monitoring | P1 |
| @tanstack/react-query | 5.62.7 | Automatic retries, caching | P1 |

### Phase 3: Future (Nice-to-Have)

| Library | Version | Purpose | Priority |
|---------|---------|---------|----------|
| Vite | 6.x | Replace CRA (10-20x faster) | P2 |
| Vitest | 3.x | Replace Jest (faster, better DX) | P2 |
| @google/generative-ai | 0.21.0 | Official Gemini SDK | P2 |
| Supabase Edge Function | N/A | Hide API key server-side | P2 |

## What NOT to Use

| Avoid | Reason |
|-------|--------|
| Redux/Redux Toolkit | Overkill for app size; Context API is sufficient |
| Axios | Native fetch is sufficient |
| Moment.js | Deprecated; use date-fns if needed |
| Full Lodash | Bundle bloat; use native methods |

## Testing Strategy

**Target coverage for stability milestone:**
- 70% unit tests (hooks, utilities)
- 25% integration tests (component + Supabase)
- 5% E2E tests (critical path only)

**Critical paths to test:**
1. Login flow (email/password + OAuth)
2. Quiz completion → result display
3. Task CRUD operations
4. AI schedule generation (mock Gemini response)

**Testing stack (keep existing for now):**
- Jest (via CRA) — works, don't change mid-stability
- @testing-library/react 16.3.2 — already installed
- Manual E2E — Playwright can wait for future milestone

## Error Handling Patterns

### Exponential Backoff (Recommended)
```javascript
const retry = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
};
```

### Error Boundary Pattern
```javascript
<ErrorBoundary fallback={<ErrorFallback />}>
  <ResultScreen />
</ErrorBoundary>
```

## Confidence Levels

| Recommendation | Confidence | Rationale |
|----------------|------------|-----------|
| Error Boundaries | HIGH | Standard React pattern, no risk |
| DOMPurify | HIGH | Industry standard for XSS prevention |
| Retry logic | HIGH | Essential for API reliability |
| Keep CRA for now | HIGH | Don't change build during stability |
| Sentry | MEDIUM-HIGH | Valuable but adds complexity |
| TanStack Query | MEDIUM | Great but significant refactor |

---

*Research conducted: 2026-01-28*
