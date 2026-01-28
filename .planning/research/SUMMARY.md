# Chronotype Planner: Stabilization Research Summary

**Research Date:** 2026-01-28
**Focus:** Brownfield stabilization milestone — making existing features work reliably
**Target:** Stability, security, and reliability improvements (not new features)

---

## Executive Summary

The Chronotype Planner is a well-architected React + Supabase + Gemini SPA with solid feature foundations but **critical reliability and security gaps** that must be addressed before production. The app successfully implements its core differentiator—combining chronotype assessment + real-time status check-ins for dynamic AI scheduling—but lacks error handling, retry logic, and XSS protection that make it unreliable under real-world conditions.

The stabilization milestone requires **~8-10 hours of focused work** targeting three critical areas: (1) **error handling and resilience**, (2) **API reliability with retry logic**, and (3) **security hardening**. The good news: no architectural changes needed, no new dependencies required beyond react-error-boundary and dompurify, and the build system (Create React App) should stay as-is during this phase.

**Key recommendation:** Stabilization is achievable in a single 1-2 week sprint by focusing exclusively on the "P0 - Critical Fixes Required" section below. Defer all feature enhancements (regenerate button, calendar sync, plan rationale) to v2.

---

## Key Findings by Research Area

### From STACK.md: Technology Assessment

**Current State:**
- React 19.2.3 + Create React App 5.0.1 (deprecated but stable)
- Supabase JS 2.91.0 (current, solid)
- Tailwind CSS 3.4.13 (current)
- **Critical gap:** Minimal error handling, no testing coverage

**Core Dependencies for Stability:**
1. **react-error-boundary 4.1.2** — Catches component crashes (prevents white screen)
2. **dompurify 3.2.2** — Sanitizes AI HTML output (fixes XSS vulnerability)
3. **Custom retry logic** — Exponential backoff for transient API failures

**Future (Post-Stabilization):**
- Vite + Vitest (10-20x faster builds, can wait for next milestone)
- @sentry/react (error monitoring, valuable but adds complexity)
- Supabase Edge Functions (move API key server-side, future)

**What NOT to change during stabilization:**
- Don't replace CRA with Vite (build system changes = risk during stability)
- Don't add Redux/TanStack Query (overkill, Context API is sufficient)
- Don't change testing framework (Jest works, focus on writing tests instead)

**Testing Strategy:** Target 70% unit tests (hooks, utilities), 25% integration tests (Supabase), 5% E2E. Critical paths: login → quiz → tasks → AI planning.

---

### From FEATURES.md: Feature Verification Requirements

**Table Stakes (Must Work):**
- Login (email + OAuth) → ✓ Exists, needs retry/timeout hardening
- Chronotype quiz (4-type assessment) → ✓ Exists, verify edge cases
- Task CRUD → ✓ Exists, needs rollback on failure
- AI schedule generation (today/tomorrow/week) → ✓ Exists, **needs verification** that all timeframes work
- Real-time session persistence → ✓ Supabase auth handles it
- Hebrew RTL support → ✓ Full support exists

**Your Competitive Advantage (Verify These Work):**
- **Status/Energy check-in quiz** — "What is your status now?" affects AI prompt (major differentiator vs. Opal, Rise, Timely)
- Recurring task handling with habit stacking in prompts (medium differentiator)
- AI explains context for scheduling (not yet fully implemented)

**What to Test Before Release (P0):**
1. End-to-end flow: login → quiz → add tasks → generate schedule (today + tomorrow + week)
2. Status quiz actually influences AI output (verify prompt includes current energy level)
3. All three timeframes generate valid HTML output
4. Edge cases handled: empty task list, missing chronotype, rapid clicks
5. Copy plan to clipboard works
6. Save plan to database works

**Out of Scope (Defer to v2):**
- Regenerate button (nice to have, not critical)
- Plan rationale/explanations (not implemented, lower priority)
- Calendar integration (complex, future roadmap)
- Plan editing UI (medium complexity, future)

---

### From ARCHITECTURE.md: Recommended Layering

**Current State (3 layers):**
```
Presentation (Screens) → State (Context + Hooks) → Data (Supabase Client)
```

