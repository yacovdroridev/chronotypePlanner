# Chronotype Planner

React app for planning tasks and daily schedules based on chronotype.

## Live
GitHub Pages: https://yacovdroridev.github.io/chronotypePlanner/

## Local development
```bash
npm install
npm start
```

## Build
```bash
npm run build
```

## Supabase setup
1. Create a Supabase project.
2. Run the SQL in `supabase.sql`.
3. Enable Email/Password auth in Supabase.
4. (Optional) Enable Realtime for the `tasks` table.
5. Update `src/appLogic.js` with your Supabase URL, anon key, and Gemini `apiKey`.

## Notes
- If you see a loading spinner, check the browser console for Firebase auth/config errors.
