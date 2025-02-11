import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button } from '@/components/common';
import theme from '@/constants/theme';

export const WelcomeScreen = () => {
  const router = useRouter();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Typography variant="h1" style={styles.title}>
          Daily Glow
        </Typography>
        <Typography variant="h3" style={styles.subtitle}>
          A Journal for Your Wellbeing
        </Typography>
      </Animated.View>

      <Animated.View
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Button 
          title="Get Started" 
          onPress={() => router.push('/(onboarding)/purpose')}
          style={styles.button} 
        />
        <Button 
          title="Skip for now" 
          onPress={() => router.replace('/(app)')}
          variant="secondary" 
          style={styles.button} 
        />
        <View style={styles.signUpContainer}>
          <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
            Don't have an account?{' '}
          </Typography>
          <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
            <Typography color={theme.COLORS.primary.green}>
              Sign Up
            </Typography>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
    paddingHorizontal: theme.SPACING.lg,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.SPACING.sm,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
  },
  footer: {
    paddingBottom: theme.SPACING.xl,
  },
  button: {
    marginBottom: theme.SPACING.md,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.SPACING.md,
  },
}); 