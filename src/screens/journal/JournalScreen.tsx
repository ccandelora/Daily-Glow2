import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Alert, ActionSheetIOS, Platform, Animated as RNAnimated, Share } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Card, Input, AnimatedMoodIcon, Button } from '@/components/common';
import { useJournal } from '@/contexts/JournalContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

type FilterType = 'all' | 'great' | 'good' | 'okay' | 'bad';
type ViewMode = 'list' | 'grid';
type SortOrder = 'newest' | 'oldest' | 'mood';
type MoodType = Exclude<FilterType, 'all'>;

interface JournalEntry {
  id: string;
  date: Date;
  mood: MoodType;
  gratitude: string;
  note?: string;
  created_at: string;
}

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  color?: string;
  size?: number;
  disabled?: boolean;
}

const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  onPress, 
  color = theme.COLORS.ui.text, 
  size = 24,
  disabled = false 
}) => (
  <TouchableOpacity 
    onPress={onPress} 
    disabled={disabled}
    style={[
      styles.iconButton,
      disabled && { opacity: 0.5 }
    ]}
  >
    <Ionicons name={icon} size={size} color={color} />
  </TouchableOpacity>
);

const moodOrder: Record<MoodType, number> = {
  great: 0,
  good: 1,
  okay: 2,
  bad: 3,
};

