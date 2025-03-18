import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Typography, Button, VideoBackground, Logo } from '@/components/common';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';

export const EmailVerificationSuccessScreen = () => {
  const router = useRouter();
  const { refreshSession, user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationSuccess, setVerificationSuccess] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setIsVerifying(true);
        console.log('Starting email verification process...');
        
        // Refresh the session to update the email verification status
        const { isVerified } = await refreshSession();
        
        console.log('Verification result:', isVerified);
        setVerificationSuccess(isVerified);
      } catch (error) {
        console.error('Error during verification:', error);
        setVerificationSuccess(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, []);

  const handleContinue = () => {
    router.replace('/(app)');
  };

  const handleRetry = async () => {
    setIsVerifying(true);
    try {
      const { isVerified } = await refreshSession();
      setVerificationSuccess(isVerified);
    } catch (error) {
      console.error('Error during retry:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      
      {/* Dark overlay gradient */}
      <LinearGradient
        colors={[
          'rgba(28, 14, 45, 0.8)',
          'rgba(28, 14, 45, 0.6)',
          'rgba(28, 14, 45, 0.8)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <Logo size="large" />
          </View>

          {isVerifying ? (
            <>
              <Typography variant="h1" style={styles.title} glow="strong">
                Verifying Email...
              </Typography>
              <Typography variant="body" style={styles.subtitle} glow="medium">
                Please wait while we verify your email address.
              </Typography>
            </>
          ) : verificationSuccess ? (
            <>
              <Typography variant="h1" style={styles.title} glow="strong">
                Email Verified!
              </Typography>
              <Typography variant="body" style={styles.subtitle} glow="medium">
                Thank you for verifying your email. You now have full access to all features of Daily Glow.
              </Typography>
              <View style={styles.buttonContainer}>
                <Button
                  title="Continue to App"
                  onPress={handleContinue}
                  style={styles.continueButton}
                  variant="primary"
                />
              </View>
            </>
          ) : (
            <>
              <Typography variant="h1" style={styles.title} glow="strong">
                Verification Issue
              </Typography>
              <Typography variant="body" style={styles.subtitle} glow="medium">
                We couldn't verify your email at this time. This might happen if you've already verified your email or if the verification link has expired.
              </Typography>
              <View style={styles.buttonContainer}>
                <Button
                  title="Try Manual Verification"
                  onPress={() => router.push('/(auth)/manual-verification')}
                  style={styles.manualVerifyButton}
                  variant="secondary"
                />
                <Button
                  title="Try Again"
                  onPress={handleRetry}
                  style={styles.retryButton}
                  variant="outline"
                />
                <Button
                  title="Continue to App"
                  onPress={handleContinue}
                  style={styles.continueButton}
                  variant="primary"
                />
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.SPACING.xl,
    paddingTop: theme.SPACING.xl * 2,
    paddingBottom: theme.SPACING.xl * 2,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(65, 105, 225, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.SPACING.xl,
    borderWidth: 2,
    borderColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
    fontSize: theme.FONTS.sizes.xxxl,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    maxWidth: '90%',
    lineHeight: 24,
    fontSize: theme.FONTS.sizes.md,
    marginBottom: theme.SPACING.xl,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: theme.SPACING.lg,
  },
  continueButton: {
    backgroundColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  retryButton: {
    marginBottom: theme.SPACING.md,
    borderColor: theme.COLORS.ui.accent,
  },
  manualVerifyButton: {
    marginBottom: theme.SPACING.md,
    backgroundColor: theme.COLORS.primary.purple,
  },
}); 