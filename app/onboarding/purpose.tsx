import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { FontAwesome5 } from '@expo/vector-icons';

/**
 * Purpose Selection Screen
 * Allow users to select or input their primary wellness purpose
 */
export default function PurposeScreen() {
  const router = useRouter();
  const { setPurpose, state } = useOnboarding();
  const [selectedPurpose, setSelectedPurpose] = useState(state.purpose || '');
  const [customPurpose, setCustomPurpose] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  
  const purposes = [
    'Improve mental health',
    'Track daily mood',
    'Develop gratitude practice',
    'Reduce stress and anxiety',
    'Build better habits',
    'Custom goal'
  ];
  
  const handlePurposeSelect = (purpose: string) => {
    if (purpose === 'Custom goal') {
      setShowCustomInput(true);
      setSelectedPurpose('');
    } else {
      setSelectedPurpose(purpose);
      setShowCustomInput(false);
    }
  };
  
  const handleNext = () => {
    // Save the purpose
    const finalPurpose = showCustomInput ? customPurpose : selectedPurpose;
    if (finalPurpose.trim()) {
      setPurpose(finalPurpose.trim());
      // Navigate to the next step
      router.push('/onboarding/notifications');
    }
  };
  
  const handleBack = () => {
    router.back();
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.stepText}>Step 1 of 5</Text>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title}>What brings you to Daily Glow?</Text>
        <Text style={styles.subtitle}>
          Select your primary goal so we can customize your experience
        </Text>
        
        <View style={styles.purposeContainer}>
          {purposes.map((purpose) => (
            <TouchableOpacity
              key={purpose}
              style={[
                styles.purposeButton,
                selectedPurpose === purpose && styles.selectedPurpose
              ]}
              onPress={() => handlePurposeSelect(purpose)}
            >
              <Text 
                style={[
                  styles.purposeText,
                  selectedPurpose === purpose && styles.selectedPurposeText
                ]}
              >
                {purpose}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        {showCustomInput && (
          <TextInput
            style={styles.customInput}
            placeholder="Enter your personal goal..."
            placeholderTextColor="#8e8e93"
            value={customPurpose}
            onChangeText={setCustomPurpose}
            maxLength={50}
          />
        )}
      </View>
      
      <TouchableOpacity 
        style={[
          styles.nextButton,
          (!selectedPurpose && !customPurpose) && styles.disabledButton
        ]}
        onPress={handleNext}
        disabled={!selectedPurpose && !customPurpose}
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
    marginBottom: 30,
  },
  purposeContainer: {
    marginTop: 20,
  },
  purposeButton: {
    backgroundColor: 'rgba(130, 57, 227, 0.2)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(130, 57, 227, 0.3)',
  },
  selectedPurpose: {
    backgroundColor: 'rgba(130, 57, 227, 0.4)',
    borderColor: '#8239e3',
  },
  purposeText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedPurposeText: {
    fontWeight: 'bold',
  },
  customInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 15,
    color: '#fff',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(130, 57, 227, 0.3)',
  },
  nextButton: {
    backgroundColor: '#8239e3',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: 'rgba(130, 57, 227, 0.4)',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 