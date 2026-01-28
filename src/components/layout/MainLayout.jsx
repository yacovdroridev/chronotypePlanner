import React from 'react';
import ProgressBar from '../common/ProgressBar';
import { LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const MainLayout = ({ children, progress, showBack, onBack, user }) => {
    const { userData, signOut } = useAuth();

    const handleLogout = async () => {
        if (window.confirm('Are you sure you want to logout?')) {
            await signOut();
        }
    };

    return (
        <div className="w-full max-w-full sm:max-w-2xl md:max-w-5xl lg:max-w-6xl xl:max-w-7xl bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[700px] flex flex-col relative transition-all duration-500 my-8 mx-auto">

            {/* Progress Bar */}
            <ProgressBar progress={progress} />

            {/* Navigation Controls */}
            {showBack && (
                <div className="absolute top-4 left-4 z-10">
                    <button onClick={onBack} className="flex items-center text-gray-400 hover:text-gray-600 transition text-sm font-bold">
                        <ArrowLeft className="w-4 h-4 ml-1" /> חזור
                    </button>
                </div>
            )}

            {/* User Profile Indicator */}
            {user && (
                <div className="absolute top-4 right-4 z-10 flex flex-col items-end">
                    <div className="text-xs text-gray-400">שלום, <span className="font-bold">{userData?.name || user.email || 'משתמש'}</span></div>
                    <button onClick={handleLogout} className="text-[10px] text-red-300 hover:text-red-500 underline mt-1 flex items-center gap-1">
                        התנתק <LogOut size={10} />
                    </button>
                </div>
            )}

            <div className="p-4 sm:p-6 lg:p-8 flex-grow flex flex-col justify-center relative">
                {children}
            </div>
        </div>
    );
};

export default MainLayout;
