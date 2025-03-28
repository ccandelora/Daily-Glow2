import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Input, Button, Card, VideoBackground, Logo } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { setLoading, showSuccess } = useAppState();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleResetPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      return;
    }

    if (password !== confirmPassword) {
      showSuccess('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showSuccess('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(password.trim());
      setIsSubmitted(true);
      showSuccess('Password has been reset successfully!');
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
            {isSubmitted ? 'Password Reset' : 'Create New Password'}
          </Typography>
          <Typography variant="body" style={styles.subtitle} glow="medium">
            {isSubmitted 
              ? "Your password has been updated successfully"
              : "Please create a new password for your account"}
          </Typography>
        </View>

        <Card style={styles.card} variant="glow">
          {!isSubmitted ? (
            <>
              <Input
                label="New Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter new password"
                secureTextEntry
                style={styles.input}
              />

              <Input
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry
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
                Your password has been successfully reset. You can now sign in with your new password.
              </Typography>
              
              <Button
                title="Sign In"
                onPress={() => router.push('/(auth)/sign-in')}
                style={styles.button}
                variant="primary"
              />
            </View>
          )}
        </Card>
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