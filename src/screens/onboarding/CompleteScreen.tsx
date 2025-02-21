import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, VideoBackground } from '@/components/common';
import { useOnboarding } from '@/contexts/OnboardingContext';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const CONFETTI_COLORS = [
  theme.COLORS.primary.green,
  theme.COLORS.primary.blue,
  theme.COLORS.primary.yellow,
  theme.COLORS.primary.red,
];

const Confetti = ({ delay = 0 }: { delay?: number }) => {
  const translateY = React.useRef(new Animated.Value(-50)).current;
  const translateX = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const rotate = React.useRef(new Animated.Value(0)).current;
  const color = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 400,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(translateX, {
          toValue: (Math.random() - 0.5) * 200,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: (Math.random() - 0.5) * 4 * Math.PI,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [delay]);

  return (
    <Animated.View
      style={[
        styles.confetti,
        {
          backgroundColor: color,
          transform: [
            { translateY },
            { translateX },
            { rotate: rotate.interpolate({
              inputRange: [-4 * Math.PI, 4 * Math.PI],
              outputRange: ['-720deg', '720deg'],
            })},
          ],
          opacity,
        },
      ]}
    />
  );
};

export const CompleteScreen = () => {
  const router = useRouter();
  const { completeOnboarding, hasCompletedOnboarding } = useOnboarding();
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const buttonAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    console.log('CompleteScreen mounted');
    console.log('Initial onboarding status:', { hasCompletedOnboarding });

    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 150,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(buttonAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = async () => {
    try {
      console.log('Begin Journey button pressed');
      console.log('Current onboarding status:', { hasCompletedOnboarding });
      
      // First complete onboarding
      await completeOnboarding();
      console.log('Onboarding completed successfully');
      console.log('Updated onboarding status:', { hasCompletedOnboarding });

      // Longer delay to ensure AsyncStorage is updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log('Attempting navigation to /(app)');
      // Navigate to the app group
      router.replace('/(app)');
    } catch (error: unknown) {
      console.error('Navigation error:', error);
      if (error instanceof Error) {
        console.error('Full error details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
      }
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      
      {/* Overlay gradient for better text readability */}
      <LinearGradient
        colors={[
          'rgba(28, 14, 45, 0.8)',
          'rgba(28, 14, 45, 0.6)',
          'rgba(28, 14, 45, 0.8)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.celebrationIcon}>
          <Typography style={styles.emoji}>🎉</Typography>
        </View>

        <Typography variant="h1" style={styles.title} glow="strong">
          You're All Set!
        </Typography>

        <Typography variant="body" style={styles.subtitle} glow="medium">
          Congratulations on taking the first step towards better emotional well-being! 
          Your daily check-ins will help you understand yourself better and cultivate gratitude.
        </Typography>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: buttonAnim }]}>
        <Button
          title="Begin Your Journey"
          onPress={handleStart}
          style={styles.button}
          variant="primary"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.SPACING.xl,
  },
  celebrationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(65, 105, 225, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.SPACING.xl,
    borderWidth: 2,
    borderColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  emoji: {
    fontSize: 64,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
    color: theme.COLORS.ui.text,
    fontSize: theme.FONTS.sizes.xxxl,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    maxWidth: '90%',
    lineHeight: 28,
    fontSize: theme.FONTS.sizes.md,
  },
  footer: {
    paddingHorizontal: theme.SPACING.xl,
    paddingBottom: theme.SPACING.xl * 2,
    paddingTop: theme.SPACING.xl,
  },
  button: {
    backgroundColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  confetti: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: 0,
    left: '50%',
  },
}); 