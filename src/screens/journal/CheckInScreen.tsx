import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Button, Input, Header, EmotionWheel, VideoBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme, { TIME_PERIODS } from '@/constants/theme';
import { Emotion } from '@/constants/emotions';
import { getCurrentTimePeriod, TimePeriod } from '@/utils/dateTime';
import { LinearGradient } from 'expo-linear-gradient';

const formatTime = (hour: number) => {
  const period = hour >= 12 ? 'PM' : 'AM';
  const standardHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${standardHour}:00 ${period}`;
};

export const CheckInScreen = () => {
  const router = useRouter();
  const { addEntry, getLatestEntryForPeriod, getTodayEntries } = useJournal();
  const { showError } = useAppState();
  const [step, setStep] = useState<'initial' | 'secondary' | 'gratitude'>('initial');
  const [initialEmotion, setInitialEmotion] = useState<string | undefined>();
  const [secondaryEmotion, setSecondaryEmotion] = useState<string | undefined>();
  const [gratitude, setGratitude] = useState('');
  const [note, setNote] = useState('');
  const currentPeriod = getCurrentTimePeriod();
  const periodDetails = TIME_PERIODS[currentPeriod];
  const [hasCompletedCurrentPeriod, setHasCompletedCurrentPeriod] = useState(false);
  const [nextPeriod, setNextPeriod] = useState<TimePeriod | null>(null);

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    checkPeriodCompletion();
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkPeriodCompletion = () => {
    const existingEntry = getLatestEntryForPeriod(currentPeriod);
    const todayEntries = getTodayEntries();
    const currentHour = new Date().getHours();
    
    if (existingEntry) {
      setHasCompletedCurrentPeriod(true);
      
      // Determine next available period
      const completedPeriods = new Set(todayEntries.map(entry => entry.time_period));
      
      if (currentPeriod === 'EVENING') {
        // After evening check-in, next check-in is tomorrow morning
        setNextPeriod('MORNING');
      } else if (currentPeriod === 'MORNING' && !completedPeriods.has('AFTERNOON')) {
        setNextPeriod('AFTERNOON');
      } else if ((currentPeriod === 'MORNING' || currentPeriod === 'AFTERNOON') && 
                 !completedPeriods.has('EVENING')) {
        setNextPeriod('EVENING');
      } else {
        // All periods completed for today
        setNextPeriod(null);
      }
    }
  };

  const handleInitialEmotionSelect = (emotion: Emotion) => {
    setInitialEmotion(emotion.id);
    setSecondaryEmotion(undefined);
    setStep('secondary');
  };

  const handleSecondaryEmotionSelect = (emotion: Emotion) => {
    setSecondaryEmotion(emotion.id);
    setStep('gratitude');
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

  if (hasCompletedCurrentPeriod) {
    return (
      <View style={styles.container}>
        <VideoBackground />
        
        {/* Dark overlay gradient with reduced opacity */}
        <LinearGradient
          colors={[
            'rgba(28, 14, 45, 0.5)',
            'rgba(28, 14, 45, 0.3)',
            'rgba(28, 14, 45, 0.5)',
          ]}
          style={StyleSheet.absoluteFill}
        />

        <Header showBranding={true} />
        <ScrollView style={styles.scrollView}>
          <Animated.View
            style={[
              styles.content,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Card style={styles.card} variant="glow">
              <Typography variant="h2" style={styles.title} glow="strong">
                Check-in Complete
              </Typography>
              <Typography variant="body" style={styles.message} glow="medium">
                You've already completed your {periodDetails.label.toLowerCase()} check-in.
                {nextPeriod ? (
                  nextPeriod === 'MORNING' ? 
                  ` Come back tomorrow morning between ${formatTime(TIME_PERIODS.MORNING.range.start)} - ${formatTime(TIME_PERIODS.MORNING.range.end)} for your next check-in!` :
                  ` Your next check-in will be available between ${formatTime(TIME_PERIODS[nextPeriod].range.start)} - ${formatTime(TIME_PERIODS[nextPeriod].range.end)}.`
                ) : (
                  ` You've completed all check-ins for today. Come back tomorrow morning at ${formatTime(TIME_PERIODS.MORNING.range.start)}!`
                )}
              </Typography>
              {nextPeriod && (
                <Typography 
                  variant="body" 
                  style={StyleSheet.flatten([
                    styles.cardDescription, 
                    { color: theme.COLORS.primary.green }
                  ])}
                  glow="medium"
                >
                  Next check-in: {TIME_PERIODS[nextPeriod].label}
                </Typography>
              )}
              <Button
                title="Return Home"
                onPress={() => router.back()}
                variant="secondary"
                style={styles.button}
              />
            </Card>
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <VideoBackground />
      
      {/* Dark overlay gradient with reduced opacity */}
      <LinearGradient
        colors={[
          'rgba(28, 14, 45, 0.5)',
          'rgba(28, 14, 45, 0.3)',
          'rgba(28, 14, 45, 0.5)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <Header showBranding={true} />
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Card style={styles.card} variant="glow">
            <Typography variant="h2" style={styles.title} glow="strong">
              {periodDetails.label} Check-in
            </Typography>
            <Typography variant="body" style={styles.subtitle} glow="medium">
              Take a moment to reflect on how you're feeling
            </Typography>

            {step === 'initial' && (
              <>
                <Typography variant="h3" style={styles.sectionTitle} glow="medium">
                  How are you feeling right now?
                </Typography>
                <EmotionWheel 
                  onSelectEmotion={handleInitialEmotionSelect}
                  selectedEmotion={initialEmotion}
                  type="primary"
                />
              </>
            )}

            {step === 'secondary' && initialEmotion && (
              <>
                <Typography variant="h3" style={styles.sectionTitle} glow="medium">
                  Any other emotions present?
                </Typography>
                <EmotionWheel 
                  onSelectEmotion={handleSecondaryEmotionSelect}
                  selectedEmotion={secondaryEmotion}
                  type="secondary"
                  primaryEmotion={initialEmotion}
                />
                <Button
                  title="Back"
                  onPress={handleBack}
                  variant="secondary"
                  style={styles.backButton}
                />
              </>
            )}

            {step === 'gratitude' && (
              <>
                <Typography variant="h3" style={styles.sectionTitle} glow="medium">
                  What are you grateful for?
                </Typography>
                <Input
                  multiline
                  value={gratitude}
                  onChangeText={setGratitude}
                  placeholder="Share something you appreciate..."
                  style={styles.input}
                />
                <Typography variant="h3" style={styles.sectionTitle} glow="medium">
                  Additional thoughts (optional)
                </Typography>
                <Input
                  multiline
                  value={note}
                  onChangeText={setNote}
                  placeholder="Any other thoughts or reflections..."
                  style={styles.input}
                />
                <View style={styles.buttonContainer}>
                  <Button
                    title="Complete Check-in"
                    onPress={handleSubmit}
                    variant="primary"
                    size="large"
                    style={styles.completeButton}
                  />
                  <Button
                    title="Back"
                    onPress={handleBack}
                    variant="secondary"
                    size="medium"
                    style={styles.backButton}
                  />
                </View>
              </>
            )}
          </Card>
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
  scrollViewContent: {
    paddingBottom: theme.SPACING.xxl,
  },
  content: {
    padding: theme.SPACING.lg,
  },
  card: {
    padding: theme.SPACING.xl,
    marginVertical: theme.SPACING.md,
  },
  title: {
    marginBottom: theme.SPACING.md,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: theme.SPACING.xl,
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.lg,
  },
  input: {
    height: 120,
    marginBottom: theme.SPACING.xl,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.SPACING.xl,
    marginBottom: theme.SPACING.lg,
    width: '100%',
  },
  button: {
    width: '100%',
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  backButton: {
    width: '80%',
    marginTop: theme.SPACING.md,
    backgroundColor: 'rgba(65, 105, 225, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
  },
  completeButton: {
    width: '100%',
    backgroundColor: theme.COLORS.primary.purple,
    borderColor: 'rgba(255, 255, 255, 0.4)',
    borderWidth: 1,
    shadowColor: theme.COLORS.primary.purple,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 6,
    paddingVertical: theme.SPACING.md,
  },
  submitButton: {
    backgroundColor: theme.COLORS.ui.accent,
    shadowOpacity: 0.5,
    shadowRadius: 12,
  },
  message: {
    marginBottom: theme.SPACING.xl,
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
  },
  cardDescription: {
    marginBottom: theme.SPACING.xl,
    textAlign: 'center',
  },
}); 