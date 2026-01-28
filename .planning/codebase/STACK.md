# Technology Stack

**Analysis Date:** 2026-01-28

## Languages

**Primary:**
- JavaScript (ES6+) - React application, hooks, and utilities
- JSX - React components (`src/components/**/*.jsx`, `src/App.js`)

**Secondary:**
- SQL - Supabase schema definitions (`supabase.sql`)
- CSS - Tailwind utility styles through PostCSS

## Runtime

**Environment:**
- Node.js 14+ (via npm)
- Browser: Modern Chrome/Firefox/Safari (ES6 support required)

**Package Manager:**
- npm 10+ (package-lock.json present)
- Lockfile: Yes, `package-lock.json` tracked

## Frameworks

**Core:**
- React 19.2.3 - Main UI framework
- React Router DOM 7.12.0 - Client-side routing
- React DOM 19.2.3 - React rendering layer
- React Scripts 5.0.1 - Create React App build tooling

**Styling:**
- Tailwind CSS 3.4.13 - Utility-first CSS framework
- PostCSS 8.5.6 - CSS transformation
- Autoprefixer 10.4.23 - Browser vendor prefixing

**Markup Processing:**
- marked 17.0.1 - Markdown to HTML conversion (for AI-generated schedules)

**Icons:**
- lucide-react 0.562.0 - React icon library

**Testing:**
- @testing-library/react 16.3.2 - React component testing
- @testing-library/jest-dom 6.9.1 - Jest matchers for DOM
- @testing-library/dom 10.4.1 - DOM testing utilities
- @testing-library/user-event 13.5.0 - User interaction simulation

**Build/Dev:**
- gh-pages 6.3.0 - GitHub Pages deployment

**API Client:**
- @supabase/supabase-js 2.91.0 - Supabase PostgreSQL client and auth

**LLM Integration:**
- @openrouter/sdk 0.4.0 - OpenRouter AI API client (not actively used; codebase uses Google Gemini directly)

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.91.0 - Database, authentication, and real-time subscriptions. Core persistence layer. Connection via `src/utils/supabaseClient.js`.
- React 19.2.3 - UI framework and state management via Context API
- Tailwind CSS 3.4.13 - Entire visual design system

**Infrastructure:**
- web-vitals 2.1.4 - Core Web Vitals performance monitoring
- react-scripts 5.0.1 - CRA build pipeline (includes Webpack, Babel, Jest)

## Configuration

**Environment:**
- Located in: `.env` (development), `.env.example` (template)
- Required variables:
  - `REACT_APP_SUPABASE_URL` - Supabase project URL
  - `REACT_APP_SUPABASE_ANON_KEY` - Supabase anonymous/public key
  - `REACT_APP_GEMINI_API_KEY` - Google Gemini API key for schedule generation

- Environment prefix: `REACT_APP_` required for Create React App to expose to frontend

**Build:**
- `package.json` - Scripts: start, build, predeploy, deploy, test
- `tailwind.config.js` - Extends default Tailwind theme (no custom extensions)
- `postcss.config.js` - Applies Tailwind and Autoprefixer
- Deployment target: GitHub Pages (`homepage` field points to `/chronotypePlanner`)

**Code Organization:**
- ESLint config: `react-app` preset (extends `react-app/jest`)
- No custom `.eslintrc` file (uses Create React App defaults)

## Platform Requirements

**Development:**
- Node.js 14+
- npm or yarn
- Environment variables properly configured in `.env`
- Git (for gh-pages deployment)

**Production:**
- Static hosting (GitHub Pages or similar)
- Supabase project with configured authentication providers (Google, GitHub)
- Google Gemini API key with quota for generateContent endpoint

**Browser Compatibility:**
- Modern browsers supporting ES2020+
- 2+ years of version history (Chrome, Firefox, Safari per `browserslist`)

---

*Stack analysis: 2026-01-28*
