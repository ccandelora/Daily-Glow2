import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'streak' | 'entries' | 'challenges' | 'special';
  requirement_count: number;
  points: number;
}

interface UserBadge {
  id: string;
  badge_id: string;
  unlocked_at: string;
  badge: Badge;
}

interface Notification {
  id: string;
  type: 'achievement' | 'badge' | 'streak' | 'reminder';
  title: string;
  message: string;
  metadata: Record<string, any>;
  read: boolean;
  created_at: string;
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  userBadges: UserBadge[];
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const { setLoading, showError } = useAppState();
  const { session } = useAuth();

  useEffect(() => {
    if (session?.user) {
      loadNotifications();
      loadUserBadges();
      subscribeToNotifications();
    }
  }, [session]);

  const subscribeToNotifications = () => {
    const notificationsSubscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${session?.user?.id}`,
        },
        (payload) => {
          setNotifications(prev => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  };

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session?.user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load notifications');
    }
  };

  const loadUserBadges = async () => {
    try {
      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          id,
          badge_id,
          unlocked_at,
          badge:badges (
            id,
            name,
            description,
            icon,
            type,
            requirement_count,
            points
          )
        `)
        .eq('user_id', session?.user?.id)
        .order('unlocked_at', { ascending: false });

      if (error) throw error;
      
      // Type assertion to ensure the data matches our UserBadge interface
      const typedData = (data || []) as unknown as UserBadge[];
      setUserBadges(typedData);
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to load badges');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to mark notification as read');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', session?.user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to mark all notifications as read');
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)
        .eq('user_id', session?.user?.id);

      if (error) throw error;

      setNotifications(prev =>
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Failed to delete notification');
    } finally {
      setLoading(false);
    }
  };

  const refreshNotifications = async () => {
    await Promise.all([
      loadNotifications(),
      loadUserBadges(),
    ]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value = {
    notifications,
    unreadCount,
    userBadges,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
} 