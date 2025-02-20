import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Input, Header, EmotionWheel } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';
import { Emotion } from '@/constants/emotions';

export const CheckInScreen = () => {
  const router = useRouter();
  const { addEntry } = useJournal();
  const [step, setStep] = useState<'initial' | 'gratitude' | 'final'>('initial');
  const [initialEmotion, setInitialEmotion] = useState<string | undefined>();
  const [postEmotion, setPostEmotion] = useState<string | undefined>();
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');

  const handleInitialEmotionSelect = (emotion: Emotion) => {
    setInitialEmotion(emotion.id);
  };

  const handlePostEmotionSelect = (emotion: Emotion) => {
    setPostEmotion(emotion.id);
  };

  const handleNext = () => {
    if (step === 'initial' && !initialEmotion) {
      return;
    }

    if (step === 'gratitude' && !gratitude.trim()) {
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

  const handleSubmit = async () => {
    if (!initialEmotion || !postEmotion || !gratitude.trim()) return;
    
    try {
      await addEntry(initialEmotion, postEmotion, gratitude.trim(), note.trim() || undefined);
      router.back();
    } catch (error) {
      // Error is handled in JournalContext
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
            <EmotionWheel
              onSelectEmotion={handleInitialEmotionSelect}
              selectedEmotion={initialEmotion}
            />
            <Button
              title="Next"
              onPress={handleNext}
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
                title="Next"
                onPress={handleNext}
                style={styles.button}
              />
            </View>
          </>
        )}

        {step === 'final' && (
          <>
            <Card style={styles.card}>
              <Typography variant="h3" style={styles.sectionTitle}>
                After reflecting, how do you feel now?
              </Typography>
              <EmotionWheel
                onSelectEmotion={handlePostEmotionSelect}
                selectedEmotion={postEmotion}
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
  },
  input: {
    height: 120,
  },
  button: {
    flex: 1,
    marginHorizontal: theme.SPACING.xs,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.SPACING.md,
    marginBottom: theme.SPACING.xl,
  },
}); 