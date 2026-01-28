### User Issue
The user flagged a critical regression where clicking "What is the status now?" in the Hub triggers the base chronotype quiz instead of the intended one-step status check. This breaks the core "quick return" loop described in the MVP spec.

### Analysis
1.  **HubScreen.jsx**: The button currently calls `onStartQuiz('now')`.
2.  **AuthContext.js**: No direct relation to this logical flow, but good to be aware of user state.
3.  **QuizScreen.jsx**: The component checks `if (mode === 'status')` to render the status check. It DOES NOT handle `mode === 'now'`.
4.  **App.js**: Passes `handleStartQuiz` to HubScreen. When `handleStartQuiz` is called with `'now'`, it sets `quizMode` to `'now'`. `QuizScreen` receives `mode='now'`, which falls through to the default render (Base Quiz).

### Proposed Fix
The fix I attempted earlier (changing 'now' to 'status' in HubScreen) was correct in principle but failed execution or verification due to the app being stuck in a loading/error state.

### Plan
1.  **Verify Codebase State**: I need to be 100% sure the `onStartQuiz('now')` call is the culprit and that I change it to `onStartQuiz('status')`.
2.  **Fix the 'Loading...' Bug**: The app is crashing with `AbortError` loops on `getSession`. This is likely because `checkSession` is not robust or we have dirty local storage state from previous bad runs.
    *   I will modify `AuthContext.js` to be even more defensive and ensure `setLoading(false)` is called.
    *   I will verify `supabaseClient.js` initialization.
3.  **Execute the Logic Fix**: Change `HubScreen.jsx` to send `status` instead of `now`.
4.  **Verify**: I will try to verify again. If the browser is still stuck, I will focus on the console logs which showed "AbortError".

### Implementation Details
- **HubScreen.jsx**:
  - `onClick={() => onStartQuiz('now')}` -> `onClick={() => onStartQuiz('status')}`
- **AuthContext.js**:
  - Ensure the `checkSession` logic doesn't infinite loop or throw uncaught errors that leave `loading` true.

I will start by creating this plan file.
