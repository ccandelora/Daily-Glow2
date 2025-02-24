import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { TabBar } from '@/components/common/TabBar';
import { AppStateProvider } from '@/contexts/AppStateContext';
import { AuthProvider } from '@/contexts/AuthContext';
import { JournalProvider } from '@/contexts/JournalContext';
import { ChallengesProvider } from '@/contexts/ChallengesContext';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import theme from '@/constants/theme';

const tabs = [
  { key: 'index', label: 'Home', icon: '🏠' },
  { key: 'journal', label: 'Journal', icon: '📖' },
  { key: 'insights', label: 'Insights', icon: '📊' },
  { key: 'achievements', label: 'Achievements', icon: '🏆' },
  { key: 'settings', label: 'Settings', icon: '⚙️' }
];

export default function AppLayout() {
  return (
    <AppStateProvider>
      <AuthProvider>
        <JournalProvider>
          <ChallengesProvider>
            <NotificationsProvider>
              <View style={styles.container}>
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
            </NotificationsProvider>
          </ChallengesProvider>
        </JournalProvider>
      </AuthProvider>
    </AppStateProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
}); 