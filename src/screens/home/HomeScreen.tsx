import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, AnimatedMoodIcon, DailyChallenge } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';

const moodColors = {
  great: theme.COLORS.primary.green,
  good: theme.COLORS.primary.blue,
  okay: theme.COLORS.primary.yellow,
  bad: theme.COLORS.primary.red,
};

const moodIcons = {
  great: '😊',
  good: '🙂',
  okay: '😐',
  bad: '😕',
};

export const HomeScreen = () => {
  const router = useRouter();
  const { getRecentEntries, getTodayEntry } = useJournal();
  const todayEntry = getTodayEntry();
  const recentEntries = getRecentEntries(3);

  // Animation values
  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const checkInAnim = React.useRef(new Animated.Value(50)).current;
  const recentAnim = React.useRef(new Animated.Value(50)).current;
  const actionsAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in header
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Stagger other elements
      Animated.stagger(150, [
        Animated.spring(checkInAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(recentAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.spring(actionsAnim, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const getMoodColor = (mood: string) => moodColors[mood as keyof typeof moodColors] || theme.COLORS.ui.textSecondary;
  const getMoodIcon = (mood: string) => moodIcons[mood as keyof typeof moodIcons] || '🤔';

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <Typography variant="h1" style={styles.title}>
          Daily Glow
        </Typography>
        <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
          {new Date().toLocaleDateString('en-US', { 
            weekday: 'long',
            month: 'long',
            day: 'numeric'
          })}
        </Typography>
      </Animated.View>

      <Animated.View style={{
        transform: [{ translateY: checkInAnim }],
        opacity: headerAnim,
      }}>
        <Card style={styles.checkInCard}>
          <Typography variant="h2" style={styles.cardTitle}>
            Daily Check-in
          </Typography>
          {todayEntry ? (
            <>
              <View style={styles.todayMood}>
                <AnimatedMoodIcon
                  color={getMoodColor(todayEntry.mood)}
                  active={true}
                  size={48}
                >
                  <Typography style={styles.moodIcon}>
                    {getMoodIcon(todayEntry.mood)}
                  </Typography>
                </AnimatedMoodIcon>
                <View style={styles.todayMoodText}>
                  <Typography variant="h3" color={getMoodColor(todayEntry.mood)}>
                    {todayEntry.mood.charAt(0).toUpperCase() + todayEntry.mood.slice(1)}
                  </Typography>
                  <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                    {todayEntry.gratitude.length > 50 
                      ? todayEntry.gratitude.substring(0, 50) + '...'
                      : todayEntry.gratitude}
                  </Typography>
                </View>
              </View>
              <Button
                title="View Today's Entry"
                onPress={() => router.push('/(app)/journal')}
                variant="secondary"
                style={styles.checkInButton}
              />
            </>
          ) : (
            <>
              <Typography variant="body" color={theme.COLORS.ui.textSecondary} style={styles.cardSubtitle}>
                Take a moment to reflect on your day
              </Typography>
              <Button
                title="Start Check-in"
                onPress={() => router.push('/(app)/check-in')}
                style={styles.checkInButton}
              />
            </>
          )}
        </Card>
        <DailyChallenge />
      </Animated.View>

      <Animated.View style={{
        transform: [{ translateY: recentAnim }],
        opacity: headerAnim,
      }}>
        <Card style={styles.recentEntriesCard}>
          <View style={styles.cardHeader}>
            <Typography variant="h3">Recent Entries</Typography>
            <Button
              title="View All"
              variant="secondary"
              onPress={() => router.push('/(app)/journal')}
            />
          </View>
          {recentEntries.length > 0 ? (
            recentEntries.map(entry => (
              <TouchableOpacity 
                key={entry.id} 
                style={styles.entryItem}
                onPress={() => router.push(`/(app)/journal/${entry.id}`)}
              >
                <View style={styles.entryItemLeft}>
                  <Typography style={styles.entryIcon}>
                    {getMoodIcon(entry.mood)}
                  </Typography>
                  <View>
                    <Typography variant="body" color={getMoodColor(entry.mood)}>
                      {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
                    </Typography>
                    <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
                      {entry.date.toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                  </View>
                </View>
                <Typography 
                  variant="body" 
                  color={theme.COLORS.ui.textSecondary}
                  style={styles.entryPreview}
                >
                  {entry.gratitude.length > 30 
                    ? entry.gratitude.substring(0, 30) + '...'
                    : entry.gratitude}
                </Typography>
              </TouchableOpacity>
            ))
          ) : (
            <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
              No entries yet. Start your journey by doing a check-in.
            </Typography>
          )}
        </Card>
      </Animated.View>

      <Animated.View style={[
        styles.quickActions,
        {
          transform: [{ translateY: actionsAnim }],
          opacity: headerAnim,
        }
      ]}>
        <Typography variant="h3" style={styles.sectionTitle}>
          Quick Actions
        </Typography>
        <View style={styles.actionButtons}>
          <Button
            title="New Entry"
            onPress={() => router.push('/(app)/check-in')}
            style={styles.actionButton}
          />
          <Button
            title="Journal"
            onPress={() => router.push('/(app)/journal')}
            style={styles.actionButton}
          />
          <Button
            title="Insights"
            onPress={() => router.push('/(app)/insights')}
            style={styles.actionButton}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  contentContainer: {
    flexGrow: 1,
  },
  header: {
    padding: theme.SPACING.lg,
  },
  title: {
    marginBottom: theme.SPACING.xs,
  },
  checkInCard: {
    margin: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  cardTitle: {
    marginBottom: theme.SPACING.sm,
  },
  cardSubtitle: {
    marginBottom: theme.SPACING.lg,
  },
  todayMood: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.SPACING.md,
  },
  todayMoodText: {
    marginLeft: theme.SPACING.md,
    flex: 1,
  },
  moodIcon: {
    fontSize: 24,
  },
  checkInButton: {
    marginTop: theme.SPACING.md,
  },
  recentEntriesCard: {
    margin: theme.SPACING.lg,
    marginTop: 0,
    padding: theme.SPACING.lg,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  entryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.ui.border,
  },
  entryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  entryIcon: {
    fontSize: 24,
    marginRight: theme.SPACING.md,
  },
  entryPreview: {
    flex: 1,
    marginLeft: theme.SPACING.md,
    textAlign: 'right',
  },
  quickActions: {
    padding: theme.SPACING.lg,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.md,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -theme.SPACING.xs,
  },
  actionButton: {
    flex: 1,
    minWidth: '30%',
    marginHorizontal: theme.SPACING.xs,
    marginBottom: theme.SPACING.sm,
  },
}); 