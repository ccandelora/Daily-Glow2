import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Header, AnimatedBackground, VideoBackground } from '@/components/common';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const AchievementsScreen: React.FC = () => {
  const router = useRouter();
  const { userBadges } = useNotifications();
  const { userStats } = useChallenges();
  
  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getBadgeIcon = (type: string) => {
    switch (type) {
      case 'streak':
        return 'flame';
      case 'entries':
        return 'journal';
      case 'challenges':
        return 'trophy';
      default:
        return 'ribbon';
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'streak':
        return theme.COLORS.primary.red;
      case 'entries':
        return theme.COLORS.primary.blue;
      case 'challenges':
        return theme.COLORS.primary.yellow;
      default:
        return theme.COLORS.primary.green;
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Typography variant="h1" style={styles.title}>
            Achievements
          </Typography>
          <Typography variant="body" style={styles.subtitle}>
            Track your progress and earn rewards
          </Typography>
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Typography variant="h2">0</Typography>
            <Typography variant="body">Points</Typography>
          </View>
          <View style={styles.statCard}>
            <Typography variant="h2">0</Typography>
            <Typography variant="body">Badges</Typography>
          </View>
          <View style={styles.statCard}>
            <Typography variant="h2">0</Typography>
            <Typography variant="body">Streak</Typography>
          </View>
        </View>

        <View style={styles.section}>
          <Typography variant="h2" style={styles.sectionTitle}>
            Your Badges
          </Typography>
          <View style={styles.emptyState}>
            <Typography variant="body" style={styles.emptyText}>
              Complete challenges and maintain streaks to earn badges!
            </Typography>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: theme.SPACING.lg,
  },
  header: {
    marginTop: 60,
    marginBottom: theme.SPACING.xl,
  },
  title: {
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.sm,
  },
  subtitle: {
    color: theme.COLORS.ui.textSecondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.xl,
  },
  statCard: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.md,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  section: {
    marginBottom: theme.SPACING.xl,
  },
  sectionTitle: {
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.md,
  },
  emptyState: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
  },
}); 