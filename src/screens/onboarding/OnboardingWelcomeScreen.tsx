import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { VideoBackground } from '@/components/common';

const OnboardingWelcomeScreen = () => {
  const router = useRouter();
  const { dbError, errorType } = useOnboarding();

  const handleGetStarted = () => {
    router.push('/(onboarding)/personalize');
  };

  return (
    <SafeAreaView style={styles.container}>
      <VideoBackground />
      <View style={styles.content}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../../../assets/default_transparent_353x345.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Content Section */}
        <View style={styles.textContainer}>
          <Text style={styles.title}>Welcome to Daily Glow</Text>
          <Text style={styles.subtitle}>
            Your personalized companion for tracking and improving your mental wellness
          </Text>
        </View>

        {/* Features Section */}
        <View style={styles.featuresContainer}>
          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="calendar-outline" size={24} color={theme.COLORS.primary.green} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Daily Check-ins</Text>
              <Text style={styles.featureDescription}>Track your mood and wellness journey</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="analytics-outline" size={24} color={theme.COLORS.primary.green} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Insights & Analytics</Text>
              <Text style={styles.featureDescription}>Understand patterns in your mental health</Text>
            </View>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIconContainer}>
              <Ionicons name="trophy-outline" size={24} color={theme.COLORS.primary.green} />
            </View>
            <View style={styles.featureTextContainer}>
              <Text style={styles.featureTitle}>Goals & Achievements</Text>
              <Text style={styles.featureDescription}>Celebrate your progress and milestones</Text>
            </View>
          </View>
        </View>

        {/* Database Error Notice */}
        {dbError && (
          <View style={styles.errorContainer}>
            <Ionicons 
              name={errorType === 'schema' ? 'construct-outline' : 'cloud-offline-outline'} 
              size={20} 
              color="rgba(255, 59, 48, 0.8)" 
            />
            <Text style={styles.errorText}>
              {errorType === 'schema'
                ? "Your app is missing required database tables. Your progress will be saved locally."
                : "You're in offline mode. Your progress will be saved locally."}
            </Text>
          </View>
        )}
      </View>

      {/* Call to Action Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>Get Started</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    borderRadius: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.COLORS.primary.green,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: theme.COLORS.ui.text,
    textAlign: 'center',
    lineHeight: 24,
  },
  featuresContainer: {
    marginBottom: 30,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  featureIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 158, 76, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 10,
    flex: 1,
  },
  buttonContainer: {
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  button: {
    backgroundColor: theme.COLORS.primary.green,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
});

export default OnboardingWelcomeScreen; 