import React, { useEffect, useCallback } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AnimatedBackground } from '@/components/common';
import theme from '@/constants/theme';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { CheckInStreakProvider, CheckInStreak } from '@/contexts/CheckInStreakContext';
import { BadgeProvider, useBadges } from '@/contexts/BadgeContext';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/common/TabBar';
import { BadgeService } from '@/services/BadgeService';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

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
    
    // Log every 5 seconds to verify the component stays mounted
    const interval = setInterval(() => {
      console.log('App layout still active');
    }, 5000);

    return () => clearInterval(interval);
  }, [width, height]);

  return (
    <AppStateProvider>
      <AuthProvider>
        <BadgeProvider>
          <CheckInStreakWithBadges>
            <JournalProvider>
              <ChallengesProvider>
                <NotificationsProvider>
                  <View style={styles.container}>
                    <AnimatedBackground intensity="medium" />

                    {/* Base gradient layer */}
                    <LinearGradient
                      colors={[
                        `${theme.COLORS.primary.green}30`,
                        'transparent',
                        `${theme.COLORS.primary.blue}30`,
                      ]}
                      style={[styles.gradient, { opacity: 0.8 }]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />

                    {/* Accent gradient layer */}
                    <LinearGradient
                      colors={[
                        'transparent',
                        `${theme.COLORS.ui.accent}20`,
                        'transparent'
                      ]}
                      style={[styles.gradient, { opacity: 0.6 }]}
                      start={{ x: 1, y: 0 }}
                      end={{ x: 0, y: 1 }}
                    />

                    {/* Vertical glow effect */}
                    <LinearGradient
                      colors={[
                        `${theme.COLORS.primary.green}10`,
                        `${theme.COLORS.primary.blue}15`,
                        `${theme.COLORS.primary.green}10`,
                      ]}
                      style={[styles.gradient, { opacity: 0.7 }]}
                      start={{ x: 0.5, y: 0 }}
                      end={{ x: 0.5, y: 1 }}
                    />

                    {/* Radial-like glow effect */}
                    <LinearGradient
                      colors={[
                        `${theme.COLORS.primary.yellow}15`,
                        'transparent',
                        `${theme.COLORS.primary.green}10`,
                        'transparent'
                      ]}
                      style={[styles.gradient, { opacity: 0.5 }]}
                      start={{ x: 0.5, y: 0.5 }}
                      end={{ x: 1, y: 1 }}
                      locations={[0, 0.3, 0.6, 1]}
                    />

                    {/* Subtle color wash */}
                    <LinearGradient
                      colors={[
                        'transparent',
                        `${theme.COLORS.ui.accent}05`,
                        `${theme.COLORS.primary.blue}08`,
                        'transparent'
                      ]}
                      style={[styles.gradient, { opacity: 0.9 }]}
                      start={{ x: 0, y: 0.2 }}
                      end={{ x: 1, y: 0.8 }}
                      locations={[0, 0.3, 0.7, 1]}
                    />

                    {/* Content */}
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
                      <Tabs.Screen 
                        name="index"
                        options={{
                          href: null,
                        }}
                      />
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
                </NotificationsProvider>
              </ChallengesProvider>
            </JournalProvider>
          </CheckInStreakWithBadges>
        </BadgeProvider>
      </AuthProvider>
    </AppStateProvider>
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