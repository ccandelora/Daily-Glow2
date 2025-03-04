import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Card, Input, EmotionWheel, VideoBackground } from '@/components/common';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { Emotion } from '@/constants/emotions';

export const FirstCheckInScreen = () => {
  const router = useRouter();
  const { state, setFirstCheckIn } = useOnboarding();
  const { showError } = useAppState();
  const [step, setStep] = useState<'initial' | 'secondary' | 'gratitude'>('initial');
  const [initialEmotion, setInitialEmotion] = useState<string | undefined>();
  const [secondaryEmotion, setSecondaryEmotion] = useState<string | undefined>();
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');

  // Animation values
  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const cardAnim = React.useRef(new Animated.Value(50)).current;
  const footerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(cardAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleInitialEmotionSelect = (emotion: Emotion) => {
    setInitialEmotion(emotion.id);
    setSecondaryEmotion(undefined);
    setStep('secondary');
  };

  const handleSecondaryEmotionSelect = (emotion: Emotion) => {
    setSecondaryEmotion(emotion.id);
    setStep('gratitude');
  };

  const handleBack = () => {
    if (step === 'secondary') {
      setStep('initial');
      setSecondaryEmotion(undefined);
    } else if (step === 'gratitude') {
      setStep('secondary');
    }
  };

  const handleComplete = () => {
    if (!initialEmotion || !secondaryEmotion) {
      showError("Please select how you're feeling");
      setStep('initial');
      return;
    }

    if (!gratitude.trim()) {
      showError("Please share something you're grateful for");
      return;
    }

    setFirstCheckIn(initialEmotion, gratitude.trim());
    router.push('/complete');
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      
      <ScrollView style={styles.scrollView}>
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Typography variant="h1" style={styles.title} glow="medium">
            Let's Check In
          </Typography>
          <Typography variant="body" style={styles.subtitle} glow="soft">
            Take a moment to reflect on how you're feeling right now. Regular check-ins help you build emotional awareness and track your well-being journey.
          </Typography>
        </Animated.View>

        <Animated.View style={{
          transform: [{ translateY: cardAnim }],
          opacity: headerAnim,
        }}>
          {step === 'initial' && (
            <Card style={styles.card} variant="glow">
              <Typography variant="h2" style={styles.sectionTitle} glow="medium">
                How are you feeling?
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
            <Card style={styles.card} variant="glow">
              <Typography variant="h2" style={styles.sectionTitle} glow="medium">
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
              <Card style={styles.card} variant="glow">
                <Typography variant="h2" style={styles.sectionTitle} glow="medium">
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

              <Card style={styles.card} variant="glow">
                <Typography variant="h2" style={styles.sectionTitle} glow="medium">
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
                  title="Complete Check-in"
                  onPress={handleComplete}
                  style={styles.button}
                />
              </View>
            </>
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
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.SPACING.lg,
    paddingTop: theme.SPACING.xl * 2,
    paddingBottom: theme.SPACING.xl,
  },
  title: {
    marginBottom: theme.SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
  },
  card: {
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.xl,
    textAlign: 'center',
  },
  emotionWheelContainer: {
    marginVertical: theme.SPACING.xl,
  },
  input: {
    height: 120,
    textAlignVertical: 'top',
  },
  button: {
    marginTop: theme.SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.SPACING.md,
    marginBottom: theme.SPACING.xl,
  },
}); 