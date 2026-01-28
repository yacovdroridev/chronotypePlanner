import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Current session check
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setUser(session?.user ?? null);
                // Don't block loading for profile fetch
                if (session?.user) {
                    fetchProfile(session.user.id).catch(console.error);
                }
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Session check error:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        checkSession();

        // Listen for changes
        const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
            try {
                setUser(session?.user ?? null);
                if (session?.user) {
                    // Don't block UI updates for profile fetch
                    fetchProfile(session.user.id).catch(console.error);
                } else {
                    setUserData(null);
                }
                setLoading(false);
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('Auth state change error:', error);
                }
                setLoading(false);
            }
        });

        return () => {
            listener?.subscription.unsubscribe();
        };
    }, []);

    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (!error && data) {
                setUserData(data);
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
        }
    };

    const value = {
        user,
        userData,
        loading,
        fetchProfile, // Expose to manually refresh if needed
        signOut: () => supabase.auth.signOut(),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
