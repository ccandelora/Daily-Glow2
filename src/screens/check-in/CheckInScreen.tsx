import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Input, EmotionWheel, Header, VideoBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useCheckInStreak } from '@/contexts/CheckInStreakContext';
import { getCurrentTimePeriod } from '@/utils/dateTime';
import theme from '@/constants/theme';
import { Emotion } from '@/constants/emotions';
import { useAchievementTriggers } from '@/hooks/useAchievementTriggers';

export const CheckInScreen = () => {
  const router = useRouter();
  const { addEntry, getTodayEntries } = useJournal();
  const { showError, showSuccess } = useAppState();
  const { streaks, isFirstCheckIn } = useCheckInStreak();
  const { triggerCheckInCompleted, triggerMoodAchievement } = useAchievementTriggers();
  
  const [step, setStep] = useState<'initial' | 'gratitude' | 'final'>('initial');
  const [initialEmotion, setInitialEmotion] = useState<string | undefined>();
  const [postEmotion, setPostEmotion] = useState<string | undefined>();
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const transitionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(transitionAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [step]);

  const handleInitialEmotionSelect = (emotion: Emotion) => {
    setInitialEmotion(emotion.id);
  };

  const handlePostEmotionSelect = (emotion: Emotion) => {
    setPostEmotion(emotion.id);
  };

  const handleNext = () => {
    if (step === 'initial' && !initialEmotion) {
      showError("Please select how you're feeling");
      return;
    }

    if (step === 'gratitude' && !gratitude.trim()) {
      showError("Please share what you're grateful for");
      return;
    }

    if (step === 'initial') {
      setStep('gratitude');
    } else if (step === 'gratitude') {
      setStep('final');
    }
  };

  const handleBack = () => {
    if (step === 'gratitude') {
      setStep('initial');
    } else if (step === 'final') {
      setStep('gratitude');
    }
  };

  const getStreakMessage = () => {
    const currentPeriod = getCurrentTimePeriod().toLowerCase();
    let message = '';
    
    // Get the streak count for the current period
    const streakCount = streaks[currentPeriod as keyof typeof streaks] as number || 0;
    
    if (streakCount === 0) {
      message = "Great job on your first check-in!";
    } else if (streakCount === 1) {
      message = `You've started a ${currentPeriod} streak!`;
    } else if (streakCount < 5) {
      message = `You're on a ${streakCount}-day ${currentPeriod} streak!`;
    } else if (streakCount < 10) {
      message = `Impressive! ${streakCount}-day ${currentPeriod} streak!`;
    } else {
      message = `Amazing! ${streakCount}-day ${currentPeriod} streak! You're a check-in master!`;
    }
    
    return message;
  };

  const handleSave = async () => {
    if (!initialEmotion) {
      showError('Please select an emotion');
      return;
    }
    
    if (!gratitude.trim()) {
      showError('Please enter what you are grateful for');
      return;
    }
    
    setLoading(true);
    
    try {
      // Add the journal entry
      await addEntry(initialEmotion, postEmotion || '', gratitude, note);
      
      // Check if all periods were completed today
      const todayEntries = getTodayEntries();
      const completedPeriods = new Set(todayEntries.map((entry: any) => entry.time_period));
      const allPeriodsCompleted = completedPeriods.size === 3;
      
      // Trigger achievements and badges for completed check-in
      await triggerCheckInCompleted(
        streaks,
        isFirstCheckIn,
        allPeriodsCompleted,
        initialEmotion
      );
      
      // Check for mood improvement (if both initial and post emotions are set)
      if (initialEmotion && postEmotion) {
        await triggerMoodAchievement(postEmotion, initialEmotion);
      }
      
      // Show success message with streak information
      showSuccess(getStreakMessage());
      
      router.back();
    } catch (error) {
      console.error('Error saving journal entry:', error);
      showError('Failed to save your check-in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      <Header showBranding={true} onBack={() => router.back()} />

      <ScrollView style={styles.content}>
        <Typography variant="h1" style={styles.title}>
          Daily Check-in
        </Typography>
        
        {step === 'initial' && (
          <Card style={StyleSheet.flatten([styles.card])} variant="glow">
            <Typography variant="h3" style={styles.sectionTitle}>
              How are you feeling right now?
            </Typography>
            <EmotionWheel
              onSelectEmotion={handleInitialEmotionSelect}
              selectedEmotion={initialEmotion}
              style={{
                opacity: transitionAnim,
                transform: [{ scale: transitionAnim }],
              }}
            />
            <Button
              title="Next"
              onPress={handleNext}
              style={styles.button}
            />
          </Card>
        )}

        {step === 'gratitude' && (
          <Card style={StyleSheet.flatten([styles.card])} variant="glow">
            <Typography variant="h3" style={styles.sectionTitle}>
              What are you grateful for today?
            </Typography>
            <Input
              multiline
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="Take a moment to reflect on something positive..."
              style={styles.gratitudeInput}
            />
            <Input
              multiline
              value={note}
              onChangeText={setNote}
              placeholder="Any additional thoughts? (Optional)"
              style={styles.noteInput}
            />
            <View style={styles.buttonRow}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Next"
                onPress={handleNext}
                style={styles.button}
              />
            </View>
          </Card>
        )}

        {step === 'final' && (
          <Card style={StyleSheet.flatten([styles.card])} variant="glow">
            <Typography variant="h3" style={styles.sectionTitle}>
              After reflecting, how do you feel now?
            </Typography>
            <EmotionWheel
              onSelectEmotion={handlePostEmotionSelect}
              selectedEmotion={postEmotion}
              style={{
                opacity: transitionAnim,
                transform: [{ scale: transitionAnim }],
              }}
            />
            <View style={styles.buttonRow}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Save Entry"
                onPress={handleSave}
                style={styles.button}
              />
            </View>
          </Card>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  title: {
    fontSize: 32,
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.SPACING.lg,
  },
  card: {
    padding: theme.SPACING.lg,
    marginBottom: theme.SPACING.md,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  sectionTitle: {
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
  },
  gratitudeInput: {
    height: 100,
    marginBottom: theme.SPACING.md,
  },
  noteInput: {
    height: 100,
    marginBottom: theme.SPACING.md,
  },
  button: {
    marginBottom: theme.SPACING.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.SPACING.md,
  },
}); 