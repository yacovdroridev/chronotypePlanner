import React, { useState } from 'react';
import { QUESTIONS, STATUS_OPTIONS, calculateWinner } from '../../hooks/useChronotype';

const QuizScreen = ({ mode, onComplete, setProgress }) => {
    const [step, setStep] = useState(0);
    const [history, setHistory] = useState([]);

    // Base Mode Handler
    const handleBaseAnswer = (type) => {
        const newHistory = [...history, type];
        setHistory(newHistory);

        const nextStep = step + 1;
        if (nextStep < QUESTIONS.length) {
            setStep(nextStep);
            setProgress(((nextStep + 1) / QUESTIONS.length) * 100);
        } else {
            const result = calculateWinner(newHistory);
            onComplete(result);
        }
    };

    // Status Mode Handler
    const handleStatusAnswer = (type) => {
        onComplete(type);
    };

    if (mode === 'status') {
        return (
            <div className="w-full">
                <div className="flex items-center gap-2 mb-4 justify-center">
                    <span className="text-2xl">⚡</span>
                    <h3 className="text-xl font-bold text-gray-800">איך את/ה מרגיש/ה כרגע?</h3>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    {STATUS_OPTIONS.map((opt) => (
                        <button
                            key={opt.type}
                            onClick={() => handleStatusAnswer(opt.type)}
                            className={`text-right p-4 rounded-xl border-2 ${opt.border} hover:bg-gray-50 transition bg-white w-full`}
                        >
                            <div className={`font-bold ${opt.text}`}>{opt.title}</div>
                            <div className="text-sm text-gray-600">{opt.desc}</div>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Base Mode Render
    const currentQ = QUESTIONS[step];

    return (
        <div className="w-full text-center">
            <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">שאלה {step + 1} מתוך {QUESTIONS.length}</span>
            <h3 className="text-2xl font-bold text-gray-800 mt-2 mb-6">{currentQ.text}</h3>
            <div className="space-y-3">
                {currentQ.options.map((opt) => (
                    <button
                        key={opt.type}
                        onClick={() => handleBaseAnswer(opt.type)}
                        className="w-full text-right bg-gray-50 hover:bg-indigo-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group transition"
                    >
                        <span>{opt.text}</span> <span className="text-2xl">{opt.icon}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default QuizScreen;
