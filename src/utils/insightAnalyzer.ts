import { getEmotionById } from '@/constants/emotions';

// Define JournalEntry type to match the actual data structure
type JournalEntry = {
  id: string;
  date: Date;
  initial_emotion: string;
  emotional_shift: number;
  time_period: 'MORNING' | 'AFTERNOON' | 'EVENING';
  note?: string;
};

// Interface for emotional triggers
export interface EmotionalTrigger {
  keyword: string;
  emotion: {
    id: string;
    label: string;
    color: string;
  };
  count: number;
}

// Interface for personalized recommendations
export interface PersonalizedRecommendation {
  title: string;
  description: string;
  icon: string; // FontAwesome icon name
}

// Interface for activity correlations
export interface ActivityCorrelation {
  activity: string;
  impact: number; // -10 to +10 scale
  description: string;
}

// Interface for predicted emotions
export interface PredictedEmotion {
  id: string;
  label: string;
  color: string;
  probability: number;
}

// Interface for emotional balance
export interface EmotionalBalance {
  score: number; // -1 to 1 scale
  description: string;
}

/**
 * Analyzes journal entries to identify common emotional triggers
 */
export const analyzeEmotionalTriggers = async (entries: JournalEntry[]): Promise<EmotionalTrigger[]> => {
  // This would normally use Gemini API to analyze entries
  // For now, we'll use a mock implementation
  
  // Extract common words from notes and associate with emotions
  const wordMap: Record<string, { emotionId: string, count: number }[]> = {};
  
  entries.forEach(entry => {
    if (!entry.note) return;
    
    // Extract words from notes (simple implementation)
    const words = entry.note.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3); // Only consider words longer than 3 chars
    
    // Count word occurrences with associated emotions
    words.forEach(word => {
      if (!wordMap[word]) {
        wordMap[word] = [];
      }
      
      const existingEmotion = wordMap[word].find(e => e.emotionId === entry.initial_emotion);
      if (existingEmotion) {
        existingEmotion.count++;
      } else {
        wordMap[word].push({ emotionId: entry.initial_emotion, count: 1 });
      }
    });
  });
  
  // Find words that appear multiple times with the same emotion
  const triggers: EmotionalTrigger[] = [];
  
  Object.entries(wordMap).forEach(([word, emotions]) => {
    emotions.forEach(emotion => {
      if (emotion.count >= 2) { // Only include if word appears with same emotion multiple times
        const emotionData = getEmotionById(emotion.emotionId);
        if (emotionData) {
          triggers.push({
            keyword: word,
            emotion: {
              id: emotionData.id,
              label: emotionData.label,
              color: emotionData.color,
            },
            count: emotion.count,
          });
        }
      }
    });
  });
  
  // If we don't have enough real triggers, add sample data
  if (triggers.length < 3) {
    return generateSampleTriggers(entries);
  }
  
  // Sort by count and limit to top 5
  return triggers
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

/**
 * Generates sample emotional triggers based on common patterns
 * when there isn't enough real data to analyze
 */
const generateSampleTriggers = (entries: JournalEntry[]): EmotionalTrigger[] => {
  // Find the most common emotions in the entries
  const emotionCounts: Record<string, number> = {};
  entries.forEach(entry => {
    emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
  });
  
  // Sort emotions by frequency
  const sortedEmotions = Object.entries(emotionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([id]) => id);
  
  // Use the top 3 emotions, or defaults if not enough data
  const topEmotions = sortedEmotions.length >= 3 
    ? sortedEmotions.slice(0, 3) 
    : ['happy', 'sad', 'angry'];
  
  // Sample triggers for different emotions
  const sampleTriggersByEmotion: Record<string, string[]> = {
    'happy': ['family', 'friends', 'success', 'achievement', 'relaxation'],
    'sad': ['rejection', 'failure', 'loneliness', 'weather', 'memories'],
    'angry': ['traffic', 'interruption', 'disrespect', 'unfairness', 'waiting'],
    'scared': ['uncertainty', 'darkness', 'deadline', 'conflict', 'health'],
    'optimistic': ['opportunity', 'morning', 'planning', 'progress', 'learning'],
    'peaceful': ['nature', 'meditation', 'music', 'reading', 'silence'],
    'powerful': ['exercise', 'accomplishment', 'recognition', 'decision', 'helping'],
    'proud': ['achievement', 'growth', 'feedback', 'milestone', 'overcoming']
  };
  
  // Generate sample triggers based on the user's top emotions
  const sampleTriggers: EmotionalTrigger[] = [];
  
  topEmotions.forEach((emotionId, index) => {
    const emotionData = getEmotionById(emotionId);
    if (!emotionData) return;
    
    // Get sample triggers for this emotion, or use defaults
    const triggerWords = sampleTriggersByEmotion[emotionId] || sampleTriggersByEmotion['happy'];
    
    // Add 1-2 triggers for each top emotion
    const numTriggersToAdd = index === 0 ? 2 : 1;
    
    for (let i = 0; i < numTriggersToAdd && i < triggerWords.length; i++) {
      sampleTriggers.push({
        keyword: triggerWords[i],
        emotion: {
          id: emotionData.id,
          label: emotionData.label,
          color: emotionData.color,
        },
        count: Math.floor(Math.random() * 3) + 2 // Random count between 2-4
      });
    }
  });
  
  return sampleTriggers;
};

