import React, { useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import theme from '@/constants/theme';
import { getEmotionById } from '@/constants/emotions';
import { useJournal } from '@/contexts/JournalContext';

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
    
    // Create sample data if no entries with notes exist
    if (entries.length === 0) {
      return generateSampleWordCloud();
    }
    
    // Extract words from journal entries
    const wordMap: Record<string, { count: number; emotions: Record<string, number> }> = {};
    const stopWords = ['and', 'the', 'to', 'a', 'of', 'for', 'as', 'i', 'with', 'it', 'is', 'on', 'that', 'this', 'can', 'in', 'be', 'has', 'if', 'was', 'am', 'are', 'my', 'me', 'mine', 'our', 'ours', 'your', 'yours', 'their', 'theirs', 'his', 'her', 'hers'];
    
    // Count entries with notes
    let entriesWithNotes = 0;
    
    entries.forEach(entry => {
      if (!entry.note || entry.note.trim().length < 5) return;
      entriesWithNotes++;
      
      // Extract words from notes
      const words = entry.note.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(word => word.length > 3 && !stopWords.includes(word));
      
      // Count word occurrences with associated emotions
      words.forEach(word => {
        if (!wordMap[word]) {
          wordMap[word] = { count: 0, emotions: {} };
        }
        
        wordMap[word].count++;
        
        // Associate with emotion
        if (!wordMap[word].emotions[entry.initial_emotion]) {
          wordMap[word].emotions[entry.initial_emotion] = 0;
        }
        wordMap[word].emotions[entry.initial_emotion]++;
      });
    });
    
    console.log('Entries with notes:', entriesWithNotes);
    console.log('Word map size:', Object.keys(wordMap).length);
    
    // If no meaningful data, use sample data
    if (Object.keys(wordMap).length < 5) {
      return generateSampleWordCloud();
    }
    
    // Convert to array and sort by count
    const wordArray = Object.entries(wordMap)
      .map(([text, data]) => {
        // Find dominant emotion for this word
        let dominantEmotion = '';
        let maxCount = 0;
        
        Object.entries(data.emotions).forEach(([emotion, count]) => {
          if (count > maxCount) {
            dominantEmotion = emotion;
            maxCount = count;
          }
        });
        
        const emotionData = getEmotionById(dominantEmotion);
        
        return {
          text,
          value: data.count,
          color: emotionData?.color || theme.COLORS.ui.text,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 20); // Limit to top 20 words for better readability
    
    // Calculate font sizes based on frequency
    const maxValue = Math.max(...wordArray.map(word => word.value));
    const minValue = Math.min(...wordArray.map(word => word.value));
    const fontSizeRange = 32 - 16; // Max font size - Min font size (increased for better visibility)
    
    // Improved layout algorithm with better spacing
    const placedWords: WordData[] = [];
    const centerX = width / 2;
    const centerY = height / 2;
    
    // Place the most important words near the center
    wordArray.forEach((word, index) => {
      // Calculate font size based on frequency (increased minimum size)
      const normalizedValue = (word.value - minValue) / (Math.max(1, maxValue - minValue));
      const fontSize = 16 + normalizedValue * fontSizeRange;
      
      // Calculate position (improved spiral layout with better spacing)
      const angle = (index / wordArray.length) * 2 * Math.PI * 3;
      const spiralFactor = 10 + (index * 4);
      const x = centerX + Math.cos(angle) * spiralFactor;
      const y = centerY + Math.sin(angle) * spiralFactor;
      
      // Less rotation for better readability
      const rotation = Math.floor(Math.random() * 2) * 20 - 10; // -10, 0, or 10 degrees
      
      placedWords.push({
        ...word,
        x,
        y,
        size: fontSize,
        rotation,
      });
    });
    
    return placedWords;
  }, [entries, width, height]);
  
  // Generate sample data when no real data exists
  const generateSampleWordCloud = (): WordData[] => {
    const sampleWords = [
      { text: 'happy', value: 10, emotion: 'happy' },
      { text: 'family', value: 8, emotion: 'peaceful' },
      { text: 'friends', value: 7, emotion: 'happy' },
      { text: 'work', value: 6, emotion: 'optimistic' },
      { text: 'relaxed', value: 5, emotion: 'peaceful' },
      { text: 'excited', value: 5, emotion: 'happy' },
      { text: 'tired', value: 4, emotion: 'sad' },
      { text: 'grateful', value: 4, emotion: 'peaceful' },
      { text: 'productive', value: 3, emotion: 'powerful' },
      { text: 'stressed', value: 3, emotion: 'scared' },
    ];
    
    const centerX = width / 2;
    const centerY = height / 2;
    
    return sampleWords.map((word, index) => {
      const emotionData = getEmotionById(word.emotion);
      const fontSize = 16 + (word.value / 10) * 16;
      
      // Calculate position (spiral layout)
      const angle = (index / sampleWords.length) * 2 * Math.PI * 3;
      const spiralFactor = 10 + (index * 4);
      const x = centerX + Math.cos(angle) * spiralFactor;
      const y = centerY + Math.sin(angle) * spiralFactor;
      
      // Less rotation for better readability
      const rotation = Math.floor(Math.random() * 2) * 20 - 10; // -10, 0, or 10 degrees
      
      return {
        text: word.text,
        value: word.value,
        color: emotionData?.color || theme.COLORS.ui.text,
        x,
        y,
        size: fontSize,
        rotation,
      };
    });
  };
  
  if (wordCloudData.length === 0) {
    return (
      <View style={[styles.container, { width, height }]}>
        <Text style={styles.noDataText}>
          Add more journal entries to see your word cloud
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
    padding: 2, // Add padding for better spacing
  },
  noDataText: {
    color: theme.COLORS.ui.textSecondary,
    textAlign: 'center',
  },
}); 