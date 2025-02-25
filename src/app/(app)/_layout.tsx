import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackground } from '@/components/common';
import { TabBar } from '@/components/common/TabBar';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { CheckInStreakProvider, CheckInStreak } from '@/contexts/CheckInStreakContext';
import { BadgeProvider, useBadges } from '@/contexts/BadgeContext';
import { BadgeService } from '@/services/BadgeService';
import theme from '@/constants/theme';
import { AchievementsProvider } from '@/contexts/AchievementsContext';
import { UserProfileProvider } from '@/contexts/UserProfileContext';

const tabs = [
  { key: 'index', label: 'Home', icon: '🏠' },
  { key: 'journal', label: 'Journal', icon: '📖' },
  { key: 'insights', label: 'Insights', icon: '📊' },
  { key: 'achievements', label: 'Achievements', icon: '🏆' },
  { key: 'settings', label: 'Settings', icon: '⚙️' }
];

// Create a wrapper component to handle streak updates with badge context
function CheckInStreakWithBadges({ children }: { children: React.ReactNode }) {
  const { addUserBadge, isLoading } = useBadges();
  
  const handleStreakUpdated = useCallback(async (
    streaks: CheckInStreak, 
    isFirstCheckIn: boolean, 
    allPeriodsCompleted: boolean
  ) => {
    // Skip badge processing if badges are still loading
    if (isLoading) {
      console.log('Badges still loading, skipping badge processing');
      return;
    }
    
    // Award badges based on streak updates
    if (isFirstCheckIn) {
      await BadgeService.awardFirstCheckInBadge(addUserBadge);
    }
    
    // Check streak badges
    await BadgeService.checkStreakBadges(streaks, addUserBadge);
    
    // Check if all periods were completed
    if (allPeriodsCompleted) {
      await BadgeService.checkAllPeriodsCompleted(addUserBadge);
    }
  }, [addUserBadge, isLoading]);
  
  return (
    <CheckInStreakProvider onStreakUpdated={handleStreakUpdated}>
      {children}
    </CheckInStreakProvider>
  );
}

export default function AppLayout() {
  const { width, height } = Dimensions.get('window');

  useEffect(() => {
    console.log('App layout mounted with dimensions:', { width, height });
  }, [width, height]);

  return (
    <View style={{ flex: 1 }}>
      <AppStateProvider>
        <AuthProvider>
          <BadgeProvider>
            <CheckInStreakWithBadges>
              <JournalProvider>
                <ChallengesProvider>
                  <NotificationsProvider>
                    <AchievementsProvider>
                      <UserProfileProvider>
                        <View style={styles.container}>
                          <AnimatedBackground intensity="medium" />
                          
                          {/* Debug text */}
                          <View style={styles.debugOverlay}>
                            <Text style={styles.debugText}>App Layout Active</Text>
                            <Text style={styles.debugText}>{`${width}x${height}`}</Text>
                          </View>

                          <Tabs
                            screenOptions={{
                              headerShown: false,
                              tabBarStyle: {
                                height: 85,
                                paddingTop: 12,
                                paddingBottom: 28,
                                backgroundColor: theme.COLORS.ui.background,
                                borderTopWidth: 1,
                                borderTopColor: theme.COLORS.ui.border,
                              }
                            }}
                            tabBar={(props) => <TabBar {...props} tabs={tabs} />}
                          >
                            <Tabs.Screen name="index" />
                            <Tabs.Screen name="journal" />
                            <Tabs.Screen name="insights" />
                            <Tabs.Screen name="achievements" />
                            <Tabs.Screen name="settings" />
                            <Tabs.Screen
                              name="check-in"
                              options={{
                                href: null,
                              }}
                            />
                            <Tabs.Screen
                              name="notifications"
                              options={{
                                href: null,
                              }}
                            />
                          </Tabs>
                        </View>
                      </UserProfileProvider>
                    </AchievementsProvider>
                  </NotificationsProvider>
                </ChallengesProvider>
              </JournalProvider>
            </CheckInStreakWithBadges>
          </BadgeProvider>
        </AuthProvider>
      </AppStateProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  gradient: {
    position: 'absolute',
    top: -100,
    left: -100,
    right: -100,
    bottom: -100,
    transform: [{ scale: 1.2 }],
  },
  debugOverlay: {
    position: 'absolute',
    top: 40,
    left: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    padding: 5,
    borderRadius: 5,
    zIndex: 999,
  },
  debugText: {
    color: theme.COLORS.primary.green,
    fontSize: 10,
  },
}); 