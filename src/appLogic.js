import { createClient } from '@supabase/supabase-js';
import { marked } from 'marked';

const supabaseUrl = 'https://mtbwpweisvrvpwckkwaq.supabase.co';
const supabaseAnonKey = 'sb_publishable_oLyhvM3VOylqTHR3iAuMwg_E183UkPx';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- CONSTANTS & STATE ---
let apiKey = '';
let userId = null;
let userData = null;
let answerHistory = [];
let currentMode = 'base';
let currentResultType = 'bear';
let tasksChannel = null;
let appInitialized = false;

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

// --- SUPABASE INIT ---
async function initSupabase() {
  const { data: sessionData } = await supabase.auth.getSession();
  await handleSession(sessionData?.session || null);

  supabase.auth.onAuthStateChange(async (_event, session) => {
    await handleSession(session);
  });
}

async function handleSession(session) {
  if (!session?.user) {
    userId = null;
    showScreen('screen-login');
    document.getElementById('screen-loading').classList.add('hidden');
    return;
  }

  userId = session.user.id;
  await ensureProfileFromMetadata(session.user);
  await checkUserProfile();
}

async function ensureProfileFromMetadata(user) {
  const metaName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email;
  if (!metaName) return;
  await supabase.from('profiles').upsert(
    { id: user.id, name: metaName },
    { onConflict: 'id' }
  );
}

async function checkUserProfile() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, base_chronotype')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    document.getElementById('screen-loading').classList.add('hidden');

    if (data?.name && data?.base_chronotype) {
      userData = { name: data.name, baseChronotype: data.base_chronotype };
      showHub(userData);
    } else if (data?.name) {
      userData = { name: data.name };
      showIntroQuiz(data.name);
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
  const email = document.getElementById('email-input').value.trim();
  const password = document.getElementById('password-input').value;

  if (!name || !email || !password) {
    alert('נא להזין שם, אימייל וסיסמה');
    return;
  }

  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (signInError) {
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      alert(signUpError.message);
      return;
    }

    if (!signUpData?.session) {
      alert('נשלחה הודעת אימות לאימייל. אשר אותה ואז התחבר.');
      return;
    }
  }

  const session = signInData?.session || (await supabase.auth.getSession()).data.session;
  if (!session?.user) {
    alert('התחברות נכשלה. נסה שוב.');
    return;
  }

  userId = session.user.id;
  await supabase.from('profiles').upsert(
    { id: userId, name },
    { onConflict: 'id' }
  );

  await checkUserProfile();
}

async function loginWithProvider(provider) {
  const basePath = window.location.pathname.includes('/chronotypePlanner') ? '/chronotypePlanner/' : '/';
  const redirectTo = window.location.origin + basePath;
  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  });
  if (error) alert(error.message);
}

async function handleLogout() {
  if (window.confirm('האם אתה בטוח שברצונך להתנתק? המידע המקומי ינוקה.')) {
    if (tasksChannel) {
      await supabase.removeChannel(tasksChannel);
      tasksChannel = null;
    }
    await supabase.auth.signOut();
    window.location.reload();
  }
}

async function saveUserBaseType(type) {
  await supabase.from('profiles').upsert(
    { id: userId, base_chronotype: type },
    { onConflict: 'id' }
  );
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

  subscribeToTasks(false);
  showScreen('screen-result');
}

// --- TASKS LOGIC (SUPABASE) ---
async function refreshTasks(statsOnly) {
  if (!userId) return;
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Tasks Error:', error);
    return;
  }

  let doneCount = 0;
  data.forEach((t) => {
    if (t.completed) doneCount += 1;
  });

  if (statsOnly) {
    document.getElementById('stat-tasks-count').innerText = data.length - doneCount;
    document.getElementById('stat-tasks-done').innerText = doneCount;
  } else {
    renderTaskList(data);
  }
}

async function subscribeToTasks(statsOnly) {
  await refreshTasks(statsOnly);

  if (tasksChannel) {
    await supabase.removeChannel(tasksChannel);
    tasksChannel = null;
  }

  tasksChannel = supabase
    .channel(`tasks-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${userId}` },
      async () => {
        await refreshTasks(statsOnly);
      }
    )
    .subscribe();
}

async function addTask() {
  const desc = document.getElementById('new-task-desc').value.trim();
  const duration = document.getElementById('new-task-duration').value.trim();
  const type = document.getElementById('new-task-type').value;
  const recurring = document.getElementById('new-task-recurring').checked;

  if (!desc) return alert('נא להזין תיאור');

  const { error } = await supabase.from('tasks').insert({
    user_id: userId,
    desc,
    duration,
    type,
    recurring,
    completed: false,
  });

  if (error) {
    alert('שגיאה בשמירת משימה');
    return;
  }

  document.getElementById('new-task-desc').value = '';
  document.getElementById('new-task-duration').value = '';
  document.getElementById('new-task-recurring').checked = false;
  toggleAddTask();
}

async function toggleTaskDone(id, currentStatus) {
  await supabase
    .from('tasks')
    .update({ completed: !currentStatus })
    .eq('id', id)
    .eq('user_id', userId);
}

async function deleteTask(id) {
  if (!window.confirm('למחוק?')) return;
  await supabase
    .from('tasks')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
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

  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .eq('completed', false);

  if (error) {
    btn.innerHTML = originalText;
    alert('שגיאה בשליפת משימות');
    return;
  }

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
  await supabase.from('plans').insert({
    user_id: userId,
    html: content,
  });
  alert('התוכנית נשמרה בהצלחה!');
}

async function loadLastPlan() {
  const { data, error } = await supabase
    .from('plans')
    .select('html, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (error) {
    alert('שגיאה בטעינת תוכנית');
    return;
  }

  if (!data || data.length === 0) {
    alert('לא נמצאה תוכנית שמורה');
    return;
  }

  document.getElementById('ai-response-text').innerHTML = data[0].html;
  document.getElementById('ai-response-container').classList.remove('hidden');
}

function closeAIResult() {
  document.getElementById('ai-response-container').classList.add('hidden');
}

async function callGeminiAPI(prompt) {
  if (!apiKey) {
    alert('חסר מפתח API. נא להוסיף אותו בקובץ appLogic.js.');
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
  window.loginWithGoogle = () => loginWithProvider('google');
  window.loginWithGithub = () => loginWithProvider('github');
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
  initSupabase();
}
