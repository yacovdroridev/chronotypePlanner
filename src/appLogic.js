import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  limit,
  where,
  getDocs,
} from 'firebase/firestore';
import { marked } from 'marked';

// --- CONSTANTS & STATE ---
let apiKey = '';
let firebaseConfig = null;
let db;
let auth;
let userDocRef;
let tasksColRef;
let plansColRef;
let userData = null;
let answerHistory = [];
let currentMode = 'base';
let currentResultType = 'bear';
let unsubscribeTasks = null; // Listener cleanup
let appId = 'default-app-id';
let firebaseInitTimeout = null;
let appInitialized = false;

// --- GITHUB / PUBLIC WEB CONFIGURATION ---
// 1. If you are uploading this to GitHub, replace the Empty Strings below with your keys.
// 2. You can get firebaseConfig from the Firebase Console (Settings -> General -> Your Apps).
// 3. You can get Gemini apiKey from aistudio.google.com.

// CHECK IF WE ARE IN THE CANVAS/PREVIEW ENVIRONMENT
const injectedConfig = typeof window !== 'undefined' ? window.__firebase_config : undefined;
const injectedAppId = typeof window !== 'undefined' ? window.__app_id : undefined;
const injectedAuthToken = typeof window !== 'undefined' ? window.__initial_auth_token : undefined;

if (injectedConfig) {
  // WE ARE IN PREVIEW: Use injected keys
  firebaseConfig = JSON.parse(injectedConfig);
  // apiKey is injected by the environment usually, but we check just in case
  if (injectedAppId) appId = injectedAppId;
} else {
  // WE ARE ON GITHUB/PUBLIC: Use your keys here
  apiKey = '';

  firebaseConfig = {
    apiKey: 'AIzaSyBhcRBB9vzzAUdodqPxFsH0jZ6D4AAQ4J8',
    authDomain: 'chrontypeplanner.firebaseapp.com',
    projectId: 'chrontypeplanner',
    storageBucket: 'chrontypeplanner.firebasestorage.app',
    messagingSenderId: '273674506551',
    appId: '1:273674506551:web:d4eb0d667a397b5c788ab2',
    measurementId: 'G-P37L6Q61KE',
  };
}

const baseData = {
  lion: { title: 'אריה 🦁', name: 'אריה', desc: 'משכימי קום, חדים בבוקר.', power: 'עבודה עמוקה בבוקר.', class: 'bg-lion' },
  bear: { title: 'דוב 🐻', name: 'דוב', desc: 'אנרגיה יציבה בשעות האור.', power: 'שיא: 10:00-14:00.', class: 'bg-bear' },
  wolf: { title: 'זאב 🐺', name: 'זאב', desc: 'חיות לילה. בוקר איטי.', power: 'יצירתיות בערב.', class: 'bg-wolf' },
  dolphin: { title: 'דולפין 🐬', name: 'דולפין', desc: 'שנה קלה, מוח פעיל.', power: 'עבודה בספרינטים.', class: 'bg-dolphin' },
};

const statusData = {
  lion: { title: 'מצב אריה (פוקוס) 🦁', desc: 'חדות שיא. לטרוף.', power: 'תקוף את המשימה הקשה.', class: 'bg-lion' },
  bear: { title: 'מצב דוב (יציבות) 🐻', desc: 'אנרגיה מאוזנת.', power: 'זמן לביצוע שוטף.', class: 'bg-bear' },
  wolf: { title: 'מצב זאב (יצירה) 🐺', desc: 'ראש יצירתי ומעופף.', power: 'סיעור מוחות.', class: 'bg-wolf' },
  dolphin: { title: 'מצב דולפין (הצפה) 🐬', desc: 'עומס ופיזור.', power: 'עצור! תרגיל נשימה.', class: 'bg-dolphin' },
};

// --- FIREBASE INIT ---
async function initFirebase() {
  firebaseInitTimeout = setTimeout(() => {
    if (!auth || !db) {
      console.error('Firebase init timed out.');
      document.getElementById('screen-loading').classList.add('hidden');
      showScreen('screen-login');
      alert('לא ניתן להתחבר ל-Firebase. ודא שהפעלת Anonymous Auth והגדרות הפרויקט תקינות.');
    }
  }, 8000);

  await runFirebaseLogic();
}