/**
 * Generates personalized recommendations based on emotional patterns
 */
export const generatePersonalizedRecommendations = async (entries: JournalEntry[]): Promise<PersonalizedRecommendation[]> => {
  // This would normally use Gemini API to generate recommendations
  // For now, we'll use a mock implementation
  
  // Count emotions to determine dominant patterns
  const emotionCounts: Record<string, number> = {};
  entries.forEach(entry => {
    emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
  });
  
  // Find most common emotion
  let mostCommonEmotion = '';
  let highestCount = 0;
  
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    if (count > highestCount) {
      mostCommonEmotion = emotion;
      highestCount = count;
    }
  });
  
  // Generate recommendations based on dominant emotion
  const recommendations: PersonalizedRecommendation[] = [];
  
  switch (mostCommonEmotion) {
    case 'happy':
    case 'optimistic':
    case 'peaceful':
      recommendations.push(
        {
          title: 'Maintain Your Positive Momentum',
          description: 'Your positive outlook is a strength. Try sharing your positivity with others through acts of kindness.',
          icon: 'hand-holding-heart',
        },
        {
          title: 'Gratitude Practice',
          description: "Enhance your positive emotions by writing down three things you're grateful for each day.",
          icon: 'book-open',
        }
      );
      break;
    case 'sad':
    case 'scared':
      recommendations.push(
        {
          title: 'Mindful Breathing',
          description: 'When feeling down, try 5 minutes of deep breathing to center yourself and reduce stress.',
          icon: 'wind',
        },
        {
          title: 'Connect with Others',
          description: 'Reaching out to a friend or family member can help improve your mood when feeling low.',
          icon: 'users',
        }
      );
      break;
    case 'angry':
      recommendations.push(
        {
          title: 'Physical Activity',
          description: 'Channel your energy into a brisk walk or exercise session to help process intense emotions.',
          icon: 'running',
        },
        {
          title: 'Emotion Journaling',
          description: 'Write about what triggered your anger without judgment to gain clarity on your feelings.',
          icon: 'pen-fancy',
        }
      );
      break;
    default:
      recommendations.push(
        {
          title: 'Mindfulness Practice',
          description: 'Take 5 minutes each day to sit quietly and observe your thoughts without judgment.',
          icon: 'brain',
        },
        {
          title: 'Emotional Check-ins',
          description: 'Set a reminder to check in with your emotions throughout the day to build awareness.',
          icon: 'bell',
        }
      );
  }
  
  // Add a general recommendation
  recommendations.push({
    title: 'Consistent Sleep Schedule',
    description: 'Maintaining regular sleep hours can significantly improve your emotional well-being.',
    icon: 'moon',
  });
  
  return recommendations;
};

/**
 * Analyzes correlations between activities mentioned in entries and emotional states
 */
