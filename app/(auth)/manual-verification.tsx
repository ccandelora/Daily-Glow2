import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ManualVerification } from '@/components/common';
import { Typography } from '@/components/common';
import { Stack } from 'expo-router';
import theme from '@/constants/theme';

export default function ManualVerificationScreen() {
  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      <Stack.Screen 
        options={{ 
          title: 'Manual Verification',
          headerStyle: {
            backgroundColor: theme.COLORS.ui.background,
          },
          headerTintColor: theme.COLORS.ui.text,
        }} 
      />
      
      <View style={styles.header}>
        <Typography variant="h1" style={styles.title}>
          Verify Your Email
        </Typography>
        
        <Typography variant="body" style={styles.subtitle}>
          If you're having trouble with the automatic verification link, you can use this page to manually verify your email.
        </Typography>
      </View>
      
      <ManualVerification />
      
      <View style={styles.helpSection}>
        <Typography variant="h3" style={styles.helpTitle}>
          Need Help?
        </Typography>
        
        <Typography variant="body" style={styles.helpText}>
          1. Check your email for the verification link from Daily Glow
        </Typography>
        
        <Typography variant="body" style={styles.helpText}>
          2. In the verification link URL, find the part that starts with "token="
        </Typography>
        
        <Typography variant="body" style={styles.helpText}>
          3. Copy everything after "token=" and before the next "&" or the end of the URL
        </Typography>
        
        <Typography variant="body" style={styles.helpText}>
          4. Paste that token in the field above and click "Verify Email"
        </Typography>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 20,
  },
  helpSection: {
    marginTop: 30,
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
  },
  helpTitle: {
    marginBottom: 15,
    textAlign: 'center',
  },
  helpText: {
    marginBottom: 10,
  },
}); 