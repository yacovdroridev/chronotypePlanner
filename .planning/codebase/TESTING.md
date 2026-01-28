# Testing Patterns

**Analysis Date:** 2026-01-28

## Test Framework

**Runner:**
- Jest (via `react-scripts test`)
- Version: Included in `react-scripts@5.0.1`
- Config: No explicit config file; uses Create React App defaults via `package.json` eslintConfig

**Assertion Library:**
- @testing-library/react (v16.3.2)
- @testing-library/jest-dom (v6.9.1)
- @testing-library/user-event (v13.5.0)

**Run Commands:**
```bash
npm test                  # Run all tests in watch mode
npm test -- --coverage   # Run tests with coverage report
npm test -- --watchAll   # Continuous watch mode
```

## Test File Organization

**Location:**
- Co-located with source files in same directory
- Only one test file currently: `src/App.test.js` for `src/App.js`

**Naming:**
- Pattern: `{ComponentName}.test.js`
- Currently: `App.test.js` tests the main App component

**Structure:**
```
src/
├── App.js
├── App.test.js          ← Test file co-located
├── components/
│   ├── screens/
│   │   ├── LoginScreen.jsx
│   │   ├── QuizScreen.jsx
│   │   └── ...
├── hooks/
│   ├── useChronotype.js
│   ├── usePlanner.js
│   └── useTasks.js
└── ...
```

## Test Structure

**Suite Organization:**

The current test follows the pattern of a single test function with basic setup:

```javascript
import { render, screen } from '@testing-library/react';
import App from './App';
import { supabase } from './utils/supabaseClient';

// Mock Supabase client
jest.mock('./utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));

test('renders the login screen when not authenticated', async () => {
  render(<App />);
  // The app shows "Loading..." initially
  const loadingElement = screen.getByText(/Loading/i);
  expect(loadingElement).toBeInTheDocument();

  // After a bit, it should show login
  const loginHeading = await screen.findByText(/ברוכים הבאים/i);
  expect(loginHeading).toBeInTheDocument();
});
```

**Patterns:**
- Mocking used at module level with `jest.mock()`
- Query methods: `screen.getByText()` for synchronous elements, `screen.findByText()` for async elements
- Assertions use `expect()` with jest-dom matchers (`.toBeInTheDocument()`)
- Case-insensitive regex queries used (`/Loading/i`, `/ברוכים הבאים/i`)

## Mocking

**Framework:** Jest's built-in mocking system

**Patterns:**

Mocks are defined at the top of test files using `jest.mock()`:

```javascript
jest.mock('./utils/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({ data: { session: null }, error: null })),
      onAuthStateChange: jest.fn(() => ({
        data: { subscription: { unsubscribe: jest.fn() } },
      })),
      signOut: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(() => Promise.resolve({ data: null, error: null })),
        })),
      })),
    })),
  },
}));
```

**Mocking Approach:**
- Return entire module with mock implementation
- Chain mocked methods to simulate Supabase query builder pattern
- Return promises with expected data structure: `{ data: null, error: null }`
- Methods return objects with unsubscribe for cleanup (e.g., `onAuthStateChange`)

**What to Mock:**
- External service clients (Supabase)
- API calls and HTTP requests
- Authentication services
- Environment-dependent code

**What NOT to Mock:**
- React hooks (use actual React hooks in tests)
- Internal utility functions unless specifically testing side effects
- Database queries should be mocked at the client level (supabase), not at the hook level

## Async Testing

**Pattern:**

Async operations are tested with `findBy` queries which return promises:

```javascript
test('renders the login screen when not authenticated', async () => {
  render(<App />);
  // First check for loading state (synchronous)
  const loadingElement = screen.getByText(/Loading/i);
  expect(loadingElement).toBeInTheDocument();

  // Wait for async state change and login screen render
  const loginHeading = await screen.findByText(/ברוכים הבאים/i);
  expect(loginHeading).toBeInTheDocument();
});
```

**Key Points:**
- Use `await` with `findBy` queries for elements that render after async operations
- Initial `getBy` queries used for elements present immediately
- Test function marked as `async` to support `await`

