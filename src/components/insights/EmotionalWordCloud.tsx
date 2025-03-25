import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import theme from '@/constants/theme';
import { getEmotionById } from '@/constants/emotions';
import { useJournal } from '@/contexts/JournalContext';
import { extractWordsFromEntries } from '@/utils/insightAnalyzer';

// Use the JournalEntry type from the context
type JournalEntry = {
  id: string;
  date: Date;
  initial_emotion: string;
  emotional_shift: number;
  time_period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  note?: string;
};

interface WordData {
  text: string;
  value: number;
  color: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface EmotionalWordCloudProps {
  entries: JournalEntry[];
  width: number;
  height: number;
}

export const EmotionalWordCloud: React.FC<EmotionalWordCloudProps> = ({ entries, width, height }) => {
  const wordCloudData = useMemo(() => {
    console.log('EmotionalWordCloud entries:', entries.length);
    
    // Check if we have entries with notes
    const entriesWithNotes = entries.filter(entry => entry.note && entry.note.trim().length > 5);
    console.log('Entries with notes:', entriesWithNotes.length);
    
    // If no entries with notes, return empty array (will show message)
    if (entriesWithNotes.length === 0) {
      return [];
    }
    
    // Use the utility function to extract word data
    const extractedWords = extractWordsFromEntries(entries);
    console.log('Extracted words:', extractedWords.length);
    
    // Always use whatever words we have, no matter how few
    const wordArray = extractedWords
      .slice(0, 15) // Limit to top 15 words for better spacing
      .map(word => ({
        text: word.text,
        value: word.value,
        color: word.color,
      }));
    
    // If no words were extracted, return empty array
    if (wordArray.length === 0) {
      return [];
    }
    
    // Calculate font sizes based on frequency
    const maxValue = Math.max(...wordArray.map(word => word.value));
    const minValue = Math.min(...wordArray.map(word => word.value));
    const fontSizeRange = 32 - 16; // Max font size - Min font size
    
    // Layout algorithm with better spacing
    const placedWords: WordData[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Helper to check distance between words
    const getMinDistanceBetweenWords = (x: number, y: number): number => {
      let minDistance = Number.MAX_VALUE;
      
      for (const word of placedWords) {
        const dx = word.x - x;
        const dy = word.y - y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        minDistance = Math.min(minDistance, distance);
      }
      
      return minDistance;
    };
    
    // Place the most important words near the center
    wordArray.forEach((word, index) => {
      // Calculate font size based on frequency
      const normalizedValue = (word.value - minValue) / (Math.max(1, maxValue - minValue));
      const fontSize = 16 + normalizedValue * fontSizeRange;
      
      // Try multiple positions until we find one with sufficient spacing
      let bestX = 0;
      let bestY = 0;
      let bestDistance = 0;
      
      for (let attempt = 0; attempt < 10; attempt++) {
        // Calculate position (spiral layout with improved spacing)
        const angle = ((index + attempt * 0.3) / wordArray.length) * 2 * Math.PI * 3;
        // Increase spiral spacing factor to create more distance between words
        const spiralFactor = 15 + ((index + attempt * 0.5) * 8);
        const x = centerX + Math.cos(angle) * spiralFactor;
        const y = centerY + Math.sin(angle) * spiralFactor;
        
        const distance = placedWords.length > 0 ? getMinDistanceBetweenWords(x, y) : Number.MAX_VALUE;
        
        // If this position has better spacing than what we've found so far, use it
        if (distance > bestDistance) {
          bestDistance = distance;
          bestX = x;
          bestY = y;
        }
        
        // If we found a position with good spacing, use it
        if (bestDistance > fontSize * 1.2) {
          break;
        }
      }
      
      // Randomize rotation slightly for better visual interest
      const rotation = Math.floor(Math.random() * 3) * 15 - 15; // -15, 0, or 15 degrees
      
      placedWords.push({
        ...word,
        x: bestX || centerX + Math.cos(index) * 15,
        y: bestY || centerY + Math.sin(index) * 15,
        size: fontSize,
        rotation,
      });
    });
    
    return placedWords;
  }, [entries, width, height]);
  
  if (wordCloudData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>
          Add journal entries with notes to see your most frequently used words
        </Text>
        <Text style={styles.noDataSubText}>
          Your word cloud will show patterns in how you express yourself
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[styles.container, { width, height }]}>
      {wordCloudData.map((word, index) => (
        <Text
          key={index}
          style={[
            styles.word,
            {
              fontSize: word.size,
              color: word.color,
              left: word.x,
              top: word.y,
              transform: [{ rotate: `${word.rotation}deg` }],
              opacity: 0.9, // Slightly transparent for layering effect
            },
          ]}
        >
          {word.text}
        </Text>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
    marginVertical: theme.SPACING.md,
  },
  word: {
    position: 'absolute',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    padding: 8, // Increase padding for better spacing
  },
  noDataText: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  noDataSubText: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
    fontSize: 14,
  },
}); 