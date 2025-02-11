import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Card, Input, AnimatedMoodIcon } from '@/components/common';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';

const moods = [
  { id: 'great', label: 'Great', icon: '😊', color: theme.COLORS.primary.green },
  { id: 'good', label: 'Good', icon: '🙂', color: theme.COLORS.primary.blue },
  { id: 'okay', label: 'Okay', icon: '😐', color: theme.COLORS.primary.yellow },
  { id: 'bad', label: 'Bad', icon: '😕', color: theme.COLORS.primary.red },
];

export const FirstCheckInScreen = () => {
  const router = useRouter();
  const { state, setFirstCheckIn } = useOnboarding();
  const { showError } = useAppState();
  const [selectedMood, setSelectedMood] = useState<string | null>(state.firstMood);
  const [gratitude, setGratitude] = useState(state.firstGratitude);

  // Animation values
  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const moodCardAnim = React.useRef(new Animated.Value(50)).current;
  const gratitudeCardAnim = React.useRef(new Animated.Value(50)).current;
  const footerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in header
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Slide up mood card
      Animated.spring(moodCardAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Slide up gratitude card
      Animated.spring(gratitudeCardAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Fade in footer
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleComplete = () => {
    if (!selectedMood) {
      showError("Please select how you're feeling");
      return;
    }

    if (!gratitude.trim()) {
      showError("Please share something you're grateful for");
      return;
    }

    setFirstCheckIn(selectedMood, gratitude.trim());
    router.push('/(onboarding)/complete');
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Animated.View style={[styles.header, { opacity: headerAnim }]}>
        <Typography variant="h2" style={styles.title}>
          Let's do your first check-in
        </Typography>
        <Typography variant="body" style={styles.subtitle}>
          Take a moment to reflect on how you're feeling right now.
        </Typography>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View style={{
          transform: [{ translateY: moodCardAnim }],
          opacity: headerAnim,
        }}>
          <Card style={styles.moodCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              How are you feeling?
            </Typography>
            <View style={styles.moodGrid}>
              {moods.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  onPress={() => setSelectedMood(mood.id)}
                  style={styles.moodButton}
                >
                  <AnimatedMoodIcon
                    color={mood.color}
                    active={selectedMood === mood.id}
                  >
                    <Typography style={styles.moodIcon}>{mood.icon}</Typography>
                  </AnimatedMoodIcon>
                  <Typography
                    variant="caption"
                    color={selectedMood === mood.id ? mood.color : theme.COLORS.ui.textSecondary}
                  >
                    {mood.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </Card>
        </Animated.View>

        <Animated.View style={{
          transform: [{ translateY: gratitudeCardAnim }],
          opacity: headerAnim,
        }}>
          <Card style={styles.gratitudeCard}>
            <Typography variant="h3" style={styles.sectionTitle}>
              What's one thing you're grateful for?
            </Typography>
            <Input
              multiline
              value={gratitude}
              onChangeText={setGratitude}
              placeholder="Take a moment to reflect on something positive..."
              style={styles.gratitudeInput}
            />
          </Card>
        </Animated.View>
      </View>

      <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
        <Button
          title="Complete Check-in"
          onPress={handleComplete}
          style={styles.button}
        />
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
    paddingHorizontal: theme.SPACING.lg,
    paddingVertical: theme.SPACING.xl,
  },
  title: {
    marginBottom: theme.SPACING.sm,
  },
  subtitle: {
    color: theme.COLORS.ui.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.SPACING.lg,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.lg,
  },
  moodCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  moodGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  moodButton: {
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  moodIcon: {
    fontSize: theme.FONTS.sizes.xl,
  },
  gratitudeCard: {
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  gratitudeInput: {
    height: 120,
  },
  footer: {
    padding: theme.SPACING.lg,
  },
  button: {
    marginBottom: theme.SPACING.md,
  },
}); 