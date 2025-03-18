import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Input, Button, Card, VideoBackground, Logo } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export const SignUpScreen = () => {
  const router = useRouter();
  const { signUp } = useAuth();
  const { setLoading, showError } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      showError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      showError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      await signUp(email.trim(), password);
      
      // On mobile, redirect to verification instructions
      // On web, redirect to welcome screen (verification will happen via email link)
      if (Platform.OS === 'web') {
        router.replace('/(app)');
      } else {
        router.replace('/(app)');
      }
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
            Create Account
          </Typography>
          <Typography variant="body" style={styles.subtitle} glow="medium">
            Start your journey to emotional wellness
          </Typography>
        </View>

        <Card style={styles.card} variant="glow">
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Create a password"
            secureTextEntry
            style={styles.input}
          />

          <Input
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
            style={styles.input}
          />

          <Typography variant="caption" style={styles.verificationNote}>
            You'll need to verify your email address before accessing all features.
          </Typography>

          <Button
            title="Sign Up"
            onPress={handleSignUp}
            style={styles.button}
            variant="primary"
          />
        </Card>

        <View style={styles.footer}>
          <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
            Already have an account?{' '}
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
};

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
    maxWidth: '80%',
  },
  card: {
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  input: {
    marginBottom: theme.SPACING.md,
  },
  verificationNote: {
    color: theme.COLORS.ui.textSecondary,
    marginBottom: theme.SPACING.md,
    textAlign: 'center',
    fontStyle: 'italic',
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
}); 