async function runFirebaseLogic() {
  // Safety check for config
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    console.warn('No Firebase Config found. If you are on GitHub, please edit your config.');
    if (!injectedConfig) {
      alert('שים לב: לא הוגדרו מפתחות Firebase. האפליקציה לא תשמור נתונים. נא לערוך את הקובץ ולהוסיף מפתחות.');
    }
    return;
  }

  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);

    // Handle Auth (Preview vs Public)
    if (injectedAuthToken) {
      await signInWithCustomToken(auth, injectedAuthToken);
    } else {
      await signInAnonymously(auth);
    }
  } catch (e) {
    console.error('Firebase init error:', e);
    if (firebaseInitTimeout) clearTimeout(firebaseInitTimeout);
    document.getElementById('screen-loading').classList.add('hidden');
    showScreen('screen-login');
    alert('שגיאת התחברות ל-Firebase. ודא שהפעלת Anonymous Auth ושכל המפתחות נכונים.');
    return;
  }

  onAuthStateChanged(auth, async (user) => {
    if (firebaseInitTimeout) clearTimeout(firebaseInitTimeout);
    if (user) {
      // Refs
      userDocRef = doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main');
      tasksColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'tasks');
      plansColRef = collection(db, 'artifacts', appId, 'users', user.uid, 'plans');

      await checkUserProfile();
    } else {
      // Logged out
      showScreen('screen-login');
      document.getElementById('screen-loading').classList.add('hidden');
    }
  });
}

async function checkUserProfile() {
  try {
    const docSnap = await getDoc(userDocRef);
    document.getElementById('screen-loading').classList.add('hidden');

    if (docSnap.exists()) {
      userData = docSnap.data();
      if (userData.name && userData.baseChronotype) {
        showHub(userData);
      } else if (userData.name) {
        showIntroQuiz(userData.name);
      } else {
        showScreen('screen-login');
      }
    } else {
      showScreen('screen-login');
    }
  } catch (e) {
    console.error('Profile Error:', e);
    showScreen('screen-login');
  }
}

async function handleLogin() {
  const name = document.getElementById('username-input').value.trim();
  if (!name) return alert('נא להזין שם');
  await setDoc(userDocRef, { name }, { merge: true });
  if (userData && userData.baseChronotype) showHub({ ...userData, name });
  else showIntroQuiz(name);
}

async function handleLogout() {
  if (window.confirm('האם אתה בטוח שברצונך להתנתק? המידע המקומי ינוקה.')) {
    if (unsubscribeTasks) unsubscribeTasks(); // Detach listener
    await signOut(auth);
    window.location.reload();
  }
}

async function saveUserBaseType(type) {
  await setDoc(userDocRef, { baseChronotype: type }, { merge: true });
  userData = { ...userData, baseChronotype: type };
}

// --- HUB & UI ---
function showHub(data) {
  userData = data;
  document.getElementById('display-username').innerText = data.name;
  document.getElementById('user-indicator').classList.remove('hidden');

  if (baseData[data.baseChronotype]) {
    const info = baseData[data.baseChronotype];
    document.getElementById('hub-animal-name').innerText = info.name;
    document.getElementById('hub-animal-icon').innerText = info.title.split(' ')[1];
  }

  // Start listening to tasks stats
  subscribeToTasks(true);

  showScreen('screen-welcome');
  updateProgress(0);
}

function showIntroQuiz(name) {
  document.getElementById('intro-name').innerText = name;
  showScreen('screen-intro-quiz');
}

function startQuiz(mode) {
  currentMode = mode;
  answerHistory = [];
  if (mode === 'base') {
    showScreen('screen-q1');
    updateProgress(10);
    document.getElementById('nav-controls').classList.add('hidden');
  } else {
    showScreen('screen-status');
    updateProgress(50);
    document.getElementById('nav-controls').classList.remove('hidden');
  }
}

function goHome() {
  if (userData && userData.baseChronotype) showHub(userData);
  else showScreen('screen-login');
  document.getElementById('nav-controls').classList.add('hidden');
}

function showScreen(id) {
  document.querySelectorAll('.screen').forEach((el) => {
    el.classList.add('hidden');
    el.classList.remove('fade-enter-active');
  });
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.classList.add('fade-enter');
  void el.offsetWidth;
  el.classList.add('fade-enter-active');
}

function updateProgress(percent) {
  document.getElementById('progress-bar').style.width = `${percent}%`;
}

function goBack() {
  if (currentMode === 'now') {
    goHome();
    return;
  }
  if (answerHistory.length === 0) {
    goHome();
    return;
  }
  answerHistory.pop();
  const step = answerHistory.length;
  if (step === 0) {
    showScreen('screen-q1');
    updateProgress(10);
    document.getElementById('nav-controls').classList.add('hidden');
  } else if (step === 1) {
    showScreen('screen-q2');
    updateProgress(50);
  }
}

