import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView, Platform } from 'react-native';
import { router, usePathname } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

/**
 * Notification Preferences Screen
 * Allow users to enable/disable notifications and set reminder times
 */
export default function NotificationsScreen() {
  const pathname = usePathname();
  const { setNotificationPreferences, state } = useOnboarding();
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(state.notifications);
  const [reminderTime, setReminderTime] = useState<Date>(state.reminderTime as unknown as Date);
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);
  
  // Log the current path for debugging development URLs
  useEffect(() => {
    if (__DEV__) {
      console.log('[NotificationsScreen] Current pathname:', pathname);
    }
  }, []);
  
  // Parse the reminder time string into hours and minutes
  const timeComponents = reminderTime.toTimeString().slice(0, 5).split(':');
  const initialHours = parseInt(timeComponents[0]);
  const initialMinutes = parseInt(timeComponents[1]);
  
  // Create a date object for the time picker
  const [date, setDate] = useState(new Date());
  
  // Set the initial time
  useEffect(() => {
    const newDate = new Date();
    newDate.setHours(initialHours);
    newDate.setMinutes(initialMinutes);
    setDate(newDate);
  }, []);
  
  const handleNotificationToggle = (value: boolean) => {
    setNotificationsEnabled(value);
  };
  
  const handleTimeChange = (event: any, selectedDate?: Date) => {
    setShowTimePicker(false);
    
    if (selectedDate) {
      setDate(selectedDate);
      // Format as HH:MM
      const hours = selectedDate.getHours().toString().padStart(2, '0');
      const minutes = selectedDate.getMinutes().toString().padStart(2, '0');
      setReminderTime(new Date(`${selectedDate.toDateString()} ${hours}:${minutes}:00`));
    }
  };
  
  const showTimepicker = () => {
    setShowTimePicker(true);
  };
  
  const handleNext = () => {
    // Save notification preferences
    setNotificationPreferences(notificationsEnabled, reminderTime.toISOString());
    // Navigate to the next step
    router.push('/onboarding/first-check-in');
  };
  
  const handleBack = () => {
    router.back();
  };
  
  // Format time for display (convert from 24h to 12h format)
  const formatTimeForDisplay = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    let h = parseInt(hours);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // Convert 0 to 12
    return `${h}:${minutes} ${ampm}`;
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.stepText}>Step 2 of 5</Text>
        </View>
        
        <View style={styles.content}>
          <Text style={styles.title}>Set Up Notifications</Text>
          <Text style={styles.subtitle}>
            Daily reminders help you maintain your wellness routine
          </Text>
          
          <View style={styles.notificationSetting}>
            <View style={styles.settingHeader}>
              <Ionicons name="notifications" size={28} color="#8239e3" />
              <Text style={styles.settingTitle}>Daily Check-in Reminder</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleNotificationToggle}
              trackColor={{ false: '#444', true: '#8239e3' }}
              thumbColor="#fff"
            />
          </View>
          
          {notificationsEnabled && (
            <TouchableOpacity 
              style={styles.timeSelector}
              onPress={showTimepicker}
            >
              <Text style={styles.timeSelectorLabel}>Reminder Time</Text>
              <Text style={styles.timeValue}>{formatTimeForDisplay(reminderTime.toTimeString().slice(0, 5))}</Text>
              
              {showTimePicker && (
                <DateTimePicker
                  value={date}
                  mode="time"
                  is24Hour={false}
                  display="default"
                  onChange={handleTimeChange}
                />
              )}
            </TouchableOpacity>
          )}
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={24} color="#8e8e93" />
            <Text style={styles.infoText}>
              You can always adjust notification settings later from your profile.
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>Continue</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c0e2e',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  stepText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 'auto',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#8e8e93',
    marginBottom: 40,
  },
  notificationSetting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 15,
  },
  timeSelector: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  timeSelectorLabel: {
    color: '#8e8e93',
    fontSize: 14,
    marginBottom: 8,
  },
  timeValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginTop: 20,
  },
  infoText: {
    color: '#8e8e93',
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },
  nextButton: {
    backgroundColor: '#8239e3',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    margin: 20,
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 