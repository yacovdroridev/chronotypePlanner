import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../utils/supabaseClient';
import { useAuth } from '../context/AuthContext';

const useTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchTasks = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await supabase
            .from('tasks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (!error && data) {
            setTasks(data);
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

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchTasks]);

    const addTask = async (taskData) => {
        if (!user) return;
        const { data, error } = await supabase.from('tasks').insert({
            user_id: user.id,
            completed: false,
            ...taskData
        }).select().single();

        if (error) {
            alert('Error adding task: ' + error.message);
        } else if (data) {
            setTasks(prev => [data, ...prev]);
        }
    };

    const toggleTask = async (id, currentStatus) => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !currentStatus } : t));

        const { error } = await supabase.from('tasks').update({ completed: !currentStatus }).eq('id', id);
        if (error) {
            // Revert if error
            setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: currentStatus } : t));
            alert('Error updating task');
        }
    };

    const deleteTask = async (id) => {
        if (!window.confirm('Delete this task?')) return;

        // Optimistic update
        setTasks(prev => prev.filter(t => t.id !== id));

        const { error } = await supabase.from('tasks').delete().eq('id', id);
        if (error) {
            // Revert (this is harder without keeping previous, but generally okay for delete)
            // We'd ideally fetch again
            fetchTasks();
            alert('Error deleting task');
        }
    };

    return { tasks, loading, addTask, toggleTask, deleteTask };
};

export default useTasks;
