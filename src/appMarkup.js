const appMarkup = `


    <div class="w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden min-h-[700px] flex flex-col relative transition-all duration-500" id="main-card">
        
        <!-- Progress Bar -->
        <div class="h-2 bg-gray-100 w-full relative">
            <div id="progress-bar" class="h-full bg-slate-600 transition-all duration-500 ease-out w-0"></div>
        </div>

        <!-- Navigation Controls -->
        <div id="nav-controls" class="absolute top-4 left-4 z-10 hidden">
            <button onclick="goBack()" class="flex items-center text-gray-400 hover:text-gray-600 transition text-sm font-bold">
                <span class="text-lg ml-1">➔</span> חזור
            </button>
        </div>
        
        <!-- User Profile Indicator -->
        <div id="user-indicator" class="absolute top-4 right-4 z-10 hidden flex flex-col items-end">
             <div class="text-xs text-gray-400">שלום, <span id="display-username" class="font-bold"></span></div>
             <button onclick="handleLogout()" class="text-[10px] text-red-300 hover:text-red-500 underline mt-1">התנתק / החלף משתמש</button>
        </div>

        <div class="p-8 flex-grow flex flex-col justify-center">

            <!-- Loading Screen -->
            <div id="screen-loading" class="screen text-center">
                <div class="loader"></div>
                <p class="mt-4 text-gray-500">טוען נתונים...</p>
            </div>

            <!-- Login / Name Screen -->
            <div id="screen-login" class="screen hidden text-center">
                <div class="text-6xl mb-4">👋</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">ברוכים הבאים</h1>
                <p class="text-gray-600 mb-6">הזן שם, אימייל וסיסמה כדי ליצור פרופיל או להתחבר</p>
                <input type="text" id="username-input" placeholder="השם שלך" class="w-full p-4 border rounded-xl mb-3 text-center text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <input type="email" id="email-input" placeholder="אימייל" class="w-full p-4 border rounded-xl mb-3 text-center text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <input type="password" id="password-input" placeholder="סיסמה" class="w-full p-4 border rounded-xl mb-4 text-center text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <button onclick="handleLogin()" class="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg">
                    התחבר / צור משתמש 🚀
                </button>
                <div class="mt-4 grid grid-cols-2 gap-2">
                    <button onclick="loginWithGoogle()" class="w-full bg-white border border-gray-200 text-gray-700 text-sm py-2 rounded-lg font-bold hover:bg-gray-50">
                        Google
                    </button>
                    <button onclick="loginWithGithub()" class="w-full bg-white border border-gray-200 text-gray-700 text-sm py-2 rounded-lg font-bold hover:bg-gray-50">
                        GitHub
                    </button>
                </div>
            </div>

            <!-- Welcome Screen (Hub) -->
            <div id="screen-welcome" class="screen hidden text-center">
                <div class="text-6xl mb-4">🧭</div>
                <h1 class="text-3xl font-bold text-gray-800 mb-2">מבוך האנרגיה</h1>
                <h2 class="text-xl text-gray-500 mb-6">מרכז הבקרה שלך</h2>
                
                <div class="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100 text-right">
                    <p class="text-sm text-gray-500">פרופיל בסיס:</p>
                    <h3 class="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span id="hub-animal-icon"></span> <span id="hub-animal-name"></span>
                    </h3>
                </div>

                <div class="space-y-4">
                    <button onclick="startQuiz('now')" class="w-full bg-slate-700 text-white font-bold py-4 px-6 rounded-xl hover:bg-slate-800 transition shadow-lg flex items-center justify-between group">
                        <span class="text-right">
                            <div class="text-lg">מה המצב עכשיו?</div>
                            <div class="text-xs font-normal opacity-80">בדיקה יומית לבניית לו"ז אופטימלי</div>
                        </span>
                        <span class="text-2xl group-hover:scale-110 transition">⚡</span>
                    </button>

                    <div class="grid grid-cols-2 gap-3 mt-4">
                         <div class="bg-indigo-50 p-3 rounded-lg text-center">
                             <div class="text-2xl font-bold text-indigo-600" id="stat-tasks-count">0</div>
                             <div class="text-xs text-gray-500">משימות פתוחות</div>
                         </div>
                         <div class="bg-teal-50 p-3 rounded-lg text-center">
                             <div class="text-2xl font-bold text-teal-600" id="stat-tasks-done">0</div>
                             <div class="text-xs text-gray-500">הושלמו</div>
                         </div>
                    </div>
                </div>
            </div>

            <!-- Pre-Quiz Intro (New Users) -->
            <div id="screen-intro-quiz" class="screen hidden text-center">
                <div class="text-6xl mb-4">🧬</div>
                <h1 class="text-2xl font-bold text-gray-800 mb-4">נעים להכיר, <span id="intro-name"></span>!</h1>
                <p class="text-gray-600 mb-8 leading-relaxed">
                    כדי שנוכל לעזור לך לנהל את הזמן, אנחנו צריכים להבין קודם כל מי את/ה.
                    <br><br>
                    נצא ל"אבחון בסיס" קצר (3 שאלות) שיגלה לנו את ה"חיה" הפנימית שלך.
                </p>
                <button onclick="startQuiz('base')" class="w-full bg-indigo-600 text-white font-bold py-4 px-6 rounded-xl hover:bg-indigo-700 transition shadow-lg">
                    התחל אבחון בסיס
                </button>
            </div>

            <!-- Quiz Questions (Base Type) -->
            <!-- Q1 -->
            <div id="screen-q1" class="screen hidden">
                <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">שאלה 1 מתוך 3</span>
                <h3 class="text-2xl font-bold text-gray-800 mt-2 mb-6">בחופש מוחלט, מתי תתעורר/י?</h3>
                <div class="space-y-3">
                    <button onclick="answer('lion')" class="btn-option w-full text-right bg-gray-50 hover:bg-orange-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>לפני 06:30 בבוקר</span> <span class="text-2xl">🌅</span>
                    </button>
                    <button onclick="answer('bear')" class="btn-option w-full text-right bg-gray-50 hover:bg-amber-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>בין 07:00 ל-09:00</span> <span class="text-2xl">☀️</span>
                    </button>
                    <button onclick="answer('wolf')" class="btn-option w-full text-right bg-gray-50 hover:bg-indigo-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>אחרי 10:00 או בצהריים</span> <span class="text-2xl">🌙</span>
                    </button>
                    <button onclick="answer('dolphin')" class="btn-option w-full text-right bg-gray-50 hover:bg-blue-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>שינה קלה / נדודי שינה</span> <span class="text-2xl">👀</span>
                    </button>
                </div>
            </div>

            <!-- Q2 -->
            <div id="screen-q2" class="screen hidden">
                <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">שאלה 2 מתוך 3</span>
                <h3 class="text-2xl font-bold text-gray-800 mt-2 mb-6">מתי הריכוז שלך בשיא?</h3>
                <div class="space-y-3">
                    <button onclick="answer('lion')" class="btn-option w-full text-right bg-gray-50 hover:bg-orange-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>מוקדם בבוקר</span> <span class="text-2xl">🦁</span>
                    </button>
                    <button onclick="answer('bear')" class="btn-option w-full text-right bg-gray-50 hover:bg-amber-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>בוקר מאוחר עד צהריים</span> <span class="text-2xl">🐻</span>
                    </button>
                    <button onclick="answer('wolf')" class="btn-option w-full text-right bg-gray-50 hover:bg-indigo-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>ערב או לילה</span> <span class="text-2xl">🐺</span>
                    </button>
                    <button onclick="answer('dolphin')" class="btn-option w-full text-right bg-gray-50 hover:bg-blue-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>משתנה / פרצי אנרגיה</span> <span class="text-2xl">🐬</span>
                    </button>
                </div>
            </div>

            <!-- Q3 -->
            <div id="screen-q3" class="screen hidden">
                <span class="text-sm font-bold text-gray-400 uppercase tracking-wider">שאלה 3 מתוך 3</span>
                <h3 class="text-2xl font-bold text-gray-800 mt-2 mb-6">בילויים עד מאוחר?</h3>
                <div class="space-y-3">
                    <button onclick="answer('lion')" class="btn-option w-full text-right bg-gray-50 hover:bg-orange-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>עייף/ה ב-21:00</span> <span class="text-2xl">😴</span>
                    </button>
                    <button onclick="answer('bear')" class="btn-option w-full text-right bg-gray-50 hover:bg-amber-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>סבבה, אבל בחצות לישון</span> <span class="text-2xl">😌</span>
                    </button>
                    <button onclick="answer('wolf')" class="btn-option w-full text-right bg-gray-50 hover:bg-indigo-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>רק ב-22:00 אני מתעורר/ת!</span> <span class="text-2xl">🔥</span>
                    </button>
                    <button onclick="answer('dolphin')" class="btn-option w-full text-right bg-gray-50 hover:bg-blue-50 p-4 rounded-xl border border-gray-200 flex items-center justify-between group">
                        <span>מלחיץ / מעייף נפשית</span> <span class="text-2xl">🤯</span>
                    </button>
                </div>
            </div>

            <!-- Status Check Screen -->
            <div id="screen-status" class="screen hidden">
                <div class="flex items-center gap-2 mb-4">
                     <span class="text-2xl">⚡</span>
                     <h3 class="text-xl font-bold text-gray-800">איך את/ה מרגיש/ה כרגע?</h3>
                </div>
                <div class="grid grid-cols-1 gap-3">
                    <button onclick="showStatusResult('lion')" class="text-right p-4 rounded-xl border-2 border-orange-100 hover:border-orange-300 hover:bg-orange-50 transition bg-white">
                        <div class="font-bold text-orange-800">חד, ממוקד וחזק</div>
                        <div class="text-sm text-gray-600">שיא האנרגיה - זה הזמן לטרוף</div>
                    </button>
                    <button onclick="showStatusResult('bear')" class="text-right p-4 rounded-xl border-2 border-amber-100 hover:border-amber-300 hover:bg-amber-50 transition bg-white">
                        <div class="font-bold text-amber-800">יציב וחברותי</div>
                        <div class="text-sm text-gray-600">אנרגיה טובה ומאוזנת</div>
                    </button>
                    <button onclick="showStatusResult('wolf')" class="text-right p-4 rounded-xl border-2 border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition bg-white">
                        <div class="font-bold text-indigo-800">יצירתי אך מעורפל</div>
                        <div class="text-sm text-gray-600">ראש פתוח, פחות פוקוס על פרטים</div>
                    </button>
                    <button onclick="showStatusResult('dolphin')" class="text-right p-4 rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:bg-blue-50 transition bg-white">
                        <div class="font-bold text-blue-800">לחוץ / עייף / מוצף</div>
                        <div class="text-sm text-gray-600">זקוק להפסקה או ארגון מחדש</div>
                    </button>
                </div>
                 <button onclick="goHome()" class="mt-6 text-gray-400 hover:text-gray-600 text-sm w-full text-center">ביטול וחזרה למסך הראשי</button>
            </div>

            <!-- Result & Planner Screen -->
            <div id="screen-result" class="screen hidden text-center">
                <div class="flex justify-between items-start">
                    <div id="result-icon" class="text-5xl mb-2 animate-bounce"></div>
                    <div class="text-left">
                        <button onclick="loadLastPlan()" class="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded text-white border border-white/40">📂 טען תוכנית אחרונה</button>
                    </div>
                </div>
                
                <h2 class="text-2xl font-bold mb-1 text-white"><span id="result-title"></span></h2>
                <p id="result-power" class="text-sm text-white/90 mb-4 bg-black/10 p-2 rounded-lg"></p>

                <!-- Tasks & AI Section -->
                <div class="bg-white/95 rounded-t-2xl p-4 shadow-xl min-h-[400px] text-gray-800 text-right">
                    
                    <!-- Task List Header -->
                    <div class="flex justify-between items-center mb-3">
                        <h3 class="font-bold text-gray-700">📋 משימות לביצוע</h3>
                        <button onclick="toggleAddTask()" class="text-indigo-600 hover:text-indigo-800 text-sm font-bold">+ הוסף</button>
                    </div>

                    <!-- Add Task Form (Toggle) -->
                    <div id="add-task-form" class="hidden bg-indigo-50 p-3 rounded-lg mb-4 border border-indigo-100">
                        <input type="text" id="new-task-desc" placeholder="מה המשימה?" class="w-full p-2 text-sm border rounded-lg mb-2">
                        
                        <div class="flex gap-2 mb-2">
                            <select id="new-task-type" class="p-2 text-sm border rounded-lg bg-white flex-1">
                                <option value="short">קצר (היום/מחר)</option>
                                <option value="long">ארוך (פרויקט)</option>
                            </select>
                            <input type="text" id="new-task-duration" placeholder="משך (למשל: שעתיים)" class="w-full p-2 text-sm border rounded-lg flex-1">
                        </div>
                        
                        <div class="flex items-center gap-2 mb-2">
                            <input type="checkbox" id="new-task-recurring" class="w-4 h-4 text-indigo-600 rounded">
                            <label for="new-task-recurring" class="text-sm text-gray-600">משימה חוזרת (הרגל)</label>
                        </div>

                        <button onclick="addTask()" class="w-full bg-indigo-600 text-white text-sm py-2 rounded-lg font-bold hover:bg-indigo-700">שמור משימה</button>
                    </div>

                    <!-- Task List Container -->
                    <div id="tasks-container" class="space-y-2 mb-4 max-h-48 overflow-y-auto task-scroll p-1 border rounded bg-gray-50 min-h-[60px]">
                         <p id="empty-task-msg" class="text-xs text-gray-400 text-center py-4">אין משימות. הוסף משימה חדשה!</p>
                    </div>

                    <!-- AI Generators -->
                    <div class="border-t pt-4">
                        <h3 class="font-bold text-gray-700 mb-2">✨ יצירת לו"ז חכם</h3>
                        <div class="grid grid-cols-3 gap-2 mb-2">
                            <button onclick="generateSchedule('today')" id="btn-gen-today" class="bg-orange-100 text-orange-700 hover:bg-orange-200 py-2 rounded-lg text-xs font-bold border border-orange-200">
                                היום 🌙
                            </button>
                            <button onclick="generateSchedule('tomorrow')" id="btn-gen-tomorrow" class="bg-teal-100 text-teal-700 hover:bg-teal-200 py-2 rounded-lg text-xs font-bold border border-teal-200">
                                מחר ☀️
                            </button>
                            <button onclick="generateSchedule('week')" id="btn-gen-week" class="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 py-2 rounded-lg text-xs font-bold border border-indigo-200">
                                שבוע 📅
                            </button>
                        </div>
                    </div>

                    <!-- AI Result Display -->
                    <div id="ai-response-container" class="hidden mt-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-right">
                        <div class="flex justify-between items-center mb-2 border-b pb-2">
                             <span class="font-bold text-indigo-600 text-sm">התוכנית שלך:</span>
                             <div class="flex gap-2">
                                <button onclick="saveCurrentPlan()" class="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">שמור 💾</button>
                                <button onclick="closeAIResult()" class="text-gray-400 hover:text-gray-600">✕</button>
                             </div>
                        </div>
                        <div id="ai-response-text" class="prose text-sm leading-relaxed max-h-60 overflow-y-auto task-scroll"></div>
                    </div>
                </div>

                <div class="mt-4">
                    <button onclick="goHome()" class="bg-black/20 hover:bg-black/30 text-white font-bold py-2 px-6 rounded-xl transition text-sm">
                        חזרה למסך הראשי 🏠
                    </button>
                </div>
            </div>

        </div>
    </div>

    
`;

export default appMarkup;
