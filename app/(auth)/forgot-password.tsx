import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Input, Button, Card, VideoBackground, Logo } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const { setLoading, showSuccess } = useAppState();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      return;
    }

    try {
      setLoading(true);
      await forgotPassword(email.trim());
      setIsSubmitted(true);
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setLoading(false);
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

      <View style={styles.content}>
        <View style={styles.header}>
          <Logo size="large" style={styles.logo} />
          <Typography variant="h1" style={styles.title} glow="strong">
            Reset Password
          </Typography>
          <Typography variant="body" style={styles.subtitle} glow="medium">
            {isSubmitted 
              ? "Check your email for reset instructions"
              : "Enter your email to receive password reset instructions"}
          </Typography>
        </View>

        <Card style={styles.card} variant="glow">
          {!isSubmitted ? (
            <>
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                autoCapitalize="none"
                keyboardType="email-address"
                style={styles.input}
              />

              <Button
                title="Reset Password"
                onPress={handleResetPassword}
                style={styles.button}
                variant="primary"
              />
            </>
          ) : (
            <View style={styles.successMessage}>
              <Typography variant="body" style={styles.successText}>
                If an account exists with that email, you'll receive instructions 
                to reset your password shortly.
              </Typography>
              
              <Button
                title="Back to Sign In"
                onPress={() => router.push('/(auth)/sign-in')}
                style={styles.backButton}
                variant="secondary"
              />
            </View>
          )}
        </Card>

        <View style={styles.footer}>
          <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
            Remember your password?{' '}
          </Typography>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-in')}>
            <Typography 
              color={theme.COLORS.primary.green}
              glow="medium"
            >
              Sign In
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    flex: 1,
    padding: theme.SPACING.lg,
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.SPACING.xl,
    alignItems: 'center',
  },
  logo: {
    marginBottom: theme.SPACING.md,
  },
  title: {
    marginBottom: theme.SPACING.sm,
    textAlign: 'center',
    fontSize: theme.FONTS.sizes.xxxl,
    color: theme.COLORS.ui.text,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    maxWidth: '90%',
  },
  card: {
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  input: {
    marginBottom: theme.SPACING.md,
  },
  button: {
    marginTop: theme.SPACING.md,
    backgroundColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  backButton: {
    backgroundColor: theme.COLORS.primary.purple,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.SPACING.xl,
  },
  successMessage: {
    padding: theme.SPACING.md,
  },
  successText: {
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
    color: theme.COLORS.ui.text,
  },
}); 