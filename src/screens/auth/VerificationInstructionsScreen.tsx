import React from 'react';
import { View, StyleSheet, ScrollView, Linking } from 'react-native';
import { Typography, Button, VideoBackground, Logo, Card } from '@/components/common';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export const VerificationInstructionsScreen = () => {
  const router = useRouter();
  const { user, resendVerificationEmail } = useAuth();

  const handleResendEmail = async () => {
    if (user?.email) {
      await resendVerificationEmail(user.email);
    }
  };

  const handleOpenEmail = async () => {
    // Try to open the default email app
    await Linking.openURL('mailto:');
  };

  const handleContinue = () => {
    router.replace('/(app)');
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

          <Typography variant="h1" style={styles.title} glow="strong">
            Verify Your Email
          </Typography>

          <Typography variant="body" style={styles.subtitle} glow="medium">
            We've sent a verification link to your email address. Please verify your email to unlock all features.
          </Typography>

          <Card style={styles.instructionsCard}>
            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Typography variant="h3" color={theme.COLORS.primary.green}>1</Typography>
              </View>
              <View style={styles.stepTextContainer}>
                <Typography variant="body" style={styles.stepText}>
                  Open your email app and check your inbox
                </Typography>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Typography variant="h3" color={theme.COLORS.primary.green}>2</Typography>
              </View>
              <View style={styles.stepTextContainer}>
                <Typography variant="body" style={styles.stepText}>
                  Open the email from "Supabase Auth"
                </Typography>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Typography variant="h3" color={theme.COLORS.primary.green}>3</Typography>
              </View>
              <View style={styles.stepTextContainer}>
                <Typography variant="body" style={styles.stepText}>
                  Tap the "Confirm your mail" link
                </Typography>
              </View>
            </View>

            <View style={styles.stepContainer}>
              <View style={styles.stepIconContainer}>
                <Typography variant="h3" color={theme.COLORS.primary.green}>4</Typography>
              </View>
              <View style={styles.stepTextContainer}>
                <Typography variant="body" style={styles.stepText}>
                  Return to the app and enjoy all features
                </Typography>
              </View>
            </View>
          </Card>

          <View style={styles.buttonContainer}>
            <Button
              title="Open Email App"
              onPress={handleOpenEmail}
              style={styles.emailButton}
              variant="primary"
            />
            
            <Button
              title="Resend Verification Email"
              onPress={handleResendEmail}
              style={styles.resendButton}
              variant="outline"
            />

            <Button
              title="Continue to App"
              onPress={handleContinue}
              style={styles.continueButton}
              variant="secondary"
            />
          </View>

          <Typography variant="caption" style={styles.noteText}>
            Note: You can still use the app, but some features will be limited until you verify your email.
          </Typography>
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
  instructionsCard: {
    width: '100%',
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
    marginBottom: theme.SPACING.xl,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.md,
    alignItems: 'center',
  },
  stepIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(76, 217, 100, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  stepTextContainer: {
    flex: 1,
  },
  stepText: {
    color: theme.COLORS.ui.text,
  },
  buttonContainer: {
    width: '100%',
    marginBottom: theme.SPACING.lg,
  },
  emailButton: {
    marginBottom: theme.SPACING.md,
    backgroundColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  resendButton: {
    marginBottom: theme.SPACING.md,
    borderColor: theme.COLORS.ui.accent,
  },
  continueButton: {
    backgroundColor: theme.COLORS.primary.green,
  },
  noteText: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    fontStyle: 'italic',
  },
}); 