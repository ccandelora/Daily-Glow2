import React from 'react';
import { View, ScrollView, StyleSheet, Animated } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const StreaksTab = () => {
  const { streaks } = useCheckInStreak();
  
  // Animation values
  const fadeIn = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.timing(fadeIn, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const getStreakIcon = (period: string) => {
    switch (period) {
      case 'morning':
        return 'sunny-outline';
      case 'afternoon':
        return 'partly-sunny-outline';
      case 'evening':
        return 'moon-outline';
      default:
        return 'time-outline';
    }
  };

  const getStreakColor = (period: string) => {
    switch (period) {
      case 'morning':
        return theme.COLORS.primary.yellow;
      case 'afternoon':
        return theme.COLORS.primary.orange;
      case 'evening':
        return theme.COLORS.primary.purple;
      default:
        return theme.COLORS.ui.accent;
    }
  };

  const getStreakTitle = (period: string) => {
    switch (period) {
      case 'morning':
        return 'Morning Streak';
      case 'afternoon':
        return 'Afternoon Streak';
      case 'evening':
        return 'Evening Streak';
      default:
        return 'Streak';
    }
  };

  const getStreakDescription = (period: string, count: number) => {
    if (count === 0) {
      return `Start your ${period} streak by checking in during the ${period}!`;
    } else if (count === 1) {
      return `You've checked in during the ${period} once. Keep it up!`;
    } else {
      return `You've checked in during the ${period} ${count} days in a row!`;
    }
  };

  const renderStreakCard = (period: 'morning' | 'afternoon' | 'evening') => {
    const count = streaks[period];
    const color = getStreakColor(period);
    const icon = getStreakIcon(period);
    const title = getStreakTitle(period);
    const description = getStreakDescription(period, count);
    
    return (
      <Card 
        key={period} 
        style={styles.streakCard}
        variant={count > 0 ? "glow" : "default"}
      >
        <View style={styles.streakHeader}>
          <View 
            style={[
              styles.iconContainer, 
              {
                backgroundColor: count > 0 ? `${color}20` : 'rgba(120, 120, 120, 0.1)',
                borderColor: count > 0 ? color : 'rgba(120, 120, 120, 0.2)',
              }
            ]}
          >
            <Ionicons 
              name={icon as any} 
              size={24} 
              color={count > 0 ? color : 'rgba(120, 120, 120, 0.5)'} 
            />
          </View>
          <View style={styles.streakInfo}>
            <Typography 
              variant="h3" 
              style={styles.streakTitle}
              color={count > 0 ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
              glow={count > 0 ? "medium" : "none"}
            >
              {title}
            </Typography>
            <Typography 
              variant="body" 
              style={styles.streakDescription}
              color={count > 0 ? theme.COLORS.ui.textSecondary : 'rgba(120, 120, 120, 0.6)'}
            >
              {description}
            </Typography>
          </View>
        </View>
        <View style={styles.streakFooter}>
          <Typography 
            variant="h1" 
            style={styles.streakCount}
            color={count > 0 ? color : 'rgba(120, 120, 120, 0.5)'}
            glow={count > 0 ? "medium" : "none"}
          >
            {count}
          </Typography>
          <Typography 
            variant="caption"
            color={count > 0 ? theme.COLORS.ui.textSecondary : 'rgba(120, 120, 120, 0.5)'}
          >
            {count === 1 ? 'day' : 'days'}
          </Typography>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeIn }]}>
        {renderStreakCard('morning')}
        {renderStreakCard('afternoon')}
        {renderStreakCard('evening')}
        
        <Card style={styles.tipsCard} variant="default">
          <Typography variant="h3" style={styles.tipsTitle} glow="soft">
            Tips for Building Streaks
          </Typography>
          <View style={styles.tipItem}>
            <Ionicons name="time-outline" size={20} color={theme.COLORS.ui.accent} style={styles.tipIcon} />
            <Typography variant="body" style={styles.tipText}>
              Check in consistently during the same time period each day
            </Typography>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="notifications-outline" size={20} color={theme.COLORS.ui.accent} style={styles.tipIcon} />
            <Typography variant="body" style={styles.tipText}>
              Set a reminder to help you remember your daily check-in
            </Typography>
          </View>
          <View style={styles.tipItem}>
            <Ionicons name="calendar-outline" size={20} color={theme.COLORS.ui.accent} style={styles.tipIcon} />
            <Typography variant="body" style={styles.tipText}>
              Don't break the chain! Try to maintain your streak every day
            </Typography>
          </View>
        </Card>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    padding: theme.SPACING.lg,
  },
  streakCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  streakHeader: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: theme.SPACING.md,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    marginBottom: theme.SPACING.xs,
  },
  streakDescription: {
    fontSize: 14,
  },
  streakFooter: {
    alignItems: 'center',
    marginTop: theme.SPACING.md,
  },
  streakCount: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  tipsCard: {
    marginTop: theme.SPACING.lg,
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.7)',
  },
  tipsTitle: {
    marginBottom: theme.SPACING.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  tipIcon: {
    marginRight: theme.SPACING.md,
  },
  tipText: {
    flex: 1,
    color: theme.COLORS.ui.textSecondary,
  },
}); 