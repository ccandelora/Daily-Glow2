import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Card } from '@/components/common';
import { useOnboarding } from '@/contexts/OnboardingContext';
import theme from '@/constants/theme';

const purposes = [
  {
    id: 'positive',
    title: 'I want to feel more positive around others',
    icon: '😊',
  },
  {
    id: 'relationships',
    title: 'I want to build better relationships',
    icon: '🤝',
  },
  {
    id: 'stress',
    title: 'I want to improve how I handle stress and anxiety',
    icon: '🧘‍♀️',
  },
  {
    id: 'emotions',
    title: 'I want to understand how emotions work',
    icon: '🤔',
  },
  {
    id: 'other',
    title: 'Another reason not listed here',
    icon: '✨',
  },
];

export const PurposeScreen = () => {
  const router = useRouter();
  const { state, setPurpose } = useOnboarding();
  const [selectedPurpose, setSelectedPurpose] = useState<string | null>(state.purpose);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const cardAnims = purposes.map(() => React.useRef(new Animated.Value(50)).current);

  useEffect(() => {
    // Fade in header
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // Stagger card animations
    Animated.stagger(100, cardAnims.map(anim =>
      Animated.spring(anim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      })
    )).start();
  }, []);

  const handlePurposeSelect = (purposeId: string) => {
    setSelectedPurpose(purposeId);
    setPurpose(purposeId);
  };

  const handleContinue = () => {
    if (selectedPurpose) {
      router.push('/setup');
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
        <Typography variant="h2" style={styles.title}>
          Before jumping in, let's explore why you're here.
        </Typography>
      </Animated.View>

      <View style={styles.content}>
        {purposes.map((purpose, index) => (
          <Animated.View
            key={purpose.id}
            style={{
              transform: [{ translateY: cardAnims[index] }],
              opacity: fadeAnim,
            }}
          >
            <TouchableOpacity
              onPress={() => handlePurposeSelect(purpose.id)}
            >
              <Card
                style={{
                  ...styles.purposeCard,
                  ...(selectedPurpose === purpose.id ? styles.selectedCard : {}),
                }}
              >
                <View style={styles.purposeContent}>
                  <Typography style={styles.icon}>{purpose.icon}</Typography>
                  <Typography>{purpose.title}</Typography>
                </View>
              </Card>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      <Animated.View style={[styles.footer, { opacity: fadeAnim }]}>
        <Button
          title="Continue"
          onPress={handleContinue}
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
  },
  header: {
    paddingVertical: theme.SPACING.xl,
  },
  title: {
    marginBottom: theme.SPACING.md,
  },
  content: {
    flex: 1,
  },
  purposeCard: {
    marginBottom: theme.SPACING.md,
  },
  selectedCard: {
    borderColor: theme.COLORS.primary.green,
    borderWidth: 2,
  },
  purposeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: theme.FONTS.sizes.xl,
    marginRight: theme.SPACING.md,
  },
  footer: {
    paddingVertical: theme.SPACING.xl,
  },
  button: {
    marginBottom: theme.SPACING.md,
  },
}); 