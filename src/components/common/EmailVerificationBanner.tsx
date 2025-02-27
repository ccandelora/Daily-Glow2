import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

interface EmailVerificationBannerProps {
  email: string;
  onResendVerification?: () => void;
}

export const EmailVerificationBanner = ({ 
  email, 
  onResendVerification 
}: EmailVerificationBannerProps) => {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="mail-unread-outline" size={24} color={theme.COLORS.ui.text} />
      </View>
      <View style={styles.textContainer}>
        <Typography variant="body" style={styles.title}>
          Please verify your email
        </Typography>
        <Typography variant="caption" style={styles.message}>
          We've sent a verification link to {email}. Please check your inbox and verify your email to unlock all features.
        </Typography>
        {onResendVerification && (
          <TouchableOpacity onPress={onResendVerification} style={styles.resendButton}>
            <Typography variant="caption" style={styles.resendText}>
              Resend verification email
            </Typography>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    borderRadius: theme.SPACING.md,
    padding: theme.SPACING.md,
    flexDirection: 'row',
    marginVertical: theme.SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
  },
  iconContainer: {
    marginRight: theme.SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 193, 7, 0.2)',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontWeight: theme.FONTS.weights.bold as any,
    marginBottom: theme.SPACING.xs,
    color: theme.COLORS.ui.text,
  },
  message: {
    color: theme.COLORS.ui.textSecondary,
    lineHeight: 20,
  },
  resendButton: {
    marginTop: theme.SPACING.sm,
  },
  resendText: {
    color: theme.COLORS.primary.green,
    textDecorationLine: 'underline',
    fontWeight: theme.FONTS.weights.bold as any,
  },
}); 