# Codebase Concerns

**Analysis Date:** 2026-01-28

## Tech Debt

**Error Suppression Masking Real Issues:**
- Issue: Extensive error suppression in `src/index.js` (lines 6-37) and `public/index.html` (lines 14-48) suppresses AbortError warnings from Supabase. This hides legitimate errors and makes debugging difficult.
- Files: `src/index.js`, `public/index.html`
- Impact: Errors in development are silently hidden, making it harder to catch bugs early. Error suppression affects console output globally.
- Fix approach: Identify root cause of AbortError from Supabase (likely request cancellation on component unmount) and fix properly, then remove error suppression entirely.

**Unvalidated Credentials in Repository:**
- Issue: `.env.example` contains actual Supabase URL and publishable key (lines 1-2), which are partially exposed public credentials. If the `.env` file is committed, secrets would be visible.
- Files: `.env.example`
- Impact: Public Supabase credentials could be compromised if `.env` is accidentally committed. The key is marked as "publishable" but still contains sensitive project information.
- Fix approach: Never commit `.env`, ensure `.gitignore` excludes it, and regenerate exposed credentials in Supabase console. Use truly anonymous/limited-scope keys when possible.

**API Key Exposed in Environment:**
- Issue: `usePlanner.js` (line 13) reads `REACT_APP_GEMINI_API_KEY` from environment and uses it directly in fetch requests on the client side. Client-side API keys can be reverse-engineered from network requests.
- Files: `src/hooks/usePlanner.js`
- Impact: Gemini API key is exposed in network traffic and can be stolen, leading to unauthorized API usage and quota depletion.
- Fix approach: Move Gemini API calls to a backend endpoint with proper authentication. Never expose API keys on client.

## Security Concerns

**XSS Vulnerability in Plan Rendering:**
- Issue: `dangerouslySetInnerHTML` used in `ResultScreen.jsx` (line 126) to render AI-generated HTML from Gemini API without sanitization. The `marked.parse()` library may not prevent XSS if adversary controls API response.
- Files: `src/components/screens/ResultScreen.jsx` (line 126)
- Impact: If Gemini API is compromised or if request is intercepted, malicious JavaScript could execute in user's browser, stealing session tokens or personal data.
- Fix approach: Sanitize HTML using `DOMPurify` library before rendering, or render parsed markdown as React components instead of raw HTML.

**Missing Input Validation:**
- Issue: Task descriptions, durations, and user inputs are not validated before being sent to Supabase. No length limits, no sanitization of special characters.
- Files: `src/components/screens/HubScreen.jsx` (line 18), `src/components/screens/ResultScreen.jsx` (line 13), `src/hooks/useTasks.js` (lines 46-59)
- Impact: Database could be polluted with invalid data; extremely long strings could cause storage issues or display problems.
- Fix approach: Add input validation (max length, allowed characters) before sending to database. Use schema validation on Supabase side as well.

**Missing CSRF Protection:**
- Issue: No CSRF tokens on state-changing operations (task add/update/delete). Supabase auth handles some protection but explicit CSRF guards are absent.
- Files: `src/hooks/useTasks.js`, `src/hooks/usePlanner.js`
- Impact: Theoretically low risk with Supabase auth, but if user visits malicious site while logged in, the site could force task operations.
- Fix approach: Verify Supabase's CSRF protection documentation; add explicit CSRF tokens if needed for additional security.

## Performance Bottlenecks

**Inefficient Subscription Cleanup:**
- Issue: In `useTasks.js` (lines 30-43), a real-time subscription is created with `supabase.channel()` on every render if `user` changes. The subscription is removed but frequent reconnections could waste resources.
- Files: `src/hooks/useTasks.js`
- Impact: Multiple subscriptions could accumulate if the user context changes rapidly, consuming WebSocket connections and causing performance degradation.
- Fix approach: Deduplicate subscription logic, ensure only one subscription per user_id, and use proper cleanup timing.

**Optimistic Updates Without Proper Rollback:**
- Issue: In `useTasks.js`, optimistic updates (lines 62-70, 76-85) revert state on error but don't maintain complete previous state for complex cases. Delete operation (line 83) calls `fetchTasks()` which re-queries entire dataset.
- Files: `src/hooks/useTasks.js`
- Impact: Poor user experience on errors; full refetch on delete is inefficient with large task lists. Could cause list to flicker.
- Fix approach: Maintain complete previous state before optimistic update, restore it precisely on error instead of refetching.

**Full Task Refetch on Mutation:**
- Issue: After adding a task (line 57), state is updated immediately, but subscription still triggers a full `fetchTasks()` call. This causes redundant query and potential double-rendering.
- Files: `src/hooks/useTasks.js`
- Impact: Network overhead; with many tasks, refetch becomes slow. UI may stutter when task operations occur.
- Fix approach: Trust optimistic update and only refetch on error or use subscription update instead of full refetch.

