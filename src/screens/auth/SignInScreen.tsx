import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Input, Button, Card, VideoBackground, Logo } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

export const SignInScreen = () => {
  const router = useRouter();
  const { signIn, resendVerificationEmail, user, isEmailVerified } = useAuth();
  const { setLoading, showSuccess } = useAppState();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    try {
      setLoading(true);
      await signIn(email.trim(), password);
      
      // After sign-in, the AuthContext will have updated the user and isEmailVerified
      // We can access them directly from the destructured values at the top
      if (user && !isEmailVerified) {
        setShowVerificationPrompt(true);
      } else {
        // TEMPORARY: Force navigation to onboarding
        console.log('🔀 REDIRECTING to onboarding after login');
        router.replace('/(onboarding)/index');
      }
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };
  
  const handleResendVerification = async () => {
    if (!email.trim()) {
      Alert.alert('Email Required', 'Please enter your email address to resend verification.');
      return;
    }
    
    try {
      setLoading(true);
      await resendVerificationEmail(email.trim());
      showSuccess('Verification email sent! Please check your inbox.');
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
            Welcome Back
          </Typography>
          <Typography variant="body" style={styles.subtitle} glow="medium">
            Sign in to continue your journey
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
            placeholder="Enter your password"
            secureTextEntry
            style={styles.input}
          />

          <View style={styles.actionLinks}>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password')}
              style={styles.forgotPassword}
            >
              <Typography
                variant="caption"
                color={theme.COLORS.primary.green}
                glow="soft"
              >
                Forgot Password?
              </Typography>
            </TouchableOpacity>
            
            {showVerificationPrompt && (
              <TouchableOpacity
                onPress={handleResendVerification}
                style={styles.resendVerification}
              >
                <Typography
                  variant="caption"
                  color={theme.COLORS.primary.purple}
                  glow="soft"
                >
                  Resend Verification Email
                </Typography>
              </TouchableOpacity>
            )}
          </View>

          <Button
            title="Sign In"
            onPress={handleSignIn}
            style={styles.button}
            variant="primary"
          />
          
          {showVerificationPrompt && (
            <View style={styles.verificationMessage}>
              <Typography 
                variant="body" 
                color={theme.COLORS.status.warning}
                style={styles.verificationText}
              >
                Your email is not verified. Please check your inbox or resend the verification email.
              </Typography>
              
              <TouchableOpacity 
                onPress={() => router.push('/(auth)/manual-verification')}
                style={styles.manualVerificationLink}
              >
                <Typography 
                  variant="body" 
                  color={theme.COLORS.primary.blue}
                  style={styles.manualVerificationText}
                >
                  Try manual verification instead
                </Typography>
              </TouchableOpacity>
            </View>
          )}
        </Card>

        <View style={styles.footer}>
          <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
            Don't have an account?{' '}
          </Typography>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')}>
            <Typography 
              color={theme.COLORS.primary.green}
              glow="medium"
            >
              Sign Up
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
  actionLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: theme.SPACING.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-start',
  },
  resendVerification: {
    alignSelf: 'flex-end',
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
  verificationMessage: {
    marginTop: theme.SPACING.md,
    padding: theme.SPACING.sm,
    backgroundColor: 'rgba(255, 204, 0, 0.1)',
    borderRadius: theme.BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: theme.COLORS.status.warning,
  },
  verificationText: {
    textAlign: 'center',
  },
  manualVerificationLink: {
    marginTop: theme.SPACING.sm,
    alignItems: 'center',
  },
  manualVerificationText: {
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
}); 