// --- QUIZ LOGIC ---
function answer(type) {
  answerHistory.push(type);
  const step = answerHistory.length;
  if (step >= 1) document.getElementById('nav-controls').classList.remove('hidden');
  if (step === 1) {
    showScreen('screen-q2');
    updateProgress(50);
  } else if (step === 2) {
    showScreen('screen-q3');
    updateProgress(90);
  } else {
    calculateBaseResult();
  }
}

function calculateBaseResult() {
  updateProgress(100);
  document.getElementById('nav-controls').classList.add('hidden');
  const counts = { lion: 0, bear: 0, wolf: 0, dolphin: 0 };
  answerHistory.forEach((a) => {
    counts[a] += 1;
  });
  let winner = 'bear';
  let maxVal = -1;
  Object.entries(counts).forEach(([key, val]) => {
    if (val > maxVal) {
      maxVal = val;
      winner = key;
    }
  });
  saveUserBaseType(winner);
  currentResultType = winner;
  renderResult(winner, baseData[winner]);
}

function showStatusResult(type) {
  updateProgress(100);
  document.getElementById('nav-controls').classList.add('hidden');
  currentResultType = type;
  renderResult(type, statusData[type]);
}

function renderResult(type, data) {
  const resultScreen = document.getElementById('screen-result');
  resultScreen.className = `screen rounded-2xl shadow-inner fade-enter fade-enter-active ${data.class}`;

  document.getElementById('result-title').innerText = data.title;
  document.getElementById('result-icon').innerText = data.title.includes('🦁')
    ? '🦁'
    : data.title.includes('🐻')
      ? '🐻'
      : data.title.includes('🐺')
        ? '🐺'
        : '🐬';
  document.getElementById('result-power').innerText = data.power;

  document.getElementById('add-task-form').classList.add('hidden');
  document.getElementById('ai-response-container').classList.add('hidden');

  // Switch to tasks listener for full view
  subscribeToTasks(false);

  showScreen('screen-result');
}

// --- TASKS LOGIC (FIRESTORE) ---
function subscribeToTasks(statsOnly) {
  if (unsubscribeTasks) unsubscribeTasks();

  const q = query(tasksColRef, orderBy('createdAt', 'desc'));

  unsubscribeTasks = onSnapshot(q, (snapshot) => {
    const tasks = [];
    let doneCount = 0;
    snapshot.forEach((docSnap) => {
      const t = { id: docSnap.id, ...docSnap.data() };
      tasks.push(t);
      if (t.completed) doneCount += 1;
    });

    if (statsOnly) {
      document.getElementById('stat-tasks-count').innerText = tasks.length - doneCount;
      document.getElementById('stat-tasks-done').innerText = doneCount;
    } else {
      renderTaskList(tasks);
    }
  });
}

async function addTask() {
  const desc = document.getElementById('new-task-desc').value.trim();
  const duration = document.getElementById('new-task-duration').value.trim();
  const type = document.getElementById('new-task-type').value;
  const recurring = document.getElementById('new-task-recurring').checked;

  if (!desc) return alert('נא להזין תיאור');

  await addDoc(tasksColRef, {
    desc,
    duration,
    type,
    recurring,
    completed: false,
    createdAt: serverTimestamp(),
  });

  document.getElementById('new-task-desc').value = '';
  document.getElementById('new-task-duration').value = '';
  document.getElementById('new-task-recurring').checked = false;
  toggleAddTask(); // Close form
}

async function toggleTaskDone(id, currentStatus) {
  const taskRef = doc(tasksColRef, id);
  await updateDoc(taskRef, { completed: !currentStatus });
}

async function deleteTask(id) {
  if (!window.confirm('למחוק?')) return;
  await deleteDoc(doc(tasksColRef, id));
}

function renderTaskList(tasks) {
  const container = document.getElementById('tasks-container');
  container.innerHTML = '';

  if (tasks.length === 0) {
    container.innerHTML = '<p class="text-xs text-gray-400 text-center py-4">אין משימות.</p>';
    return;
  }

  tasks.forEach((task) => {
    const div = document.createElement('div');
    div.className = `flex items-center justify-between bg-white p-2 rounded border border-gray-100 text-sm mb-1 ${task.completed ? 'bg-gray-50' : ''}`;

    const recIcon = task.recurring ? '🔁' : '';
    const typeIcon = task.type === 'long' ? '📅' : '⏱️';
    const doneClass = task.completed ? 'task-done' : 'font-bold text-gray-900';

    div.innerHTML = `
      <div class="flex items-center gap-2 f overflow-hidden">
        <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTaskDone('${task.id}', ${task.completed})" class="w-4 h-4 cursor-pointer">
        <div class="flex-grow">
          <div class="${doneClass} truncate">${recIcon} ${task.desc}</div>
          <div class="text-[10px] text-gray-500">${typeIcon} ${task.duration || ''}</div>
        </div>
      </div>
      <button onclick="deleteTask('${task.id}')" class="text-gray-300 hover:text-red-400 px-2">✕</button>
    `;
    container.appendChild(div);
  });
}

