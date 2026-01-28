import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Suppress Supabase AbortError overlay in development
if (process.env.NODE_ENV === 'development') {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.message?.includes('signal is aborted without reason') ||
      args[0]?.name === 'AbortError' ||
      (typeof args[0] === 'string' && args[0].includes('AbortError'))) {
      return;
    }
    originalError.apply(console, args);
  };

  window.addEventListener('unhandledrejection', (event) => {
    if (event.reason?.name === 'AbortError' ||
      event.reason?.message?.includes('signal is aborted without reason')) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  const originalWindowError = window.onerror;
  window.onerror = (message, source, lineno, colno, error) => {
    if (message?.toString().includes('AbortError') ||
      message?.toString().includes('signal is aborted without reason')) {
      return true;
    }
    if (originalWindowError) {
      return originalWindowError(message, source, lineno, colno, error);
    }
    return false;
  };
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