**No Pagination/Virtualization for Tasks:**
- Issue: All tasks are rendered in memory without pagination or virtual scrolling. UI renders all task DOM nodes even if off-screen.
- Files: `src/components/screens/HubScreen.jsx` (lines 61-78), `src/components/screens/ResultScreen.jsx` (lines 82-102)
- Impact: With hundreds of tasks, rendering becomes slow; memory usage grows linearly with task count.
- Fix approach: Implement pagination or virtual scrolling using a library like `react-window` for large task lists.

**Missing Progress Indicator During AI Generation:**
- Issue: `generateSchedule()` in `usePlanner.js` sets loading state but provides no progress feedback. Large requests to Gemini could take 10+ seconds with no user feedback.
- Files: `src/hooks/usePlanner.js`
- Impact: Users may click button multiple times thinking it didn't work, resulting in duplicate API calls and wasted quota.
- Fix approach: Show animated loading state with estimated time, disable button with clear feedback, or add timeout handling.

## Fragile Areas

**Tightly Coupled View State Management:**
- Issue: Navigation state (view: 'login'/'hub'/'quiz'/'result') is managed in `App.js` (lines 13, 22, 56) with complex conditional rendering. No centralized state management (Redux, Context, Zustand).
- Files: `src/App.js`
- Impact: Adding new views or modifying navigation is error-prone. State transitions are implicit and hard to debug. Testing view transitions is difficult.
- Safe modification: Use Context API or state management library to centralize view state before adding new flows.
- Test coverage: Only one render test exists in `App.test.js`; view transitions are untested.

**Missing Error Recovery:**
- Issue: Many operations show alerts on error (`LoginScreen.jsx` line 36, `HubScreen.jsx` line 17, `useTasks.js` line 55) but don't provide retry mechanisms. Failed operations are lost.
- Files: `src/components/screens/LoginScreen.jsx`, `src/components/screens/HubScreen.jsx`, `src/hooks/useTasks.js`, `src/hooks/usePlanner.js`
- Impact: Users must manually retry operations; failed authentications or network errors are frustrating to recover from.
- Safe modification: Implement retry queue for failed operations; provide persistent error messages with retry buttons.

**Unprotected Profile Creation:**
- Issue: In `LoginScreen.jsx` (lines 51-54), profile is upserted after every login without checking if it already exists, even if name didn't change.
- Files: `src/components/screens/LoginScreen.jsx`
- Impact: Unnecessary database writes on every login. User `name` could be overwritten if OAuth login happens and name field is empty.
- Safe modification: Only upsert if user is new (check `created_at`), or only update name if it changed.

**Missing Logout Confirmation Consistency:**
- Issue: Logout in `MainLayout.jsx` (line 10) asks for confirmation, but logout from `AuthContext.js` doesn't. Inconsistent user experience.
- Files: `src/components/layout/MainLayout.jsx`, `src/context/AuthContext.js`
- Impact: Minor UX inconsistency; could confuse users if they trigger logout from different paths.
- Safe modification: Standardize logout flow with confirmation in one place only.

**AI-Generated Content Not Persisted With Context:**
- Issue: In `ResultScreen.jsx`, plan HTML is generated but not linked to the quiz result or tasks that created it. Generating a new plan overwrites the old one with no way to compare.
- Files: `src/hooks/usePlanner.js` (lines 76-84), `src/components/screens/ResultScreen.jsx`
- Impact: Users lose ability to compare plans or understand which tasks were used to generate them.
- Safe modification: Store plan with metadata (tasks used, chronotype, timeframe) in database before rendering.

## Known Bugs

**View State Not Preserved on Navigation:**
- Symptoms: If user is on quiz screen and manually navigates (browser back), they return to hub instead of resuming quiz progress.
- Files: `src/App.js` (lines 54-59)
- Trigger: Click back button or browser back while on quiz, then navigate forward
- Workaround: Restart quiz; progress is recalculated based on quiz mode.

**Session Re-fetch on Mount:**
- Symptoms: Page flickers briefly on load showing "Loading..." then content.
- Files: `src/context/AuthContext.js` (lines 13-30)
- Cause: `checkSession()` is async but loading is only set to false in finally block, causing initial render with loading=true.
- Workaround: User experience issue only; data loads correctly eventually.

**AbortError Not Fully Suppressed in Production:**
- Symptoms: Console shows AbortError warnings in development when navigating away from pages during fetch.
- Files: `src/index.js`, `public/index.html`
- Cause: Supabase cancels requests on unmount but error isn't caught at the request level.
- Workaround: Error suppression hides it but doesn't fix root cause; currently masked by filtering.

**OAuth Redirect Loop:**
- Symptoms: OAuth login may cause redirect loop if redirect URL doesn't match Supabase config.
- Files: `src/components/screens/LoginScreen.jsx` (line 67)
- Cause: `redirectTo: window.location.origin` may not match Supabase's configured redirect URI exactly.
- Workaround: Ensure Supabase OAuth settings include the exact redirect URL used in app.

## Test Coverage Gaps

