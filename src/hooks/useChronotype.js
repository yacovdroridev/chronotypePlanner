

export const CHRONOTYPES = {
    lion: { title: 'אריה 🦁', name: 'אריה', desc: 'משכימי קום, חדים בבוקר.', power: 'עבודה עמוקה בבוקר.', class: 'bg-orange-100/50' },
    bear: { title: 'דוב 🐻', name: 'דוב', desc: 'אנרגיה יציבה בשעות האור.', power: 'שיא: 10:00-14:00.', class: 'bg-amber-100/50' },
    wolf: { title: 'זאב 🐺', name: 'זאב', desc: 'חיות לילה. בוקר איטי.', power: 'יצירתיות בערב.', class: 'bg-indigo-100/50' },
    dolphin: { title: 'דולפין 🐬', name: 'דולפין', desc: 'שנה קלה, מוח פעיל.', power: 'עבודה בספרינטים.', class: 'bg-blue-100/50' },
};

export const STATUS_TYPES = {
    lion: { title: 'מצב אריה (פוקוס) 🦁', desc: 'חדות שיא. לטרוף.', power: 'תקוף את המשימה הקשה.', class: 'bg-orange-100/50' },
    bear: { title: 'מצב דוב (יציבות) 🐻', desc: 'אנרגיה מאוזנת.', power: 'זמן לביצוע שוטף.', class: 'bg-amber-100/50' },
    wolf: { title: 'מצב זאב (יצירה) 🐺', desc: 'ראש יצירתי ומעופף.', power: 'סיעור מוחות.', class: 'bg-indigo-100/50' },
    dolphin: { title: 'מצב דולפין (הצפה) 🐬', desc: 'עומס ופיזור.', power: 'עצור! תרגיל נשימה.', class: 'bg-blue-100/50' },
};

export const QUESTIONS = [
    {
        text: 'בחופש מוחלט, מתי תתעורר/י?',
        options: [
            { type: 'lion', text: 'לפני 06:30 בבוקר', icon: '🌅' },
            { type: 'bear', text: 'בין 07:00 ל-09:00', icon: '☀️' },
            { type: 'wolf', text: 'אחרי 10:00 או בצהריים', icon: '🌙' },
            { type: 'dolphin', text: 'שינה קלה / נדודי שינה', icon: '👀' },
        ]
    },
    {
        text: 'מתי הריכוז שלך בשיא?',
        options: [
            { type: 'lion', text: 'מוקדם בבוקר', icon: '🦁' },
            { type: 'bear', text: 'בוקר מאוחר עד צהריים', icon: '🐻' },
            { type: 'wolf', text: 'ערב או לילה', icon: '🐺' },
            { type: 'dolphin', text: 'משתנה / פרצי אנרגיה', icon: '🐬' },
        ]
    },
    {
        text: 'בילויים עד מאוחר?',
        options: [
            { type: 'lion', text: 'עייף/ה ב-21:00', icon: '😴' },
            { type: 'bear', text: 'סבבה, אבל בחצות לישון', icon: '😌' },
            { type: 'wolf', text: 'רק ב-22:00 אני מתעורר/ת!', icon: '🔥' },
            { type: 'dolphin', text: 'מלחיץ / מעייף נפשית', icon: '🤯' },
        ]
    }
];

export const STATUS_OPTIONS = [
    { type: 'lion', title: 'חד, ממוקד וחזק', desc: 'שיא האנרגיה - זה הזמן לטרוף', border: 'border-orange-100', text: 'text-orange-800' },
    { type: 'bear', title: 'יציב וחברותי', desc: 'אנרגיה טובה ומאוזנת', border: 'border-amber-100', text: 'text-amber-800' },
    { type: 'wolf', title: 'יצירתי אך מעורפל', desc: 'ראש פתוח, פחות פוקוס על פרטים', border: 'border-indigo-100', text: 'text-indigo-800' },
    { type: 'dolphin', title: 'לחוץ / עייף / מוצף', desc: 'זקוק להפסקה או ארגון מחדש', border: 'border-blue-100', text: 'text-blue-800' },
];

export const calculateWinner = (history) => {
    const counts = { lion: 0, bear: 0, wolf: 0, dolphin: 0 };
    history.forEach(a => counts[a] += 1);

    let winner = 'bear';
    let maxVal = -1;
    Object.entries(counts).forEach(([key, val]) => {
        if (val > maxVal) {
            maxVal = val;
            winner = key;
        }
    });
    return winner;
};
