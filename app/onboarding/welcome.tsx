import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { WelcomeScreen } from '@/screens/onboarding/WelcomeScreen';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * Welcome screen for onboarding
 * First screen in the onboarding flow that introduces the app
 */
export default function OnboardingWelcomeScreen() {
  const pathname = usePathname();
  const router = useRouter();
  const { resetOnboarding } = useOnboarding();
  
  useEffect(() => {
    // Reset onboarding state when starting the flow
    resetOnboarding();
    
    // Log the path we're rendering to help debug
    console.log('🔍 DEBUG: Rendering onboarding welcome screen with path:', pathname);
  }, [pathname]);
  
  const handleStart = () => {
    // Navigate to the first step in the onboarding flow
    router.push('/onboarding/purpose');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require('@/assets/images/welcome-illustration.png')} 
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Welcome to Daily Glow</Text>
        <Text style={styles.subtitle}>
          Let's set up your personal wellness journey
        </Text>
      </View>
      
      <TouchableOpacity 
        style={styles.startButton}
        onPress={handleStart}
      >
        <Text style={styles.startButtonText}>Get Started</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c0e2e',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  image: {
    width: 300,
    height: 300,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#8e8e93',
    marginTop: 10,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#8239e3',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 12,
    marginBottom: 30,
    width: '100%',
    alignItems: 'center',
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 