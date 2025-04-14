import React from 'react';
import { View, StyleSheet } from 'react-native';
import OnboardingNotificationsScreen from '@/screens/onboarding/OnboardingNotificationsScreen';
import { UserProfileProvider } from '@/contexts/UserProfileContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { BadgeProvider } from '@/contexts/BadgeContext';
import { AchievementsProvider } from '@/contexts/AchievementsContext';

export default function Notifications() {
  return (
    <View style={styles.container}>
      <UserProfileProvider>
        <BadgeProvider>
          <AchievementsProvider>
            <NotificationsProvider>
              <OnboardingNotificationsScreen />
            </NotificationsProvider>
          </AchievementsProvider>
        </BadgeProvider>
      </UserProfileProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 