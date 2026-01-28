# Features Research: Chronotype-Based Productivity Apps

**Research Date:** 2026-01-28
**Focus:** Feature analysis for stabilization milestone

## Feature Classification

### Table Stakes (Must Work for MVP)

| Feature | Your App | Status |
|---------|----------|--------|
| Chronotype Assessment | 4-type quiz (Lion/Bear/Wolf/Dolphin) | Exists |
| Task Management | CRUD operations | Exists |
| Authentication | Email/password + OAuth | Exists |
| AI Schedule Generation | Today/tomorrow/week | **Needs verification** |
| Session Persistence | Supabase auth | Exists |
| Hebrew RTL UI | Full support | Exists |

### Differentiating Features (Competitive Advantage)

| Feature | Your App | Competitive Edge |
|---------|----------|------------------|
| Status/Energy Check-In | "What is the status now?" quiz | **Major differentiator** — most apps only use base chronotype |
| Recurring Tasks | Flag exists, AI prompt mentions habit stacking | Medium differentiator |
| Plan Regeneration | **NOT implemented** | Biggest gap |
| Plan Rationale | AI explains why it scheduled tasks | Not implemented |
| Calendar Integration | Not implemented | Complex, future work |

### Anti-Features (Deliberately Avoid)

| Feature | Why Avoid |
|---------|-----------|
| Complex chronotype models | Stick to 4 types — simple is better |
| Gamification (points/badges) | Distracts from core value |
| Social features | Out of scope for solo productivity |
| Complex task metadata | Keep it simple (description, duration, type, recurring) |

## AI Schedule Generation Analysis

### Current State
- One-shot generation
- Read-only HTML output
- No regeneration capability
- No editing of generated plan

### UX Gaps

| Gap | Impact | Fix Complexity |
|-----|--------|----------------|
| No "Regenerate" button | Users stuck with first result | Low |
| No specific times in output | Users must interpret vague schedule | Low (prompt change) |
| No rationale for scheduling | Users don't understand why | Low (prompt change) |
| No plan editing | Can't adjust AI output | Medium |

### Quick Wins (Prompt-Level Fixes)

1. Add specific times to AI output (e.g., "9:00 AM - Deep work")
2. Include brief rationale ("Morning is your peak focus time")
3. Format as actionable checklist

## Priority for Stability Milestone

### P0 — Must Work (Blocking)
- [ ] End-to-end flow: login → quiz → tasks → AI planning
- [ ] All three timeframes generate valid output (today/tomorrow/week)
- [ ] No crashes on edge cases (empty tasks, missing chronotype)
- [ ] Generated HTML displays correctly

### P1 — Should Verify (Important)
- [ ] Status quiz actually influences AI output
- [ ] Recurring tasks trigger habit stacking in prompt
- [ ] Save plan to database works
- [ ] Copy plan to clipboard works

### P2 — Future Milestone (Out of Scope Now)
- [ ] Regenerate button
- [ ] Plan rationale in AI output
- [ ] Calendar sync
- [ ] Task editing from plan view

## Competitive Landscape

| App | Chronotype | AI Scheduling | Status Check-In |
|-----|------------|---------------|-----------------|
| Your App | 4-type quiz | Gemini-based | **Yes (unique)** |
| Opal | No | No (time blocking) | No |
| Rise | Sleep-based | No | No |
| Timely | No | AI time tracking | No |

**Your differentiator:** Combining base chronotype + current status for dynamic scheduling is rare in the market.

## Recommendations for Stability

1. **Focus on verification, not new features**
   - Test all three timeframes thoroughly
   - Verify status quiz influences output
   - Ensure error states are handled

2. **Document what works**
   - Create test cases for each feature
   - Manual QA checklist for release

3. **Defer enhancements**
   - Regenerate button = next milestone
   - Calendar sync = future roadmap

---

*Research conducted: 2026-01-28*
