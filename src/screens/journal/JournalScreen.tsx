import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, SearchInput, Button, Header, VideoBackground } from '@/components/common';
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

// Number of entries to load per page
const ENTRIES_PER_PAGE = 10;

export const JournalScreen = () => {
  const router = useRouter();
  const { entries } = useJournal();
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  
  // Get available months and years for filtering
  const dateFilters = useMemo(() => {
    const months = new Set<string>();
    const years = new Set<number>();
    
    entries.forEach(entry => {
      const date = entry.date;
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      
      months.add(month);
      years.add(year);
    });
    
    return {
      months: Array.from(months),
      years: Array.from(years).sort((a, b) => b - a) // Sort years in descending order
    };
  }, [entries]);

  // Filter entries based on search query and date filters
  const filteredEntries = useMemo(() => {
    return entries.filter(entry => {
      const searchLower = searchQuery.toLowerCase().trim();
      const matchesSearch = searchLower === '' ||
        entry.gratitude.toLowerCase().includes(searchLower) ||
        (entry.note?.toLowerCase() || '').includes(searchLower);
      
      const matchesMonth = selectedMonth === null || 
        entry.date.toLocaleDateString('en-US', { month: 'long' }) === selectedMonth;
      
      const matchesYear = selectedYear === null || 
        entry.date.getFullYear() === selectedYear;
      
      return matchesSearch && matchesMonth && matchesYear;
    }).sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [entries, searchQuery, selectedMonth, selectedYear]);

  // Group entries by month and year
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

  // Get paginated entries
  const paginatedGroupedEntries = useMemo(() => {
    const groupKeys = Object.keys(groupedEntries);
    const paginatedGroups: { [key: string]: typeof entries } = {};
    
    // Calculate start and end indices for pagination
    const startIdx = 0;
    const endIdx = page * ENTRIES_PER_PAGE;
    
    let entryCount = 0;
    let i = 0;
    
    // Add groups until we reach the desired number of entries
    while (entryCount < endIdx && i < groupKeys.length) {
      const key = groupKeys[i];
      paginatedGroups[key] = groupedEntries[key];
      entryCount += groupedEntries[key].length;
      i++;
    }
    
    return paginatedGroups;
  }, [groupedEntries, page]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedMonth, selectedYear]);

  // Load more entries when user reaches the end of the list
  const loadMoreEntries = useCallback(() => {
    if (Object.keys(paginatedGroupedEntries).length < Object.keys(groupedEntries).length) {
      setIsLoading(true);
      // Simulate network delay
      setTimeout(() => {
        setPage(prevPage => prevPage + 1);
        setIsLoading(false);
      }, 500);
    }
  }, [paginatedGroupedEntries, groupedEntries]);

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

  // Render a month group of entries
  const renderMonthGroup = useCallback(({ item }: { item: [string, JournalEntry[]] }) => {
    const [date, dateEntries] = item;
    
    return (
      <View style={styles.monthGroup}>
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
                numberOfLines={2}
              >
                {entry.gratitude}
              </Typography>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [router]);

  // Render the filter section
  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {/* Month filters */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedMonth === null && styles.activeFilterChip
          ]}
          onPress={() => setSelectedMonth(null)}
        >
          <Typography style={selectedMonth === null ? styles.activeFilterText : styles.filterText}>
            All Months
          </Typography>
        </TouchableOpacity>
        
        {dateFilters.months.map(month => (
          <TouchableOpacity
            key={month}
            style={[
              styles.filterChip,
              selectedMonth === month && styles.activeFilterChip
            ]}
            onPress={() => setSelectedMonth(month)}
          >
            <Typography style={selectedMonth === month ? styles.activeFilterText : styles.filterText}>
              {month}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        {/* Year filters */}
        <TouchableOpacity
          style={[
            styles.filterChip,
            selectedYear === null && styles.activeFilterChip
          ]}
          onPress={() => setSelectedYear(null)}
        >
          <Typography style={selectedYear === null ? styles.activeFilterText : styles.filterText}>
            All Years
          </Typography>
        </TouchableOpacity>
        
        {dateFilters.years.map(year => (
          <TouchableOpacity
            key={year}
            style={[
              styles.filterChip,
              selectedYear === year && styles.activeFilterChip
            ]}
            onPress={() => setSelectedYear(year)}
          >
            <Typography style={selectedYear === year ? styles.activeFilterText : styles.filterText}>
              {year}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render footer with loading indicator
  const renderFooter = () => {
    if (!isLoading) return null;
    
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color={theme.COLORS.primary.green} />
        <Typography style={styles.loaderText}>Loading more entries...</Typography>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Typography 
        variant="body" 
        style={styles.emptyText}
        color={theme.COLORS.ui.textSecondary}
      >
        {searchQuery || selectedMonth || selectedYear
          ? "No entries match your filters."
          : "You haven't created any journal entries yet. Start by completing a check-in."}
      </Typography>
      {!searchQuery && !selectedMonth && !selectedYear && (
        <Button
          title="Start Check-in"
          onPress={() => router.push('/check-in')}
          variant="primary"
          style={styles.startButton}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <VideoBackground />
      <Header showBranding={true} />
      
      <View style={styles.content}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Typography variant="h1" style={styles.title}>
            Your Journal
          </Typography>
        </View>

        {/* Search */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          placeholder="Search your entries..."
          style={styles.searchContainer}
        />

        {/* Filters */}
        {entries.length > 0 && renderFilters()}

        {/* Entries List */}
        {filteredEntries.length > 0 ? (
          <FlatList
            data={Object.entries(paginatedGroupedEntries)}
            renderItem={renderMonthGroup}
            keyExtractor={(item) => item[0]}
            contentContainerStyle={styles.listContainer}
            onEndReached={loadMoreEntries}
            onEndReachedThreshold={0.5}
            ListFooterComponent={renderFooter}
          />
        ) : (
          renderEmptyState()
        )}
      </View>
    </View>
  );
};

import { ScrollView } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: theme.SPACING.lg,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
    paddingTop: 0,
  },
  title: {
    fontSize: 32,
    color: theme.COLORS.ui.text,
  },
  searchContainer: {
    marginBottom: theme.SPACING.md,
  },
  filtersContainer: {
    marginBottom: theme.SPACING.md,
  },
  filtersScroll: {
    marginBottom: theme.SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.xs,
    backgroundColor: `${theme.COLORS.ui.card}80`,
    borderRadius: theme.BORDER_RADIUS.md,
    marginRight: theme.SPACING.sm,
    borderWidth: 1,
    borderColor: `${theme.COLORS.ui.border}50`,
  },
  activeFilterChip: {
    backgroundColor: theme.COLORS.primary.green,
  },
  filterText: {
    color: theme.COLORS.ui.textSecondary,
  },
  activeFilterText: {
    color: theme.COLORS.ui.background,
    fontWeight: 'bold',
  },
  listContainer: {
    paddingBottom: theme.SPACING.xl,
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
  loaderContainer: {
    padding: theme.SPACING.md,
    alignItems: 'center',
  },
  loaderText: {
    marginTop: theme.SPACING.xs,
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