import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Notification } from '../types/database';

export function useNotifications(userId: string | undefined) {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const fetch = async () => {
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      setNotifs(data ?? []);
      setLoading(false);
    };
    fetch();

    const channel = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, payload => {
        setNotifs(ns => [payload.new as Notification, ...ns]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const markRead = async (id: string) => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: true } : n));
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  };

  const markAllRead = async () => {
    setNotifs(ns => ns.map(n => ({ ...n, read: true })));
    if (userId) {
      await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
    }
  };

  return { notifs, loading, markRead, markAllRead };
}
