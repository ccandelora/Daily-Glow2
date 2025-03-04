import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, TextStyle, ViewStyle, StyleProp, Dimensions, Switch } from 'react-native';
import { Typography, Card, Button, Header, VideoBackground, EmailVerificationBanner } from '@/components/common';
import theme from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useRouter } from 'expo-router';

const ProfileScreen = () => {
  const { user, signOut, isEmailVerified, resendVerificationEmail } = useAuth();
  const { showError } = useAppState();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('Jane Doe');
  const [debugTapCount, setDebugTapCount] = useState(0);

  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      showError('Failed to log out');
    }
  };

  const handleResendVerification = async () => {
    if (user?.email) {
      try {
        await resendVerificationEmail(user.email);
      } catch (error) {
        // Error is already handled in AuthContext
      }
    }
  };
  
  const handleDebugTap = () => {
    const newCount = debugTapCount + 1;
    setDebugTapCount(newCount);
    
    if (newCount >= 7) {
      // Reset counter and navigate to debug menu
      setDebugTapCount(0);
      router.push('/debug');
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      <Header showBranding={true} />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <View style={styles.content}>
          <Typography variant="h1" style={styles.title}>
            Profile
          </Typography>

          {/* Email Verification Banner */}
          {!isEmailVerified && user?.email && (
            <EmailVerificationBanner 
              email={user.email}
              onResendVerification={handleResendVerification}
            />
          )}

          {/* Profile Header */}
          <Card style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <TouchableOpacity onPress={handleDebugTap}>
                <View style={styles.avatar}>
                  <Typography variant="h3" style={styles.avatarText}>
                    {user?.email ? user.email.charAt(0).toUpperCase() : 'U'}
                  </Typography>
                </View>
              </TouchableOpacity>
              <View style={styles.profileInfo}>
                {isEditing ? (
                  <TextInput
                    style={styles.nameInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                  />
                ) : (
                  <Typography variant="h2" style={styles.profileName}>{displayName}</Typography>
                )}
                <Typography style={styles.profileEmail}>{user?.email || 'user@example.com'}</Typography>
                <View style={styles.profileStats}>
                  <View style={styles.statItem}>
                    <Typography variant="h3" color={theme.COLORS.primary.green}>7</Typography>
                    <Typography>Day Streak</Typography>
                  </View>
                  <View style={styles.statItem}>
                    <Typography variant="h3" color={theme.COLORS.primary.blue}>520</Typography>
                    <Typography>Points</Typography>
                  </View>
                </View>
              </View>
            </View>
            <View style={styles.profileActions}>
              {isEditing ? (
                <>
                  <Button 
                    title="Save" 
                    onPress={() => setIsEditing(false)} 
                    style={styles.actionButton}
                  />
                  <Button 
                    title="Cancel" 
                    variant="outline" 
                    onPress={() => setIsEditing(false)} 
                    style={styles.actionButton}
                  />
                </>
              ) : (
                <>
                  <Button 
                    title="Edit Profile" 
                    onPress={() => setIsEditing(true)} 
                    style={styles.actionButton}
                  />
                  <Button 
                    title="Log Out" 
                    variant="outline" 
                    onPress={handleLogout} 
                    style={styles.actionButton}
                  />
                </>
              )}
            </View>
          </Card>

          {/* About Card */}
          <Card style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <Image 
                source={require('@/assets/default_transparent_765x625.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Typography variant="h3" style={styles.aboutTitle}>
                Daily Glow
              </Typography>
              <Typography style={styles.versionText}>
                Version 1.0.0
              </Typography>
            </View>
            
            <View style={styles.aboutContent}>
              <Typography style={styles.aboutText}>
                Daily Glow is a mindfulness and emotional wellness app designed to help you track and improve your mental well-being through daily check-ins and reflections.
              </Typography>
              
              <Typography style={styles.creditTitle}>
                Background Video
              </Typography>
              <Typography style={styles.creditText}>
                "Flowing Energy" by Nicola Narracci
              </Typography>
              
              <Typography style={styles.copyright}>
                © 2025 Daily Glow™. All rights reserved.
              </Typography>
            </View>
          </Card>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: theme.SPACING.xl,
  },
  content: {
    paddingHorizontal: theme.SPACING.lg,
  },
  title: {
    fontSize: 32,
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
    paddingTop: 0,
  },
  profileCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: theme.COLORS.primary.purple,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: theme.COLORS.ui.accent,
    marginRight: theme.SPACING.md,
  },
  avatarText: {
    color: 'white',
    fontSize: 40,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    marginBottom: theme.SPACING.xs,
  },
  profileEmail: {
    color: theme.COLORS.ui.textSecondary,
    marginBottom: theme.SPACING.sm,
  },
  profileStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.sm,
  },
  statItem: {
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  nameInput: {
    fontSize: theme.FONTS.sizes.xl,
    fontWeight: theme.FONTS.weights.bold as any,
    color: theme.COLORS.ui.text,
    borderBottomWidth: 1,
    borderBottomColor: theme.COLORS.ui.accent,
    paddingBottom: theme.SPACING.xs,
    marginBottom: theme.SPACING.xs,
  },
  profileActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.md,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: theme.SPACING.xs,
  },
  aboutCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  aboutHeader: {
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: theme.SPACING.md,
  },
  aboutTitle: {
    marginBottom: theme.SPACING.xs,
    textAlign: 'center',
  },
  versionText: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
  },
  aboutContent: {
    marginTop: theme.SPACING.md,
  },
  aboutText: {
    marginBottom: theme.SPACING.sm,
    color: theme.COLORS.ui.textSecondary,
  },
  creditTitle: {
    fontWeight: theme.FONTS.weights.bold as any,
    color: theme.COLORS.ui.text,
    marginBottom: theme.SPACING.sm,
    marginTop: theme.SPACING.md,
  },
  creditText: {
    color: theme.COLORS.ui.textSecondary,
    marginBottom: theme.SPACING.md,
  },
  copyright: {
    marginTop: theme.SPACING.md,
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
  },
});

export default ProfileScreen; 