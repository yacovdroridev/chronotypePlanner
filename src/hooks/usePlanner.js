import { useState, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { withTimeout, retryWithBackoff } from '../utils/fetchWithTimeout';

// Rate limiting: max 10 plans per hour
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const API_TIMEOUT_MS = 30000; // 30 seconds for AI generation

const usePlanner = () => {
    const { user } = useAuth();
    const [planHtml, setPlanHtml] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    
    // Rate limiting state
    const generationTimestamps = useRef([]);

    const clearMessages = () => {
        setError(null);
        setSuccess(null);
    };

    const checkRateLimit = () => {
        const now = Date.now();
        // Remove timestamps older than the rate window
        generationTimestamps.current = generationTimestamps.current.filter(
            ts => now - ts < RATE_WINDOW_MS
        );
        
        if (generationTimestamps.current.length >= RATE_LIMIT) {
            return false;
        }
        
        generationTimestamps.current.push(now);
        return true;
    };

    const generateSchedule = async (timeframe, tasks, chronotype, currentMode) => {
        setError(null);
        setSuccess(null);
        
        // Check rate limit
        if (!checkRateLimit()) {
            setError('הגעת למגבלת יצירת תוכניות (10 בשעה). נסה שוב מאוחר יותר.');
            return;
        }
        
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

            // Fetch with timeout (30s) and retry (3 attempts with exponential backoff)
            const data = await retryWithBackoff(async () => {
                const response = await withTimeout(
                    fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                    }),
                    API_TIMEOUT_MS
                );
                const json = await response.json();
                if (json.error) throw new Error(json.error.message);
                return json;
            }, 3, 1000);

            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response from AI');
            }

            const text = data.candidates[0].content.parts[0].text;
            // Sanitize HTML to prevent XSS
            const html = DOMPurify.sanitize(marked.parse(text));
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
