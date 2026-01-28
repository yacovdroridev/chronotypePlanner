# Codebase Structure

**Analysis Date:** 2026-01-28

## Directory Layout

```
chronotypePlanner/
├── public/
│   ├── index.html              # HTML entry point with RTL setup
│   ├── favicon.ico
│   ├── logo192.png
│   ├── manifest.json
│   └── ... (manifest assets)
├── src/
│   ├── components/             # React components (UI layer)
│   │   ├── common/             # Reusable UI components
│   │   │   └── ProgressBar.jsx
│   │   ├── layout/             # Layout wrapper
│   │   │   └── MainLayout.jsx
│   │   └── screens/            # Full-page screen components
│   │       ├── LoginScreen.jsx
│   │       ├── HubScreen.jsx
│   │       ├── QuizScreen.jsx
│   │       └── ResultScreen.jsx
│   ├── context/                # React Context for state
│   │   └── AuthContext.js
│   ├── hooks/                  # Custom React hooks
│   │   ├── useChronotype.js    # Chronotype data/constants
│   │   ├── useTasks.js         # Task CRUD operations
│   │   └── usePlanner.js       # AI schedule generation
│   ├── utils/                  # Utility modules
│   │   └── supabaseClient.js   # Supabase client singleton
│   ├── App.js                  # Root component
│   ├── App.test.js             # App component tests
│   ├── index.js                # React DOM entry point
│   ├── index.css               # Global styles (Tailwind)
│   └── setupProxy.js           # Dev proxy config
├── .planning/                  # GSD planning documents
│   └── codebase/               # Architecture/structure docs
├── .env                        # Environment variables (local)
├── .env.example                # Template for env vars
├── package.json                # Dependencies and scripts
├── package-lock.json           # Dependency lockfile
├── tailwind.config.js          # Tailwind CSS configuration
├── postcss.config.js           # PostCSS configuration
├── supabase.sql                # Database schema and migrations
└── README.md
```

## Directory Purposes

