import React, { useState } from 'react';
import useTasks from '../../hooks/useTasks';
import usePlanner from '../../hooks/usePlanner';

const ResultScreen = ({ resultType, resultData, onBack }) => {
    const { tasks, addTask, toggleTask, deleteTask, error: tasksError, clearError: clearTasksError } = useTasks();
    const { planHtml, loading: planLoading, error: planError, success: planSuccess, generateSchedule, savePlan, loadLastPlan, clearPlan, clearMessages } = usePlanner();

    const [showAdd, setShowAdd] = useState(false);
    const [newTask, setNewTask] = useState({ description: '', duration: '', type: 'short', recurring: false });
    const [taskValidationError, setTaskValidationError] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);

    const handleAddTask = async () => {
        if (!newTask.description) {
            setTaskValidationError('נא להזין תיאור משימה');
            return;
        }
        setTaskValidationError(null);
        await addTask(newTask);
        setNewTask({ description: '', duration: '', type: 'short', recurring: false });
        setShowAdd(false);
    };

    return (
        <div className={`text-center w-full transition-colors duration-500 rounded-2xl p-4 shadow-inner ${resultData.class?.replace('/50', '/20') || 'bg-white'}`}>

            {/* result header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-6">
                <div className="text-5xl animate-bounce">{resultData.title.includes('🦁') ? '🦁' : resultData.title.includes('🐻') ? '🐻' : resultData.title.includes('🐺') ? '🐺' : '🐬'}</div>
                <div className="text-left">
                    <button onClick={loadLastPlan} className="text-xs bg-white/50 hover:bg-white/70 px-2 py-1 rounded text-gray-700 border border-white/40">📂 טען תוכנית אחרונה</button>
                </div>
            </div>

            <h2 className="text-2xl font-bold mb-1 text-gray-800">{resultData.title}</h2>
            <p className="text-sm text-gray-600 mb-4 bg-white/50 p-2 rounded-lg inline-block">{resultData.power}</p>

            {/* Tasks Section */}
            <div className="bg-white/95 rounded-xl p-4 shadow-xl min-h-[400px] text-gray-800 text-right">
                <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                    <h3 className="font-bold text-gray-700">📋 משימות לביצוע</h3>
                    <button onClick={() => setShowAdd(!showAdd)} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold">+ הוסף</button>
                </div>

                {showAdd && (
                    <div className="bg-indigo-50 p-3 rounded-lg mb-4 border border-indigo-100">
                        <input
                            type="text"
                            placeholder="מה המשימה?"
                            className="w-full p-2 text-sm border rounded-lg mb-2"
                            value={newTask.description}
                            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                        />
                        <div className="flex flex-col sm:flex-row gap-2 mb-2">
                            <select
                                className="p-2 text-sm border rounded-lg bg-white w-full sm:flex-1"
                                value={newTask.type}
                                onChange={(e) => setNewTask({ ...newTask, type: e.target.value })}
                            >
                                <option value="short">קצר (היום/מחר)</option>
                                <option value="long">ארוך (פרויקט)</option>
                            </select>
                            <input
                                type="text"
                                placeholder="משך (למשל: שעתיים)"
                                className="w-full p-2 text-sm border rounded-lg sm:flex-1"
                                value={newTask.duration}
                                onChange={(e) => setNewTask({ ...newTask, duration: e.target.value })}
                            />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                            <input
                                type="checkbox"
                                id="rec2"
                                className="w-4 h-4 text-indigo-600 rounded"
                                checked={newTask.recurring}
                                onChange={(e) => setNewTask({ ...newTask, recurring: e.target.checked })}
                            />
                            <label htmlFor="rec2" className="text-sm text-gray-600">משימה חוזרת (הרגל)</label>
                        </div>
                        {(taskValidationError || tasksError) && (
                            <div dir="rtl" className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-2" role="alert">
                                {taskValidationError || tasksError}
                            </div>
                        )}
                        <button onClick={handleAddTask} className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-indigo-700">שמור משימה</button>
                    </div>
                )}

                <div className="space-y-2 mb-4 max-h-48 overflow-y-auto task-scroll p-1 border rounded bg-gray-50 min-h-[60px]">
                    {tasks.length === 0 && <p className="text-xs text-gray-400 text-center py-4">אין משימות. הוסף משימה חדשה!</p>}
                    {tasks.map(task => (
                        <div key={task.id} className={`flex items-center justify-between bg-white p-2 rounded border border-gray-100 text-sm mb-1 ${task.completed ? 'bg-gray-50' : ''}`}>
                            <div className="flex items-center gap-2 overflow-hidden">
                                <input
                                    type="checkbox"
                                    checked={task.completed}
                                    onChange={() => toggleTask(task.id, task.completed)}
                                    className="w-4 h-4 cursor-pointer"
                                />
                                <div>
                                    <div className={`truncate ${task.completed ? 'line-through text-gray-400' : 'font-bold text-gray-900'}`}>
                                        {task.recurring && '🔁'} {task.description}
                                    </div>
                                    <div className="text-[10px] text-gray-500">
                                        {task.type === 'long' ? '📅' : '⏱️'} {task.duration}
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-400 px-2">✕</button>
                        </div>
                    ))}
                </div>

                {/* AI Generator */}
                <div className="border-t pt-4">
                    <h3 className="font-bold text-gray-700 mb-2">✨ יצירת לו"ז חכם</h3>
                    
                    {/* Error and Success Messages */}
                    {planError && (
                        <div dir="rtl" className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm mb-2" role="alert">
                            {planError}
                        </div>
                    )}
                    {planSuccess && (
                        <div dir="rtl" className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded text-sm mb-2" role="status">
                            {planSuccess}
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
                        <button 
                            disabled={planLoading} 
                            onClick={() => generateSchedule('today', tasks, resultData, 'now')} 
                            className="bg-orange-100 text-orange-700 hover:bg-orange-200 py-2 rounded-lg text-xs font-bold border border-orange-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {planLoading ? 'טוען...' : 'היום 🌙'}
                        </button>
                        <button 
                            disabled={planLoading} 
                            onClick={() => generateSchedule('tomorrow', tasks, resultData, 'now')} 
                            className="bg-teal-100 text-teal-700 hover:bg-teal-200 py-2 rounded-lg text-xs font-bold border border-teal-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {planLoading ? 'טוען...' : 'מחר ☀️'}
                        </button>
                        <button 
                            disabled={planLoading} 
                            onClick={() => generateSchedule('week', tasks, resultData, 'now')} 
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-2 rounded-lg text-xs font-bold border border-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {planLoading ? 'טוען...' : 'שבוע 📅'}
                        </button>
                    </div>
                </div>

                {/* Plan Display */}
                {planHtml && (
                    <div className="mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-right">
                        <div className="flex justify-between items-center mb-2 border-b pb-2">
                            <span className="font-bold text-indigo-600 text-sm">התוכנית שלך:</span>
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => { 
                                        navigator.clipboard.writeText(planHtml); 
                                        setCopySuccess(true);
                                        setTimeout(() => setCopySuccess(false), 2000);
                                    }} 
                                    className={`text-xs px-2 py-1 rounded text-white hover:opacity-80 ${copySuccess ? 'bg-green-500' : 'bg-blue-500'}`}
                                >
                                    {copySuccess ? 'הועתק! ✓' : 'העתק 📋'}
                                </button>
                                <button onClick={savePlan} className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">שמור 💾</button>
                                <button onClick={clearPlan} className="text-gray-400 hover:text-gray-600">✕</button>
                            </div>
                        </div>
                        <div className="prose text-sm leading-relaxed max-h-60 overflow-y-auto" dangerouslySetInnerHTML={{ __html: planHtml }} />
                    </div>
                )}
            </div>

            <div className="mt-4">
                <button onClick={onBack} className="bg-black/20 hover:bg-black/30 text-gray-800 font-bold py-2 px-6 rounded-xl transition text-sm border border-black/10">
                    חזרה למסך הראשי 🏠
                </button>
            </div>
        </div>
    );
};

export default ResultScreen;
