import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

const OnboardingPersonalizeScreen = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  const goals = [
    'Reduce stress',
    'Improve sleep',
    'Build healthy habits',
    'Increase mindfulness',
    'Boost mood',
    'Track mental health'
  ];

  const toggleGoal = (goal: string) => {
    if (selectedGoals.includes(goal)) {
      setSelectedGoals(selectedGoals.filter(g => g !== goal));
    } else {
      setSelectedGoals([...selectedGoals, goal]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Personalize Your Experience</Text>
        
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Your Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your name"
            value={name}
            onChangeText={setName}
          />
        </View>
        
        <View style={styles.goalsContainer}>
          <Text style={styles.label}>Select Your Goals</Text>
          <Text style={styles.subtitle}>What do you want to achieve with Daily Glow?</Text>
          
          <View style={styles.goalsList}>
            {goals.map((goal) => (
              <TouchableOpacity
                key={goal}
                style={[
                  styles.goalItem,
                  selectedGoals.includes(goal) && styles.selectedGoal
                ]}
                onPress={() => toggleGoal(goal)}
              >
                {selectedGoals.includes(goal) && (
                  <Ionicons name="checkmark-circle" size={20} color={theme.COLORS.primary.green} style={styles.checkIcon} />
                )}
                <Text style={[
                  styles.goalText,
                  selectedGoals.includes(goal) && styles.selectedGoalText
                ]}>
                  {goal}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/(onboarding)/notifications')}
        >
          <Text style={styles.buttonText}>Continue</Text>
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
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.COLORS.primary.green,
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: theme.COLORS.ui.text,
  },
  subtitle: {
    fontSize: 14,
    color: theme.COLORS.ui.textSecondary,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.COLORS.ui.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  goalsContainer: {
    marginBottom: 30,
  },
  goalsList: {
    marginTop: 10,
  },
  goalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderWidth: 1,
    borderColor: theme.COLORS.ui.border,
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  selectedGoal: {
    borderColor: theme.COLORS.primary.green,
    backgroundColor: 'rgba(0, 158, 76, 0.05)',
  },
  goalText: {
    fontSize: 16,
    color: theme.COLORS.ui.text,
  },
  selectedGoalText: {
    fontWeight: '500',
    color: theme.COLORS.primary.green,
  },
  checkIcon: {
    marginRight: 10,
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
});

export default OnboardingPersonalizeScreen; 