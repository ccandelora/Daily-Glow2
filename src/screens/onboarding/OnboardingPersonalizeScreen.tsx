import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { VideoBackground } from '@/components/common';
import { useProfile } from '@/contexts/UserProfileContext';

// Define a type for our goal items that includes the icon type
type Goal = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const OnboardingPersonalizeScreen = () => {
  const router = useRouter();
  const { dbError, errorType } = useOnboarding();
  const { updateProfile, saveUserGoals } = useProfile();
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const goals: Goal[] = [
    { id: 'stress', label: 'Reduce stress', icon: 'leaf' },
    { id: 'sleep', label: 'Improve sleep', icon: 'moon' },
    { id: 'habits', label: 'Build healthy habits', icon: 'fitness' },
    { id: 'mindful', label: 'Increase mindfulness', icon: 'heart' },
    { id: 'mood', label: 'Boost mood', icon: 'sunny' },
    { id: 'track', label: 'Track mental health', icon: 'pulse' }
  ];

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleContinue = async () => {
    if (isSaving) return; // Prevent double-taps
    setIsSaving(true);
    
    try {
      // Save user preferences to AsyncStorage for local access
      if (name.trim()) {
        await AsyncStorage.setItem('userName', name.trim());
      }
      
      if (selectedGoals.length > 0) {
        await AsyncStorage.setItem('userGoals', JSON.stringify(selectedGoals));
      }
      
      // Save to database via UserProfileContext
      try {
        if (name.trim()) {
          await updateProfile({ display_name: name.trim() });
        }
        
        if (selectedGoals.length > 0) {
          await saveUserGoals(selectedGoals);
        }
      } catch (dbErr) {
        console.error('Error saving to database:', dbErr);
        // Continue with onboarding even if database save fails
      }
      
      // Navigate to notifications screen
      router.push('/(onboarding)/notifications');
    } catch (error) {
      console.error('Error saving personalization data:', error);
      
      Alert.alert(
        "Warning",
        "Unable to save your preferences, but you can continue with the setup.",
        [{ 
          text: "Continue Anyway", 
          onPress: () => router.push('/(onboarding)/notifications')
        }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <VideoBackground />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="person-circle-outline" size={40} color={theme.COLORS.primary.green} />
          </View>
          <Text style={styles.title}>Personalize Your Experience</Text>
          <Text style={styles.subtitle}>Tell us about yourself so we can customize your experience</Text>
        </View>
        
        <View style={styles.card}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Your Name</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
              placeholderTextColor="rgba(255, 255, 255, 0.5)"
            />
          </View>
          
          <View style={styles.goalsContainer}>
            <Text style={styles.label}>Select Your Goals</Text>
            <Text style={styles.helperText}>What do you want to achieve with Daily Glow?</Text>
            
            <View style={styles.goalsList}>
              {goals.map((goal) => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalItem,
                    selectedGoals.includes(goal.id) && styles.selectedGoal
                  ]}
                  onPress={() => toggleGoal(goal.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.goalIconContainer,
                    selectedGoals.includes(goal.id) && styles.selectedGoalIconContainer
                  ]}>
                    <Ionicons 
                      name={goal.icon} 
                      size={24} 
                      color={selectedGoals.includes(goal.id) ? 
                        theme.COLORS.primary.green : 
                        'rgba(255, 255, 255, 0.7)'} 
                    />
                  </View>
                  <Text style={[
                    styles.goalText,
                    selectedGoals.includes(goal.id) && styles.selectedGoalText
                  ]}>
                    {goal.label}
                  </Text>
                  {selectedGoals.includes(goal.id) && (
                    <Ionicons 
                      name="checkmark-circle" 
                      size={22} 
                      color={theme.COLORS.primary.green} 
                      style={styles.checkIcon} 
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
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
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, isSaving && styles.disabledButton]}
          onPress={handleContinue}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>
            {isSaving ? "Saving..." : "Continue"}
          </Text>
          {isSaving ? (
            <Ionicons name="hourglass-outline" size={20} color="#fff" />
          ) : (
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
  scrollContent: {
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
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#fff',
  },
  helperText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
  },
  goalsContainer: {
    marginBottom: 16,
  },
  goalsList: {
    marginTop: 8,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  selectedGoal: {
    borderColor: theme.COLORS.primary.green,
    backgroundColor: 'rgba(0, 158, 76, 0.15)',
  },
  goalIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  selectedGoalIconContainer: {
    backgroundColor: 'rgba(0, 158, 76, 0.2)',
  },
  goalText: {
    fontSize: 16,
    color: '#fff',
    flex: 1,
  },
  selectedGoalText: {
    fontWeight: '500',
    color: theme.COLORS.primary.green,
  },
  checkIcon: {
    marginLeft: 5,
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

export default OnboardingPersonalizeScreen; 