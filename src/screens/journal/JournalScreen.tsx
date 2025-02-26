import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Input, AnimatedBackground, Button, Header, VideoBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';
import { getEmotionById } from '@/constants/emotions';

interface JournalEntry {
  id: string;
  gratitude: string;
  note?: string;
  created_at: string;
  date: Date;
  initial_emotion: string;
  secondary_emotion: string;
}

export const JournalScreen = () => {
  const router = useRouter();
  const { entries } = useJournal();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const searchLower = searchQuery.toLowerCase().trim();
      return searchLower === '' ||
        entry.gratitude.toLowerCase().includes(searchLower) ||
        (entry.note?.toLowerCase() || '').includes(searchLower);
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries, searchQuery]);

  const groupedEntries = useMemo(() => {
    const groups: { [key: string]: typeof entries } = {};
    
    filteredEntries.forEach(entry => {
      const date = entry.date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(entry);
    });

    return groups;
  }, [filteredEntries]);

  const renderEmotionBadge = (emotionId: string) => {
    const emotion = getEmotionById(emotionId);
    if (!emotion) return null;

    return (
      <View style={[styles.emotionBadge, { backgroundColor: emotion.color }]}>
        <Typography style={styles.emotionText}>
          {emotion.label}
        </Typography>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      <ScrollView style={styles.scrollView}>
        <Header showBranding={true} />
        
        <View style={styles.content}>
          {/* Title and Add Button */}
          <View style={styles.titleContainer}>
            <Typography variant="h1" style={styles.title}>
              Your Journal
            </Typography>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <FontAwesome6 
              name="search" 
              size={20} 
              color={theme.COLORS.ui.textSecondary}
              style={styles.searchIcon}
            />
            <Input
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search your entries..."
              style={styles.searchInput}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
              >
                <FontAwesome6 
                  name="circle-xmark" 
                  size={20} 
                  color={theme.COLORS.ui.textSecondary} 
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Entries List */}
          {Object.entries(groupedEntries).map(([date, dateEntries]) => (
            <View key={date} style={styles.monthGroup}>
              <Typography variant="h2" style={styles.monthTitle}>
                {date}
              </Typography>
              {dateEntries.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  onPress={() => router.push(`/journal/${entry.id}`)}
                >
                  <Card style={StyleSheet.flatten([styles.entryCard])} variant="glow">
                    <View style={styles.entryHeader}>
                      <Typography variant="h3" style={styles.entryDate}>
                        {entry.date.toLocaleDateString('en-US', { 
                          weekday: 'long',
                          day: 'numeric'
                        })}
                      </Typography>
                      <View style={styles.emotionsRow}>
                        {renderEmotionBadge(entry.initial_emotion)}
                        <FontAwesome6 
                          name="arrow-right" 
                          size={16} 
                          color={theme.COLORS.ui.textSecondary}
                          style={styles.arrow}
                        />
                        {renderEmotionBadge(entry.secondary_emotion)}
                      </View>
                    </View>
                    <Typography
                      variant="body"
                      style={styles.gratitudeText}
                    >
                      {entry.gratitude}
                    </Typography>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ))}
          
          {filteredEntries.length === 0 && (
            <View style={styles.emptyState}>
              <Typography 
                variant="body" 
                style={styles.emptyText}
                color={theme.COLORS.ui.textSecondary}
              >
                {searchQuery 
                  ? "No entries match your search."
                  : "You haven't created any journal entries yet. Start by completing a check-in."}
              </Typography>
              {!searchQuery && (
                <Button
                  title="Start Check-in"
                  onPress={() => router.push('/check-in')}
                  variant="primary"
                  style={styles.startButton}
                />
              )}
            </View>
          )}
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
  content: {
    paddingHorizontal: theme.SPACING.lg,
    paddingBottom: theme.SPACING.xl,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  title: {
    fontSize: 32,
    color: theme.COLORS.ui.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.COLORS.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.COLORS.primary.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${theme.COLORS.ui.card}80`,
    borderRadius: theme.BORDER_RADIUS.md,
    paddingHorizontal: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    borderWidth: 1,
    borderColor: `${theme.COLORS.ui.border}50`,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    height: 44,
    color: theme.COLORS.ui.text,
  },
  clearButton: {
    padding: theme.SPACING.xs,
  },
  monthGroup: {
    marginBottom: theme.SPACING.md,
  },
  monthTitle: {
    marginBottom: theme.SPACING.sm,
    color: theme.COLORS.ui.text,
  },
  entryCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.lg,
    backgroundColor: 'rgba(38, 20, 60, 0.85)',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  entryDate: {
    fontSize: 18,
    color: theme.COLORS.ui.text,
  },
  emotionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionBadge: {
    paddingHorizontal: theme.SPACING.sm,
    paddingVertical: theme.SPACING.xs,
    borderRadius: theme.BORDER_RADIUS.sm,
    marginHorizontal: theme.SPACING.xs,
  },
  emotionText: {
    color: theme.COLORS.ui.background,
    fontSize: 12,
    fontWeight: 'bold',
  },
  arrow: {
    marginHorizontal: theme.SPACING.xs,
  },
  gratitudeText: {
    color: theme.COLORS.ui.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.xl,
    marginTop: theme.SPACING.xl,
  },
  emptyText: {
    textAlign: 'center',
    marginBottom: theme.SPACING.lg,
  },
  startButton: {
    width: '100%',
    maxWidth: 200,
  },
}); 