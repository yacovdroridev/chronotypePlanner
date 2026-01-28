# Coding Conventions

**Analysis Date:** 2026-01-28

## Naming Patterns

**Files:**
- React components: PascalCase with `.jsx` extension (e.g., `LoginScreen.jsx`, `ProgressBar.jsx`)
- Hooks: camelCase with `use` prefix and `.js` extension (e.g., `useChronotype.js`, `usePlanner.js`, `useTasks.js`)
- Utilities: camelCase with `.js` extension (e.g., `supabaseClient.js`)
- Context: PascalCase with `Context` suffix and `.js` extension (e.g., `AuthContext.js`)
- Tests: Same name as source file with `.test.js` suffix (e.g., `App.test.js`)

**Directories:**
- Component groups: lowercase (e.g., `src/components/screens`, `src/components/layout`, `src/components/common`)
- Logical groupings: lowercase plural when applicable (e.g., `src/hooks`, `src/context`, `src/utils`)

**Functions:**
- camelCase convention used throughout
- Handler functions prefixed with `handle` (e.g., `handleLogin`, `handleAddTask`, `handleBaseAnswer`)
- Async operations use consistent naming (e.g., `fetchTasks`, `generateSchedule`)
- Getter/setter style for state management variables (e.g., `setUser`, `setLoading`)

**Variables:**
- camelCase for all variable declarations
- State variables: descriptive names (e.g., `showAdd`, `newTask`, `planHtml`)
- Boolean state: `is-` or `show-` prefix pattern (e.g., `loading`, `showAdd`, `showTaskList`)
- Loop counters: `task`, `opt` for options, full descriptive names preferred over single letters

**Types & Objects:**
- Object keys use snake_case when matching database fields (e.g., `base_chronotype`, `user_id`, `created_at`)
- Constants in UPPERCASE (e.g., `CHRONOTYPES`, `STATUS_TYPES`, `QUESTIONS`, `STATUS_OPTIONS`)
- Object shorthand used in spread operations (e.g., `{ ...newTask, description: value }`)

## Code Style

**Formatting:**
- No specific formatter enforced (no Prettier config present)
- Code uses mixed indentation: some files use 4 spaces, others use variable indentation
- Line length appears flexible, no hard limit enforced
- Consistent use of semicolons in most files
- Single quotes used for strings in JSX templates, double quotes in HTML attributes

**Linting:**
- React App ESLint config (`"react-app"` and `"react-app/jest"`)
- No custom ESLint config file (uses CRA defaults)
- PropTypes not explicitly used; prop validation through JSDoc comments absent

**JSDoc/Comments:**
- Minimal inline comments, code is generally self-documenting
- Comments used for non-obvious logic (e.g., `// Optimistic update`, `// Base Mode Handler`)
- No formal JSDoc blocks present
- Status comments explain business logic (e.g., `// Don't block loading for profile fetch`)

## Import Organization

**Order:**
1. React library imports (e.g., `import React, { useState } from 'react'`)
2. Third-party packages (e.g., `@testing-library/react`, `lucide-react`, `marked`)
3. Internal utils and services (e.g., `'../utils/supabaseClient'`)
4. Hooks (e.g., `'../../hooks/useChronotype'`)
5. Context (e.g., `'../context/AuthContext'`)
6. Components (e.g., `'./components/layout/MainLayout'`)

**Path Aliases:**
- Relative paths used throughout (no path aliases configured)
- Consistent relative path depth based on component hierarchy
- Imports use relative `../` patterns to navigate up directory structure

**Example from `src/App.js`:**
```javascript
import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoginScreen from './components/screens/LoginScreen';
import { CHRONOTYPES, STATUS_TYPES } from './hooks/useChronotype';
import { supabase } from './utils/supabaseClient';
```

## Error Handling

**Patterns:**
- Try-catch blocks used for async operations (e.g., in `LoginScreen`, `usePlanner`)
- Error messages displayed via `alert()` (not ideal but consistent)
- Supabase errors checked via error destructuring: `const { data, error } = await supabase...`
- Errors logged to console for debugging: `console.error('Error fetching profile:', error)`
- AbortError specifically handled to suppress noise (see `src/index.js`)
- Fallback values used for missing data (e.g., `session?.user ?? null`)

