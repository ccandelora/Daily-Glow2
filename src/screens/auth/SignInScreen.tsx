import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Input, Button, Card } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';

export const SignInScreen = () => {
  const router = useRouter();
  const { signIn } = useAuth();
  const { setLoading } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      router.replace('/(app)');
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
          Welcome Back
        </Typography>
        <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
          Sign in to continue your journey
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
          placeholder="Enter your password"
          secureTextEntry
          style={styles.input}
        />

        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          style={styles.forgotPassword}
        >
          <Typography
            variant="caption"
            color={theme.COLORS.primary.green}
          >
            Forgot Password?
          </Typography>
        </TouchableOpacity>

        <Button
          title="Sign In"
          onPress={handleSignIn}
          style={styles.button}
        />
      </Card>

      <View style={styles.footer}>
        <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
          Don't have an account?{' '}
        </Typography>
        <TouchableOpacity onPress={() => router.replace('/(auth)/sign-up')}>
          <Typography color={theme.COLORS.primary.green}>
            Sign Up
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.SPACING.lg,
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