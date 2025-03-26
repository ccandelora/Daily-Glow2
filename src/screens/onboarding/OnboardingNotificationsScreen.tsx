import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VideoBackground } from '@/components/common';

type NotificationPreference = {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  enabled: boolean;
};

const OnboardingNotificationsScreen = () => {
  const router = useRouter();
  const { dbError, errorType, completeOnboarding } = useOnboarding();
  const [isCompleting, setIsCompleting] = useState(false);
  
  const [notificationPrefs, setNotificationPrefs] = useState<NotificationPreference[]>([
    {
      id: 'dailyReminder',
      title: 'Daily Check-in Reminder',
      description: 'Get a friendly nudge to complete your daily check-in',
      icon: 'notifications-outline',
      enabled: true,
    },
    {
      id: 'achievements',
      title: 'Achievement Alerts',
      description: 'Be notified when you earn badges and reach goals',
      icon: 'trophy-outline',
      enabled: true,
    },
  ]);

  const toggleNotification = (id: string) => {
    setNotificationPrefs(notificationPrefs.map(pref => 
      pref.id === id ? { ...pref, enabled: !pref.enabled } : pref
    ));
  };

  const requestNotificationPermissions = async () => {
    if (Platform.OS === 'android') {
      // Android doesn't need explicit permission for local notifications
      return { granted: true };
    }
    
    const { status } = await Notifications.requestPermissionsAsync();
    return { granted: status === 'granted' };
  };

  const saveNotificationPreferencesLocal = async () => {
    try {
      const enabledPrefIds = notificationPrefs
        .filter(pref => pref.enabled)
        .map(pref => pref.id);
        
      await AsyncStorage.setItem('notificationPreferences', JSON.stringify(enabledPrefIds));
      
      return true;
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      return false;
    }
  };

  const handleFinishOnboarding = async () => {
    if (isCompleting) return; // Prevent double-taps
    setIsCompleting(true);

    try {
      // 1. Request permissions if any notification is enabled
      const anyEnabled = notificationPrefs.some(pref => pref.enabled);
      
      if (anyEnabled) {
        const { granted } = await requestNotificationPermissions();
        
        if (!granted) {
          // User declined notifications
          Alert.alert(
            "Notifications Disabled",
            "You won't receive reminders or updates. You can enable them later in your device settings.",
            [{ text: "Continue Anyway" }]
          );
        }
      }
      
      // 2. Save user preferences
      await saveNotificationPreferencesLocal();
      
      // 3. Complete onboarding
      await completeOnboarding();
      
      // 4. Navigate to main app
      router.replace('/(app)');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      
      Alert.alert(
        "Error",
        "There was a problem completing setup. Would you like to try again?",
        [
          { 
            text: "Try Again", 
            onPress: () => setIsCompleting(false) 
          },
          { 
            text: "Skip Setup", 
            onPress: () => router.replace('/(app)'),
            style: "destructive"
          }
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <VideoBackground />
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="notifications" size={40} color={theme.COLORS.primary.green} />
          </View>
          <Text style={styles.title}>Stay Updated</Text>
          <Text style={styles.subtitle}>Choose which notifications you'd like to receive</Text>
        </View>

        {/* Notification Preferences Card */}
        <View style={styles.card}>
          {notificationPrefs.map((pref) => (
            <View key={pref.id} style={styles.prefItem}>
              <View style={styles.prefIcon}>
                <Ionicons name={pref.icon} size={24} color={theme.COLORS.primary.green} />
              </View>
              <View style={styles.prefTextContainer}>
                <Text style={styles.prefTitle}>{pref.title}</Text>
                <Text style={styles.prefDescription}>{pref.description}</Text>
              </View>
              <Switch
                value={pref.enabled}
                onValueChange={() => toggleNotification(pref.id)}
                trackColor={{ false: 'rgba(255, 255, 255, 0.2)', true: 'rgba(0, 158, 76, 0.3)' }}
                thumbColor={pref.enabled ? theme.COLORS.primary.green : '#f4f3f4'}
                ios_backgroundColor="rgba(255, 255, 255, 0.2)"
              />
            </View>
          ))}
          
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
                  ? "Your app is missing required database tables. Your preferences will be saved locally."
                  : "You're in offline mode. Your preferences will be saved locally."}
              </Text>
            </View>
          )}
        </View>

        {/* Information Box */}
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={22} color="rgba(255, 255, 255, 0.7)" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            You can always change your notification preferences later in the app settings.
          </Text>
        </View>
      </View>

      {/* Finish Button Container */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, isCompleting && styles.disabledButton]} 
          onPress={handleFinishOnboarding}
          disabled={isCompleting}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isCompleting ? "Finalizing Setup..." : "Complete Setup"}
          </Text>
          {isCompleting ? (
            <Ionicons name="hourglass-outline" size={20} color="#fff" />
          ) : (
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
          )}
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
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0, 158, 76, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.COLORS.primary.green,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  prefItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  prefIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(0, 158, 76, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  prefTextContainer: {
    flex: 1,
  },
  prefTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  prefDescription: {
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
    marginTop: 16,
  },
  errorText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 10,
    flex: 1,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 10,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  infoIcon: {
    marginRight: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    flex: 1,
    lineHeight: 20,
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
  disabledButton: {
    backgroundColor: 'rgba(0, 158, 76, 0.5)',
    shadowOpacity: 0.1,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 10,
  },
});

export default OnboardingNotificationsScreen; 