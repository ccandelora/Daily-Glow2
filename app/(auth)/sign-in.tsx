import React, { useState } from 'react';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import theme from '@/constants/theme';

export default function SignInPage() {
  const router = useRouter();
  const { devManuallyVerifyEmail } = useAuth();
  const [showManualVerify, setShowManualVerify] = useState(false);
  const [email, setEmail] = useState('');
  
  const handleManualVerify = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
    
    try {
      // Call our development method to manually verify the email
      const success = await devManuallyVerifyEmail(email);
      
      if (success) {
        Alert.alert(
          'Development Note', 
          'In a real app, you would need to create a Supabase Edge Function to handle this. For now, please manually verify the email in the Supabase dashboard.',
          [{ text: 'OK', onPress: () => setShowManualVerify(false) }]
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to verify email. Please try again.');
      console.error('Manual verification error:', error);
    }
  };
  
  // For development testing only - show a button to toggle manual verification
  const DevVerifyButton = () => (
    <TouchableOpacity 
      style={styles.devButton} 
      onPress={() => setShowManualVerify(!showManualVerify)}
    >
      <Text style={styles.devButtonText}>DEV: {showManualVerify ? 'Hide' : 'Show'} Manual Verify</Text>
    </TouchableOpacity>
  );
  
  if (showManualVerify) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Manual Email Verification</Text>
        <Text style={styles.subtitle}>Development Use Only</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        
        <TouchableOpacity style={styles.verifyButton} onPress={handleManualVerify}>
          <Text style={styles.buttonText}>Verify Email</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.backButton} onPress={() => setShowManualVerify(false)}>
          <Text style={styles.backButtonText}>Back to Sign In</Text>
        </TouchableOpacity>
        
        <Text style={styles.instructionText}>
          To manually verify an email in Supabase:
          {'\n\n'}
          1. Go to your Supabase dashboard
          {'\n'}
          2. Navigate to Authentication → Users
          {'\n'}
          3. Find the user with the email you entered
          {'\n'}
          4. Click on the user and check "Email confirmed"
          {'\n'}
          5. Save the changes
          {'\n\n'}
          After this, you can sign in with your account.
        </Text>
      </View>
    );
  }
  
  return (
    <>
      <SignInScreen />
      <DevVerifyButton />
    </>
  );
}

const styles = StyleSheet.create({
  devButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: theme.COLORS.ui.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.ui.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    color: theme.COLORS.ui.text,
  },
  verifyButton: {
    backgroundColor: theme.COLORS.primary.blue,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.COLORS.ui.textSecondary,
    fontSize: 16,
  },
  instructionText: {
    marginTop: 20,
    color: theme.COLORS.ui.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
}); 