**Recommended Additions (5-layer architecture):**
```
1. Error Handling & Resilience   ← ErrorBoundary, NetworkDetector, RetryQueue (NEW)
2. Authentication & Session      ← AuthContext (hardened with timeout/retry)
3. Data Access & State           ← useTasks, usePlanner, useProfile
4. External Service Integration  ← Supabase wrapper, Gemini client with sanitization
5. Presentation & UI             ← Screens + Components
```

**Critical Security Patterns:**

| Issue | Fix | Effort |
|-------|-----|--------|
| No error boundaries | Add ErrorBoundary wrapper at app + screen level | 1 hour |
| XSS vulnerability (dangerouslySetInnerHTML) | Wrap Gemini HTML with DOMPurify before render | 30 min |
| Client-exposed Gemini API key | Rate-limit in Google dashboard + future: Edge Function proxy | 30 min (now) + future refactor |
| No timeout on Gemini calls | Add AbortController with 30s timeout | 30 min |

**Data Flow Fixes:**

1. **Authentication (hardened):** Add 5s timeout to signIn() calls, retry on network error
2. **Task management (with rollback):** Save `previousTasks` before optimistic update; restore on API failure
3. **AI Planning (secured):** Retry (max 3) → Parse → Sanitize with DOMPurify → Display
4. **Real-time subscriptions:** Store channel in `useRef`, properly unsubscribe on cleanup (prevents leaks)

**Build Order (Dependency-Based):**
1. **Phase 1:** Error boundaries + loading states
2. **Phase 2:** Auth timeout/retry
3. **Phase 3:** Data layer (rollback, subscription cleanup)
4. **Phase 4:** DOMPurify + Gemini retry/timeout
5. **Phase 5:** Polish (inline errors instead of alerts, skeleton screens)

---

### From PITFALLS.md: Critical Mistakes to Avoid

**Red Lights (Actively Affecting App):**

| Pitfall | Your Status | Severity | Fix |
|---------|------------|----------|-----|
| **No error boundaries** | AFFECTED — white screen on crash | High | 1 hour (add react-error-boundary) |
| **XSS vulnerability** | CRITICAL — dangerouslySetInnerHTML unprotected | Critical | 30 min (add dompurify) |
| **No retry logic** | AFFECTED — single attempt on API failure | Medium | 1-2 hours (exponential backoff) |
| **No LLM timeout** | AFFECTED — can hang indefinitely | Medium | 30 min (AbortController + 30s timeout) |
| **Subscription leaks** | PARTIALLY AFFECTED — cleanup may be incomplete | Medium | 1-2 hours (useRef + proper unsubscribe) |
| **Optimistic updates without rollback** | AFFECTED — UI/DB mismatch on error | Medium | 2 hours (save previous state) |
| **alert() for errors** | AFFECTED — blocks UI, not accessible | Low | 1-2 hours (inline error messages in Hebrew) |
| **console.error suppression** | AFFECTED — AbortError filter may hide real issues | Low | Fix root cause instead of suppressing |

**Checklist Before Release:**
- [ ] ErrorBoundary at app + screen level
- [ ] DOMPurify sanitizes Gemini HTML output
- [ ] Gemini API calls retry (max 3, exponential backoff)
- [ ] Gemini calls have 30s timeout
- [ ] All async buttons show loading states
- [ ] Error messages inline + in Hebrew (not alerts)
- [ ] Real-time subscriptions unsubscribe properly
- [ ] Task CRUD has rollback on failure

---

## Roadmap Implications: Stabilization Phases

### Phase 1: Error Handling Foundation (2 days, low risk)

**Rationale:** Prevent white-screen-of-death crashes; establish baseline resilience.

**Deliverables:**
- Add ErrorBoundary at app root + per-screen
- Add loading skeletons for async operations
- Replace `alert()` with inline error messages (Hebrew)

**Features verified:** All (error states handled gracefully)

**Pitfalls avoided:** Missing error boundaries, poor UX on errors

**Effort:** ~4 hours | **Risk:** Low

**Definition of Done:**
- App renders error fallback instead of crashing
- Error messages appear inline with proper Hebrew text
- Loading states visible for all async operations

---

