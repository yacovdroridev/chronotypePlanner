import React from 'react';

const ProgressBar = ({ progress }) => {
    return (
        <div className="h-2 bg-gray-100 w-full relative">
            <div
                className="h-full bg-slate-600 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
            ></div>
        </div>
    );
};

export default ProgressBar;