**public/**
- Purpose: Static assets served by web server
- Contains: HTML entry point, icons, manifest for PWA
- Key files: `index.html` (sets RTL, suppresses AbortErrors)

**src/components/**
- Purpose: All React components organized by type
- Contains: Screen views, layout wrappers, reusable UI pieces
- Key files: `screens/` (4 main views), `layout/` (wrapper), `common/` (utilities)

**src/components/screens/**
- Purpose: Full-page view components representing app states
- Contains:
  - `LoginScreen.jsx`: Email/password/OAuth login form
  - `HubScreen.jsx`: Task management and quiz entry point
  - `QuizScreen.jsx`: Quiz questions (base or status mode)
  - `ResultScreen.jsx`: Quiz result display + AI planning interface

**src/components/layout/**
- Purpose: Shared layout structure for all authenticated views
- Contains: `MainLayout.jsx` wraps screens with header, progress bar, logout

**src/components/common/**
- Purpose: Reusable UI building blocks
- Contains: `ProgressBar.jsx` (visual progress indicator)

**src/context/**
- Purpose: React Context definitions for global state
- Contains: `AuthContext.js` (user, userData, loading, sign out)

**src/hooks/**
- Purpose: Custom logic encapsulated as hooks
- Contains:
  - `useChronotype.js`: Exports CHRONOTYPES, STATUS_TYPES, QUESTIONS, STATUS_OPTIONS, calculateWinner (no state)
  - `useTasks.js`: Manages task list state, CRUD, real-time sync
  - `usePlanner.js`: Generates and manages AI schedules via Gemini API

**src/utils/**
- Purpose: Utility functions and service clients
- Contains: `supabaseClient.js` (singleton Supabase client)

## Key File Locations

**Entry Points:**
- `public/index.html`: HTML entry point, sets RTL language, suppresses AbortErrors
- `src/index.js`: React entry point, creates root and renders App
- `src/App.js`: Root component, wraps AppContent with AuthProvider

**Configuration:**
- `package.json`: Dependencies, scripts, eslint config
- `tailwind.config.js`: Tailwind CSS content paths
- `postcss.config.js`: PostCSS with autoprefixer
- `.env.example`: Template for REACT_APP_* environment variables
- `supabase.sql`: Database schema (profiles, tasks, plans tables)

**Core Logic:**
- `src/App.js`: AppContent function manages view routing and state
- `src/context/AuthContext.js`: Handles auth state and session management
- `src/hooks/useTasks.js`: Task management with real-time sync
- `src/hooks/usePlanner.js`: Gemini AI integration for schedule generation
- `src/utils/supabaseClient.js`: Supabase client initialization

**Testing:**
- `src/App.test.js`: App component test (render test)

## Naming Conventions

**Files:**
- Screen components: PascalCase.jsx (LoginScreen.jsx, HubScreen.jsx)
- Utility/hook files: camelCase.js (supabaseClient.js, useTasks.js)
- Context files: PascalCase.js (AuthContext.js)
- Style file: index.css
- Test files: ComponentName.test.js (App.test.js)

**Directories:**
- Feature directories: lowercase (components, context, hooks, utils)
- Subdirectories: lowercase (screens, common, layout)

**Components:**
- Screen components: PascalCase, end in "Screen" (LoginScreen, HubScreen)
- Layout components: PascalCase with "Layout" (MainLayout)
- Common components: PascalCase (ProgressBar)

**Functions/Variables:**
- Hooks: camelCase starting with "use" (useTasks, usePlanner, useAuth)
- Context hook: useAuth()
- Constants: UPPERCASE (CHRONOTYPES, QUESTIONS, STATUS_OPTIONS)
- State variables: camelCase (user, userData, tasks, loading)
- Event handlers: "handle" prefix (handleLogin, handleAddTask, handleBaseAnswer)

## Where to Add New Code

**New Screen/View:**
- Create file: `src/components/screens/[ScreenName].jsx`
- Import in: `src/App.js` AppContent component
- Add view string case: Add to view state routing logic
- Add button trigger: Add navigation handler to previous screen

**New Custom Hook (for feature state):**
- Create file: `src/hooks/use[FeatureName].js`
- Export: State getter/setter and action methods
- Use pattern from `useTasks.js` or `usePlanner.js`
- Import in components or other hooks

**New Context (for global state):**
- Create file: `src/context/[Feature]Context.js`
- Follow pattern of `AuthContext.js`
- Wrap App in provider if global, or specific screens if scoped

**New Utility Module:**
- Create file: `src/utils/[moduleName].js`
- Export singleton or factory functions
- Import in hooks/components as needed

**New Layout/Common Component:**
- Reusable UI: `src/components/common/[ComponentName].jsx`
- Layout wrapper: `src/components/layout/[LayoutName].jsx`
- Props-driven, minimal state

**New Tailwind Styles:**
- Simple utilities: Use Tailwind classes in JSX
- Complex styles: Add to `src/index.css` with CSS classes
- Custom animations: Add @keyframes to `src/index.css`

**Database Integration:**
- Add tables to: `supabase.sql`
- Add queries to: Relevant hook file (useTasks pattern)
- Use supabase client from: `src/utils/supabaseClient.js`

## Special Directories

**node_modules/**
- Purpose: Installed npm dependencies
- Generated: Yes (npm install)
- Committed: No (.gitignore)

**.planning/**
- Purpose: GSD orchestrator planning documents
- Generated: Yes (by /gsd commands)
- Committed: Yes (tracked for orchestrator reference)

**build/**
- Purpose: Production build output
- Generated: Yes (npm run build)
- Committed: No (.gitignore)

**.env**
- Purpose: Local environment variables (secrets)
- Generated: No (created manually from .env.example)
- Committed: No (.gitignore)

**.tmp/**
- Purpose: Temporary files from development
- Generated: Yes
- Committed: No

**.git/**
- Purpose: Git repository metadata
- Generated: Yes (git init)
- Committed: N/A

## Component Composition Patterns

**Screen Components:**
```jsx
// Pattern: Props-driven, manages own state and sub-hooks
const ScreenName = ({ prop1, onAction }) => {
  const [localState, setLocalState] = useState(initial);
  const { data, action } = useHook();

  const handleClick = async () => {
    await action(data);
    setLocalState(new);
  };

  return <div>{content}</div>;
};
```

**Layout Wrapper:**
```jsx
// Pattern: Wraps screens, receives children
const MainLayout = ({ children, progress, showBack, onBack, user }) => {
  // Shared header, footer, progress bar
  return <div>{header} {children} {footer}</div>;
};
```

**Custom Hook:**
```jsx
// Pattern: Manages state and provides API
const useFeature = () => {
  const [state, setState] = useState(initial);
  const { user } = useAuth();

  const action = async (data) => {
    // Perform action via Supabase or API
  };

  useEffect(() => {
    // Setup subscriptions or fetches
    return cleanup;
  }, [dependencies]);

  return { state, action };
};
```

## Import Paths

**No aliases currently configured.** All imports use relative paths:
- Sibling imports: `import { useAuth } from '../context/AuthContext'`
- Parent imports: `import { supabase } from '../../utils/supabaseClient'`
- Absolute would be beneficial for deep nesting but not implemented

## Public vs src Organization

**public/:** Static assets only, no application code
**src/:** All application code, organized by type (components, context, hooks, utils)

---

*Structure analysis: 2026-01-28*
