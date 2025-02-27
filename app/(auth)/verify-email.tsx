import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { verifyEmailWithToken } from '@/utils/authUtils';
import { Button } from '@/components/common/Button';
import theme from '@/constants/theme';

export default function VerifyEmailPage() {
  const { refreshSession } = useAuth();
  const { showSuccess, showError } = useAppState();
  const router = useRouter();
  const params = useLocalSearchParams();
  const [verifying, setVerifying] = React.useState(true);
  const [verified, setVerified] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  useEffect(() => {
    const handleVerification = async () => {
      console.log('VerifyEmailPage mounted with params:', JSON.stringify(params));
      setVerifying(true);
      
      // Check if we have a token in the URL params
      const token = params.token as string;
      
      if (token) {
        try {
          console.log('Verifying email with token from params:', token);
          const success = await verifyEmailWithToken(token);
          
          if (success) {
            console.log('Email verification successful!');
            showSuccess('Email verified successfully!');
            setVerified(true);
            // Refresh the session to update the verification status
            await refreshSession();
          } else {
            console.error('Email verification failed');
            setError('Failed to verify email. The link may have expired.');
            showError('Failed to verify email. The link may have expired.');
          }
        } catch (error) {
          console.error('Error handling verification token:', error);
          setError(error instanceof Error ? error.message : 'An unknown error occurred');
          showError('An error occurred while verifying your email');
        }
      } else {
        console.log('No token found in params');
        setError('No verification token found');
      }
      
      setVerifying(false);
    };
    
    handleVerification();
  }, [params.token]);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Email Verification</Text>
      
      {verifying && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.COLORS.primary.blue} />
          <Text style={styles.message}>Verifying your email...</Text>
        </View>
      )}
      
      {!verifying && verified && (
        <View style={styles.successContainer}>
          <Text style={styles.successMessage}>Your email has been verified successfully!</Text>
          <Button 
            title="Continue to App" 
            onPress={() => router.replace('/')}
            style={styles.button}
          />
        </View>
      )}
      
      {!verifying && !verified && error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>Verification Failed</Text>
          <Text style={styles.errorDetail}>{error}</Text>
          <Button 
            title="Go to Sign In" 
            onPress={() => router.replace('/sign-in')}
            style={styles.button}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.ui.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: theme.COLORS.ui.text,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  message: {
    marginTop: 20,
    fontSize: 16,
    textAlign: 'center',
    color: theme.COLORS.ui.text,
  },
  successContainer: {
    alignItems: 'center',
  },
  successMessage: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.COLORS.primary.green,
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorMessage: {
    fontSize: 18,
    textAlign: 'center',
    color: theme.COLORS.primary.red,
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    color: theme.COLORS.ui.text,
  },
  button: {
    marginTop: 20,
    minWidth: 200,
  },
}); 