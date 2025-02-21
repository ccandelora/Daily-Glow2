import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Input, AnimatedBackground, Button, Header, VideoBackground } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
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
        <View style={styles.safeArea}>
          {/* Header */}
          <View style={styles.header}>
            <Typography variant="h1" style={styles.title}>
              Your Journal
            </Typography>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push('/check-in')}
            >
              <Ionicons name="add" size={24} color={theme.COLORS.ui.background} />
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchContainer}>
            <Ionicons 
              name="search-outline" 
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
                <Ionicons 
                  name="close-circle" 
                  size={20} 
                  color={theme.COLORS.ui.textSecondary} 
                />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Entries List */}
          <View style={styles.content}>
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
                    <Card style={styles.entryCard}>
                      <View style={styles.entryHeader}>
                        <Typography variant="h3" style={styles.entryDate}>
                          {entry.date.toLocaleDateString('en-US', { 
                            weekday: 'long',
                            day: 'numeric'
                          })}
                        </Typography>
                        <View style={styles.emotionsRow}>
                          {renderEmotionBadge(entry.initial_emotion)}
                          <Ionicons 
                            name="arrow-forward" 
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
                  variant="h3"
                  style={styles.emptyTitle}
                >
                  No entries found
                </Typography>
                <Typography
                  variant="body"
                  style={styles.emptyText}
                >
                  {searchQuery 
                    ? "Try adjusting your search terms"
                    : "Start your journey by adding your first entry"}
                </Typography>
                <TouchableOpacity
                  style={styles.emptyButton}
                  onPress={() => router.push('/check-in')}
                >
                  <Typography style={styles.emptyButtonText}>
                    Add New Entry
                  </Typography>
                </TouchableOpacity>
              </View>
            )}
          </View>
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
  safeArea: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.lg,
    paddingBottom: theme.SPACING.lg,
  },
  title: {
    fontSize: 34,
    fontWeight: 'bold',
    color: theme.COLORS.ui.text,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.primary.green,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.COLORS.ui.card,
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
    borderRadius: theme.BORDER_RADIUS.lg,
    paddingHorizontal: theme.SPACING.md,
    height: 38,
  },
  searchIcon: {
    marginRight: theme.SPACING.sm,
  },
  searchInput: {
    flex: 1,
    backgroundColor: 'transparent',
    height: 38,
    fontSize: 17,
    color: theme.COLORS.ui.text,
    padding: 0,
    margin: 0,
    top: -1,
  },
  clearButton: {
    padding: theme.SPACING.sm,
  },
  content: {
    paddingHorizontal: theme.SPACING.lg,
  },
  monthGroup: {
    marginBottom: theme.SPACING.xl,
  },
  monthTitle: {
    marginBottom: theme.SPACING.md,
    fontSize: 22,
    color: theme.COLORS.ui.text,
  },
  entryCard: {
    marginBottom: theme.SPACING.md,
    padding: theme.SPACING.lg,
  },
  entryHeader: {
    marginBottom: theme.SPACING.md,
  },
  entryDate: {
    fontSize: 18,
    marginBottom: theme.SPACING.sm,
    color: theme.COLORS.ui.text,
  },
  emotionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emotionBadge: {
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.xs,
    borderRadius: theme.BORDER_RADIUS.lg,
  },
  emotionText: {
    color: theme.COLORS.ui.background,
    fontSize: 14,
    fontWeight: 'bold',
  },
  arrow: {
    marginHorizontal: theme.SPACING.sm,
  },
  gratitudeText: {
    color: theme.COLORS.ui.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  emptyState: {
    alignItems: 'center',
    padding: theme.SPACING.xl * 2,
  },
  emptyTitle: {
    marginBottom: theme.SPACING.md,
    textAlign: 'center',
  },
  emptyText: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    marginBottom: theme.SPACING.xl,
  },
  emptyButton: {
    backgroundColor: theme.COLORS.primary.green,
    paddingHorizontal: theme.SPACING.xl,
    paddingVertical: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
  },
  emptyButtonText: {
    color: theme.COLORS.ui.background,
    fontWeight: 'bold',
  },
}); 