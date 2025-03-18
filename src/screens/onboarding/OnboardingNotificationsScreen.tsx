import React, { useState } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '@/contexts/OnboardingContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OnboardingNotificationsScreen = () => {
  const router = useRouter();
  const { completeOnboarding } = useOnboarding();
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [morningCheckinEnabled, setMorningCheckinEnabled] = useState(false);
  const [eveningCheckinEnabled, setEveningCheckinEnabled] = useState(false);

  const handleCompleteOnboarding = async () => {
    try {
      // Save notification preferences
      const notificationPreferences = {
        dailyReminders: reminderEnabled,
        morningCheckin: morningCheckinEnabled,
        eveningReflection: eveningCheckinEnabled
      };
      
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(notificationPreferences));
      
      // If user enabled any notifications, request permissions
      if (reminderEnabled || morningCheckinEnabled || eveningCheckinEnabled) {
        // Just show an alert for now, as we're not implementing full notifications in this fix
        Alert.alert(
          'Notifications Enabled',
          'You have enabled notifications. In a complete implementation, we would save these preferences.',
          [{ text: 'OK' }]
        );
      }
      
      // Mark onboarding as completed in AsyncStorage
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      
      // Complete onboarding process using the context
      await completeOnboarding();
      
      // Navigate to the main app
      router.replace('/(app)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Try to complete onboarding anyway even if saving preferences fails
      await completeOnboarding();
      router.replace('/(app)');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.contentContainer}>
        <View style={styles.headerContainer}>
          <Ionicons name="notifications" size={80} color={theme.COLORS.primary.green} />
          <Text style={styles.title}>Stay on Track</Text>
          <Text style={styles.subtitle}>
            Enable notifications to help you maintain your daily wellness routine
          </Text>
        </View>
        
        <View style={styles.optionsContainer}>
          <View style={styles.optionItem}>
            <View>
              <Text style={styles.optionTitle}>Daily Reminders</Text>
              <Text style={styles.optionDesc}>Get reminded to check in daily</Text>
            </View>
            <Switch
              value={reminderEnabled}
              onValueChange={setReminderEnabled}
              trackColor={{ false: "#ccc", true: theme.COLORS.primary.green }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.optionItem}>
            <View>
              <Text style={styles.optionTitle}>Morning Check-in</Text>
              <Text style={styles.optionDesc}>Start your day mindfully at 8:00 AM</Text>
            </View>
            <Switch
              value={morningCheckinEnabled}
              onValueChange={setMorningCheckinEnabled}
              trackColor={{ false: "#ccc", true: theme.COLORS.primary.green }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
            />
          </View>
          
          <View style={styles.optionItem}>
            <View>
              <Text style={styles.optionTitle}>Evening Reflection</Text>
              <Text style={styles.optionDesc}>Reflect on your day at 8:00 PM</Text>
            </View>
            <Switch
              value={eveningCheckinEnabled}
              onValueChange={setEveningCheckinEnabled}
              trackColor={{ false: "#ccc", true: theme.COLORS.primary.green }}
              thumbColor={Platform.OS === 'ios' ? '#fff' : "#f4f3f4"}
            />
          </View>
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleCompleteOnboarding}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.button}
          onPress={handleCompleteOnboarding}
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
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.COLORS.primary.green,
    marginVertical: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  optionsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.ui.border,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.COLORS.ui.text,
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: theme.COLORS.ui.textSecondary,
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.ui.border,
  },
  button: {
    backgroundColor: theme.COLORS.primary.green,
    paddingVertical: 15,
    borderRadius: 30,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  skipButton: {
    paddingVertical: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  skipButtonText: {
    color: theme.COLORS.ui.textSecondary,
    fontSize: 16,
  },
});

export default OnboardingNotificationsScreen; 