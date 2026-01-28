import React, { useState } from 'react';
import { supabase } from '../../utils/supabaseClient';
import { withTimeout } from '../../utils/fetchWithTimeout';

const LoginScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(null);
        if (!name || !email || !password) {
            setError('נא להזין שם, אימייל וסיסמה');
            return;
        }
        setLoading(true);

        try {
            // Try to sign in first (with 5s timeout)
            const { error: signInError } = await withTimeout(
                supabase.auth.signInWithPassword({ email, password }),
                5000
            );

            if (signInError) {
                // If sign in fails, try to sign up (with 5s timeout)
                const { data: signUpData, error: signUpError } = await withTimeout(
                    supabase.auth.signUp({
                        email,
                        password,
                        options: { data: { full_name: name } }
                    }),
                    5000
                );

                if (signUpError) {
                    setError(signUpError.message);
                    setLoading(false);
                    return;
                }

                if (!signUpData?.session) {
                    setError('נשלחה הודעת אימות לאימייל. אנא אשר אותה כדי להתחבר.');
                    setLoading(false);
                    return;
                }
            }

            // On success (either login or signup)
            const session = (await supabase.auth.getSession()).data.session;
            if (session?.user) {
                await supabase.from('profiles').upsert(
                    { id: session.user.id, name },
                    { onConflict: 'id' }
                );
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const loginWithProvider = async (provider) => {
        setError(null);
        try {
            const { error: oauthError } = await withTimeout(
                supabase.auth.signInWithOAuth({
                    provider,
                    options: { redirectTo: window.location.origin }
                }),
                5000
            );
            if (oauthError) setError(oauthError.message);
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="text-center max-w-md mx-auto w-full">
            <div className="text-6xl mb-4">👋</div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">ברוכים הבאים</h1>
            <p className="text-gray-600 mb-6">הזן שם, אימייל וסיסמה כדי ליצור פרופיל או להתחבר</p>

            <form onSubmit={handleLogin} className="space-y-3">
                <input
                    type="text"
                    placeholder="השם שלך"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="w-full p-4 border rounded-xl text-center text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                    type="email"
                    placeholder="אימייל"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="w-full p-4 border rounded-xl text-center text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                    type="password"
                    placeholder="סיסמה"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full p-4 border rounded-xl text-center text-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                {error && (
                    <div
                        dir="rtl"
                        className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm"
                        role="alert"
                    >
                        {error}
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 transition shadow-lg disabled:opacity-50"
                >
                    {loading ? 'טוען...' : 'התחבר / צור משתמש 🚀'}
                </button>
            </form>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <button type="button" onClick={() => loginWithProvider('google')} className="w-full bg-white border border-gray-200 text-gray-700 text-sm py-2 rounded-lg font-bold hover:bg-gray-50">
                    Google
                </button>
                <button type="button" onClick={() => loginWithProvider('github')} className="w-full bg-white border border-gray-200 text-gray-700 text-sm py-2 rounded-lg font-bold hover:bg-gray-50">
                    GitHub
                </button>
            </div>
        </div>
    );
};

export default LoginScreen;
