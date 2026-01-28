# Chronotype Planner (מבוך האנרגיה)

## What This Is

A chronotype-aware task planning app in Hebrew. Users take a quiz to discover their chronotype (lion, bear, wolf, dolphin), add tasks, and get AI-generated schedules optimized for their energy patterns — by day, tomorrow, or week. Built with React, Supabase, and Google Gemini.

## Core Value

Users get a personalized schedule based on their chronotype and current tasks — the AI planning must work reliably for today, tomorrow, and weekly timeframes.

## Requirements

### Validated

- ✓ User can sign up with email/password — existing
- ✓ User can log in with Google or GitHub OAuth — existing
- ✓ User session persists across refresh (Supabase auth) — existing
- ✓ User can take chronotype quiz to determine base type — existing
- ✓ User can take status quiz for current energy state — existing
- ✓ User can add tasks with description, duration, type, recurring flag — existing
- ✓ User can toggle task completion — existing
- ✓ User can delete tasks — existing
- ✓ Tasks sync in real-time via Supabase subscriptions — existing
- ✓ User sees chronotype result with description and emoji — existing
- ✓ Hebrew RTL UI throughout — existing

### Active

- [ ] Full app works end-to-end without crashes (login → quiz → tasks → planning)
- [ ] AI planning generates schedule for "today" timeframe
- [ ] AI planning generates schedule for "tomorrow" timeframe
- [ ] AI planning generates schedule for "week" timeframe
- [ ] Generated plan displays correctly as formatted HTML
- [ ] User can save generated plan to database
- [ ] User can copy plan to clipboard

### Out of Scope

- New features beyond current functionality — this milestone is about stability, not additions
- Backend/server-side changes — frontend-only work with existing Supabase setup
- Internationalization — Hebrew-only is fine

## Context

- Brownfield project on `react-refactor` branch — recently migrated to CRA React with Supabase
- Codebase map available at `.planning/codebase/`
- Gemini API (1.5-flash) used for schedule generation via direct fetch
- AI prompt includes chronotype context, task list, and scheduling rules
- Plans stored as HTML in `plans` table
- Known concerns: XSS risk with dangerouslySetInnerHTML, client-exposed API key, AbortError suppression masking real issues

## Constraints

- **Tech stack**: React 19 + Supabase + Tailwind — no framework changes
- **API**: Google Gemini 1.5-flash — no switching LLM providers
- **Language**: Hebrew UI, RTL layout — must preserve
- **Scope**: Stabilize and verify existing features, not build new ones

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Focus on stability over features | User wants confidence everything works before adding more | — Pending |
| Keep existing architecture | No refactoring — verify current code works | — Pending |

---
*Last updated: 2026-01-28 after initialization*
