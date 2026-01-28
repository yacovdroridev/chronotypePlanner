import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const useTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Keep reference to previous tasks for rollback
    const previousTasksRef = useRef([]);

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        setError(null);
        const { data, error: fetchError } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!fetchError && data) {
            setTasks(data);
            previousTasksRef.current = data;
        } else if (fetchError) {
            setError('שגיאה בטעינת משימות');
        }
        setLoading(false);
    }, [user]);

    useEffect(() => {
        fetchTasks();

        if (!user) return;

        const channel = supabase
            .channel(`tasks-${user.id}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'tasks', filter: `user_id=eq.${user.id}` },
                () => {
                    fetchTasks();
                }
            )
            .subscribe();

        // Proper cleanup
        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchTasks]);

    const addTask = async (taskData) => {
        if (!user) return;
        setError(null);
        
        // Optimistic add with temp ID
        const tempId = `temp-${Date.now()}`;
        const optimisticTask = {
            id: tempId,
            user_id: user.id,
            completed: false,
            created_at: new Date().toISOString(),
            ...taskData
        };
        
        setTasks(prev => {
            previousTasksRef.current = prev;
            return [optimisticTask, ...prev];
        });

        const { data, error: addError } = await supabase.from('tasks').insert({
            user_id: user.id,
            completed: false,
            ...taskData
        }).select().single();

        if (addError) {
            // Rollback
            setTasks(previousTasksRef.current);
            setError('שגיאה בהוספת משימה: ' + addError.message);
        } else if (data) {
            // Replace temp with real
            setTasks(prev => prev.map(t => t.id === tempId ? data : t));
        }
    };

    const toggleTask = async (id, currentStatus) => {
        setError(null);
        
        // Save for rollback
        setTasks(prev => {
            previousTasksRef.current = prev;
            return prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t);
        });

        const { error: updateError } = await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
        if (updateError) {
            // Rollback
            setTasks(previousTasksRef.current);
            setError('שגיאה בעדכון משימה');
        }
    };

    const deleteTask = async (id) => {
        setError(null);
        
        // Save for rollback
        setTasks(prev => {
            previousTasksRef.current = prev;
            return prev.filter(t => t.id !== id);
        });

        const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);
        if (deleteError) {
            // Rollback
            setTasks(previousTasksRef.current);
            setError('שגיאה במחיקת משימה');
        }
    };

    const clearError = () => setError(null);

    return { tasks, loading, error, addTask, toggleTask, deleteTask, clearError };
};

export default useTasks;
