import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography, Card, Button, AnimatedMoodIcon } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';
import { getEmotionById } from '@/constants/emotions';

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

  const initialEmotion = getEmotionById(entry.initialEmotion);
  const postEmotion = getEmotionById(entry.postGratitudeEmotion);

  if (!initialEmotion || !postEmotion) {
    return (
      <View style={styles.container}>
        <Typography variant="h2" style={styles.errorText}>
          Invalid emotion data
        </Typography>
        <Button
          title="Go Back"
          onPress={() => router.back()}
          style={styles.button}
        />
      </View>
    );
  }

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
            Initial Feeling
          </Typography>
          <View style={styles.moodContainer}>
            <AnimatedMoodIcon
              color={initialEmotion.color}
              size={64}
              active
            >
              <Typography style={styles.moodEmoji}>
                {initialEmotion.icon || '😊'}
              </Typography>
            </AnimatedMoodIcon>
            <Typography
              variant="h3"
              color={initialEmotion.color}
              style={styles.moodText}
            >
              {initialEmotion.label}
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

        <Card style={styles.moodCard}>
          <Typography variant="h3" style={styles.sectionTitle}>
            After Reflection
          </Typography>
          <View style={styles.moodContainer}>
            <AnimatedMoodIcon
              color={postEmotion.color}
              size={64}
              active
            >
              <Typography style={styles.moodEmoji}>
                {postEmotion.icon || '😊'}
              </Typography>
            </AnimatedMoodIcon>
            <Typography
              variant="h3"
              color={postEmotion.color}
              style={styles.moodText}
            >
              {postEmotion.label}
            </Typography>
          </View>
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