**Example from `src/context/AuthContext.js`:**
```javascript
try {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
} catch (error) {
    if (error.name !== 'AbortError') {
        console.error('Session check error:', error);
    }
} finally {
    setLoading(false);
}
```

## Logging

**Framework:** `console` (no logging library)

**Patterns:**
- `console.error()` for error logging with descriptive prefixes (e.g., `'Planner Error:'`, `'Session check error:'`)
- `console.log()` not used in production code paths (only in test setup)
- Error suppression handled in `src/index.js` for AbortErrors to prevent noise in dev mode
- No structured logging; simple string messages

**When to Log:**
- Log errors that occur in async operations
- Log errors from external services (Supabase, API calls)
- Suppress known non-critical errors (AbortError)

## Function Design

**Size:**
- Functions kept relatively small and focused
- Component functions typically 50-150 lines including JSX markup
- Hooks 50-100 lines with clear separation of concerns
- Handlers typically 5-20 lines

**Parameters:**
- Destructuring used for component props (e.g., `const AppContent = () => {}`, `const QuizScreen = ({ mode, onComplete, setProgress }) => {}`)
- Handler functions receive single events or IDs (e.g., `handleStatusAnswer(type)`, `deleteTask(id)`)
- Callbacks passed as props with descriptive names (e.g., `onStartQuiz`, `onComplete`, `onBack`)

**Return Values:**
- Components return JSX directly
- Hooks return objects with multiple values (e.g., `return { tasks, loading, addTask, toggleTask, deleteTask }`)
- Async functions return void or use state setters for side effects
- Falsy checks used for conditional returns (e.g., `if (!user) return;`)

**Example from `src/hooks/useTasks.js`:**
```javascript
const fetchTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (!error && data) {
        setTasks(data);
    }
    setLoading(false);
}, [user]);
```

## Module Design

**Exports:**
- Named exports for constants (e.g., `export const CHRONOTYPES = {...}`)
- Default export for components and hooks (e.g., `export default LoginScreen`)
- Context uses named export for custom hook (e.g., `export const useAuth`) and default for provider

**Barrel Files:**
- No barrel files (`index.js`) used for re-exports
- Direct imports from source files preferred

**Example from `src/hooks/useChronotype.js`:**
```javascript
export const CHRONOTYPES = { ... };
export const STATUS_TYPES = { ... };
export const QUESTIONS = [ ... ];
export const STATUS_OPTIONS = [ ... ];
export const calculateWinner = (history) => { ... };
```

## Styling

**CSS Framework:** Tailwind CSS with custom CSS supplements

**Patterns:**
- Tailwind utility classes used for most styling (e.g., `className="text-center max-w-md mx-auto w-full"`)
- Custom CSS classes in `src/index.css` for animations and special cases
- Responsive design using Tailwind breakpoints (e.g., `sm:`, `md:`, `lg:`)
- Inline styles used sparingly (e.g., dynamic widths: `style={{ width: \`${progress}%\` }}`)
- Color system uses Tailwind palette with custom theme colors for chronotypes (lion, bear, wolf, dolphin)

**Naming for custom CSS:**
- Classes follow kebab-case (e.g., `.btn-option`, `.task-scroll`, `.loading-dots`, `.task-done`)
- Animations defined with `@keyframes` (e.g., `dots`, `spin`)
- CSS custom classes stored in `src/index.css`

## Conditional Rendering

**Patterns:**
- Ternary operators for simple conditionals: `{condition ? <Component /> : <OtherComponent />}`
- Logical AND for single conditional: `{condition && <Component />}`
- Early returns in functions to avoid nesting
- View state managed via string values (e.g., `view === 'login'`, `mode === 'base'`)

**Example from `src/App.js`:**
```javascript
if (loading) return <div className="text-center mt-20">Loading...</div>;

if (!user) {
    return (
        <MainLayout progress={0} showBack={false}>
            <LoginScreen />
        </MainLayout>
    );
}

return (
    <MainLayout>
        {view === 'hub' && <HubScreen ... />}
        {view === 'quiz' && <QuizScreen ... />}
        {view === 'result' && resultData && <ResultScreen ... />}
    </MainLayout>
);
```

---

*Convention analysis: 2026-01-28*
