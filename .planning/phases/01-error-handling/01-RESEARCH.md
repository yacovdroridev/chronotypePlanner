# Phase 1: Error Handling - Research

**Researched:** 2026-01-28
**Domain:** React error handling, loading states, and user feedback patterns
**Confidence:** HIGH

## Summary

Error handling in React applications requires a multi-layered approach combining Error Boundaries for component crashes, inline error messages for user feedback, and loading states for async operations. The current codebase has critical gaps: no Error Boundaries (white screen on crash), alert() popups instead of inline messages, and no retry/timeout logic for API calls.

The standard approach uses `react-error-boundary` library for catching rendering errors, state-based error management for async operations, and discriminated union patterns for loading states. For this stability phase, the focus is on preventing white screens, replacing alerts with Hebrew inline errors, and showing loading feedback for all async operations (login, Supabase tasks, Gemini AI planning).

**Primary recommendation:** Add `react-error-boundary` at app and screen levels, replace all alert() calls with inline error state, and ensure every async button shows loading indicators.

## Standard Stack

The established libraries/tools for React error handling:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-error-boundary | 4.1.2+ (v5 available) | Catch component rendering errors | Official React team recommendation, wraps class-based ErrorBoundary pattern |
| React useState | Built-in | Track loading/error states for async ops | Native React solution, no dependencies |
| AbortController | Native Web API | Timeout and cancellation for fetch | Standard browser API, zero dependencies |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| DOMPurify | 3.2.0+ | Sanitize AI-generated HTML | When using dangerouslySetInnerHTML (XSS prevention) |
| exponential-backoff | 4.1.0+ (optional) | Retry logic with backoff | If custom retry gets complex; can hand-roll for simple cases |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| react-error-boundary | Custom class component ErrorBoundary | react-error-boundary provides hooks (useErrorHandler), resetKeys, better DX |
| AbortController | setTimeout without cleanup | AbortController is standard, cancellable, prevents memory leaks |
| Inline error state | alert() | alert() blocks UI, poor UX, not accessible |
| Custom retry logic | TanStack Query | TanStack Query is powerful but large refactor; hand-roll for stability phase |

**Installation:**
```bash
npm install react-error-boundary
npm install dompurify  # for XSS fix (separate from error handling but related)
```

## Architecture Patterns

### Recommended Error Boundary Structure
```
App (Root)
├── <ErrorBoundary fallback={<AppCrashScreen />}>  ← Global: catches everything
│   ├── AuthProvider
│   ├── AppContent
│   │   ├── <ErrorBoundary fallback={<ScreenError />}>  ← Screen-level: isolates failures
│   │   │   └── LoginScreen
│   │   ├── <ErrorBoundary fallback={<ScreenError />}>
│   │   │   └── HubScreen
│   │   ├── <ErrorBoundary fallback={<ScreenError />}>
│   │   │   └── QuizScreen
│   │   └── <ErrorBoundary fallback={<ScreenError />}>
│   │       └── ResultScreen
│   │           └── <ErrorBoundary fallback={<PlanError />}>  ← Critical section: AI plan display
│   │               └── PlanDisplay
```

**Granularity strategy:**
- Global boundary for catastrophic failures
- Screen-level boundaries to isolate crashes (user can navigate away)
- Critical section boundaries for high-risk components (AI HTML rendering)

### Pattern 1: Error Boundary Wrapper
**What:** Wrap components to catch rendering errors and show fallback UI
**When to use:** Around screens and critical sections that might crash
**Example:**
```jsx
// Source: https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
// Using react-error-boundary library: https://www.npmjs.com/package/react-error-boundary

import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div role="alert" className="text-center p-8">
      <h2 className="text-xl font-bold text-red-600 mb-2">משהו השתבש</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="bg-indigo-600 text-white px-4 py-2 rounded"
      >
        נסה שוב
      </button>
    </div>
  );
}

// Usage
<ErrorBoundary
  FallbackComponent={ErrorFallback}
  onReset={() => {
    // Reset state, navigate away, or reload data
  }}
>
  <ResultScreen />
</ErrorBoundary>
```

