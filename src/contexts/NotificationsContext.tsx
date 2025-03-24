import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAppState } from './AppStateContext';
import { useAuth } from './AuthContext';
import { supabase } from '@/lib/supabase';
import { AchievementUnlock } from '@/components/achievements/AchievementUnlock';
import { useAchievements } from './AchievementsContext';
import { useBadges } from './BadgeContext';
import theme from '@/constants/theme';

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

// Add notification display types
interface NotificationDisplayData {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  type: 'achievement' | 'badge';
}

interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  userBadges: UserBadge[];
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  showAchievementNotification: (achievementId: string) => void;
  showBadgeNotification: (badgeName: string) => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const { setLoading, showError } = useAppState();
  const { session } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  // Add state for achievement notifications
  const [notification, setNotification] = useState<NotificationDisplayData | null>(null);
  const [visible, setVisible] = useState(false);
  const [queue, setQueue] = useState<NotificationDisplayData[]>([]);
  
  // Get achievements and badges
  let achievements: any[] = [];
  let badges: any[] = [];
  
  try {
    const achievementsContext = useAchievements();
    if (achievementsContext) {
      achievements = achievementsContext.achievements;
    }
  } catch (error) {
    console.log('AchievementsContext not available in NotificationsProvider');
  }
  
  try {
    const badgesContext = useBadges();
    if (badgesContext) {
      badges = badgesContext.badges;
    }
  } catch (error) {
    console.log('BadgesContext not available in NotificationsProvider');
  }

  useEffect(() => {
    let cleanupFunction = () => {};
    
    try {
      if (session?.user) {
        // Load data first
        loadNotifications().catch(err => {
          console.error('Error loading notifications:', err);
        });
        
        loadUserBadges().catch(err => {
          console.error('Error loading user badges:', err);
        });
        
        // Then set up subscription
        if (!isSubscribed) {
          cleanupFunction = subscribeToNotifications();
          setIsSubscribed(true);
        }
      }
    } catch (error) {
      console.error('Error in NotificationsProvider useEffect:', error);
    }
    
    // Return cleanup function
    return () => {
      try {
        cleanupFunction();
        setIsSubscribed(false);
      } catch (error) {
        console.error('Error in NotificationsProvider cleanup:', error);
      }
    };
  }, [session]);

  const subscribeToNotifications = () => {
    try {
      // Defensive check for supabase client
      if (!supabase) {
        console.warn('Supabase client not available - skipping notification subscription');
        return () => {};
      }
      
      // Check if channel method exists on supabase
      if (!supabase.channel || typeof supabase.channel !== 'function') {
        console.warn('Supabase channel feature not available - skipping notification subscription');
        return () => {}; // Return empty cleanup function
      }
      
      // Check if user is available
      if (!session?.user?.id) {
        console.warn('User ID not available - skipping notification subscription');
        return () => {};
      }
      
      try {
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
              try {
                setNotifications(prev => [payload.new as Notification, ...prev]);
              } catch (error) {
                console.error('Error handling notification payload:', error);
              }
            }
          )
          .subscribe((status) => {
            console.log(`Notification subscription status: ${status}`);
          });

        return () => {
          try {
            if (notificationsSubscription && supabase.removeChannel && typeof supabase.removeChannel === 'function') {
              supabase.removeChannel(notificationsSubscription);
              console.log('Notification subscription removed');
            }
          } catch (error) {
            console.error('Error removing notification channel:', error);
          }
        };
      } catch (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        return () => {};
      }
    } catch (error) {
      console.error('Error in subscribeToNotifications:', error);
      return () => {}; // Return empty cleanup function
    }
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

      // Even if there's an error, don't show it to the user or log it
      // Just set empty user badges if there's an error
      const typedData = (data || []) as unknown as UserBadge[];
      setUserBadges(typedData);
    } catch (e) {
      // Silently handle any errors
      setUserBadges([]);
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

  // Display handling for achievements and badges
  useEffect(() => {
    // Check if there's notifications in the queue and none being displayed
    if (queue.length > 0 && !visible) {
      // Display the next notification in the queue
      setNotification(queue[0]);
      setVisible(true);
      // Remove the notification from the queue
      setQueue(prev => prev.slice(1));
    }
  }, [queue, visible]);

  // Handle showing achievement notifications
  const showAchievementNotification = (achievementId: string) => {
    const achievement = achievements.find((a: any) => a.id === achievementId);
    
    if (achievement) {
      const newNotification: NotificationDisplayData = {
        title: achievement.name,
        description: achievement.description,
        icon: achievement.icon_name || 'trophy',
        iconColor: theme.COLORS.primary.teal,
        type: 'achievement'
      };
      
      // If already showing a notification, add to queue
      if (visible) {
        setQueue(prev => [...prev, newNotification]);
      } else {
        // Show immediately
        setNotification(newNotification);
        setVisible(true);
      }
    }
  };
  
  // Handle showing badge notifications
  const showBadgeNotification = (badgeName: string) => {
    const badge = badges.find((b: any) => b.name === badgeName);
    
    if (badge) {
      const newNotification: NotificationDisplayData = {
        title: badge.name,
        description: badge.description,
        icon: badge.icon_name || 'award',
        iconColor: badge.category === 'consistency' 
          ? theme.COLORS.primary.green 
          : theme.COLORS.primary.orange,
        type: 'badge'
      };
      
      // If already showing a notification, add to queue
      if (visible) {
        setQueue(prev => [...prev, newNotification]);
      } else {
        // Show immediately
        setNotification(newNotification);
        setVisible(true);
      }
    }
  };
  
  // Handle completion of notification animation
  const handleAnimationComplete = () => {
    setVisible(false);
    setNotification(null);
  };

  const value = {
    notifications,
    unreadCount,
    userBadges,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    refreshNotifications,
    showAchievementNotification,
    showBadgeNotification
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
      
      {notification && (
        <AchievementUnlock
          title={notification.title}
          description={notification.description}
          icon={notification.icon}
          iconColor={notification.iconColor}
          type={notification.type}
          visible={visible}
          onAnimationComplete={handleAnimationComplete}
        />
      )}
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