export const analyzeActivityCorrelations = async (entries: JournalEntry[]): Promise<ActivityCorrelation[]> => {
  // This would normally use Gemini API to identify correlations
  // For now, we'll use a mock implementation
  
  // Common activities to look for
  const activities = ['work', 'exercise', 'family', 'friends', 'sleep', 'meditation', 'reading', 'nature'];
  const activityImpact: Record<string, { count: number, totalShift: number }> = {};
  
  // Initialize activity tracking
  activities.forEach(activity => {
    activityImpact[activity] = { count: 0, totalShift: 0 };
  });
  
  // Analyze notes for activities and track emotional shifts
  entries.forEach(entry => {
    if (!entry.note) return;
    
    const notesLower = entry.note.toLowerCase();
    
    activities.forEach(activity => {
      if (notesLower.includes(activity)) {
        activityImpact[activity].count++;
        activityImpact[activity].totalShift += entry.emotional_shift;
      }
    });
  });
  
  // Calculate average impact for each activity
  const correlations: ActivityCorrelation[] = [];
  
  Object.entries(activityImpact).forEach(([activity, data]) => {
    if (data.count >= 2) { // Only include if activity appears multiple times
      const avgImpact = data.totalShift / data.count;
      const normalizedImpact = Math.max(Math.min(Math.round(avgImpact * 5), 10), -10); // Scale to -10 to +10
      
      let description = '';
      if (normalizedImpact > 5) {
        description = `${activity} appears to significantly boost your mood.`;
      } else if (normalizedImpact > 0) {
        description = `${activity} seems to have a positive effect on your emotions.`;
      } else if (normalizedImpact < -5) {
        description = `${activity} may be contributing to negative emotions.`;
      } else if (normalizedImpact < 0) {
        description = `${activity} might be slightly decreasing your mood.`;
      } else {
        description = `${activity} doesn't seem to affect your emotions significantly.`;
      }
      
      correlations.push({
        activity: activity.charAt(0).toUpperCase() + activity.slice(1),
        impact: normalizedImpact,
        description,
      });
    }
  });
  
  // Sort by absolute impact (most significant first)
  return correlations
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact))
    .slice(0, 4);
};

/**
 * Predicts likely emotional states based on historical patterns
 */
export const predictEmotionalState = async (entries: JournalEntry[]): Promise<PredictedEmotion[]> => {
  // This would normally use Gemini API with ML to predict emotions
  // For now, we'll use a simple frequency-based approach
  
  // Count emotions by day of week
  const dayEmotions: Record<number, Record<string, number>> = {};
  
  entries.forEach(entry => {
    const day = entry.date.getDay(); // 0-6 for Sunday-Saturday
    if (!dayEmotions[day]) {
      dayEmotions[day] = {};
    }
    
    dayEmotions[day][entry.initial_emotion] = (dayEmotions[day][entry.initial_emotion] || 0) + 1;
  });
  
  // Get tomorrow's day of week
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDay = tomorrow.getDay();
  
  // If we have data for tomorrow's day of week, use it for prediction
  // Otherwise use overall emotion frequencies
  const emotionCounts: Record<string, number> = {};
  
  if (dayEmotions[tomorrowDay] && Object.keys(dayEmotions[tomorrowDay]).length > 0) {
    Object.assign(emotionCounts, dayEmotions[tomorrowDay]);
  } else {
    entries.forEach(entry => {
      emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
    });
  }
  
  // Calculate total for probability
  const total = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
  
  // Convert to predicted emotions with probabilities
  const predictions: PredictedEmotion[] = [];
  
  Object.entries(emotionCounts).forEach(([emotionId, count]) => {
    const emotion = getEmotionById(emotionId);
    if (emotion) {
      predictions.push({
        id: emotion.id,
        label: emotion.label,
        color: emotion.color,
        probability: count / total,
      });
    }
  });
  
  // Sort by probability and limit to top 3
  return predictions
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
};

/**
 * Calculates emotional balance score and provides a description
 */
export const calculateEmotionalBalance = (entries: JournalEntry[]): EmotionalBalance => {
  if (entries.length === 0) {
    return {
      score: 0,
      description: "Start tracking your emotions to see your emotional balance."
    };
  }
  
  // Categorize emotions as positive or negative
  const positiveEmotions = ['happy', 'optimistic', 'peaceful', 'powerful', 'proud'];
  const negativeEmotions = ['sad', 'angry', 'scared', 'anxious', 'disappointed'];
  
  let positiveCount = 0;
  let negativeCount = 0;
  
  entries.forEach(entry => {
    if (positiveEmotions.includes(entry.initial_emotion)) {
      positiveCount++;
    } else if (negativeEmotions.includes(entry.initial_emotion)) {
      negativeCount++;
    }
  });
  
  const total = positiveCount + negativeCount;
  if (total === 0) return { score: 0, description: "Not enough emotional data yet." };
  
  // Calculate balance score from -1 (all negative) to 1 (all positive)
  const score = (positiveCount - negativeCount) / total;
  
  // Generate description based on score
  let description = "";
  if (score > 0.6) {
    description = "Your emotional state is predominantly positive. You're thriving!";
  } else if (score > 0.2) {
    description = "You're maintaining a positive emotional balance. Keep it up!";
  } else if (score > -0.2) {
    description = "Your emotions are fairly balanced between positive and negative.";
  } else if (score > -0.6) {
    description = "You're experiencing more negative emotions lately. Consider self-care activities.";
  } else {
    description = "Your emotional state has been challenging. Reaching out for support might help.";
  }
  
  return { score, description };
}; 