### Pattern 2: Inline Error State for Async Operations
**What:** Track error in state and display near the operation trigger
**When to use:** For all async operations (login, task CRUD, AI generation)
**Example:**
```jsx
// Source: Community pattern verified across multiple sources
// https://stevekinney.com/courses/react-typescript/loading-states-error-handling
// https://medium.com/@sainudheenp/how-senior-react-developers-handle-loading-states-error-handling-a-complete-guide-ffe9726ad00a

const LoginScreen = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);  // Add this

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);  // Clear previous error

    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
    } catch (err) {
      setError(err.message);  // Set error state instead of alert()
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Form inputs */}

      {error && (  // Display inline, not alert()
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4" role="alert">
          <p>{error}</p>
        </div>
      )}

      <button disabled={loading}>
        {loading ? 'טוען...' : 'התחבר'}
      </button>
    </form>
  );
};
```

### Pattern 3: Discriminated Union for Loading States
**What:** Single state object with status types to prevent impossible states
**When to use:** Complex async operations with multiple outcomes
**Example:**
```jsx
// Source: https://stevekinney.com/courses/react-typescript/loading-states-error-handling
// State machine pattern - advanced but recommended for complex flows

const [state, setState] = useState({ status: 'idle' });

// Possible states:
// { status: 'idle' }
// { status: 'loading' }
// { status: 'success', data: {...} }
// { status: 'error', error: 'message' }

const generateSchedule = async () => {
  setState({ status: 'loading' });
  try {
    const data = await callGeminiAPI();
    setState({ status: 'success', data });
  } catch (error) {
    setState({ status: 'error', error: error.message });
  }
};

// Render based on status
if (state.status === 'loading') return <Spinner />;
if (state.status === 'error') return <ErrorMessage error={state.error} />;
if (state.status === 'success') return <PlanDisplay data={state.data} />;
return <GenerateButton onClick={generateSchedule} />;
```

### Pattern 4: Retry with Exponential Backoff
**What:** Retry failed async operations with increasing delays
**When to use:** External API calls (Gemini, Supabase) that might have transient failures
**Example:**
```javascript
// Source: https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/
// https://medium.com/@vnkelkar11/react-error-handling-best-practices-exponential-backoff-for-fetch-requests-9c24d119dcda

const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isLastAttempt = attempt === maxRetries - 1;
      if (isLastAttempt) throw error;

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Usage
const generateSchedule = async (timeframe, tasks, chronotype) => {
  setLoading(true);
  try {
    const plan = await retryWithBackoff(() => callGeminiAPI(prompt), 3);
    setPlanHtml(plan);
  } catch (error) {
    setError('שגיאה ביצירת תוכנית: ' + error.message);
  } finally {
    setLoading(false);
  }
};
```

### Pattern 5: Timeout with AbortController
**What:** Set timeout for async operations to prevent indefinite hangs
**When to use:** Any fetch call, especially external APIs
**Example:**
```javascript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static
// Native browser API - zero dependencies

// Modern approach (simplest)
const response = await fetch(url, {
  signal: AbortSignal.timeout(30000)  // 30 second timeout
});

// Manual approach (more control)
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('הבקשה ארכה יותר מדי זמן');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
};
```

### Anti-Patterns to Avoid
- **alert() for errors:** Blocks UI, poor UX, not accessible. Use inline error state.
- **No error boundaries:** White screen of death on component crash. Always wrap screens.
- **Silent failures:** catch without user feedback. Always show error state.
- **Multiple boolean flags:** isLoading + hasError + hasData creates impossible states. Use discriminated union.
- **No timeout on fetch:** Can hang indefinitely. Always set timeout with AbortController.
- **Retry without backoff:** Hammers server, wastes resources. Use exponential backoff with jitter.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Error boundaries | Custom class component | react-error-boundary | Provides hooks (useErrorHandler), resetKeys, better API, actively maintained |
| XSS sanitization | Regex/string replacement | DOMPurify | Handles edge cases (nested tags, encoded entities, protocol handlers), battle-tested |
| Retry logic complexity | Nested setTimeout | exponential-backoff npm | Handles jitter, max retries, cancellation, timing edge cases |
| Form validation | Custom validators | react-hook-form (future) | For stability phase, simple inline checks are fine; for complex forms later, use library |

