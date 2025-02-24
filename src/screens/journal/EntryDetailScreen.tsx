import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Typography, Card, Button, AnimatedBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';
import { getEmotionById, getAllEmotions } from '@/constants/emotions';

export const EntryDetailScreen = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { entries } = useJournal();
  
  const entry = entries.find(e => e.id === id);

  if (!entry) {
    return (
      <View style={styles.container}>
        <AnimatedBackground intensity="medium" />
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

  console.log('Debug - Raw entry data:', entry);
  console.log('Debug - Available emotion IDs:', getAllEmotions().map(e => e.id));
  
  const initialEmotion = getEmotionById(entry.initial_emotion);
  const secondaryEmotion = getEmotionById(entry.secondary_emotion);

  if (!initialEmotion || !secondaryEmotion) {
    console.log('Debug - Entry data:', {
      initialEmotionId: entry.initial_emotion,
      secondaryEmotionId: entry.secondary_emotion,
      initialEmotion,
      secondaryEmotion,
      allEmotions: getAllEmotions()
    });
    
    return (
      <View style={styles.container}>
        <AnimatedBackground intensity="medium" />
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
    <View style={styles.container}>
      <AnimatedBackground intensity="medium" />
      <ScrollView style={styles.scrollView}>
        <View style={styles.safeArea}>
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
              })}
            </Typography>
            <Typography variant="h3" style={styles.subtitle}>
              {entry.date.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </Typography>
          </View>

          <View style={styles.content}>
            <Card style={styles.card}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Initial Feeling
              </Typography>
              <View style={styles.emotionContainer}>
                <View style={[styles.emotionBadge, { backgroundColor: initialEmotion.color }]}>
                  <View style={styles.emojiContainer}>
                    <Typography style={styles.emoji}>
                      {getEmojiForEmotion(initialEmotion.id)}
                    </Typography>
                  </View>
                  <Typography
                    variant="h3"
                    style={styles.emotionLabel}
                  >
                    {initialEmotion.label}
                  </Typography>
                </View>
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

            <Card style={styles.card}>
              <Typography variant="h3" style={styles.sectionTitle}>
                More Specific Feeling
              </Typography>
              <View style={styles.emotionContainer}>
                <View style={[styles.emotionBadge, { backgroundColor: secondaryEmotion.color }]}>
                  <View style={styles.emojiContainer}>
                    <Typography style={styles.emoji}>
                      {getEmojiForEmotion(secondaryEmotion.id)}
                    </Typography>
                  </View>
                  <Typography
                    variant="h3"
                    style={styles.emotionLabel}
                  >
                    {secondaryEmotion.label}
                  </Typography>
                </View>
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
        </View>
      </ScrollView>
    </View>
  );
};

const getEmojiForEmotion = (id: string): string => {
  switch (id) {
    // Primary emotions
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'angry': return '😠';
    case 'scared': return '😨';
    
    // Happy secondary emotions
    case 'optimistic': return '✨';
    case 'peaceful': return '😌';
    case 'powerful': return '💪';
    case 'proud': return '🦋';
    
    // Sad secondary emotions
    case 'lonely': return '🫂';
    case 'vulnerable': return '🥺';
    case 'despair': return '💔';
    case 'guilty': return '😣';
    
    // Angry secondary emotions
    case 'frustrated': return '😤';
    case 'critical': return '🤨';
    case 'distant': return '🫥';
    case 'irritated': return '😒';
    
    // Scared secondary emotions
    case 'confused': return '😕';
    case 'rejected': return '😞';
    case 'helpless': return '😰';
    case 'anxious': return '😥';
    
    default: return '😐';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  scrollView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    padding: theme.SPACING.lg,
    paddingBottom: theme.SPACING.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: theme.SPACING.lg,
  },
  title: {
    textAlign: 'center',
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.xs,
  },
  subtitle: {
    textAlign: 'center',
    fontSize: 24,
    color: theme.COLORS.ui.textSecondary,
    marginTop: 0,
  },
  content: {
    padding: theme.SPACING.lg,
    paddingTop: theme.SPACING.xl,
  },
  card: {
    marginBottom: theme.SPACING.xl,
    padding: theme.SPACING.xl,
    borderRadius: theme.BORDER_RADIUS.lg,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.lg,
    fontSize: 20,
    textAlign: 'center',
    color: theme.COLORS.ui.text,
  },
  emotionContainer: {
    alignItems: 'center',
    marginTop: theme.SPACING.md,
  },
  emotionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: theme.SPACING.lg,
    borderRadius: theme.BORDER_RADIUS.xl,
    minWidth: 200,
    justifyContent: 'center',
  },
  emojiContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  emoji: {
    fontSize: 32,
    lineHeight: 40,
    textAlign: 'center',
  },
  emotionLabel: {
    color: theme.COLORS.ui.background,
    fontSize: 20,
    fontWeight: 'bold',
  },
  text: {
    color: theme.COLORS.ui.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  errorText: {
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  button: {
    marginHorizontal: theme.SPACING.lg,
  },
}); 