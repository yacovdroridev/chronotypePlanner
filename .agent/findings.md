# Findings & Research

## Technical Discoveries

### React Strict Mode & Supabase
**Finding:** React 19's Strict Mode in development causes components to mount twice, triggering Supabase auth checks to abort.

**Evidence:**
- Console shows 4x `AbortError: signal is aborted without reason`
- Errors occur at `bundle.js:5827:23` (Supabase auth internals)
- Only happens in development, not production

**Root Cause:**
```javascript
// React Strict Mode (index.js)
<React.StrictMode>
  <App />
</React.StrictMode>
```

**Solution Hierarchy:**
1. ❌ Try-catch in `AuthContext` → React overlay intercepts first
2. ❌ Event listeners in `index.js` → Too late in execution order
3. ✅ **Inline script in `public/index.html`** → Runs before React, uses capture phase

**Implementation:**
```html
<script>
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('AbortError')) {
      event.stopImmediatePropagation();
      event.preventDefault();
      return true;
    }
  }, true); // Capture phase is key
</script>
```

---

### Jest & ESM Modules
**Finding:** Jest cannot parse `marked` library's ESM exports

**Error:**
```
SyntaxError: Unexpected token 'export'
at marked/lib/marked.esm.js:71
```

**Attempted Solutions:**
1. Update `App.test.js` to mock Supabase → Still fails on `marked` import
2. Configure Jest transformIgnorePatterns → Requires ejecting from CRA

**Workaround:** Prioritize manual browser testing over unit tests

**Future Fix:** Consider migrating to Vitest (native ESM support)

---

### Supabase RLS Policies
**Finding:** Row Level Security is enabled on all tables

**Schema:**
```sql
-- profiles table
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- tasks table  
CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid() = user_id);
```

**Implication:** All database queries automatically filter by authenticated user

---

### Gemini API Rate Limits
**Finding:** gemini-1.5-flash has generous rate limits for free tier

**Limits:**
- 15 RPM (requests per minute)
- 1 million TPM (tokens per minute)
- 1,500 RPD (requests per day)

**Implication:** Sufficient for single-user testing, may need upgrade for production

---

## Architecture Insights

### Original Codebase Structure
**Finding:** The original app was a Vanilla JS SPA disguised as React

**Evidence:**
```javascript
// App.js (original)
function App() {
  useEffect(() => {
    initApp(); // Vanilla JS initialization
  }, []);
  
  return <div dangerouslySetInnerHTML={{ __html: appMarkup }} />;
}
```

**Problems:**
1. No component reusability
2. Manual DOM manipulation
3. No React state management
4. Security risk (dangerouslySetInnerHTML)
5. Hard to test

**Refactoring Impact:**
- Reduced `appLogic.js` from 618 lines to modular hooks
- Eliminated `appMarkup.js` (307 lines) entirely
- Created 8 focused components
- Enabled proper React patterns

---

### Component Hierarchy
**Finding:** Optimal structure for this app is flat, not deeply nested

**Rationale:**
- Only 4 main views (login, hub, quiz, result)
- No complex nested routing
- State is global (AuthContext) or local (view-specific)

**Structure:**
```
App (view router)
├── MainLayout (wrapper)
│   ├── ProgressBar
│   ├── LoginScreen
│   ├── HubScreen
│   ├── QuizScreen
│   └── ResultScreen
```

---

## User Experience Insights

### Hebrew RTL Considerations
**Finding:** TailwindCSS handles RTL well, but some manual adjustments needed

**Examples:**
```jsx
// Correct: Use logical properties
<div className="ml-2">  // Becomes margin-right in RTL

// Manual override when needed
<ArrowLeft className="ml-1" />  // Icon direction
```

**Best Practice:** Test all UI in actual RTL mode, not just translations

---

### Chronotype Quiz Logic
**Finding:** Original quiz used a "voting" system to determine result

**Algorithm:**
```javascript
function calculateWinner(history) {
  const counts = { bear: 0, lion: 0, wolf: 0, dolphin: 0 };
  history.forEach(type => counts[type]++);
  return Object.keys(counts).reduce((a, b) => 
    counts[a] > counts[b] ? a : b
  );
}
```

**Insight:** Simple majority vote across 3 questions. Could be enhanced with weighted questions.

---

### Status Check vs Base Quiz
**Finding:** Users were confused when "Status Check" showed the full quiz

**Original Bug:**
```javascript
// QuizScreen didn't check mode
if (step < QUESTIONS.length) {
  // Always showed base questions
}
```

**Fix:**
```javascript
if (mode === 'status') {
  return <StatusOptions />;  // Skip to feeling selector
}
```

**Impact:** Improved UX by respecting user intent

---

## Security Findings

### Environment Variables
**Finding:** CRA only exposes variables prefixed with `REACT_APP_`

**Correct:**
```bash
REACT_APP_SUPABASE_URL=...
REACT_APP_GEMINI_API_KEY=...
```

**Incorrect:**
```bash
SUPABASE_URL=...  # Won't be accessible
```

**Access:**
```javascript
process.env.REACT_APP_SUPABASE_URL
```

---

### Supabase Anon Key
**Finding:** The "anon" key is safe to expose in client-side code

**Reason:** RLS policies enforce security at database level  
**Verification:** Checked Supabase docs + existing implementation

**Still Required:** `.env.local` for consistency and easy rotation

---

## Performance Observations

### Bundle Size
**Finding:** Current bundle is reasonable for a small app

**Dependencies:**
- React: ~140KB
- Supabase: ~50KB
- TailwindCSS: ~10KB (purged)
- marked: ~20KB
- lucide-react: ~5KB (tree-shaken)

**Total:** ~225KB (gzipped)

**Optimization Opportunity:** Lazy load `ResultScreen` and `usePlanner` (only needed after quiz)

---

### Realtime Subscriptions
**Finding:** Supabase realtime is configured but not actively used

**Code:**
```javascript
// In original appLogic.js
tasksChannel = supabase
  .channel('tasks')
  .on('postgres_changes', ...)
  .subscribe();
```

**Status:** Commented out in refactor  
**Recommendation:** Re-enable for multi-device sync

---

## Deployment Findings

### GitHub Pages Configuration
**Finding:** App is configured for subdirectory deployment

**package.json:**
```json
{
  "homepage": "https://yacovdroridev.github.io/chronotypePlanner"
}
```

**Implication:** All routes must account for `/chronotypePlanner` base path

**Current Issue:** Router not configured for basename  
**Fix Needed:** Add `<BrowserRouter basename="/chronotypePlanner">`

---

## External Resources

### Helpful Documentation
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [React Strict Mode](https://react.dev/reference/react/StrictMode)
- [Gemini API Docs](https://ai.google.dev/docs)
- [TailwindCSS RTL](https://tailwindcss.com/docs/hover-focus-and-other-states#rtl-support)

### Similar Projects
- [Chronotype Quiz](https://github.com/topics/chronotype) (GitHub topic)
- [Task Scheduling Apps](https://github.com/topics/task-scheduler)

---

## Constraints & Limitations

### Browser Compatibility
**Target:** Modern browsers (Chrome 90+, Firefox 88+, Safari 14+)  
**Reason:** Uses ES2020 features, CSS Grid, Flexbox

### Mobile Support
**Status:** Responsive design implemented  
**Testing:** Manual testing needed on iOS/Android

### Offline Support
**Status:** Not implemented  
**Consideration:** Could add service worker for PWA

---

*This document captures all technical discoveries, insights, and research findings during development.*
