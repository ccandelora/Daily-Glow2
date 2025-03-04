import React, { useState } from 'react';
import { SignInScreen } from '@/screens/auth/SignInScreen';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import theme from '@/constants/theme';

/**
 * Sign-in screen using traditional folder structure
 * No parentheses-based route groups
 */
export default function SignInRoute() {
  console.log('🔍 DEBUG: Traditional auth sign-in screen loaded');
  return <SignInScreen />;
}

const styles = StyleSheet.create({
  devButton: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  devButtonText: {
    color: '#fff',
    fontSize: 12,
  },
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    backgroundColor: theme.COLORS.ui.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.COLORS.ui.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    color: theme.COLORS.ui.text,
  },
  verifyButton: {
    backgroundColor: theme.COLORS.primary.blue,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
  },
  backButtonText: {
    color: theme.COLORS.ui.textSecondary,
    fontSize: 16,
  },
  instructionText: {
    marginTop: 20,
    color: theme.COLORS.ui.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'left',
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 8,
  },
}); 