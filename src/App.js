import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { AuthProvider, useAuth } from './context/AuthContext';
import MainLayout from './components/layout/MainLayout';
import LoginScreen from './components/screens/LoginScreen';
import HubScreen from './components/screens/HubScreen';
import QuizScreen from './components/screens/QuizScreen';
import ResultScreen from './components/screens/ResultScreen';
import { CHRONOTYPES, STATUS_TYPES } from './hooks/useChronotype';
import { supabase } from './utils/supabaseClient';

function AppCrashFallback({ error, resetErrorBoundary }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
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

const AppContent = () => {
  const { user, userData, loading } = useAuth();
  const [view, setView] = useState('login'); // login, hub, quiz, result
  const [quizMode, setQuizMode] = useState('base');
  const [progress, setProgress] = useState(0);
  const [resultData, setResultData] = useState(null);

  useEffect(() => {
    if (!loading) {
      if (user) {
        // If we have a user, go to hub usually, but we check logic
        if (view === 'login') setView('hub');
      } else {
        setView('login');
      }
    }
  }, [user, loading, view]);

  const handleStartQuiz = (mode) => {
    setQuizMode(mode);
    setView('quiz');
    setProgress(mode === 'base' ? 10 : 50);
  };

  const handleQuizComplete = async (resultType) => {
    setProgress(100);

    // Determine data based on mode
    let data;
    if (quizMode === 'base') {
      data = CHRONOTYPES[resultType];
      // Save base type if from base quiz
      if (user) {
        await supabase.from('profiles').update({ base_chronotype: resultType }).eq('id', user.id);
      }
    } else {
      data = STATUS_TYPES[resultType];
    }

    setResultData({ ...data, type: resultType }); // Add type for logic
    setView('result');
  };

  const handleBack = () => {
    if (view === 'result' || view === 'quiz') {
      setView('hub');
      setProgress(0);
    }
  };

  if (loading) return <div className="text-center mt-20">Loading...</div>;

  if (!user) {
    return (
      <MainLayout progress={0} showBack={false}>
        <LoginScreen />
      </MainLayout>
    );
  }

  return (
    <MainLayout
      user={user}
      progress={progress}
      showBack={view !== 'hub'}
      onBack={handleBack}
    >
      {view === 'hub' && (
        <HubScreen
          userData={userData}
          onStartQuiz={handleStartQuiz}
        />
      )}
      {view === 'quiz' && (
        <QuizScreen
          mode={quizMode}
          onComplete={handleQuizComplete}
          setProgress={setProgress}
        />
      )}
      {view === 'result' && resultData && (
        <ResultScreen
          resultType={resultData.type}
          resultData={resultData}
          onBack={handleBack}
        />
      )}
    </MainLayout>
  );
};

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={AppCrashFallback}
      onReset={() => {
        window.location.href = '/';
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
