import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Switch, Alert } from 'react-native';
import { Typography, Card, Button, VideoBackground, Header } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import { useAppState } from '@/contexts/AppStateContext';
import { useAuth } from '@/contexts/AuthContext';
import theme from '@/constants/theme';

export const SettingsScreen = () => {
  const { entries, deleteAllEntries } = useJournal();
  const { setLoading, showError } = useAppState();
  const { signOut } = useAuth();
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const handleSignOut = async () => {
    try {
      setLoading(true);
      await signOut();
    } catch (error) {
      // Error is already handled in AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      setLoading(true);
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      showError('Export feature coming soon!');
    } catch (error) {
      showError('Failed to export data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteData = () => {
    Alert.alert(
      'Delete All Data',
      'Are you sure you want to delete all your journal entries? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAllEntries();
              showError('All entries have been deleted');
            } catch (error) {
              // Error is already handled in JournalContext
              // We can add additional UI handling here if needed
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        <Header showBranding={true} />
        
        <View style={styles.content}>
          <Typography variant="h1" style={styles.title}>
            Settings
          </Typography>

          <Card style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Account
            </Typography>
            <Button
              title="Sign Out"
              onPress={handleSignOut}
              variant="secondary"
              style={styles.signOutButton}
            />
          </Card>

          <Card style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Notifications
            </Typography>
            <View style={styles.settingRow}>
              <Typography>Daily Check-in Reminder</Typography>
              <Switch
                value={notifications}
                onValueChange={setNotifications}
                trackColor={{ false: theme.COLORS.ui.card, true: theme.COLORS.primary.green }}
              />
            </View>
          </Card>

          <Card style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Appearance
            </Typography>
            <View style={styles.settingRow}>
              <Typography>Dark Mode</Typography>
              <Switch
                value={darkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: theme.COLORS.ui.card, true: theme.COLORS.primary.green }}
              />
            </View>
          </Card>

          <Card style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              Data Management
            </Typography>
            <View style={styles.dataManagement}>
              <Button
                title="Export Journal Data"
                onPress={handleExportData}
                variant="secondary"
                style={styles.dataButton}
              />
              <Typography
                variant="caption"
                color={theme.COLORS.ui.textSecondary}
                style={styles.dataInfo}
              >
                {entries.length} entries available for export
              </Typography>
              <Button
                title="Delete All Data"
                onPress={handleDeleteData}
                variant="primary"
                style={styles.deleteButton}
              />
              <Typography
                variant="caption"
                color={theme.COLORS.ui.textSecondary}
                style={styles.dataInfo}
              >
                This action cannot be undone
              </Typography>
            </View>
          </Card>

          <Card style={styles.section}>
            <Typography variant="h3" style={styles.sectionTitle}>
              About
            </Typography>
            <Typography style={styles.aboutText}>
              Daily Glow v1.0.0
            </Typography>
            <Typography
              variant="caption"
              color={theme.COLORS.ui.textSecondary}
              style={styles.aboutText}
            >
              © 2023 Daily Glow
            </Typography>
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
  section: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  sectionTitle: {
    marginBottom: theme.SPACING.md,
    color: theme.COLORS.ui.text,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  signOutButton: {
    marginTop: theme.SPACING.sm,
  },
  dataManagement: {
    marginTop: theme.SPACING.sm,
  },
  dataButton: {
    marginBottom: theme.SPACING.sm,
  },
  deleteButton: {
    marginTop: theme.SPACING.md,
    marginBottom: theme.SPACING.sm,
    backgroundColor: theme.COLORS.primary.red,
  },
  dataInfo: {
    marginBottom: theme.SPACING.sm,
  },
  aboutText: {
    marginBottom: theme.SPACING.sm,
  },
}); 