function toggleAddTask() {
  const form = document.getElementById('add-task-form');
  form.classList.toggle('hidden');
}

// --- PLANNER LOGIC ---
async function generateSchedule(timeframe) {
  const btnId = timeframe === 'today'
    ? 'btn-gen-today'
    : timeframe === 'tomorrow'
      ? 'btn-gen-tomorrow'
      : 'btn-gen-week';
  const btn = document.getElementById(btnId);
  const originalText = btn.innerHTML;
  btn.innerHTML = '<span class="loading-dots">..</span>';

  // Get open tasks
  const q = query(tasksColRef, where('completed', '==', false));
  const snapshot = await getDocs(q);
  const tasks = [];
  snapshot.forEach((d) => tasks.push(d.data()));

  if (tasks.length === 0) {
    alert('כל המשימות הושלמו! הוסף משימות חדשות כדי לתכנן.');
    btn.innerHTML = originalText;
    return;
  }

  const taskListString = tasks.map((t) => `- ${t.desc} [${t.type}, ${t.recurring ? 'RECURRING' : 'ONCE'}]`).join('\n');
  const typeForPrompt = currentResultType;
  const context = currentMode === 'now'
    ? `Current status: ${currentResultType}`
    : `Base chronotype: ${currentResultType}`;

  const prompt = `
    Act as a Chronobiology Coach.
    User: "${typeForPrompt}" (${context}).
    Goal: Plan for ${timeframe}.
    
    Tasks:
    ${taskListString}
    
    Rules:
    - Lion: Mornings.
    - Bear: 10am-2pm.
    - Wolf: Evening.
    - Dolphin: Short bursts.
    - RECURRING tasks: Suggest habit stacking.
    
    Output: Hebrew. HTML bullet points.
  `;

  try {
    const response = await callGeminiAPI(prompt);
    const htmlContent = marked.parse(response);
    document.getElementById('ai-response-text').innerHTML = htmlContent;
    document.getElementById('ai-response-container').classList.remove('hidden');
  } catch (error) {
    console.error(error);
    alert('שגיאה בתקשורת');
  } finally {
    btn.innerHTML = originalText;
  }
}

async function saveCurrentPlan() {
  const content = document.getElementById('ai-response-text').innerHTML;
  if (!content) return;
  await addDoc(plansColRef, {
    html: content,
    createdAt: serverTimestamp(),
  });
  alert('התוכנית נשמרה בהצלחה!');
}

async function loadLastPlan() {
  const q = query(plansColRef, orderBy('createdAt', 'desc'), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) {
    alert('לא נמצאה תוכנית שמורה');
    return;
  }

  const plan = snap.docs[0].data();
  document.getElementById('ai-response-text').innerHTML = plan.html;
  document.getElementById('ai-response-container').classList.remove('hidden');
}

function closeAIResult() {
  document.getElementById('ai-response-container').classList.add('hidden');
}

async function callGeminiAPI(prompt) {
  // Check for API Key
  if (!apiKey) {
    alert('חסר מפתח API. אם אתה ב-GitHub, נא להוסיף אותו בקובץ ה-HTML.');
    return 'Error: No API Key';
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function registerHandlers() {
  window.goBack = goBack;
  window.handleLogout = handleLogout;
  window.handleLogin = handleLogin;
  window.startQuiz = startQuiz;
  window.answer = answer;
  window.showStatusResult = showStatusResult;
  window.goHome = goHome;
  window.loadLastPlan = loadLastPlan;
  window.toggleAddTask = toggleAddTask;
  window.addTask = addTask;
  window.generateSchedule = generateSchedule;
  window.saveCurrentPlan = saveCurrentPlan;
  window.closeAIResult = closeAIResult;
  window.toggleTaskDone = toggleTaskDone;
  window.deleteTask = deleteTask;
}

export function initApp() {
  if (appInitialized) return;
  appInitialized = true;
  registerHandlers();
  initFirebase();
}
