import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Input, EmotionWheel, Header, AnimatedBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { Emotion } from '@/constants/emotions';

export const CheckInScreen = () => {
  const router = useRouter();
  const { addEntry } = useJournal();
  const { showError } = useAppState();
  
  const [step, setStep] = useState<'initial' | 'gratitude' | 'final'>('initial');
  const [initialEmotion, setInitialEmotion] = useState<string | undefined>();
  const [postEmotion, setPostEmotion] = useState<string | undefined>();
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');

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

  const handleSave = async () => {
    if (!initialEmotion || !postEmotion || !gratitude.trim()) {
      showError('Please complete all fields before saving');
      return;
    }

    try {
      await addEntry(initialEmotion, postEmotion, gratitude, note);
      router.back();
    } catch (error) {
      // Error is already handled in JournalContext
    }
  };

  return (
    <View style={styles.container}>
      <AnimatedBackground intensity="medium" />
      <Header
        title="Daily Check-in"
        onBack={() => router.back()}
      />

      <ScrollView style={styles.content}>
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
  header: {
    padding: theme.SPACING.lg,
  },
  title: {
    marginBottom: theme.SPACING.xs,
  },
  content: {
    padding: theme.SPACING.lg,
    paddingTop: 0,
  },
  card: {
    padding: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.lg,
  },
  gratitudeInput: {
    height: 100,
    marginBottom: theme.SPACING.md,
  },
  noteInput: {
    height: 100,
    marginBottom: theme.SPACING.lg,
  },
  button: {
    marginBottom: theme.SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.SPACING.md,
  },
}); 