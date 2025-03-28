import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Card, VideoBackground, Logo } from '@/components/common';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export const VerificationInstructionsScreen = () => {
  const router = useRouter();
  const { resendVerificationEmail } = useAuth();
  const { setLoading } = useAppState();
  
  const handleResendEmail = async () => {
    try {
      setLoading(true);
      // We need the email to resend, which should be stored in the auth context
      // or we could pass it via params when navigating to this screen
      // For now, we'll show an error message
      router.push('/(auth)/sign-in');
    } catch (error) {
      // Error handling
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
            Check Your Email
          </Typography>
          <Typography variant="body" style={styles.subtitle} glow="medium">
            We've sent you an email verification link
          </Typography>
        </View>

        <Card style={styles.card} variant="glow">
          <View style={styles.iconContainer}>
            <Ionicons name="mail" size={60} color={theme.COLORS.primary.purple} />
          </View>
          
          <Typography variant="body" style={styles.instructions}>
            Please check your email inbox for a verification link from Supabase.
            Click the link to verify your account before signing in.
          </Typography>
          
          <Typography variant="caption" style={styles.note}>
            If you don't see the email, check your spam folder.
          </Typography>
          
          <Button
            title="Back to Sign In"
            onPress={() => router.push('/(auth)/sign-in')}
            style={styles.button}
            variant="primary"
          />
          
          <TouchableOpacity 
            style={styles.resendLink} 
            onPress={handleResendEmail}
          >
            <Typography 
              variant="caption" 
              color={theme.COLORS.primary.green}
              glow="soft"
            >
              Didn't receive an email? Sign in to resend
            </Typography>
          </TouchableOpacity>
        </Card>
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
  iconContainer: {
    alignItems: 'center',
    marginBottom: theme.SPACING.lg,
  },
  instructions: {
    textAlign: 'center',
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
  },
  note: {
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
    color: theme.COLORS.ui.textSecondary,
    fontStyle: 'italic',
  },
  button: {
    marginBottom: theme.SPACING.md,
    backgroundColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  resendLink: {
    alignItems: 'center',
    padding: theme.SPACING.sm,
  },
}); 