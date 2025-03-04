import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Onboarding Complete Screen
 * The final screen in the onboarding flow that confirms completion
 */
export default function OnboardingCompleteScreen() {
  const pathname = usePathname();
  const { completeOnboarding, state } = useOnboarding();
  
  useEffect(() => {
    // Log the path we're rendering to help debug
    if (__DEV__) {
      console.log('[OnboardingCompleteScreen] Current pathname:', pathname);
      console.log('[OnboardingCompleteScreen] Onboarding data:', state);
    }
  }, [pathname]);
  
  const handleFinish = () => {
    // Mark onboarding as complete
    completeOnboarding();
    
    // Navigate to the main app
    router.replace('/app');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.successIcon}>
          <FontAwesome5 name="check-circle" size={80} color="#8239e3" />
        </View>
        
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>
          Your personal wellness journey starts now. We've configured everything based on your preferences.
        </Text>
        
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Your preferences:</Text>
          
          <View style={styles.summaryItem}>
            <FontAwesome5 name="bullseye" size={20} color="#8239e3" style={styles.summaryIcon} />
            <View>
              <Text style={styles.summaryLabel}>Primary Goal</Text>
              <Text style={styles.summaryValue}>{state.purpose || 'Improve wellness'}</Text>
            </View>
          </View>
          
          <View style={styles.summaryItem}>
            <FontAwesome5 name="bell" size={20} color="#8239e3" style={styles.summaryIcon} />
            <View>
              <Text style={styles.summaryLabel}>Notifications</Text>
              <Text style={styles.summaryValue}>
                {state.notifications ? 'Enabled' : 'Disabled'}
                {state.notifications && state.reminderTime && 
                  ` at ${state.reminderTime}`
                }
              </Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.finishButton}
        onPress={handleFinish}
      >
        <Text style={styles.finishButtonText}>Start My Journey</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c0e2e',
    justifyContent: 'space-between',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  successIcon: {
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 40,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryContainer: {
    backgroundColor: 'rgba(130, 57, 227, 0.2)',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryIcon: {
    marginRight: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#8e8e93',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  finishButton: {
    backgroundColor: '#8239e3',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  finishButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 