import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

interface TabItem {
  key: string;
  label: string;
  icon: string;
}

interface TabBarProps extends BottomTabBarProps {
  tabs: TabItem[];
}

export const TabBar: React.FC<TabBarProps> = ({
  state,
  navigation,
  tabs,
}) => {
  const activeTab = state.routeNames[state.index];

  const handlePress = (key: string) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(key);
    }
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
          onPress={() => handlePress(tab.key)}
        >
          <Typography
            style={styles.icon}
            color={activeTab === tab.key ? theme.COLORS.primary.green : theme.COLORS.ui.textSecondary}
          >
            {tab.icon}
          </Typography>
          <Typography
            variant="caption"
            color={activeTab === tab.key ? theme.COLORS.primary.green : theme.COLORS.ui.textSecondary}
            numberOfLines={1}
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
    paddingBottom: theme.SPACING.xl,
    paddingTop: theme.SPACING.md,
    borderTopWidth: 1,
    borderTopColor: theme.COLORS.ui.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.SPACING.xs,
  },
  activeTab: {
    backgroundColor: 'transparent',
  },
  icon: {
    fontSize: 22,
    marginBottom: 4,
  },
}); 