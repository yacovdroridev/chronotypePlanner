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

## Firebase setup
1. Create a Firebase project.
2. Enable Anonymous Auth in Firebase Console.
3. Update `src/appLogic.js` with your `firebaseConfig` and Gemini `apiKey`.

## Notes
- If you see a loading spinner, check the browser console for Firebase auth/config errors.
