import React, { useState } from 'react';
import { CHRONOTYPES } from '../../hooks/useChronotype';
import useTasks from '../../hooks/useTasks';

const HubScreen = ({ userData, onStartQuiz }) => {
    const { tasks, addTask, toggleTask, deleteTask } = useTasks();
    const [showAdd, setShowAdd] = useState(false);
    const [showTaskList, setShowTaskList] = useState(false);
    const [newTask, setNewTask] = useState({ description: '', duration: '', type: 'short', recurring: false });

    // Re-destructure from the top level call
    const openTasks = tasks.filter(t => !t.completed).length;
    const closedTasks = tasks.filter(t => t.completed).length;
    const baseInfo = userData?.base_chronotype ? CHRONOTYPES[userData.base_chronotype] : null;

    const handleAddTask = async () => {
        if (!newTask.description) return alert('Description required');
        await addTask(newTask);
        setNewTask({ description: '', duration: '', type: 'short', recurring: false });
        setShowAdd(false);
    };

    return (
        <div className="text-center w-full">
            <div className="text-6xl mb-4">🧭</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">מבוך האנרגיה</h1>
            <h2 className="text-xl text-gray-500 mb-6">מרכז הבקרה שלך</h2>

            {baseInfo && (
                <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 text-right mx-auto max-w-md">
                    <p className="text-sm text-gray-500">פרופיל בסיס:</p>
                    <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span>{baseInfo.title.split(' ')[1]}</span> <span>{baseInfo.name}</span>
                    </h3>
                </div>
            )}

            <div className="space-y-4 max-w-md mx-auto">
                <button onClick={() => onStartQuiz('status')} className="w-full bg-slate-700 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-between group">
                    <span className="text-right">
                        <div className="text-lg">מה המצב עכשיו?</div>
                        <div className="text-xs font-normal opacity-80">בדיקה יומית לבניית לו"ז אופטימלי</div>
                    </span>
                    <span className="text-2xl group-hover:scale-110 transition">⚡</span>
                </button>

                <div className="grid grid-cols-2 gap-3 mt-4">
                    <div onClick={() => setShowTaskList(!showTaskList)} className="bg-indigo-50 p-3 rounded-lg text-center cursor-pointer hover:bg-indigo-100 transition">
                        <div className="text-2xl font-bold text-indigo-600">{openTasks}</div>
                        <div className="text-xs text-gray-500">משימות פתוחות</div>
                    </div>
                    <div onClick={() => setShowTaskList(!showTaskList)} className="bg-teal-50 p-3 rounded-lg text-center cursor-pointer hover:bg-teal-100 transition">
                        <div className="text-2xl font-bold text-teal-600">{closedTasks}</div>
                        <div className="text-xs text-gray-500">הושלמו</div>
                    </div>
                </div>

                {showTaskList && (
                    <div className="bg-gray-50 p-2 rounded-xl mb-4 text-right max-h-60 overflow-y-auto border border-gray-200">
                        {tasks.length === 0 && <p className="text-xs text-gray-400 text-center py-2">אין משימות.</p>}
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
                                    </div>
                                </div>
                                <button onClick={() => deleteTask(task.id)} className="text-gray-300 hover:text-red-400 px-2">✕</button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="mt-4 text-right flex flex-col items-center">
                    <button onClick={() => setShowAdd(!showAdd)} className="w-14 h-14 bg-indigo-600 text-white font-bold rounded-full hover:bg-indigo-700 transition shadow-lg flex items-center justify-center text-3xl pb-1">
                        +
                    </button>

                    {showAdd && (
                        <div className="w-full bg-indigo-50 p-3 rounded-lg mt-3 border border-indigo-100 text-right">
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
                                    id="rec"
                                    className="w-4 h-4 text-indigo-600 rounded"
                                    checked={newTask.recurring}
                                    onChange={(e) => setNewTask({ ...newTask, recurring: e.target.checked })}
                                />
                                <label htmlFor="rec" className="text-sm text-gray-600">משימה חוזרת (הרגל)</label>
                            </div>

                            <button onClick={handleAddTask} className="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-indigo-700">שמור משימה</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default HubScreen;