### Phase 2: Authentication Hardening (1 day, low risk)

**Rationale:** Login is the first experience; timeouts + retries prevent "stuck" states.

**Deliverables:**
- Add 5s timeout to `signIn()` + `signUp()` calls
- Add retry logic for network errors (max 3 with exponential backoff)
- Handle session expiry gracefully (redirect to login)

**Features verified:** Login + OAuth flow works under slow networks

**Pitfalls avoided:** Session expiry not handled, no timeout on auth

**Effort:** ~2 hours | **Risk:** Low

---

### Phase 3: Security Hardening (1 day, low risk)

**Rationale:** Gemini HTML output is untrusted; must sanitize before rendering.

**Deliverables:**
- Add dompurify dependency
- Wrap Gemini response with `DOMPurify.sanitize()` before `dangerouslySetInnerHTML`
- Add rate-limiting to Gemini API (client-side throttle: 10 plans/hour)
- Document client API key exposure as future refactor (Edge Function)

**Features verified:** AI schedule generation (today/tomorrow/week) safe from XSS

**Pitfalls avoided:** XSS injection, client-exposed API key (mitigated)

**Effort:** ~2 hours | **Risk:** Low

**Note:** Client-exposed API key is HIGH-severity long-term but medium-effort to fix properly. For now: rate-limit in Google Cloud Console + plan Edge Function refactor for next milestone.

---

### Phase 4: API Reliability (2 days, medium risk)

**Rationale:** Transient network failures should trigger retries, not immediate failure.

**Deliverables:**
- Add exponential backoff retry helper (max 3 attempts, 1s/2s/4s delays)
- Apply to all external API calls: Gemini, Supabase (auth, data)
- Add 30s timeout to Gemini fetch with AbortController
- Fix optimistic updates: save `previousTasks` before update, restore on error
- Fix real-time subscriptions: use `useRef` for channel, proper cleanup

**Features verified:** Task CRUD, AI planning works under flaky networks

**Pitfalls avoided:** No retry logic, no timeout, optimistic updates without rollback, subscription leaks

**Effort:** ~4 hours | **Risk:** Medium (testing required)

---

### Phase 5: Testing & Verification (2 days, low effort)

**Rationale:** Ensure all table-stake features work end-to-end.

**Deliverables:**
- Test login flow (email + OAuth)
- Test quiz → task creation → AI schedule generation (all 3 timeframes)
- Test error states (empty tasks, network failure)
- Test status quiz influences AI output
- Test copy/save plan functionality
- Manual QA checklist for release

**Effort:** ~4 hours writing tests, ~2 hours QA | **Risk:** Low

**Coverage target:** 70% unit, 25% integration, 5% E2E

---

### Overall Stabilization Summary

| Phase | Duration | Effort | Risk | Status |
|-------|----------|--------|------|--------|
| Phase 1: Error Handling | 2 days | 4h | Low | Foundation |
| Phase 2: Auth Hardening | 1 day | 2h | Low | Auth + Session |
| Phase 3: Security | 1 day | 2h | Low | XSS prevention |
| Phase 4: Reliability | 2 days | 4h | Medium | Retry + Timeout |
| Phase 5: Testing | 2 days | 6h | Low | Verification |
| **Total** | **1 week** | **~18h** | **Low-Medium** | Ready for v1 |

**Dependency order:** Phases 1 → 2 → 3 → 4 → 5 (can overlap phases 2-3-4 in parallel)

---

## Critical Fixes Required (P0)

These must be completed before release:

1. **Add ErrorBoundary** (react-error-boundary)
   - Location: App root + ResultScreen (Gemini output rendering)
   - Why: Prevents white screen on component crash
   - Risk: None (standard React pattern)

2. **Sanitize AI Output with DOMPurify**
   - Location: Before `dangerouslySetInnerHTML` in ResultScreen/PlanDisplay
   - Why: Prevents XSS injection from Gemini response
   - Risk: None (adds safety, no functional change)
   - Code: `DOMPurify.sanitize(html)` before render

3. **Add Gemini Retry Logic**
   - Location: usePlanner hook
   - Why: Handles transient API failures (rate limits, timeouts)
   - Max retries: 3
   - Backoff: exponential (1s, 2s, 4s)
   - Risk: Low (graceful degradation)

