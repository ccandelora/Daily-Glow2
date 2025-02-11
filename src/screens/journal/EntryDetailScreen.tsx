import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography, Card, Button, AnimatedMoodIcon } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';

export const EntryDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { entries } = useJournal();
  
  const entry = entries.find(e => e.id === id);

  if (!entry) {
    return (
      <View style={styles.container}>
        <Typography variant="h2" style={styles.errorText}>
          Entry not found
        </Typography>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    );
  }

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'great': return theme.COLORS.primary.green;
      case 'good': return theme.COLORS.primary.blue;
      case 'okay': return theme.COLORS.primary.yellow;
      case 'bad': return theme.COLORS.primary.red;
      default: return theme.COLORS.primary.blue;
    }
  };

  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'great': return '😊';
      case 'good': return '🙂';
      case 'okay': return '😐';
      case 'bad': return '😕';
      default: return '🙂';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Button
          title="← Back"
          variant="secondary"
          onPress={() => router.back()}
          style={styles.backButton}
        />
        <Typography variant="h2" style={styles.title}>
          {entry.date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Typography>
      </View>

      <View style={styles.content}>
        <Card style={styles.moodCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Mood
          </Typography>
          <View style={styles.moodContainer}>
            <AnimatedMoodIcon
              color={getMoodColor(entry.mood)}
              size={64}
              active
            >
              <Typography style={styles.moodEmoji}>
                {getMoodEmoji(entry.mood)}
              </Typography>
            </AnimatedMoodIcon>
            <Typography
              variant="h3"
              color={getMoodColor(entry.mood)}
              style={styles.moodText}
            >
              {entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}
            </Typography>
          </View>
        </Card>

        <Card style={styles.card}>
          <Typography variant="h3" style={styles.sectionTitle}>
            Gratitude
          </Typography>
          <Typography variant="body" style={styles.text}>
            {entry.gratitude}
          </Typography>
        </Card>

        {entry.note && (
          <Card style={styles.card}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Additional Thoughts
            </Typography>
            <Typography variant="body" style={styles.text}>
              {entry.note}
            </Typography>
          </Card>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  header: {
    padding: theme.SPACING.lg,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: theme.SPACING.md,
  },
  title: {
    marginBottom: theme.SPACING.md,
  },
  content: {
    padding: theme.SPACING.lg,
    paddingTop: 0,
  },
  moodCard: {
    marginBottom: theme.SPACING.lg,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.md,
  },
  moodContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  moodEmoji: {
    fontSize: theme.FONTS.sizes.xxl,
  },
  moodText: {
    marginLeft: theme.SPACING.md,
  },
  card: {
    marginBottom: theme.SPACING.lg,
  },
  text: {
    color: theme.COLORS.ui.textSecondary,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
  },
  button: {
    marginHorizontal: theme.SPACING.lg,
  },
}); 