**Key insight:** Error handling has many edge cases (race conditions, memory leaks, state consistency). Use battle-tested libraries for critical paths, hand-roll only for simple cases (basic retry is fine, complex sanitization is not).

## Common Pitfalls

### Pitfall 1: Error Boundaries Don't Catch Everything
**What goes wrong:** Developers wrap components in ErrorBoundary and assume all errors are caught. Then app crashes from event handler errors or async errors.

**Why it happens:** Error boundaries only catch errors during render, lifecycle methods, and constructors. They do NOT catch:
- Event handler errors (onClick, onChange)
- Async code (setTimeout, fetch callbacks)
- Server-side rendering
- Errors in the boundary itself

**How to avoid:**
- Use try/catch in event handlers
- Use try/catch in async functions (useEffect, event handlers)
- For async errors in useEffect, catch them and set error state, then throw in render if needed
- Place boundaries strategically, not everywhere

**Warning signs:**
- Console shows errors but ErrorBoundary doesn't trigger
- async operations fail silently
- Event handlers crash without fallback

**Source:** https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

### Pitfall 2: Race Conditions with Async State Updates
**What goes wrong:** User triggers action A, then quickly triggers action B. Action A completes after B, overwriting B's results with stale data.

**Why it happens:** Multiple async operations can complete out of order, and setState doesn't know which is "latest."

**How to avoid:**
- Use AbortController to cancel previous requests
- Check if component is still mounted before setState
- Use unique request IDs and ignore stale responses
- For complex cases, use libraries like TanStack Query (future phase)

**Warning signs:**
- UI flickers between different states
- Old data overwrites new data
- "Can't perform state update on unmounted component" warnings

**Example fix:**
```javascript
useEffect(() => {
  const controller = new AbortController();

  const fetchData = async () => {
    try {
      const response = await fetch(url, { signal: controller.signal });
      const data = await response.json();
      setData(data);
    } catch (error) {
      if (error.name === 'AbortError') return;  // Ignore cancelled requests
      setError(error);
    }
  };

  fetchData();
  return () => controller.abort();  // Cancel on cleanup
}, [url]);
```

### Pitfall 3: Optimistic Updates Without Proper Rollback
**What goes wrong:** UI updates immediately (optimistic), then API call fails but UI isn't reverted, leading to UI/DB mismatch.

**Why it happens:** Code saves previous state incorrectly, or forgets to save it at all.

**How to avoid:**
- Always save complete previous state before optimistic update
- Use functional setState to ensure latest state: `setTasks(prev => ...)`
- Test the error path (simulate API failure)

**Warning signs:**
- Task appears added/deleted but isn't persisted
- UI shows different state than database
- Refresh fixes the issue (sign of lost state)

**Current codebase issue:** useTasks.deleteTask doesn't fully rollback (calls fetchTasks instead of restoring exact previous state)

**Fix pattern:**
```javascript
const deleteTask = async (id) => {
  const previousTasks = tasks;  // Save complete state
  setTasks(prev => prev.filter(t => t.id !== id));  // Optimistic update

  try {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) throw error;
  } catch (error) {
    setTasks(previousTasks);  // Restore exact previous state
    setError('שגיאה במחיקת משימה');
  }
};
```

### Pitfall 4: Missing Loading Indicators on Buttons
**What goes wrong:** User clicks button, nothing happens visually, clicks again, triggers duplicate requests.

**Why it happens:** Loading state exists but button isn't disabled/styled during loading.

