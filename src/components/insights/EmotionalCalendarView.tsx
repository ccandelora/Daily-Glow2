import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Typography } from '@/components/common';
import { JournalEntry } from '@/types';
import { getEmotionById } from '@/constants/emotions';
import theme from '@/constants/theme';

interface EmotionalCalendarViewProps {
  entries: JournalEntry[];
  timeFilter: 'week' | 'month' | 'all';
}

export const EmotionalCalendarView: React.FC<EmotionalCalendarViewProps> = ({ entries, timeFilter }) => {
  const calendarData = useMemo(() => {
    // Get the date range based on the time filter
    const now = new Date();
    const endDate = new Date(now);
    let startDate: Date;
    
    switch (timeFilter) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // Last 7 days
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29); // Last 30 days
        break;
      default: // 'all' - show last 30 days anyway for visualization
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29);
    }
    
    // Create a map of dates to emotions
    const dateEmotionMap: Record<string, { emotionId: string, count: number }[]> = {};
    
    // Initialize all dates in the range
    const dateRange: Date[] = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      dateEmotionMap[dateStr] = [];
      dateRange.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Fill in emotions for dates with entries
    entries.forEach(entry => {
      const entryDate = entry.date;
      if (entryDate >= startDate && entryDate <= endDate) {
        const dateStr = entryDate.toISOString().split('T')[0];
        
        // Check if this emotion already exists for this date
        const existingEmotion = dateEmotionMap[dateStr].find(e => e.emotionId === entry.initial_emotion);
        
        if (existingEmotion) {
          existingEmotion.count++;
        } else {
          dateEmotionMap[dateStr].push({ emotionId: entry.initial_emotion, count: 1 });
        }
      }
    });
    
    // For each date, determine the dominant emotion
    const calendarCells = dateRange.map(date => {
      const dateStr = date.toISOString().split('T')[0];
      const emotions = dateEmotionMap[dateStr];
      
      // Find the emotion with the highest count
      let dominantEmotion = null;
      let maxCount = 0;
      
      emotions.forEach(emotion => {
        if (emotion.count > maxCount) {
          dominantEmotion = emotion.emotionId;
          maxCount = emotion.count;
        }
      });
      
      // Get emotion details if there is a dominant emotion
      const emotionDetails = dominantEmotion ? getEmotionById(dominantEmotion) : null;
      
      return {
        date,
        dayOfMonth: date.getDate(),
        dayOfWeek: date.getDay(),
        hasEntries: emotions.length > 0,
        dominantEmotion: emotionDetails,
        totalEntries: emotions.reduce((sum, e) => sum + e.count, 0),
      };
    });
    
    // Group by weeks for calendar display
    const weeks: typeof calendarCells[] = [];
    let currentWeek: typeof calendarCells = [];
    
    calendarCells.forEach(cell => {
      if (cell.dayOfWeek === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(cell);
    });
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }
    
    return { weeks, startDate, endDate };
  }, [entries, timeFilter]);
  
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <View style={styles.container}>
      {/* Day headers */}
      <View style={styles.dayLabelsRow}>
        {dayNames.map((day, index) => (
          <Typography key={index} style={styles.dayLabel} variant="caption">
            {day}
          </Typography>
        ))}
      </View>
      
      {/* Calendar grid */}
      {calendarData.weeks.map((week, weekIndex) => (
        <View key={weekIndex} style={styles.weekRow}>
          {/* Fill in empty cells at the start of the first week */}
          {weekIndex === 0 && week[0].dayOfWeek > 0 && 
            Array.from({ length: week[0].dayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.emptyCell} />
            ))
          }
          
          {/* Actual day cells */}
          {week.map((day, dayIndex) => (
            <View 
              key={dayIndex} 
              style={[
                styles.dayCell,
                day.hasEntries ? styles.filledCell : styles.emptyCell,
                day.dominantEmotion && { backgroundColor: `${day.dominantEmotion.color}40` }
              ]}
            >
              <Typography style={styles.dayNumber} variant="caption">
                {day.dayOfMonth}
              </Typography>
              {day.dominantEmotion && (
                <Text style={styles.emotionEmoji}>
                  {getEmotionEmoji(day.dominantEmotion.id)}
                </Text>
              )}
              {day.totalEntries > 0 && (
                <View style={styles.entryCountBadge}>
                  <Typography style={styles.entryCount} variant="caption">
                    {day.totalEntries}
                  </Typography>
                </View>
              )}
            </View>
          ))}
          
          {/* Fill in empty cells at the end of the last week */}
          {weekIndex === calendarData.weeks.length - 1 && week[week.length - 1].dayOfWeek < 6 && 
            Array.from({ length: 6 - week[week.length - 1].dayOfWeek }).map((_, i) => (
              <View key={`empty-end-${i}`} style={styles.emptyCell} />
            ))
          }
        </View>
      ))}
      
      <Typography variant="caption" style={styles.dateRange}>
        {calendarData.startDate.toLocaleDateString()} - {calendarData.endDate.toLocaleDateString()}
      </Typography>
    </View>
  );
};

const getEmotionEmoji = (emotionId: string): string => {
  switch (emotionId) {
    case 'happy': return '😊';
    case 'sad': return '😢';
    case 'angry': return '😠';
    case 'scared': return '😨';
    case 'optimistic': return '🌟';
    case 'peaceful': return '😌';
    case 'powerful': return '💪';
    case 'proud': return '🦁';
    default: return '😊';
  }
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.SPACING.md,
  },
  dayLabelsRow: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.xs,
  },
  dayLabel: {
    flex: 1,
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    fontSize: 12,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: theme.SPACING.xs,
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: theme.BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    position: 'relative',
  },
  filledCell: {
    borderWidth: 1,
    borderColor: `${theme.COLORS.ui.border}40`,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  dayNumber: {
    fontSize: 10,
    color: theme.COLORS.ui.textSecondary,
    position: 'absolute',
    top: 2,
    left: 4,
  },
  emotionEmoji: {
    fontSize: 16,
  },
  entryCountBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: theme.COLORS.primary.green,
    borderRadius: 10,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryCount: {
    fontSize: 8,
    color: theme.COLORS.ui.background,
    fontWeight: 'bold',
  },
  dateRange: {
    textAlign: 'center',
    marginTop: theme.SPACING.sm,
    color: theme.COLORS.ui.textSecondary,
  },
}); 