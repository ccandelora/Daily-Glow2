import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Input, Button, Card } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';

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
      router.replace('/auth/verify-email');
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1" style={styles.title}>
          Create Account
        </Typography>
        <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
          Start your journey to emotional wellness
        </Typography>
      </View>

      <Card style={styles.card}>
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

        <Button
          title="Sign Up"
          onPress={handleSignUp}
          style={styles.button}
        />
      </Card>

      <View style={styles.footer}>
        <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
          Already have an account?{' '}
        </Typography>
        <TouchableOpacity onPress={() => router.push('/auth/sign-in')}>
          <Typography color={theme.COLORS.primary.green}>
            Sign In
          </Typography>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
    padding: theme.SPACING.lg,
  },
  header: {
    marginBottom: theme.SPACING.xl,
  },
  title: {
    marginBottom: theme.SPACING.sm,
  },
  card: {
    padding: theme.SPACING.lg,
  },
  input: {
    marginBottom: theme.SPACING.md,
  },
  button: {
    marginTop: theme.SPACING.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.SPACING.xl,
  },
}); 