**How to avoid:**
- Always disable button when loading: `disabled={loading}`
- Change button text: `{loading ? 'טוען...' : 'שלח'}`
- Add visual indicator (spinner, opacity change)

**Warning signs:**
- Users report "nothing happened"
- Duplicate requests in network tab
- Users click multiple times

**Example pattern:**
```jsx
<button
  onClick={handleSubmit}
  disabled={loading}
  className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? (
    <span className="flex items-center">
      <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
        {/* spinner icon */}
      </svg>
      טוען...
    </span>
  ) : (
    'שלח'
  )}
</button>
```

### Pitfall 5: Hebrew Error Messages Not RTL-Friendly
**What goes wrong:** Error messages display with broken layout, punctuation on wrong side, mixed LTR/RTL text looks wrong.

**Why it happens:** Missing `dir="rtl"` on error containers, or mixing English error codes with Hebrew text.

**How to avoid:**
- Use `dir="rtl"` on error message containers
- Keep error messages fully in Hebrew (or separate technical details)
- Test with real Hebrew text, not Lorem Ipsum
- Use logical CSS properties (margin-inline-start instead of margin-left)

**Warning signs:**
- Punctuation appears on wrong side
- Text alignment looks off
- Mixed English/Hebrew looks broken

**Example:**
```jsx
<div
  dir="rtl"  // Explicit RTL for error container
  className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded"
  role="alert"
>
  <p className="font-bold">שגיאה</p>
  <p>{error}</p>  {/* Ensure error is in Hebrew */}
</div>
```

**Source:** https://leancode.co/blog/right-to-left-in-react

## Code Examples

Verified patterns from official sources:

### Complete Login Error Handling Example
```jsx
// Source: Community pattern, verified against official React and Supabase patterns
// https://medium.com/@sainudheenp/how-senior-react-developers-handle-loading-states-error-handling-a-complete-guide-ffe9726ad00a

import { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';

const LoginScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);  // NEW: inline error state

  const handleLogin = async (e) => {
    e.preventDefault();

    // Validation
    if (!name || !email || !password) {
      setError('נא להזין שם, אימייל וסיסמה');  // Hebrew inline, not alert()
      return;
    }

    setLoading(true);
    setError(null);  // Clear previous error

    try {
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);  // 10s for auth

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      }, { signal: controller.signal });

      clearTimeout(timeout);

      if (signInError) {
        // Try signup if login fails
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: name } }
        });

        if (signUpError) throw signUpError;

        if (!signUpData?.session) {
          setError('נשלחה הודעת אימות לאימייל. אנא אשר אותה כדי להתחבר.');
          return;
        }
      }

      // Success - AuthContext will handle navigation
      const session = (await supabase.auth.getSession()).data.session;
      if (session?.user) {
        await supabase.from('profiles').upsert(
          { id: session.user.id, name },
          { onConflict: 'id' }
        );
      }

    } catch (err) {
      if (err.name === 'AbortError') {
        setError('הבקשה ארכה יותר מדי זמן. אנא נסה שוב.');
      } else {
        setError(err.message || 'שגיאה בהתחברות');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="text-center max-w-md mx-auto w-full">
      <h1 className="text-3xl font-bold text-gray-800 mb-2">ברוכים הבאים</h1>

      <form onSubmit={handleLogin} className="space-y-3">
        <input
          type="text"
          placeholder="השם שלך"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-4 border rounded-xl"
        />
        <input
          type="email"
          placeholder="אימייל"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-4 border rounded-xl"
        />
        <input
          type="password"
          placeholder="סיסמה"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-4 border rounded-xl"
        />

        {/* NEW: Inline error display */}
        {error && (
          <div
            dir="rtl"
            className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm"
            role="alert"
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'טוען...' : 'התחבר / צור משתמש 🚀'}
        </button>
      </form>
    </div>
  );
};

export default LoginScreen;
```

