# External Integrations

**Analysis Date:** 2026-01-28

## APIs & External Services

**AI/LLM Services:**
- Google Gemini API (1.5-flash model)
  - What it's used for: Generate chronotype-aware task schedules in Hebrew
  - SDK/Client: Direct fetch to `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`
  - Auth: `REACT_APP_GEMINI_API_KEY` (exposed via .env)
  - Implementation: `src/hooks/usePlanner.js` lines 48-55
  - Prompt: Custom chronobiology coaching prompt with task context and scheduling rules
  - Response format: JSON with `candidates[0].content.parts[0].text` (markdown)
  - Processing: Converted to HTML via `marked.parse()`

**OpenRouter SDK:**
- @openrouter/sdk 0.4.0 installed but NOT ACTIVELY USED
- Risk: Unused dependency taking up space; consider removal in next cleanup

## Data Storage

**Databases:**
- Supabase PostgreSQL
  - Connection: `https://mtbwpweisvrvpwckkwaq.supabase.co` (via `REACT_APP_SUPABASE_URL`)
  - Client: @supabase/supabase-js 2.91.0
  - Implementation: `src/utils/supabaseClient.js`

**Database Schema:**
- `auth.users` - Supabase built-in user authentication table
- `profiles` - User profile data
  - Fields: `id` (UUID, PK), `name` (text), `base_chronotype` (text), `created_at` (timestamptz)
  - RLS: Users can only read/update/insert own profile

- `tasks` - User tasks for planning
  - Fields: `id` (UUID, PK), `user_id` (UUID, FK), `description` (text), `duration` (text), `type` (text), `recurring` (bool), `completed` (bool), `created_at` (timestamptz)
  - RLS: Users can CRUD only own tasks
  - Real-time: Supabase real-time subscriptions configured for postgres_changes events (`src/hooks/useTasks.js` lines 30-39)

- `plans` - Generated schedule HTML
  - Fields: `id` (UUID, PK), `user_id` (UUID, FK), `html` (text), `created_at` (timestamptz)
  - RLS: Users can only read/insert own plans
  - Note: No update/delete policy; plans are append-only

**Schema Location:** `supabase.sql` (apply manually or via Supabase dashboard)

**File Storage:**
- None configured. Plans stored as HTML strings in `plans.html` column.

**Caching:**
- None (browser memory via React state)

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (managed by @supabase/supabase-js)
  - Implementation: `src/context/AuthContext.js`

**Supported Methods:**
- Email/Password: Sign up and sign in via Supabase credentials
  - Flow: LoginScreen attempts sign in; if fails, attempts sign up with full_name metadata
  - Verification: Email confirmation required before session active

- OAuth2:
  - Google OAuth (via Supabase configured OAuth app)
    - Redirect URL: `window.location.origin` (dynamic)
    - Flow: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`

  - GitHub OAuth (via Supabase configured OAuth app)
    - Redirect URL: `window.location.origin` (dynamic)
    - Flow: `supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo } })`

**Auth State Management:**
- Context: `AuthContext` (`src/context/AuthContext.js`)
- Listens to: `supabase.auth.onAuthStateChange()` event
- Exports: `user`, `userData` (profile), `loading`, `fetchProfile()`, `signOut()`
- Providers user session globally to app via `<AuthProvider>`

**Session Persistence:**
- Automatic via Supabase (stored in browser localStorage)
- Checked on mount via `supabase.auth.getSession()`

**Profile Creation:**
- Created on first auth via `profiles.upsert()` with name from sign-up or login form
- Location: `src/components/screens/LoginScreen.jsx` lines 51-54

## Monitoring & Observability

**Error Tracking:**
- None (custom console.error filtering for AbortError suppression)

**Logs:**
- Browser console only via `console.error()` and `console.log()`
- AbortError suppression: `src/index.js` lines 7-36, `public/index.html` lines 15-47

**Performance:**
- web-vitals 2.1.4 - Core Web Vitals tracking (not currently reported to endpoint)
- No reporting endpoint configured

## CI/CD & Deployment

**Hosting:**
- GitHub Pages
- Repository: yacovdroridev/chronotypePlanner (from package.json homepage)
- Deploy command: `npm run deploy` → gh-pages -d build

**Deployment Flow:**
- `npm run predeploy` → builds production bundle
- `gh-pages` pushes `build/` to `gh-pages` branch
- Live at: `https://yacovdroridev.github.io/chronotypePlanner`

**CI Pipeline:**
- None detected (no GitHub Actions workflow)
- Tests run locally only: `npm test`

## Environment Configuration

**Required env vars:**
- `REACT_APP_SUPABASE_URL` - Supabase project endpoint
- `REACT_APP_SUPABASE_ANON_KEY` - Public/anon API key for client auth
- `REACT_APP_GEMINI_API_KEY` - Google Gemini API key

**Secrets location:**
- Development: `.env` file (gitignored in practice; template is `.env.example`)
- Production: GitHub repository secrets for deployment, Supabase dashboard for API key management
- Frontend exposure: All REACT_APP_* vars exposed to browser JavaScript (client-side only)

**Validation:**
- `src/utils/supabaseClient.js` logs error if SUPABASE_URL or SUPABASE_ANON_KEY missing
- `src/hooks/usePlanner.js` throws error if GEMINI_API_KEY missing before API call

## Webhooks & Callbacks

**Incoming:**
- OAuth redirect: Google/GitHub OAuth providers redirect to `window.location.origin` after auth approval
  - Supabase handles callback and session establishment automatically
  - No custom webhook endpoint required

**Outgoing:**
- None (no external service calls besides Gemini API for schedule generation)

## Real-time Features

**Supabase Real-time Subscriptions:**
- Channel: `tasks-{user_id}` subscribed in `src/hooks/useTasks.js`
- Events: `postgres_changes` on `tasks` table for all events (INSERT, UPDATE, DELETE)
- Filter: `user_id=eq.{user_id}` to receive only own task changes
- Callback: Refetches tasks from database on any change
- Cleanup: Unsubscribes on unmount or user change

---

*Integration audit: 2026-01-28*
