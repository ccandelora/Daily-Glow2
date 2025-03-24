import React, { createContext, useContext, useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { AchievementUnlock } from './AchievementUnlock';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useBadges } from '@/contexts/BadgeContext';
import theme from '@/constants/theme';

/**
 * @deprecated This component is deprecated. Use NotificationsContext from '@/contexts/NotificationsContext' instead.
 */

// Types for notification data
type NotificationType = 'achievement' | 'badge';

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  type: NotificationType;
  points?: number;
}

// Context for managing notifications
interface NotificationContextType {
  showAchievementNotification: (achievementId: string) => void;
  showBadgeNotification: (badgeName: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * @deprecated This hook is deprecated. Use useNotifications from '@/contexts/NotificationsContext' instead.
 */
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    // Instead of throwing, return an object with stub functions
    console.warn('useNotifications from AchievementNotificationManager is deprecated. Use NotificationsContext instead.');
    return {
      showAchievementNotification: (id: string) => console.log('Achievement notification stub called:', id),
      showBadgeNotification: (name: string) => console.log('Badge notification stub called:', name)
    };
  }
  return context;
};

// Helper function to get badge icon based on category
const getBadgeIcon = (badge: any): string => {
  // Default icons based on badge category
  if (!badge || !badge.category) return 'trophy';
  
  const categoryToIcon: Record<string, string> = {
    'CONSISTENCY': 'repeat',
    'STREAK': 'calendar-check',
    'COMPLETION': 'check-circle',
    'EMOTION': 'heart',
    'MOOD_PATTERNS': 'chart-line',
    'JOURNAL_FREQUENCY': 'book',
  };
  
  return badge.icon_name || categoryToIcon[badge.category.toUpperCase()] || 'award';
};

// Get appropriate color based on achievement/badge type
const getItemColor = (item: any, type: NotificationType): string => {
  if (!item) return theme.COLORS.primary.teal;
  
  if (type === 'achievement') {
    return theme.COLORS.primary.teal;
  }
  
  // For badges, color based on category
  const categoryColors: Record<string, string> = {
    'CONSISTENCY': theme.COLORS.primary.green,
    'STREAK': theme.COLORS.primary.blue,
    'COMPLETION': theme.COLORS.primary.teal,
    'EMOTION': theme.COLORS.primary.purple,
    'MOOD_PATTERNS': theme.COLORS.primary.orange,
    'JOURNAL_FREQUENCY': theme.COLORS.primary.yellow,
  };
  
  return item.category && categoryColors[item.category.toUpperCase()] || theme.COLORS.primary.green;
};

interface NotificationData {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  type: 'achievement' | 'badge';
}

/**
 * @deprecated This component is deprecated. Use NotificationsProvider from '@/contexts/NotificationsContext' instead.
 */
const NotificationProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { achievements } = useAchievements();
  const { badges } = useBadges();
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [visible, setVisible] = useState(false);
  const [queue, setQueue] = useState<NotificationData[]>([]);

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
    const achievement = achievements.find(a => a.id === achievementId);
    
    if (achievement) {
      const newNotification: NotificationData = {
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
    const badge = badges.find(b => b.name === badgeName);
    
    if (badge) {
      const newNotification: NotificationData = {
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

  return (
    <NotificationContext.Provider value={{ showAchievementNotification, showBadgeNotification }}>
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
    </NotificationContext.Provider>
  );
};

const styles = StyleSheet.create({
  notificationContainer: {
    position: 'absolute',
    top: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
});

export default NotificationProvider; 