### AI Planner with Retry and Timeout
```jsx
// Source: Combining patterns from multiple verified sources
// Retry: https://medium.com/@vnkelkar11/react-error-handling-best-practices-exponential-backoff-for-fetch-requests-9c24d119dcda
// Timeout: https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static

import { useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';  // Add this for XSS prevention

const usePlanner = () => {
  const { user } = useAuth();
  const [planHtml, setPlanHtml] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);  // NEW: error state

  // NEW: Retry helper
  const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const isLastAttempt = attempt === maxRetries - 1;
        if (isLastAttempt) throw error;

        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  const generateSchedule = async (timeframe, tasks, chronotype, currentMode) => {
    setLoading(true);
    setError(null);  // Clear previous error

    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

    try {
      if (!apiKey) throw new Error('Missing API Key');

      const incompleteTasks = tasks.filter(t => !t.completed);
      if (incompleteTasks.length === 0) {
        setError('אין משימות לתכנון');
        return;
      }

      const taskListString = incompleteTasks
        .map((t) => `- ${t.description} [${t.type}, ${t.recurring ? 'RECURRING' : 'ONCE'}]`)
        .join('\n');

      const context = currentMode === 'now'
        ? `Current status: ${chronotype.title}`
        : `Base chronotype: ${chronotype.title}`;

      const prompt = `
        Act as a Chronobiology Coach.
        User: "${chronotype.name}" (${context}).
        Goal: Plan for ${timeframe}.

        Tasks:
        ${taskListString}

        Rules:
        - Lion: Mornings.
        - Bear: 10am-2pm.
        - Wolf: Evening.
        - Dolphin: Short bursts.
        - RECURRING tasks: Suggest habit stacking.

        Output: Hebrew. HTML bullet points.
      `;

      // NEW: Retry with backoff, timeout
      const plan = await retryWithBackoff(async () => {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
        const payload = { contents: [{ parts: [{ text: prompt }] }] };

        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(30000)  // 30s timeout
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error.message);
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          throw new Error('Invalid response from AI');
        }

        return data.candidates[0].content.parts[0].text;
      }, 3);  // Max 3 retries

      const html = marked.parse(plan);
      const sanitizedHtml = DOMPurify.sanitize(html);  // NEW: XSS prevention
      setPlanHtml(sanitizedHtml);

    } catch (err) {
      console.error('Planner Error:', err);
      if (err.name === 'AbortError') {
        setError('הבקשה ארכה יותר מדי זמן. אנא נסה שוב.');
      } else {
        setError('שגיאה ביצירת תוכנית: ' + (err.message || 'שגיאה לא ידועה'));
      }
    } finally {
      setLoading(false);
    }
  };

  return { planHtml, loading, error, generateSchedule, clearPlan: () => setPlanHtml('') };
};

export default usePlanner;
```

