import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button } from '@/components/common';
import { useOnboarding } from '@/contexts/OnboardingContext';
import theme from '@/constants/theme';

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
  const { completeOnboarding } = useOnboarding();
  const scaleAnim = React.useRef(new Animated.Value(0.3)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const footerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Mark onboarding as complete
    completeOnboarding();
  }, []);

  const handleStart = () => {
    router.replace('/(app)');
  };

  return (
    <View style={styles.container}>
      {/* Confetti */}
      {Array.from({ length: 20 }).map((_, i) => (
        <Confetti key={i} delay={i * 100} />
      ))}

      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <Typography style={styles.emoji}>🎉</Typography>
        <Typography variant="h1" style={styles.title}>
          You're All Set!
        </Typography>
        <Typography variant="body" style={styles.subtitle}>
          Congratulations on taking the first step towards better emotional well-being! 
          Your daily check-ins will help you understand yourself better and cultivate gratitude.
        </Typography>
      </Animated.View>

      <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
        <Button
          title="Begin Your Journey"
          onPress={handleStart}
          style={styles.button}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
    paddingHorizontal: theme.SPACING.lg,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 64,
    marginBottom: theme.SPACING.xl,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.SPACING.md,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    maxWidth: '80%',
    lineHeight: 24,
  },
  footer: {
    paddingBottom: theme.SPACING.xl,
  },
  button: {
    marginBottom: theme.SPACING.md,
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