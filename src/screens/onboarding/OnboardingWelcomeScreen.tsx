import React from 'react';
import { View, Text, StyleSheet, Image, Dimensions, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import theme from '@/constants/theme';
import { useRouter } from 'expo-router';

const { width, height } = Dimensions.get('window');

const OnboardingWelcomeScreen = () => {
  const router = useRouter();
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          source={require('../../../assets/splash-square.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome to Daily Glow</Text>
        <Text style={styles.subtitle}>
          Your daily companion for mindfulness and personal growth
        </Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/personalize')}
        >
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width * 0.8,
    height: height * 0.4,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.COLORS.primary.green,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  button: {
    backgroundColor: theme.COLORS.primary.green,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});

export default OnboardingWelcomeScreen; 