### App-Level Error Boundary Setup
```jsx
// Source: https://www.npmjs.com/package/react-error-boundary
// https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary

import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider } from './context/AuthContext';

function AppCrashFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
        <div className="text-6xl mb-4">💥</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">האפליקציה נתקלה בשגיאה</h1>
        <p className="text-gray-600 mb-4">
          מצטערים! משהו השתבש. אנא רענן את הדף או נסה שוב מאוחר יותר.
        </p>
        <details className="text-right mb-4">
          <summary className="cursor-pointer text-sm text-gray-500">פרטים טכניים</summary>
          <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-auto text-left">
            {error.message}
          </pre>
        </details>
        <button
          onClick={resetErrorBoundary}
          className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-indigo-700"
        >
          רענן את האפליקציה
        </button>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={AppCrashFallback}
      onReset={() => {
        window.location.href = '/';  // Full reload on reset
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| alert() for errors | Inline error state with styled UI | 2018-2020 | Better UX, accessibility, non-blocking |
| Class-based ErrorBoundary | react-error-boundary library | 2020+ | Hooks support, better DX, maintained |
| Boolean flags (isLoading + hasError) | Discriminated union state machine | 2022+ | Type safety, prevents impossible states |
| Manual retry with setTimeout | Exponential backoff with jitter | 2019+ | Prevents thundering herd, better resource usage |
| setTimeout for timeout | AbortController + AbortSignal.timeout() | 2021-2023 | Native API, cancellable, memory-safe |
| Try/catch everywhere | Error boundaries for rendering, try/catch for async | Always | Correct tool for correct error type |

**Deprecated/outdated:**
- **componentDidCatch only:** Now use react-error-boundary for function components
- **this.state.hasError pattern:** Library provides better API with resetKeys, onReset
- **No timeout:** Modern apps must handle slow networks, always set timeout

## Open Questions

Things that couldn't be fully resolved:

1. **react-error-boundary version**
   - What we know: Version 4.1.2 is stable and widely used. Version 5.0.0 exists with changes (useErrorHandler → useErrorBoundary)
   - What's unclear: Whether v5 is production-ready in 2026, breaking changes
   - Recommendation: Use v4.1.2 for stability phase (proven, stable). Investigate v5 in future phase if needed.

2. **Supabase retry strategy**
   - What we know: Supabase client handles some retries internally, but no documented guarantee
   - What's unclear: Whether to retry at useTasks level or trust Supabase client
   - Recommendation: For stability phase, rely on Supabase client for database operations. Add retry only for external APIs (Gemini). Monitor for Supabase failures and add retry if needed.

3. **Error logging/monitoring**
   - What we know: console.error exists but no centralized logging
   - What's unclear: Whether to add Sentry/LogRocket now or later
   - Recommendation: Add console.error to ErrorBoundary's onError handler for now. Add monitoring service (Sentry) in future phase after stability is proven.

## Sources

### Primary (HIGH confidence)
- [React Official Docs - Error Boundaries](https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary) - Error boundary limitations, official patterns
- [MDN - AbortSignal.timeout()](https://developer.mozilla.org/en-US/docs/Web/API/AbortSignal/timeout_static) - Native timeout API
- [react-error-boundary npm](https://www.npmjs.com/package/react-error-boundary) - Library usage (verified via search, npm blocked)
- [DOMPurify GitHub](https://github.com/cure53/DOMPurify) - XSS sanitization (verified via search, npm blocked)

### Secondary (MEDIUM confidence)
- [Loading States and Error Handling - Steve Kinney](https://stevekinney.com/courses/react-typescript/loading-states-error-handling) - Discriminated union pattern
- [How Senior React Developers Handle Loading States](https://medium.com/@sainudheenp/how-senior-react-developers-handle-loading-states-error-handling-a-complete-guide-ffe9726ad00a) - Best practices
- [Exponential Backoff Strategy - Advanced Web Machinery](https://advancedweb.hu/how-to-implement-an-exponential-backoff-retry-strategy-in-javascript/) - Retry implementation
- [React Error Handling Best Practices - Exponential Backoff](https://medium.com/@vnkelkar11/react-error-handling-best-practices-exponential-backoff-for-fetch-requests-9c24d119dcda) - Combined patterns
- [Right to Left in React - LeanCode](https://leancode.co/blog/right-to-left-in-react) - RTL patterns for Hebrew

### Tertiary (LOW confidence)
- [WebSearch: React error boundaries best practices 2026](https://www.meticulous.ai/blog/react-error-boundaries-complete-guide) - Community patterns (unverified)
- [WebSearch: React async patterns 2026](https://www.patterns.dev/react/react-2026/) - State of the art (unverified)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - react-error-boundary and AbortController are official/native solutions verified through multiple sources
- Architecture: HIGH - Error boundary patterns verified against official React docs, inline error patterns verified across community sources
- Pitfalls: HIGH - Based on official React limitations documentation and common community issues verified across sources
- Code examples: HIGH - Patterns verified against official docs (React, MDN) and established community practices
- Versions: MEDIUM - npm pages blocked, relied on search results for version info (4.1.2 for react-error-boundary, 3.3.1 for DOMPurify)

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (60 days - error handling patterns are stable, but library versions may update)
