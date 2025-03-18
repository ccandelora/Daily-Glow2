import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Image, TouchableOpacity, TextInput, Alert, TextStyle, ViewStyle, StyleProp, Dimensions, Switch } from 'react-native';
import { Typography, Card, Button, Header, VideoBackground, EmailVerificationBanner } from '@/components/common';
import theme from '@/constants/theme';
import { useAuth } from '@/contexts/AuthContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useProfile } from '@/contexts/UserProfileContext';
import { Ionicons } from '@expo/vector-icons';

// Define the goal item data
type Goal = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
};

// Define notification preference data
type NotificationPreference = {
  id: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const ProfileScreen = () => {
  const { user, signOut, isEmailVerified, resendVerificationEmail } = useAuth();
  const { userProfile, isLoading, updateProfile } = useProfile();
  const { showError } = useAppState();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  // Map of goal IDs to display text and icons
  const goalMapping: Record<string, Goal> = {
    stress: { id: 'stress', label: 'Reduce stress', icon: 'leaf-outline' },
    sleep: { id: 'sleep', label: 'Improve sleep', icon: 'moon-outline' },
    habits: { id: 'habits', label: 'Build healthy habits', icon: 'fitness-outline' },
    mindful: { id: 'mindful', label: 'Increase mindfulness', icon: 'heart-outline' },
    mood: { id: 'mood', label: 'Boost mood', icon: 'sunny-outline' },
    track: { id: 'track', label: 'Track mental health', icon: 'pulse-outline' }
  };

  // Map of notification preference IDs to display text
  const notificationMapping: Record<string, NotificationPreference> = {
    dailyReminder: { id: 'dailyReminder', title: 'Daily Check-in Reminder', icon: 'notifications-outline' },
    achievements: { id: 'achievements', title: 'Achievement Alerts', icon: 'trophy-outline' },
    tips: { id: 'tips', title: 'Wellness Tips', icon: 'bulb-outline' }
  };

  // Set initial values from profile
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.display_name || '');
    }
  }, [userProfile]);

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

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ display_name: displayName });
      setIsEditing(false);
    } catch (error) {
      showError('Failed to update profile');
    }
  };

  // Get user goals with labels and icons
  const getUserGoals = () => {
    if (!userProfile?.user_goals || userProfile.user_goals.length === 0) {
      return [];
    }
    
    return userProfile.user_goals
      .map(goalId => goalMapping[goalId])
      .filter(goal => !!goal);
  };

  // Get user notification preferences with labels
  const getNotificationPreferences = () => {
    if (!userProfile?.notification_preferences || userProfile.notification_preferences.length === 0) {
      return [];
    }
    
    return userProfile.notification_preferences
      .map(prefId => notificationMapping[prefId])
      .filter(pref => !!pref);
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
              <Image 
                source={{ uri: 'https://via.placeholder.com/150' }} 
                style={styles.profileImage} 
              />
              <View style={styles.profileInfo}>
                {isEditing ? (
                  <TextInput
                    style={styles.nameInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    autoFocus
                  />
                ) : (
                  <Typography variant="h2" style={styles.profileName}>
                    {userProfile?.display_name || 'Your Name'}
                  </Typography>
                )}
                <Typography style={styles.profileEmail}>{user?.email || 'user@example.com'}</Typography>
                <View style={styles.profileStats}>
                  <View style={styles.statItem}>
                    <Typography variant="h3" color={theme.COLORS.primary.green}>
                      {userProfile?.streak || 0}
                    </Typography>
                    <Typography>Day Streak</Typography>
                  </View>
                  <View style={styles.statItem}>
                    <Typography variant="h3" color={theme.COLORS.primary.blue}>
                      {userProfile?.points || 0}
                    </Typography>
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
                    onPress={handleSaveProfile}
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

          {/* User Goals Card */}
          <Card style={styles.preferencesCard}>
            <Typography variant="h3" style={styles.preferencesTitle}>
              Your Goals
            </Typography>
            
            <View style={styles.goalsList}>
              {getUserGoals().length > 0 ? (
                getUserGoals().map((goal) => (
                  <View key={goal.id} style={styles.preferenceItem}>
                    <View style={styles.prefIconContainer}>
                      <Ionicons name={goal.icon} size={22} color={theme.COLORS.primary.green} />
                    </View>
                    <Typography style={styles.preferenceText}>{goal.label}</Typography>
                  </View>
                ))
              ) : (
                <Typography style={styles.emptyText}>
                  No goals set yet. You can update your goals in settings.
                </Typography>
              )}
            </View>
          </Card>

          {/* Notification Preferences Card */}
          <Card style={styles.preferencesCard}>
            <Typography variant="h3" style={styles.preferencesTitle}>
              Notification Preferences
            </Typography>
            
            <View style={styles.notificationsList}>
              {getNotificationPreferences().length > 0 ? (
                getNotificationPreferences().map((pref) => (
                  <View key={pref.id} style={styles.preferenceItem}>
                    <View style={styles.prefIconContainer}>
                      <Ionicons name={pref.icon} size={22} color={theme.COLORS.primary.blue} />
                    </View>
                    <Typography style={styles.preferenceText}>{pref.title}</Typography>
                  </View>
                ))
              ) : (
                <Typography style={styles.emptyText}>
                  No notifications enabled. You can update your preferences in settings.
                </Typography>
              )}
            </View>
          </Card>

          {/* About Card */}
          <Card style={styles.aboutCard}>
            <View style={styles.aboutHeader}>
              <Image 
                source={require('@/assets/default_transparent_353x345.png')}
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
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginRight: theme.SPACING.md,
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
  preferencesCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  preferencesTitle: {
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
  },
  goalsList: {
    marginTop: theme.SPACING.xs,
  },
  notificationsList: {
    marginTop: theme.SPACING.xs,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  prefIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  preferenceText: {
    color: theme.COLORS.ui.text,
    fontSize: 16,
  },
  emptyText: {
    color: theme.COLORS.ui.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: theme.SPACING.md,
  },
});

export default ProfileScreen; 