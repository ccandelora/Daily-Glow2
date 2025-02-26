import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';

export const StreakSummary = () => {
  const { streaks } = useCheckInStreak();
  
  const getTotalStreak = () => {
    return streaks.morning + streaks.afternoon + streaks.evening;
  };
  
  const getBestStreak = () => {
    const { morning, afternoon, evening } = streaks;
    const max = Math.max(morning, afternoon, evening);
    
    if (max === morning) {
      return { period: 'morning', count: morning, icon: 'sunny-outline' };
    } else if (max === afternoon) {
      return { period: 'afternoon', count: afternoon, icon: 'partly-sunny-outline' };
    } else {
      return { period: 'evening', count: evening, icon: 'moon-outline' };
    }
  };
  
  const bestStreak = getBestStreak();
  const totalStreak = getTotalStreak();
  
  if (totalStreak === 0) {
    return null; // Don't show anything if there are no streaks
  }
  
  return (
    <Card style={styles.container} variant="glow">
      <View style={styles.header}>
        <Typography variant="h3" style={styles.title} glow="soft">
          Your Streaks
        </Typography>
        <Ionicons name="flame-outline" size={24} color={theme.COLORS.primary.orange} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.streakItem}>
          <Ionicons 
            name={bestStreak.icon as any} 
            size={20} 
            color={theme.COLORS.primary.yellow} 
            style={styles.icon} 
          />
          <Typography variant="body" style={styles.streakText}>
            Best streak: {bestStreak.count} {bestStreak.period} check-ins
          </Typography>
        </View>
        
        <View style={styles.streakItem}>
          <Ionicons 
            name="calendar-outline" 
            size={20} 
            color={theme.COLORS.primary.green} 
            style={styles.icon} 
          />
          <Typography variant="body" style={styles.streakText}>
            Total streaks: {totalStreak} check-ins
          </Typography>
        </View>
      </View>
      
      <Typography variant="caption" style={styles.tip} color={theme.COLORS.ui.textSecondary}>
        Tip: Check in consistently to earn special badges!
      </Typography>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  title: {
    fontSize: 18,
  },
  content: {
    marginBottom: theme.SPACING.sm,
  },
  streakItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.xs,
  },
  icon: {
    marginRight: theme.SPACING.sm,
  },
  streakText: {
    fontSize: 14,
  },
  tip: {
    fontSize: 12,
    fontStyle: 'italic',
  },
}); 