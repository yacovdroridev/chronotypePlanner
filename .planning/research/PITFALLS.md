# Pitfalls Research: React + Supabase + LLM Common Mistakes

**Research Date:** 2026-01-28
**Focus:** Mistakes to avoid during stabilization

## React Pitfalls

### 1. Missing Error Boundaries
**Symptom:** White screen of death on any component error
**Your status:** **AFFECTED** — no error boundaries in codebase
**Fix:** Add react-error-boundary at app and screen level
```javascript
import { ErrorBoundary } from 'react-error-boundary';
<ErrorBoundary fallback={<ErrorFallback />}>
  <App />
</ErrorBoundary>
```

### 2. useEffect Cleanup Race Conditions
**Symptom:** "Can't perform state update on unmounted component"
**Your status:** Partially affected (AbortError suppression masks this)
**Fix:** Use AbortController properly, not just suppress errors
```javascript
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal });
  return () => controller.abort();
}, []);
```

### 3. Stale Closures in Event Handlers
**Symptom:** Handler uses old state values
**Your status:** Low risk — simple state patterns
**Prevention:** Use functional updates: `setTasks(prev => [...prev, newTask])`

### 4. Overusing Context for Frequently Changing Data
**Symptom:** Entire app re-renders on small state changes
**Your status:** OK — AuthContext changes infrequently
**Prevention:** Keep frequently changing data (tasks, plans) in local state/hooks

## Supabase Pitfalls

### 1. Real-time Subscription Leaks
**Symptom:** Multiple connections, duplicate events, memory leaks
**Your status:** **PARTIALLY AFFECTED** — subscription in useTasks
**Fix:** Store channel in ref, unsubscribe on cleanup
```javascript
const channelRef = useRef(null);
useEffect(() => {
  channelRef.current = supabase.channel(`tasks-${user.id}`);
  // ... subscribe
  return () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }
  };
}, [user?.id]);
```

### 2. Optimistic Updates Without Rollback
**Symptom:** UI shows success, but data didn't persist
**Your status:** **AFFECTED** — useTasks has optimistic updates without full rollback
**Fix:** Save previous state before optimistic update, restore on error
```javascript
const previousTasks = tasks;
setTasks(optimisticUpdate);
try {
  await supabase.from('tasks').insert(newTask);
} catch (error) {
  setTasks(previousTasks); // Rollback
  throw error;
}
```

### 3. Missing RLS Policies
**Symptom:** Users can access other users' data
**Your status:** OK — RLS policies defined in supabase.sql
**Prevention:** Always test with different user sessions

### 4. Session Expiry Not Handled
**Symptom:** API calls fail silently after session expires
**Your status:** Low risk — Supabase auto-refreshes tokens
**Prevention:** Handle 401 errors by redirecting to login

## LLM Integration Pitfalls

### 1. No Retry Logic for Transient Failures
**Symptom:** "Failed to generate plan" on temporary API hiccups
**Your status:** **AFFECTED** — single attempt, no retry
**Fix:** Exponential backoff with max 3 retries
```javascript
const generateWithRetry = async (prompt, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await callGemini(prompt);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000);
    }
  }
};
```

### 2. XSS via Unsanitized AI Output
**Symptom:** Malicious content in AI response executes as HTML
**Your status:** **CRITICAL — AFFECTED** — dangerouslySetInnerHTML without sanitization
**Fix:** Always sanitize before rendering
```javascript
import DOMPurify from 'dompurify';
const safeHtml = DOMPurify.sanitize(aiGeneratedHtml);
<div dangerouslySetInnerHTML={{ __html: safeHtml }} />
```

### 3. Client-Exposed API Keys
**Symptom:** Anyone can use your API key, run up bills
**Your status:** **AFFECTED** — REACT_APP_GEMINI_API_KEY exposed in browser
**Fix (future):** Move to Supabase Edge Function as proxy
**Fix (now):** Rate limit on Gemini dashboard, monitor usage

### 4. Prompt Injection
**Symptom:** User input manipulates AI behavior
**Your status:** Low risk — task descriptions are limited, but still sanitize
**Prevention:** Escape user input in prompts, limit task description length

### 5. No Timeout for LLM Calls
**Symptom:** UI hangs indefinitely on slow AI response
**Your status:** **AFFECTED** — no timeout on fetch
**Fix:** Add AbortController with timeout
```javascript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);
try {
  const response = await fetch(url, { signal: controller.signal });
} finally {
  clearTimeout(timeout);
}
```

## JavaScript/General Pitfalls

### 1. alert() for Error Messages
**Symptom:** Blocks UI, poor UX, not accessible
**Your status:** **AFFECTED** — LoginScreen and usePlanner use alert()
**Fix:** Inline error state with Hebrew messages
```javascript
const [error, setError] = useState(null);
// ...
{error && <div className="text-red-500">{error}</div>}
```

### 2. console.error Suppression Masking Real Issues
**Symptom:** Errors hidden, debugging impossible
**Your status:** **AFFECTED** — AbortError filter in index.js/index.html
**Impact:** May hide legitimate errors that contain "AbortError" string
**Fix:** More specific filtering, or better: fix the root cause

### 3. Missing Loading States
**Symptom:** User doesn't know if action is processing
**Your status:** Partially OK — loading states exist but could be more granular
**Fix:** Add loading indicators to all buttons that trigger async ops

## Priority Matrix for Stability Milestone

| Pitfall | Severity | Effort | Fix Now? |
|---------|----------|--------|----------|
| No error boundaries | High | Low | **Yes** |
| XSS vulnerability | Critical | Low | **Yes** |
| No retry logic | Medium | Low | **Yes** |
| No timeout on LLM | Medium | Low | **Yes** |
| alert() usage | Low | Medium | Yes |
| Subscription leaks | Medium | Medium | If time |
| Optimistic rollback | Medium | Medium | If time |
| Client API key | High | High | Future |

## Checklist Before Release

- [ ] ErrorBoundary added at app level
- [ ] DOMPurify sanitizes AI HTML output
- [ ] Gemini API calls have retry logic
- [ ] Gemini API calls have 30s timeout
- [ ] Loading states on all async buttons
- [ ] Error messages are inline (not alerts) and in Hebrew

---

*Research conducted: 2026-01-28*
