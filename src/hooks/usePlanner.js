import { useState } from 'react';
import { marked } from 'marked';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const usePlanner = () => {
    const { user } = useAuth();
    const [planHtml, setPlanHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const generateSchedule = async (timeframe, tasks, chronotype, currentMode) => {
        setError(null);
        setSuccess(null);
        setLoading(true);
        const apiKey = process.env.REACT_APP_GEMINI_API_KEY;

        try {
            if (!apiKey) throw new Error('Missing API Key');

            const incompleteTasks = tasks.filter(t => !t.completed);
            if (incompleteTasks.length === 0) {
                setError('אין משימות לתכנון. הוסף משימות קודם.');
                setLoading(false);
                return;
            }

            const taskListString = incompleteTasks.map((t) => `- ${t.description} [${t.type}, ${t.recurring ? 'RECURRING' : 'ONCE'}]`).join('\n');
            const context = currentMode === 'now' // Assuming 'now' mode means using the Status result
                ? `Current status: ${chronotype.title}`
                : `Base chronotype: ${chronotype.title}`;

            const prompt = `
                Act as a Chronobiology Coach.
                User: "${chronotype.name}" (${context}).
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

            const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
            const payload = { contents: [{ parts: [{ text: prompt }] }] };

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await response.json();

            if (data.error) throw new Error(data.error.message);

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response from AI');
            }

            const text = data.candidates[0].content.parts[0].text;
            const html = marked.parse(text);
            setPlanHtml(html);

        } catch (err) {
            console.error('Planner Error:', err);
            setError('שגיאה ביצירת תוכנית: ' + (err.message || 'שגיאה לא ידועה'));
        } finally {
            setLoading(false);
        }
    };

    const savePlan = async () => {
        if (!user || !planHtml) return;
        setError(null);
        setSuccess(null);
        const { error: saveError } = await supabase.from('plans').insert({
            user_id: user.id,
            html: planHtml,
        });
        if (saveError) {
            setError('שגיאה בשמירת התוכנית');
        } else {
            setSuccess('התוכנית נשמרה בהצלחה!');
        }
    };

    const loadLastPlan = async () => {
        if (!user) return;
        setError(null);
        setSuccess(null);
        setLoading(true);
        const { data, error: loadError } = await supabase
            .from('plans')
            .select('html')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (!loadError && data && data.length > 0) {
            setPlanHtml(data[0].html);
        } else {
            setError('לא נמצאו תוכניות שמורות');
        }
        setLoading(false);
    };

    return {
        planHtml,
        loading,
        error,
        success,
        generateSchedule,
        savePlan,
        loadLastPlan,
        clearPlan: () => { setPlanHtml(''); clearMessages(); },
        clearMessages
    };
};

export default usePlanner;
