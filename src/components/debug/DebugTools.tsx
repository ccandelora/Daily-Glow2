import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

export const DebugTools = () => {
  const { resetOnboarding } = useOnboarding();
  const { user } = useAuth();

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will reset your onboarding status. You will need to go through onboarding again.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          onPress: async () => {
            try {
              console.log('Manually resetting onboarding status');
              
              // Reset onboarding in context (which should update AsyncStorage and DB)
              await resetOnboarding();
              
              // Double-check with direct DB update using RPC function
              if (user) {
                console.log('Verifying reset for user:', user.id);
                const { data, error } = await supabase
                  .from('profiles')
                  .select('has_completed_onboarding')
                  .eq('user_id', user.id)
                  .single();
                  
                if (error) {
                  console.error('Error verifying reset:', error);
                } else if (data.has_completed_onboarding) {
                  console.warn('Reset verification failed, trying RPC function directly');
                  const { error: rpcError } = await supabase.rpc('reset_user_onboarding', {
                    user_id_param: user.id
                  });
                  
                  if (rpcError) {
                    console.error('RPC reset failed:', rpcError);
                    Alert.alert('Warning', 'Reset may not have been fully applied');
                  }
                }
              }
              
              // Clear onboarding state in AsyncStorage
              await AsyncStorage.removeItem('@onboarding_state');
              
              Alert.alert(
                'Success',
                'Onboarding status reset successfully. Please restart the app.',
                [
                  {
                    text: 'OK',
                    onPress: () => {
                      // Force reload the app if possible
                      if (typeof window !== 'undefined') {
                        window.location.reload();
                      }
                    },
                  },
                ]
              );
            } catch (error) {
              console.error('Error resetting onboarding:', error);
              Alert.alert('Error', 'Failed to reset onboarding status');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  const handleCheckOnboardingStatus = async () => {
    try {
      // Check AsyncStorage
      const savedState = await AsyncStorage.getItem('@onboarding_state');
      const parsedState = savedState ? JSON.parse(savedState) : null;
      
      // Check database
      let dbStatus = 'Unknown';
      let columnExists = 'Unknown';
      let nullCount = 'Unknown';
      
      if (user) {
        // Check if column exists and get profile data
        try {
          const { data: structureData, error: structureError } = await supabase.rpc('check_profiles_structure');
          
          if (!structureError && structureData) {
            // Find the has_completed_onboarding column in the results
            const onboardingColumn = structureData.find((col: { column_name: string }) => col.column_name === 'has_completed_onboarding');
            columnExists = onboardingColumn ? 'Yes' : 'No';
          }
        } catch (error) {
          console.error('Error checking table structure:', error);
        }
        
        // Check for NULL values
        try {
          const { data: nullData, error: nullError } = await supabase.rpc('check_null_onboarding');
          
          if (!nullError && nullData !== null) {
            nullCount = nullData.toString();
          }
        } catch (error) {
          console.error('Error checking NULL values:', error);
        }
        
        // Get user's onboarding status
        const { data, error } = await supabase
          .from('profiles')
          .select('has_completed_onboarding')
          .eq('user_id', user.id)
          .single();
          
        if (!error && data) {
          dbStatus = data.has_completed_onboarding ? 'Complete' : 'Not Complete';
        } else {
          dbStatus = `Error: ${error?.message || 'Unknown error'}`;
        }
      } else {
        dbStatus = 'No user logged in';
      }
      
      Alert.alert(
        'Onboarding Status',
        `AsyncStorage: ${parsedState ? (parsedState.isComplete ? 'Complete' : 'Not Complete') : 'Not Found'}\n\n` +
        `Database: ${dbStatus}\n\n` +
        `Column Exists: ${columnExists}\n\n` +
        `NULL Values: ${nullCount}`
      );
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      Alert.alert('Error', 'Failed to check onboarding status');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Tools</Text>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleResetOnboarding}
      >
        <Text style={styles.buttonText}>Reset Onboarding</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleCheckOnboardingStatus}
      >
        <Text style={styles.buttonText}>Check Onboarding Status</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});

export default DebugTools; 