**No Authentication Tests:**
- What's not tested: Login, signup, OAuth flows, session persistence, logout
- Files: `src/context/AuthContext.js`, `src/components/screens/LoginScreen.jsx`
- Risk: Auth regressions could lock users out; security issues in auth flow are undetected.
- Priority: High

**No Hook Tests:**
- What's not tested: `useChronotype`, `useTasks`, `usePlanner` - core business logic
- Files: `src/hooks/`
- Risk: Task operations, AI plan generation, data mutations could silently break.
- Priority: High

**No Component Integration Tests:**
- What's not tested: HubScreen, ResultScreen, QuizScreen - full user flows
- Files: `src/components/screens/`
- Risk: Breaking UI changes, navigation regressions, data binding issues undetected.
- Priority: Medium

**No Database Tests:**
- What's not tested: Profile creation, task persistence, plan saving
- Files: All files using Supabase
- Risk: Data corruption, lost user data undetected; migration issues unknown.
- Priority: High

**Test Only Covers Render State:**
- What's not tested: User interactions, form submissions, button clicks
- Files: `src/App.test.js`
- Risk: Behavior bugs (e.g., task not saving) are undetected despite component rendering.
- Priority: Medium

## Scaling Limits

**Single Subscription Per User:**
- Current capacity: Works well with 1-2 subscriptions; could become unstable if more are added.
- Limit: With >10 active subscriptions or rapid connection/disconnection, Supabase WebSocket could drop.
- Scaling path: Implement subscription pooling or use REST polling for periodic updates instead of real-time.

**AI API Rate Limiting:**
- Current capacity: No rate limiting on Gemini API calls; users can spam "generate" button.
- Limit: Gemini free tier has strict rate limits; app could hit quota with 10-20 concurrent users.
- Scaling path: Implement client-side debouncing/throttling, add backend queue for AI requests, or cache results.

**Task List Memory Growth:**
- Current capacity: <1000 tasks work fine; rendering becomes slow at 5000+ tasks.
- Limit: Without pagination, task array in memory grows without bound.
- Scaling path: Implement pagination, filtering, or virtual scrolling; query only visible items from database.

**Gemini API Cost:**
- Current capacity: Free tier only; no cost tracking.
- Limit: App could incur significant costs if abused or if request volume grows.
- Scaling path: Implement usage quotas per user, add payment tier, cache common prompts, or use cheaper model.

## Dependencies at Risk

**@supabase/supabase-js ^2.91.0:**
- Risk: Dependency is somewhat pinned but minor/patch updates could break auth flow or real-time subscriptions without warning.
- Impact: Breaking changes in Supabase client could lock users out or cause data sync issues.
- Migration plan: Pin to exact version (remove ^), add integration tests for Supabase operations before updating.

**react-scripts 5.0.1:**
- Risk: Create React App is no longer recommended for new projects; relies on build-time static analysis that may become outdated.
- Impact: Security vulnerabilities in Webpack or Babel could be exposed; build process could break with new Node versions.
- Migration plan: Plan migration to Vite or Next.js for better build performance and security updates.

**marked ^17.0.1:**
- Risk: HTML parsing library; uncontrolled version could introduce XSS vulnerabilities with dangerouslySetInnerHTML usage.
- Impact: Used unsafely in ResultScreen; could allow code injection if Gemini API response is compromised.
- Migration plan: Lock to exact version, add DOMPurify for sanitization before rendering.

**No dev dependency on ESLint/Prettier:**
- Risk: Code style and quality checks are missing; inconsistencies could accumulate.
- Impact: New developers could introduce bugs easily; code reviews harder without automated checks.
- Migration plan: Add ESLint with React plugin, Prettier for formatting; add pre-commit hooks.

## Missing Critical Features

**No Error Boundary:**
- Problem: App has no error boundary component; any unhandled error crashes entire app.
- Blocks: Error recovery, graceful degradation, debugging React errors.
- Impact: Users see blank page on error; no fallback UI.

**No Network Connectivity Handling:**
- Problem: App doesn't detect offline status or show offline indicator.
- Blocks: Users can't tell if operations are failing due to network; no offline support.
- Impact: Confusing UX when network drops; users don't know to retry.

**No Loading States for Async Operations:**
- Problem: Many async operations lack loading UI (task delete, profile fetch, etc).
- Blocks: Users can't tell if operation is in progress; button mashing is easy.
- Impact: Duplicate operations, user confusion.

**No Confirmation Dialogs for Destructive Operations:**
- Problem: Only task delete asks for confirmation (useTasks.js line 74); profile overwrite, plan deletion, logout have no confirmation.
- Blocks: Accidental data loss is possible.
- Impact: Users could accidentally delete plans or logout without intent.

**No Data Export:**
- Problem: Users can't export their chronotype history, tasks, or plans.
- Blocks: Data portability; users locked into app.
- Impact: GDPR compliance gap; user trust issue.

**No Dark Mode:**
- Problem: UI is bright white; no dark mode option.
- Blocks: Accessibility for users sensitive to bright light; battery usage on OLED screens.
- Impact: Limited audience appeal; accessibility concern.

---

*Concerns audit: 2026-01-28*
