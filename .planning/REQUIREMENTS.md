# Requirements: Stability Milestone v1.0

**Created:** 2026-01-28
**Milestone:** Make existing features work reliably

## Scope Summary

| Category | v1.0 | v2.0 | Out of Scope |
|----------|------|------|--------------|
| Error Handling | All | — | — |
| Security | XSS fix, rate limiting | API key migration | — |
| Reliability | Retry, timeout, rollback | — | — |
| Testing | Critical path coverage | Full coverage | — |
| Features | Verify existing | Regenerate button | New features |

---

## v1.0 Requirements (This Milestone)

### Error Handling

**REQ-001: Error Boundaries**
- Priority: MUST
- Phase: 1
- Description: App must not show white screen on component errors
- Acceptance: ErrorBoundary at app level catches crashes, shows Hebrew error message
- Traces to: PITFALLS.md (Missing Error Boundaries)

**REQ-002: Loading States**
- Priority: MUST
- Phase: 1
- Description: All async operations show loading indicator
- Acceptance: Login, quiz submit, task operations, AI planning show spinner/skeleton
- Traces to: ARCHITECTURE.md (UI Polish)

**REQ-003: Inline Error Messages**
- Priority: SHOULD
- Phase: 1
- Description: Replace alert() with inline error display
- Acceptance: Login errors, planning errors shown inline in Hebrew
- Traces to: PITFALLS.md (alert() for Error Messages)

### Security

**REQ-004: XSS Prevention**
- Priority: MUST
- Phase: 3
- Description: AI-generated HTML must be sanitized before rendering
- Acceptance: DOMPurify sanitizes all HTML from Gemini before dangerouslySetInnerHTML
- Traces to: PITFALLS.md (XSS via Unsanitized AI Output), CONCERNS.md

**REQ-005: Rate Limiting**
- Priority: SHOULD
- Phase: 3
- Description: Prevent excessive AI generation requests
- Acceptance: Client-side throttle limits to 10 plans/hour per session
- Traces to: ARCHITECTURE.md (Critical Security Fixes)

### Reliability

**REQ-006: API Retry Logic**
- Priority: MUST
- Phase: 4
- Description: Gemini API calls must retry on transient failures
- Acceptance: Exponential backoff (1s, 2s, 4s), max 3 attempts
- Traces to: STACK.md (Critical Gaps), PITFALLS.md

**REQ-007: API Timeout**
- Priority: MUST
- Phase: 4
- Description: Gemini API calls must not hang indefinitely
- Acceptance: 30-second timeout with AbortController, user-friendly error on timeout
- Traces to: PITFALLS.md (No Timeout for LLM Calls)

**REQ-008: Optimistic Update Rollback**
- Priority: SHOULD
- Phase: 4
- Description: Failed task operations must revert UI to previous state
- Acceptance: Save state before optimistic update, restore on error
- Traces to: PITFALLS.md (Optimistic Updates Without Rollback)

**REQ-009: Subscription Cleanup**
- Priority: SHOULD
- Phase: 4
- Description: Real-time subscriptions must not leak
- Acceptance: Channel stored in ref, properly unsubscribed on unmount
- Traces to: PITFALLS.md (Real-time Subscription Leaks)

### Verification

**REQ-010: End-to-End Flow Works**
- Priority: MUST
- Phase: 5
- Description: Full app flow must complete without errors
- Acceptance: Login -> Quiz -> Tasks -> AI Planning succeeds for all timeframes
- Traces to: PROJECT.md (Active Requirements)

**REQ-011: AI Planning Timeframes**
- Priority: MUST
- Phase: 5
- Description: All three planning timeframes must work
- Acceptance: "היום", "מחר", "שבוע" buttons all generate valid schedules
- Traces to: PROJECT.md (Core Value)

**REQ-012: Plan Save and Copy**
- Priority: MUST
- Phase: 5
- Description: Users can persist and share generated plans
- Acceptance: Save to database works, copy to clipboard works
- Traces to: PROJECT.md (Active Requirements)

---

## v2.0 Requirements (Next Milestone)

**REQ-V2-001: Plan Regeneration**
- Description: Add "Regenerate" button to get new schedule
- Rationale: Users stuck with first result; biggest UX gap

**REQ-V2-002: Backend API Proxy**
- Description: Move Gemini API key to Supabase Edge Function
- Rationale: Client-exposed API key is security risk

**REQ-V2-003: Structured Logging**
- Description: Replace console.error with Sentry or similar
- Rationale: Production error visibility

**REQ-V2-004: TanStack Query Migration**
- Description: Replace manual fetch with TanStack Query
- Rationale: Built-in retry, caching, deduplication

---

## Out of Scope

| Feature | Reason |
|---------|--------|
| New features | Stability milestone, not feature development |
| Vite migration | Risk during stability work |
| TypeScript | Adds complexity without immediate benefit |
| Calendar integration | Future roadmap item |
| Internationalization | Hebrew-only is acceptable |

---

## Requirement Summary

| ID | Title | Priority | Phase | Status |
|----|-------|----------|-------|--------|
| REQ-001 | Error Boundaries | MUST | 1 | Pending |
| REQ-002 | Loading States | MUST | 1 | Pending |
| REQ-003 | Inline Error Messages | SHOULD | 1 | Pending |
| REQ-004 | XSS Prevention | MUST | 3 | Pending |
| REQ-005 | Rate Limiting | SHOULD | 3 | Pending |
| REQ-006 | API Retry Logic | MUST | 4 | Pending |
| REQ-007 | API Timeout | MUST | 4 | Pending |
| REQ-008 | Optimistic Update Rollback | SHOULD | 4 | Pending |
| REQ-009 | Subscription Cleanup | SHOULD | 4 | Pending |
| REQ-010 | End-to-End Flow Works | MUST | 5 | Pending |
| REQ-011 | AI Planning Timeframes | MUST | 5 | Pending |
| REQ-012 | Plan Save and Copy | MUST | 5 | Pending |

**MUST requirements:** 8
**SHOULD requirements:** 4
**Total:** 12

---

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-001 | Phase 1 | Pending |
| REQ-002 | Phase 1 | Pending |
| REQ-003 | Phase 1 | Pending |
| REQ-004 | Phase 3 | Pending |
| REQ-005 | Phase 3 | Pending |
| REQ-006 | Phase 4 | Pending |
| REQ-007 | Phase 4 | Pending |
| REQ-008 | Phase 4 | Pending |
| REQ-009 | Phase 4 | Pending |
| REQ-010 | Phase 5 | Pending |
| REQ-011 | Phase 5 | Pending |
| REQ-012 | Phase 5 | Pending |

---

*Requirements defined: 2026-01-28*
*Phase traceability added: 2026-01-28*
