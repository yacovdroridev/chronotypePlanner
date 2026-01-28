# Roadmap: Chronotype Planner Stability Milestone

## Overview

This roadmap transforms the Chronotype Planner from a functional prototype into a reliable application. We'll layer error handling, security hardening, and API reliability on top of the existing React + Supabase + Gemini architecture, then verify everything works end-to-end. No new features — just confidence that existing features work.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3, 4, 5): Planned milestone work
- Decimal phases (e.g., 2.1): Urgent insertions (marked with INSERTED)

- [x] **Phase 1: Error Handling** - Prevent white-screen crashes, add loading states, replace alerts ✅
- [x] **Phase 2: Auth Hardening** - Add timeout and retry to authentication flows ✅
- [x] **Phase 3: Security** - Sanitize AI output (XSS prevention), add rate limiting ✅
- [x] **Phase 4: Reliability** - API retry/timeout, optimistic update rollback, subscription cleanup ✅
- [ ] **Phase 5: Verification** - Test full flows work for all timeframes, plan save/copy

## Phase Details

### Phase 1: Error Handling
**Goal**: Users never see a white screen; all async operations show feedback
**Depends on**: Nothing (first phase)
**Requirements**: REQ-001, REQ-002, REQ-003
**Success Criteria** (what must be TRUE):
  1. App shows Hebrew error message instead of white screen when component crashes
  2. Login, quiz submit, task operations, and AI planning all show loading indicators
  3. Login errors and planning errors display inline in Hebrew (no alert() popups)
**Plans**: 3 plans

Plans:
- [ ] 01-01-PLAN.md — Add error boundary to prevent white screen crashes
- [ ] 01-02-PLAN.md — Replace LoginScreen alerts with inline errors
- [ ] 01-03-PLAN.md — Replace planner/task alerts with inline feedback

---

### Phase 2: Auth Hardening
**Goal**: Login flows handle slow networks and transient failures gracefully
**Depends on**: Phase 1 (error messages needed for auth failures)
**Requirements**: None (auth hardening derived from research, supports REQ-010)
**Success Criteria** (what must be TRUE):
  1. Login does not hang indefinitely on slow connection (5s timeout)
  2. Login retries automatically on network errors (max 3 attempts)
  3. Session expiry redirects user to login gracefully
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

---

### Phase 3: Security
**Goal**: AI-generated content is safe to render; API abuse is rate-limited
**Depends on**: Phase 1 (error handling for rate limit messages)
**Requirements**: REQ-004, REQ-005
**Success Criteria** (what must be TRUE):
  1. All HTML from Gemini is sanitized with DOMPurify before rendering
  2. Users cannot generate more than 10 plans per hour (client-side throttle)
  3. Rate limit reached shows clear Hebrew message, not silent failure
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

---

### Phase 4: Reliability
**Goal**: API calls retry on failure, optimistic updates rollback on error, subscriptions don't leak
**Depends on**: Phase 3 (security must be in place before reliability testing)
**Requirements**: REQ-006, REQ-007, REQ-008, REQ-009
**Success Criteria** (what must be TRUE):
  1. Gemini API calls retry up to 3 times with exponential backoff (1s, 2s, 4s)
  2. Gemini API calls timeout after 30 seconds with user-friendly Hebrew error
  3. Failed task add/delete/update reverts UI to previous state (rollback works)
  4. Real-time subscriptions unsubscribe properly on component unmount
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

---

### Phase 5: Verification
**Goal**: Confirm full app flow works end-to-end for all features
**Depends on**: Phase 4 (all reliability improvements must be in place)
**Requirements**: REQ-010, REQ-011, REQ-012
**Success Criteria** (what must be TRUE):
  1. User can complete full flow: login -> quiz -> tasks -> AI planning without errors
  2. All three planning timeframes generate valid schedules ("today", "tomorrow", "week")
  3. User can save generated plan to database successfully
  4. User can copy generated plan to clipboard successfully
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

---

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Error Handling | 3/3 | ✅ Done | 2026-01-29 |
| 2. Auth Hardening | 1/1 | ✅ Done | 2026-01-29 |
| 3. Security | 1/1 | ✅ Done | 2026-01-29 |
| 4. Reliability | 1/1 | ✅ Done | 2026-01-29 |
| 5. Verification | 0/TBD | Not started | - |

---

## Requirement Coverage

| Requirement | Phase | Description |
|-------------|-------|-------------|
| REQ-001 | Phase 1 | Error Boundaries |
| REQ-002 | Phase 1 | Loading States |
| REQ-003 | Phase 1 | Inline Error Messages |
| REQ-004 | Phase 3 | XSS Prevention |
| REQ-005 | Phase 3 | Rate Limiting |
| REQ-006 | Phase 4 | API Retry Logic |
| REQ-007 | Phase 4 | API Timeout |
| REQ-008 | Phase 4 | Optimistic Update Rollback |
| REQ-009 | Phase 4 | Subscription Cleanup |
| REQ-010 | Phase 5 | End-to-End Flow Works |
| REQ-011 | Phase 5 | AI Planning Timeframes |
| REQ-012 | Phase 5 | Plan Save and Copy |

**Coverage:** 12/12 requirements mapped

---

*Roadmap created: 2026-01-28*
*Estimated effort: ~18 hours (from research)*
