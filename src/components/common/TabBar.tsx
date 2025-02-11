import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography } from './Typography';
import { NotificationBadge } from './NotificationBadge';
import theme from '@/constants/theme';

interface TabItem {
  key: string;
  label: string;
  icon: string; // We'll replace this with proper icons later
}

interface TabBarProps {
  tabs: TabItem[];
  activeTab: string;
  onTabPress: (tabKey: string) => void;
}

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTab,
  onTabPress,
}) => {
  const router = useRouter();

  const renderTabIcon = (tab: TabItem) => {
    if (tab.key === 'settings') {
      return (
        <View style={styles.iconContainer}>
          <NotificationBadge
            size={20}
            color={activeTab === tab.key ? theme.COLORS.primary.green : theme.COLORS.ui.textSecondary}
            onPress={() => router.push('/notifications')}
          />
        </View>
      );
    }
    return (
      <Typography
        style={styles.icon}
        color={activeTab === tab.key ? theme.COLORS.primary.green : theme.COLORS.ui.textSecondary}
      >
        {tab.icon}
      </Typography>
    );
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => (
        <TouchableOpacity
          key={tab.key}
          style={[
            styles.tab,
            activeTab === tab.key && styles.activeTab,
          ]}
          onPress={() => onTabPress(tab.key)}
        >
          {renderTabIcon(tab)}
          <Typography
            variant="caption"
            color={activeTab === tab.key ? theme.COLORS.primary.green : theme.COLORS.ui.textSecondary}
          >
            {tab.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.COLORS.ui.card,
    paddingBottom: theme.SPACING.md,
    paddingTop: theme.SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.ui.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: theme.FONTS.sizes.xl,
    marginBottom: theme.SPACING.xs,
  },
  iconContainer: {
    marginBottom: theme.SPACING.xs,
  },
});

export { TabBar }; 