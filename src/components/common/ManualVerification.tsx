import React, { useState } from 'react';
import { View, StyleSheet, TextInput, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { verifyEmailWithToken } from '@/utils/authUtils';
import { useRouter } from 'expo-router';
import { Button, Typography } from '@/components/common';

export const ManualVerification = () => {
  const [token, setToken] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const { refreshSession } = useAuth();
  const { showSuccess, showError } = useAppState();
  const router = useRouter();

  const handleVerify = async () => {
    if (!token.trim()) {
      showError('Please enter a verification token');
      return;
    }

    setIsVerifying(true);
    try {
      console.log('Verifying with token:', token);
      const success = await verifyEmailWithToken(token);

      if (success) {
        console.log('Email verification successful!');
        showSuccess('Email verified successfully!');
        // Refresh the session to update the verification status
        await refreshSession();
        
        // Show a success alert
        Alert.alert(
          'Verification Successful',
          'Your email has been verified successfully!',
          [{ text: 'OK', onPress: () => router.replace('app') }]
        );
      } else {
        console.error('Email verification failed');
        showError('Failed to verify email. The token may be invalid or expired.');
      }
    } catch (error) {
      console.error('Error verifying email:', error);
      showError('An error occurred while verifying your email');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <Typography variant="h2" style={styles.title}>Manual Email Verification</Typography>
      
      <Typography variant="body" style={styles.instructions}>
        If you're having trouble with the verification link, you can manually verify your email by pasting the token from the verification link below.
      </Typography>
      
      <Typography variant="body" style={styles.instructions}>
        To get the token, copy the part after "token=" and before "&" in the verification link from your email.
      </Typography>
      
      <TextInput
        style={styles.input}
        placeholder="Paste verification token here"
        value={token}
        onChangeText={setToken}
        autoCapitalize="none"
        autoCorrect={false}
      />
      
      <Button
        title="Verify Email"
        onPress={handleVerify}
        loading={isVerifying}
        disabled={isVerifying || !token.trim()}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  title: {
    marginBottom: 15,
    textAlign: 'center',
  },
  instructions: {
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
  },
}); 