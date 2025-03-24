import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useJournal } from './JournalContext';
import { Emotion, getEmotionById } from '@/constants/emotions';

export interface Mood {
  id: string;
  value: number; // 1-5 scale where 1 is negative, 3 is neutral, 5 is positive
  emotionId: string;
  created_at: string;
}

interface MoodContextType {
  moods: Mood[];
  getMoodTrend: (days: number) => 'improving' | 'declining' | 'stable';
  getAverageMood: (days: number) => number;
}

const MoodContext = createContext<MoodContextType | undefined>(undefined);

export function MoodProvider({ children }: { children: React.ReactNode }) {
  const { entries } = useJournal();
  const [moods, setMoods] = useState<Mood[]>([]);
  
  // Map emotions to mood values
  const emotionToMoodValue = (emotionId: string): number => {
    const emotion = getEmotionById(emotionId);
    if (!emotion) return 3; // Default to neutral
    
    // Map emotions to 1-5 scale based on their categories
    switch(emotion.id) {
      // Happy emotions
      case 'happy':
      case 'optimistic':
      case 'proud':
      case 'powerful':
        return 5;
      
      case 'peaceful':
        return 4;
      
      // Neutral emotions
      case 'confused':
        return 3;
      
      // Sad/Anxious emotions
      case 'anxious':
      case 'vulnerable':
      case 'distant':
        return 2;
      
      // Very negative emotions
      case 'sad':
      case 'angry':
      case 'scared':
      case 'despair':
      case 'lonely':
      case 'frustrated':
      case 'irritated':
      case 'helpless':
      case 'rejected':
      case 'guilty':
      case 'critical':
        return 1;
      
      default:
        return 3; // Default to neutral
    }
  };
  
  // Extract moods from journal entries
  useEffect(() => {
    const extractedMoods: Mood[] = entries.map(entry => ({
      id: `${entry.id}-initial`,
      value: emotionToMoodValue(entry.initial_emotion),
      emotionId: entry.initial_emotion,
      created_at: entry.created_at
    }));
    
    // Sort by created_at (newest first)
    extractedMoods.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    
    setMoods(extractedMoods);
  }, [entries]);
  
  // Get mood trend over specified days
  const getMoodTrend = (days: number = 7): 'improving' | 'declining' | 'stable' => {
    if (moods.length < 3) return 'stable';
    
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
    
    const recentMoods = moods.filter(mood => 
      new Date(mood.created_at) >= startDate
    );
    
    if (recentMoods.length < 3) return 'stable';
    
    // Calculate average of first half vs second half
    const midpoint = Math.floor(recentMoods.length / 2);
    const firstHalf = recentMoods.slice(midpoint);
    const secondHalf = recentMoods.slice(0, midpoint);
    
    const firstAvg = firstHalf.reduce((sum, mood) => sum + mood.value, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, mood) => sum + mood.value, 0) / secondHalf.length;
    
    if (secondAvg > firstAvg + 0.5) return 'improving';
    if (secondAvg < firstAvg - 0.5) return 'declining';
    return 'stable';
  };
  
  // Get average mood over specified days
  const getAverageMood = (days: number = 7): number => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - days);
    
    const recentMoods = moods.filter(mood => 
      new Date(mood.created_at) >= startDate
    );
    
    if (recentMoods.length === 0) return 3; // Default to neutral
    
    return recentMoods.reduce((sum, mood) => sum + mood.value, 0) / recentMoods.length;
  };
  
  const contextValue = useMemo(() => ({
    moods,
    getMoodTrend,
    getAverageMood
  }), [moods]);
  
  return (
    <MoodContext.Provider value={contextValue}>
      {children}
    </MoodContext.Provider>
  );
}

export const useMood = (): MoodContextType => {
  const context = useContext(MoodContext);
  if (context === undefined) {
    throw new Error('useMood must be used within a MoodProvider');
  }
  return context;
}; 