export const JournalScreen = () => {
  const router = useRouter();
  const { entries, deleteEntry, deleteEntries } = useJournal();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const fadeAnim = React.useRef(new RNAnimated.Value(1)).current;
  const scaleAnim = React.useRef(new RNAnimated.Value(1)).current;

  const handleSort = useCallback(() => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Newest First', 'Oldest First', 'By Mood'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) setSortOrder('newest');
          if (buttonIndex === 2) setSortOrder('oldest');
          if (buttonIndex === 3) setSortOrder('mood');
        }
      );
    }
  }, []);

  const handleDeleteSelected = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      'Delete Selected Entries',
      `Are you sure you want to delete ${selectedEntries.length} entries?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntries(selectedEntries);
              setSelectedEntries([]);
              setIsSelectionMode(false);
            } catch (error) {
              // Error is already handled in the context
            }
          },
        },
      ]
    );
  }, [selectedEntries, deleteEntries]);

  const toggleEntrySelection = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEntries(prev => 
      prev.includes(id) 
        ? prev.filter(entryId => entryId !== id)
        : [...prev, id]
    );
  }, []);

  const handleViewModeChange = useCallback(() => {
    Haptics.selectionAsync();
    // Animate out
    RNAnimated.parallel([
      RNAnimated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      RNAnimated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change view mode
      setViewMode(prev => prev === 'list' ? 'grid' : 'list');
      
      // Animate back in
      RNAnimated.parallel([
        RNAnimated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        RNAnimated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [fadeAnim, scaleAnim]);

  const handleShare = useCallback(async (entry: JournalEntry) => {
    try {
      await Haptics.selectionAsync();
      const message = `On ${entry.date.toLocaleDateString()}, I felt ${entry.mood}.\n\nGratitude: ${entry.gratitude}${entry.note ? `\n\nThoughts: ${entry.note}` : ''}`;
      await Share.share({
        message,
        title: 'Daily Glow Journal Entry',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  }, []);

  const handleEdit = useCallback((entry: JournalEntry) => {
    Haptics.selectionAsync();
    router.push({
      pathname: '/(app)/check-in',
      params: { editId: entry.id }
    });
  }, [router]);

  const filteredEntries = useMemo(() => {
    let filtered = entries.filter(entry => {
      const matchesSearch = searchQuery.toLowerCase().trim() === '' ||
        entry.gratitude.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (entry.note?.toLowerCase() || '').includes(searchQuery.toLowerCase());

      const matchesMood = activeFilter === 'all' || entry.mood === activeFilter;

      const matchesDate = !selectedDate || 
        entry.date.toDateString() === selectedDate.toDateString();

      return matchesSearch && matchesMood && matchesDate;
    });

    switch (sortOrder) {
      case 'oldest':
        filtered.sort((a, b) => a.date.getTime() - b.date.getTime());
        break;
      case 'mood':
        filtered.sort((a, b) => {
          const aMood = a.mood as MoodType;
          const bMood = b.mood as MoodType;
          return moodOrder[aMood] - moodOrder[bMood];
        });
        break;
      default: // newest
        filtered.sort((a, b) => b.date.getTime() - a.date.getTime());
    }

    return filtered;
  }, [entries, searchQuery, activeFilter, selectedDate, sortOrder]);

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

  const renderRightActions = useCallback((
    progress: RNAnimated.AnimatedInterpolation<number>,
    dragX: RNAnimated.AnimatedInterpolation<number>,
    entry: JournalEntry
  ) => {
    const scale = dragX.interpolate({
      inputRange: [-160, 0],
      outputRange: [1, 0],
      extrapolate: 'clamp',
    });

    const opacity = dragX.interpolate({
      inputRange: [-160, -80, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: 'clamp',
    });

    return (
      <RNAnimated.View 
        style={[
          styles.swipeActions,
          {
            transform: [{ scale }],
            opacity,
          }
        ]}
      >
        <TouchableOpacity
          onPress={() => handleEdit(entry)}
          style={[styles.swipeAction, { backgroundColor: theme.COLORS.primary.blue }]}
        >
          <Ionicons name="pencil-outline" size={24} color={theme.COLORS.ui.background} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleShare(entry)}
          style={[styles.swipeAction, { backgroundColor: theme.COLORS.primary.green }]}
        >
          <Ionicons name="share-outline" size={24} color={theme.COLORS.ui.background} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Alert.alert(
              'Delete Entry',
              'Are you sure you want to delete this entry?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete',
                  style: 'destructive',
                  onPress: () => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    deleteEntry(entry.id);
                  },
                },
              ]
            );
          }}
          style={[styles.swipeAction, { backgroundColor: theme.COLORS.primary.red }]}
        >
          <Ionicons name="trash-outline" size={24} color={theme.COLORS.ui.background} />
        </TouchableOpacity>
      </RNAnimated.View>
    );
  }, [deleteEntry, handleEdit, handleShare]);

  return (
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.header}>
        <Typography variant="h1" style={styles.title}>
          Journal
        </Typography>
        <View style={styles.headerActions}>
          {isSelectionMode ? (
            <>
              <Button
                title={`Selected: ${selectedEntries.length}`}
                variant="secondary"
                onPress={() => setIsSelectionMode(false)}
                style={styles.headerButton}
              />
              <IconButton
                icon="trash-outline"
                onPress={handleDeleteSelected}
                disabled={selectedEntries.length === 0}
                color={theme.COLORS.ui.text}
              />
            </>
          ) : (
            <>
              <IconButton
                icon={viewMode === 'list' ? 'grid-outline' : 'list-outline'}
                onPress={handleViewModeChange}
              />
              <IconButton
                icon="funnel-outline"
                onPress={() => setShowDatePicker(true)}
              />
              <IconButton
                icon="options-outline"
                onPress={handleSort}
              />
              <IconButton
                icon="checkmark-circle-outline"
                onPress={() => setIsSelectionMode(true)}
              />
            </>
          )}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search entries..."
          style={styles.searchInput}
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearButton}
          >
            <Ionicons 
              name="close-circle-outline" 
              size={20} 
              color={theme.COLORS.ui.textSecondary} 
            />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <TouchableOpacity
          onPress={() => setActiveFilter('all')}
          style={[
            styles.filterButton,
            activeFilter === 'all' && styles.filterButtonActive,
          ]}
        >
          <Typography
            color={activeFilter === 'all' ? theme.COLORS.primary.green : theme.COLORS.ui.textSecondary}
          >
            All
          </Typography>
        </TouchableOpacity>
        {['great', 'good', 'okay', 'bad'].map(mood => (
          <TouchableOpacity
            key={mood}
            onPress={() => setActiveFilter(mood as FilterType)}
            style={[
              styles.filterButton,
              activeFilter === mood && styles.filterButtonActive,
            ]}
          >
            <Typography
              color={activeFilter === mood ? theme.COLORS.primary.green : theme.COLORS.ui.textSecondary}
            >
              {mood.charAt(0).toUpperCase() + mood.slice(1)}
            </Typography>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {Platform.OS === 'ios' ? (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="inline"
            onChange={(_event, date) => {
              setShowDatePicker(false);
              if (date) {
                setSelectedDate(date);
              }
            }}
            style={styles.datePicker}
          />
        )
      ) : (
        showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            onChange={(_event, date) => {
              setShowDatePicker(false);
              if (date) {
                setSelectedDate(date);
              }
            }}
          />
        )
      )}

      {selectedDate && (
        <View style={styles.dateFilterContainer}>
          <Typography variant="body">
            Filtered by date: {selectedDate.toLocaleDateString()}
          </Typography>
          <IconButton
            icon="close-circle-outline"
            size={20}
            onPress={() => setSelectedDate(null)}
          />
        </View>
      )}

      <ScrollView style={styles.content}>
        <RNAnimated.View 
          style={{
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              })},
            ],
          }}
        >
          {viewMode === 'grid' ? (
            <View style={styles.gridContainer}>
              {filteredEntries.map(entry => (
                <TouchableOpacity
                  key={entry.id}
                  style={styles.gridItem}
                  onPress={() => isSelectionMode 
                    ? toggleEntrySelection(entry.id)
                    : router.push(`/journal/${entry.id}`)
                  }
                  onLongPress={() => {
                    if (!isSelectionMode) {
                      setIsSelectionMode(true);
                      toggleEntrySelection(entry.id);
                    }
                  }}
                >
                  <Card 
                    style={{
                      ...styles.gridCard,
                      ...(selectedEntries.includes(entry.id) ? styles.selectedCard : {})
                    }}
                  >
                    <AnimatedMoodIcon
                      color={theme.COLORS.primary[entry.mood === 'great' ? 'green' : 
                        entry.mood === 'good' ? 'blue' : 
                        entry.mood === 'okay' ? 'yellow' : 'red']}
                      size={32}
                    >
                      <Typography>
                        {entry.mood === 'great' ? '😊' :
                         entry.mood === 'good' ? '🙂' :
                         entry.mood === 'okay' ? '😐' : '😕'}
                      </Typography>
                    </AnimatedMoodIcon>
                    <Typography
                      variant="caption"
                      style={styles.gridDate}
                    >
                      {entry.date.toLocaleDateString('en-US', { 
                        month: 'short',
                        day: 'numeric'
                      })}
                    </Typography>
                    <Typography
                      variant="body"
                      numberOfLines={2}
                      style={styles.gridGratitude}
                    >
                      {entry.gratitude}
                    </Typography>
                  </Card>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            Object.entries(groupedEntries).map(([date, dateEntries]) => (
              <View key={date} style={styles.monthGroup}>
                <Typography variant="h3" style={styles.monthTitle}>
                  {date}
                </Typography>
                {dateEntries.map(entry => (
                  <Swipeable
                    key={entry.id}
                    renderRightActions={(progress, dragX) => 
                      renderRightActions(progress, dragX, entry)
                    }
                    overshootRight={false}
                  >
                    <TouchableOpacity
                      onPress={() => router.push(`/journal/${entry.id}`)}
                      onLongPress={() => {
                        if (!isSelectionMode) {
                          setIsSelectionMode(true);
                          toggleEntrySelection(entry.id);
                        }
                      }}
                    >
                      <Card 
                        style={{
                          ...styles.entryCard,
                          ...(selectedEntries.includes(entry.id) ? styles.selectedCard : {})
                        }}
                      >
                        <View style={styles.entryHeader}>
                          <Typography variant="h3">
                            {entry.date.toLocaleDateString('en-US', { 
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </Typography>
                          <AnimatedMoodIcon
                            color={theme.COLORS.primary[entry.mood === 'great' ? 'green' : 
                              entry.mood === 'good' ? 'blue' : 
                              entry.mood === 'okay' ? 'yellow' : 'red']}
                            size={32}
                          >
                            <Typography>
                              {entry.mood === 'great' ? '😊' :
                               entry.mood === 'good' ? '🙂' :
                               entry.mood === 'okay' ? '😐' : '😕'}
                            </Typography>
                          </AnimatedMoodIcon>
                        </View>
                        <Typography
                          variant="body"
                          numberOfLines={2}
                          style={styles.gratitudeText}
                        >
                          {entry.gratitude}
                        </Typography>
                      </Card>
                    </TouchableOpacity>
                  </Swipeable>
                ))}
              </View>
            ))
          )}
          
          {filteredEntries.length === 0 && (
            <Typography
              variant="body"
              color={theme.COLORS.ui.textSecondary}
              style={styles.emptyText}
            >
              No entries found
            </Typography>
          )}
        </RNAnimated.View>
      </ScrollView>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  header: {
    padding: theme.SPACING.lg,
  },
  title: {
    marginBottom: theme.SPACING.md,
  },
  searchContainer: {
    paddingHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.md,
  },
  searchInput: {
    backgroundColor: theme.COLORS.ui.card,
  },
  filterContainer: {
    paddingHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
  },
  filterButton: {
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.sm,
    marginRight: theme.SPACING.sm,
    borderRadius: theme.BORDER_RADIUS.md,
    backgroundColor: theme.COLORS.ui.card,
  },
  filterButtonActive: {
    backgroundColor: theme.COLORS.ui.card,
    borderWidth: 1,
    borderColor: theme.COLORS.primary.green,
  },
  content: {
    padding: theme.SPACING.lg,
    paddingTop: 0,
  },
  monthGroup: {
    marginBottom: theme.SPACING.xl,
  },
  monthTitle: {
    marginBottom: theme.SPACING.md,
  },
  entryCard: {
    marginBottom: theme.SPACING.md,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  gratitudeText: {
    color: theme.COLORS.ui.textSecondary,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: theme.SPACING.xl,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.SPACING.sm,
  },
  headerButton: {
    marginRight: theme.SPACING.sm,
  },
  dateFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.SPACING.lg,
    paddingVertical: theme.SPACING.sm,
    backgroundColor: theme.COLORS.ui.card,
    marginBottom: theme.SPACING.md,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: theme.SPACING.lg,
    gap: theme.SPACING.md,
  },
  gridItem: {
    width: '48%',
    marginBottom: theme.SPACING.md,
  },
  gridCard: {
    padding: theme.SPACING.md,
    alignItems: 'center',
  },
  selectedCard: {
    borderColor: theme.COLORS.primary.green,
    borderWidth: 2,
  },
  gridDate: {
    marginTop: theme.SPACING.sm,
    color: theme.COLORS.ui.textSecondary,
  },
  gridGratitude: {
    marginTop: theme.SPACING.sm,
    textAlign: 'center',
  },
  iconButton: {
    padding: theme.SPACING.sm,
  },
  clearButton: {
    position: 'absolute',
    right: theme.SPACING.md,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  filterContent: {
    paddingHorizontal: theme.SPACING.lg,
  },
  datePicker: {
    height: 350,
    marginTop: theme.SPACING.md,
  },
  swipeActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 54,
    height: '100%',
  },
}); 