## Error Testing

**Pattern:**

Current codebase does not have explicit error tests, but pattern would follow:

```javascript
test('handles login error', async () => {
  jest.mock('./utils/supabaseClient', () => ({
    supabase: {
      auth: {
        signInWithPassword: jest.fn(() =>
          Promise.resolve({
            error: { message: 'Invalid credentials' }
          })
        ),
      },
    },
  }));

  render(<LoginScreen />);
  // Test error handling logic
});
```

**Approach:**
- Mock failed responses with error objects
- Verify error messages are displayed to user
- Check fallback behavior when operations fail

## Fixtures and Test Data

**Test Data:**
- Currently embedded in mock responses
- No separate fixtures file exists
- Mock Supabase responses hardcoded in test file

**Location:**
- `src/App.test.js` contains all test mocks for the application
- No separate `__fixtures__` or `testUtils` directory

**Example Mock Data Structure:**
```javascript
// From Supabase query mocks
{ data: { session: null }, error: null }
{ data: { subscription: { unsubscribe: jest.fn() } } }
```

## Coverage

**Requirements:** None enforced

**View Coverage:**
```bash
npm test -- --coverage
```

**Coverage Report:**
- Currently only `App.js` and `App.test.js` are included in testing
- No components or hooks have dedicated test files
- No coverage thresholds configured in `package.json`

**Current Status:**
- Minimal test coverage (only main App component)
- No tests for:
  - Components: `LoginScreen`, `QuizScreen`, `ResultScreen`, `HubScreen`, `MainLayout`, `ProgressBar`
  - Hooks: `useChronotype`, `usePlanner`, `useTasks`
  - Context: `AuthContext`
  - Utilities: `supabaseClient`

## Test Types

**Unit Tests:**
- Scope: Individual component rendering
- Approach: Render component and verify output
- Currently only `App.test.js` exists as a unit test for the main App component
- Pattern: Mock all external dependencies (Supabase)

**Integration Tests:**
- Not currently present
- Would test component interactions (e.g., user flow through login -> hub -> quiz)
- Would mock Supabase but test multiple components together

**E2E Tests:**
- Not present
- Framework not configured
- Would require tools like Cypress or Playwright

## Testing Best Practices

**Patterns to Follow:**

1. **Render and Query:**
   - Always render component first
   - Query elements using semantic selectors (role, label, text)
   - Use regex for text queries to be case-insensitive when appropriate

2. **Wait for Async:**
   - Use `findBy` for elements that appear after async operations
   - Wrap test function with `async` keyword
   - Await promises from async queries

3. **Mock External Dependencies:**
   - Mock Supabase at module level, not in individual tests
   - Return proper data structure matching expected response shape
   - Include error cases in mocks

4. **Clean Assertions:**
   - Use one main assertion per test
   - Keep test descriptions clear and specific
   - Use `.toBeInTheDocument()` for DOM assertions

## Examples of Testing Patterns

**Testing Component Rendering (Current Pattern):**
```javascript
test('renders the login screen when not authenticated', async () => {
  render(<App />);
  const loadingElement = screen.getByText(/Loading/i);
  expect(loadingElement).toBeInTheDocument();

  const loginHeading = await screen.findByText(/ברוכים הבאים/i);
  expect(loginHeading).toBeInTheDocument();
});
```

**Pattern for Testing Form Input:**
```javascript
// Example of what should be added for LoginScreen tests
test('updates email input value', () => {
  render(<LoginScreen />);
  const emailInput = screen.getByPlaceholderText(/אימייל/);

  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  expect(emailInput.value).toBe('test@example.com');
});
```

**Pattern for Testing Async Operations:**
```javascript
// Example for testing Quiz completion
test('completes quiz and shows results', async () => {
  render(<QuizScreen mode="base" onComplete={mockCallback} />);

  // Click through all questions
  const options = screen.getAllByRole('button', { name: /.*/ });
  fireEvent.click(options[0]);

  // Wait for results
  await waitFor(() => {
    expect(mockCallback).toHaveBeenCalledWith(expect.any(String));
  });
});
```

---

*Testing analysis: 2026-01-28*
