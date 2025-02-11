import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Header } from '@/components/common';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const AchievementsScreen = () => {
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
      <Header
        title="Achievements"
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content}>
        <Animated.View style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}>
          {/* Stats Overview */}
          <Card style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Typography variant="h2" color={theme.COLORS.primary.green}>
                  {userStats?.total_points || 0}
                </Typography>
                <Typography variant="caption">Total Points</Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Typography variant="h2" color={theme.COLORS.primary.blue}>
                  {userBadges.length}
                </Typography>
                <Typography variant="caption">Badges Earned</Typography>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Typography variant="h2" color={theme.COLORS.primary.red}>
                  {userStats?.current_streak || 0}
                </Typography>
                <Typography variant="caption">Day Streak</Typography>
              </View>
            </View>
          </Card>

          {/* Level Progress */}
          <Card style={styles.levelCard}>
            <View style={styles.levelHeader}>
              <Typography variant="h3">Level {userStats?.level || 1}</Typography>
              <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                {userStats?.total_points || 0} / {((userStats?.level || 1) * 100)} points
              </Typography>
            </View>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  {
                    width: `${((userStats?.total_points || 0) % 100)}%`,
                  }
                ]}
              />
            </View>
          </Card>

          {/* Badges Grid */}
          <Typography variant="h3" style={styles.sectionTitle}>
            Your Badges
          </Typography>

          {userBadges.length > 0 ? (
            <View style={styles.badgesGrid}>
              {userBadges.map((userBadge) => (
                <Card key={userBadge.id} style={styles.badgeCard}>
                  <View 
                    style={[
                      styles.badgeIcon,
                      { backgroundColor: getBadgeColor(userBadge.badge.type) }
                    ]}
                  >
                    <Ionicons
                      name={getBadgeIcon(userBadge.badge.type)}
                      size={24}
                      color={theme.COLORS.ui.background}
                    />
                  </View>
                  <Typography variant="body" style={styles.badgeName}>
                    {userBadge.badge.name}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={theme.COLORS.ui.textSecondary}
                    style={styles.badgeDescription}
                  >
                    {userBadge.badge.description}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={theme.COLORS.primary.green}
                    style={styles.badgePoints}
                  >
                    +{userBadge.badge.points} points
                  </Typography>
                </Card>
              ))}
            </View>
          ) : (
            <Card style={styles.emptyCard}>
              <Ionicons
                name="ribbon-outline"
                size={48}
                color={theme.COLORS.ui.textSecondary}
              />
              <Typography
                variant="body"
                color={theme.COLORS.ui.textSecondary}
                style={styles.emptyText}
              >
                Complete challenges and maintain streaks to earn badges!
              </Typography>
            </Card>
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    flex: 1,
    padding: theme.SPACING.lg,
  },
  statsCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.COLORS.ui.border,
    marginHorizontal: theme.SPACING.md,
  },
  levelCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.COLORS.ui.border,
    borderRadius: theme.BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.COLORS.primary.green,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.md,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.SPACING.xs,
  },
  badgeCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.md,
    alignItems: 'center',
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.SPACING.sm,
  },
  badgeName: {
    textAlign: 'center',
    marginBottom: theme.SPACING.xs,
    fontWeight: theme.FONTS.weights.semibold,
  },
  badgeDescription: {
    textAlign: 'center',
    marginBottom: theme.SPACING.xs,
  },
  badgePoints: {
    textAlign: 'center',
  },
  emptyCard: {
    padding: theme.SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.SPACING.md,
  },
}); 