4. **Add Timeout to Gemini Calls**
   - Location: usePlanner fetch
   - Why: Prevents indefinite hanging on slow responses
   - Timeout: 30s
   - Implementation: AbortController + setTimeout
   - Risk: Low

5. **Fix Optimistic Updates Rollback**
   - Location: useTasks hook (add, delete, update functions)
   - Why: Prevents UI/DB mismatch on API failure
   - Implementation: `const previousTasks = tasks; setTasks(new); try { api } catch { setTasks(previousTasks) }`
   - Risk: Medium (requires careful testing)

6. **Fix Real-time Subscription Cleanup**
   - Location: useTasks subscription setup
   - Why: Prevents connection leaks and duplicate events
   - Implementation: useRef for channel, proper unsubscribe in cleanup
   - Risk: Low-Medium (cleanup is critical)

---

## Important Improvements (P1)

Complete these if Phase 0 time permits:

1. **Add Auth Timeout & Retry**
   - Location: AuthContext signIn/signUp
   - Why: Handles slow network on login
   - Timeout: 5s
   - Retry: max 3 with backoff
   - Effort: 2 hours

2. **Replace alert() with Inline Errors**
   - Location: LoginScreen, usePlanner
   - Why: Better UX, accessible, non-blocking
   - Format: `<div className="text-red-500 text-sm">{error}</div>`
   - Hebrew: Ensure error messages are in Hebrew
   - Effort: 1-2 hours

3. **Add Loading States to All Buttons**
   - Buttons affecting async: Login, Generate Plan, Save Task
   - Show: Disabled state + spinner + "יוצר..." text
   - Effort: 1 hour

4. **Fix console.error Suppression**
   - Current: Blanket filter for "AbortError" may hide real issues
   - Better: Be specific or fix root cause of AbortError
   - Effort: 30 min

5. **Test Status Quiz Influences Output**
   - Verify: Prompt includes current status/energy level
   - Verify: Different status values produce different schedules
   - Effort: 1 hour testing

---

## Future Work (P2)

Defer these to v2 or future milestones:

1. **Regenerate Button**
   - Allow users to re-run plan generation with same inputs
   - Complexity: Low (prompt is already built)
   - Roadmap: Post-stabilization nice-to-have

2. **Plan Rationale**
   - AI explains WHY tasks are scheduled at specific times
   - Complexity: Low (prompt enhancement)
   - Roadmap: Post-stabilization

3. **Move Gemini API Key to Edge Function**
   - Currently exposed in browser (client-side)
   - Proper fix: Supabase Edge Function proxy
   - Complexity: High (requires new infrastructure)
   - Timeline: v2 roadmap
   - Mitigation (now): Rate-limit in Google Cloud Console, monitor usage

4. **Calendar Integration**
   - Sync generated plans to Google/Outlook calendar
   - Complexity: High
   - Timeline: v2+ roadmap

5. **Plan Editing UI**
   - Allow users to adjust AI-generated schedule
   - Complexity: Medium
   - Timeline: v2 roadmap

