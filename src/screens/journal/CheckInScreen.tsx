import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Input, Header, EmotionWheel } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { Emotion } from '@/constants/emotions';

export const CheckInScreen = () => {
  const router = useRouter();
  const { addEntry } = useJournal();
  const { showError } = useAppState();
  const [step, setStep] = useState<'initial' | 'secondary' | 'gratitude'>('initial');
  const [initialEmotion, setInitialEmotion] = useState<string | undefined>();
  const [secondaryEmotion, setSecondaryEmotion] = useState<string | undefined>();
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');

  const handleInitialEmotionSelect = (emotion: Emotion) => {
    setInitialEmotion(emotion.id);
    setSecondaryEmotion(undefined); // Reset secondary when primary changes
    setStep('secondary'); // Automatically advance to secondary emotions
  };

  const handleSecondaryEmotionSelect = (emotion: Emotion) => {
    setSecondaryEmotion(emotion.id);
    setStep('gratitude'); // Automatically advance to gratitude
  };

  const handleSubmit = async () => {
    if (!gratitude.trim()) {
      showError('Please share what you are grateful for');
      return;
    }
    
    if (!initialEmotion || !secondaryEmotion) {
      setStep('initial');
      return;
    }
    
    try {
      await addEntry(initialEmotion, secondaryEmotion, gratitude.trim(), note.trim() || undefined);
      router.back();
    } catch (error) {
      // Error is handled in JournalContext
    }
  };

  const handleBack = () => {
    if (step === 'secondary') {
      setStep('initial');
      setSecondaryEmotion(undefined);
    } else if (step === 'gratitude') {
      setStep('secondary');
    }
  };

  return (
    <View style={styles.container}>
      <Header
        title="Daily Check-in"
        onBack={() => router.back()}
      />
      
      <ScrollView style={styles.content}>
        {step === 'initial' && (
          <Card style={styles.card}>
            <Typography variant="h3" style={styles.sectionTitle}>
              How are you feeling right now?
            </Typography>
            <View style={styles.emotionWheelContainer}>
              <EmotionWheel
                onSelectEmotion={handleInitialEmotionSelect}
                selectedEmotion={initialEmotion}
                type="primary"
              />
            </View>
          </Card>
        )}

        {step === 'secondary' && (
          <Card style={styles.card}>
            <Typography variant="h3" style={styles.sectionTitle}>
              More specifically...
            </Typography>
            <View style={styles.emotionWheelContainer}>
              <EmotionWheel
                onSelectEmotion={handleSecondaryEmotionSelect}
                selectedEmotion={secondaryEmotion}
                type="secondary"
                primaryEmotion={initialEmotion}
              />
            </View>
            <Button
              title="Back"
              onPress={handleBack}
              variant="secondary"
              style={styles.button}
            />
          </Card>
        )}

        {step === 'gratitude' && (
          <>
            <Card style={styles.card}>
              <Typography variant="h3" style={styles.sectionTitle}>
                What are you grateful for?
              </Typography>
              <Input
                multiline
                value={gratitude}
                onChangeText={setGratitude}
                placeholder="Take a moment to reflect on something positive..."
                style={styles.input}
              />
            </Card>

            <Card style={styles.card}>
              <Typography variant="h3" style={styles.sectionTitle}>
                Additional thoughts? (Optional)
              </Typography>
              <Input
                multiline
                value={note}
                onChangeText={setNote}
                placeholder="Any other thoughts or feelings you'd like to capture..."
                style={styles.input}
              />
            </Card>

            <View style={styles.buttonRow}>
              <Button
                title="Back"
                onPress={handleBack}
                variant="secondary"
                style={styles.button}
              />
              <Button
                title="Save Entry"
                onPress={handleSubmit}
                style={styles.button}
              />
            </View>
          </>
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
  content: {
    padding: theme.SPACING.lg,
  },
  card: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.lg,
    textAlign: 'center',
  },
  emotionWheelContainer: {
    marginVertical: theme.SPACING.xl,
  },
  input: {
    height: 120,
  },
  button: {
    marginTop: theme.SPACING.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.SPACING.md,
    marginBottom: theme.SPACING.xl,
  },
}); 