6. **Vite + Vitest Migration**
   - Replace Create React App (faster builds)
   - Benefit: 10-20x faster dev builds
   - Timing: AFTER stabilization (don't change build during stability)
   - Complexity: Medium

---

## What NOT to Change During Stabilization

These are outside scope and will increase risk:

- **Build system:** Don't migrate from CRA to Vite (stability phase = no tooling changes)
- **State management:** Don't add Redux/TanStack Query (Context API is sufficient)
- **Testing framework:** Don't replace Jest with Vitest (focus on writing tests, not tools)
- **Feature additions:** Don't add new features (stabilization = fixing broken reliability)
- **UI redesigns:** Don't refactor components for aesthetics (stability = functionality)
- **New dependencies:** Limit to react-error-boundary + dompurify only

**Rationale:** Each change introduces risk during a stabilization phase. Lock down the codebase, fix reliability, then expand in v2.

---

## Confidence Assessment

| Area | Confidence | Basis | Gaps |
|------|------------|-------|------|
| **Stack** | HIGH | Clear version recommendations, rationale provided | None — stack is solid |
| **Features** | HIGH | Comprehensive feature audit, test cases defined | Need to verify status quiz actually influences output |
| **Architecture** | MEDIUM-HIGH | Clear layering, patterns defined, effort estimates provided | Build order sequence untested in practice |
| **Pitfalls** | MEDIUM-HIGH | Concrete code examples, severity levels assigned | Some fixes (rollback, subscription cleanup) require testing |
| **Overall Stabilization** | MEDIUM-HIGH | All critical paths identified, effort capped at 18 hours | Estimate assumes focused work, no blockers |

**Key Uncertainties:**
1. **Status quiz integration:** Does current prompt actually use the status/energy check-in? Needs verification.
2. **Subscription cleanup:** Current implementation partially affected; cleanup pattern needs testing.
3. **Rollback logic:** Error recovery flow not yet implemented; requires careful testing.
4. **Load testing:** Unknown how app handles 100+ tasks or rapid API calls.

**Recommendation:** Allocate 1 day upfront for investigation (verify features work) before committing to 1-week stabilization sprint.

---

## Research Gaps Requiring Attention

| Gap | Impact | Mitigation |
|-----|--------|-----------|
| Status quiz influence on output | Feature validation | Review Gemini prompt; test with different statuses |
| Error rate baseline | Reliability metric | Add Sentry (P1, future) or log errors to Supabase |
| Performance on large task lists | Scalability | Load test with 100+ tasks; may need list virtualization (v2) |
| Offline behavior | Resilience | Document current behavior; add offline indicator (P1) |
| Exact Gemini cost/quota | Operations | Audit usage in Google Cloud Console; document limits |
| Accessibility (Hebrew RTL) | User experience | QA test with screen readers; may need ARIA labels |

---

## Sources & Evidence

### STACK.md
- Current version matrix: React 19.2.3, Supabase 2.91.0, CRA 5.0.1 (deprecated)
- Critical gaps: No error boundaries, no retry logic, minimal testing
- Recommended dependencies: react-error-boundary, dompurify, custom retry
- Confidence: HIGH for stack, HIGH for recommendations

### FEATURES.md
- Table stakes verified: Login, quiz, tasks, AI scheduling, RTL
- Differentiators identified: Status check-in quiz (unique), recurring task hint
- QA checklist: End-to-end flow, timeframe verification, edge cases
- Confidence: HIGH for feature list, needs verification for status quiz integration

### ARCHITECTURE.md
- Current 3-layer architecture solid but missing resilience layer
- Recommended 5-layer architecture with error handling at top
- Critical patterns: ErrorBoundary, DOMPurify, retry with backoff, subscription cleanup
- Migration effort: 8-10 hours focused work
- Confidence: MEDIUM-HIGH for architecture, HIGH for effort estimates

### PITFALLS.md
- 8 active pitfalls identified, severity/effort matrix provided
- Red lights: No error boundaries (HIGH), XSS (CRITICAL), no retry (MEDIUM), no timeout (MEDIUM)
- Release checklist: 8 items covering reliability, security, UX
- Confidence: HIGH for pitfall identification, MEDIUM for fix completeness

---

## Summary for Roadmap Planning

**Stabilization is achievable in 1 week with ~18 hours of focused work.**

**The most important actions (in order):**
1. Add error boundaries (prevents white screen)
2. Sanitize Gemini output (prevents XSS)
3. Add retry logic to Gemini + auth (handles transient failures)
4. Fix optimistic updates (prevents UI/DB mismatch)
5. Write tests to verify features work end-to-end

**Major risks to mitigate:**
- Subscription cleanup incomplete (test thoroughly)
- Status quiz may not actually influence AI output (verify before release)
- Gemini API exposed client-side (rate-limit + plan future refactor)

**Build order:** Phase 1 (error handling) → Phase 2 (auth) → Phase 3 (security) → Phase 4 (reliability) → Phase 5 (testing)

**Next step:** Proceed to requirements definition with confidence that stabilization is well-scoped and achievable.

---

*Synthesis completed: 2026-01-28*
*Research team: STACK.md, FEATURES.md, ARCHITECTURE.md, PITFALLS.md*
