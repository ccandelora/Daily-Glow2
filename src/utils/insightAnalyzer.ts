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
  // If there are no entries with notes, we can't extract triggers
  const entriesWithNotes = entries.filter(entry => entry.note && entry.note.trim().length > 0);
  if (entriesWithNotes.length === 0) {
    return generateSampleTriggers(entries);
  }
  
  console.log(`Analyzing ${entriesWithNotes.length} entries with notes for emotional triggers`);
  
  // Extract common words from notes and associate with emotions
  const wordMap: Record<string, { emotionId: string, count: number, mentions: Set<string> }[]> = {};
  
  // Common words to exclude (stopwords)
  const stopwords = [
    'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 
    'from', 'as', 'into', 'after', 'before', 'between', 'during', 'through', 
    'over', 'under', 'above', 'below', 'down', 'up', 'off', 'around', 'am', 
    'is', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had', 
    'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 
    'must', 'can', 'could', 'of', 'a', 'an', 'it', 'its', 'this', 'that', 
    'these', 'those', 'my', 'your', 'his', 'her', 'our', 'their', 'i', 'me', 
    'you', 'he', 'she', 'we', 'they', 'him', 'them', 'myself', 'yourself', 
    'himself', 'herself', 'ourselves', 'themselves', 'what', 'which', 'who', 
    'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'but',
    'now', 'also', 'like', 'even', 'well', 'back', 'there', 'still', 'today',
    'yesterday', 'tomorrow', 'day', 'week', 'month', 'year', 'time', 'feel',
    'felt', 'feeling', 'little', 'lot', 'much', 'many', 'woke', 'think', 'thought',
    'got', 'get', 'getting', 'make', 'made', 'making', 'want', 'wanted', 'wanting',
    'need', 'needed', 'needing', 'goes', 'went', 'going', 'thing', 'things', 'stuff'
  ];
  
  // Define concept groups for related terms
  const conceptGroups: Record<string, string[]> = {
    'work': ['job', 'office', 'career', 'project', 'working', 'workplace', 'boss', 'colleague', 'meeting', 'deadline'],
    'progress': ['improve', 'improvement', 'improving', 'better', 'growth', 'growing', 'develop', 'development', 'developing', 'advance', 'advancing', 'achievement', 'achieving', 'succeed', 'success', 'successful'],
    'family': ['parent', 'mom', 'dad', 'mother', 'father', 'sister', 'brother', 'sibling', 'daughter', 'son', 'child', 'children', 'grandparent', 'grandma', 'grandpa', 'relative'],
    'health': ['exercise', 'workout', 'fitness', 'gym', 'running', 'jogging', 'walking', 'diet', 'nutrition', 'eating', 'sleeping', 'sleep', 'rest', 'energy', 'tired', 'fatigue', 'sickness', 'illness', 'disease', 'doctor', 'medical'],
    'social': ['friend', 'friends', 'relationship', 'dating', 'partner', 'spouse', 'husband', 'wife', 'boyfriend', 'girlfriend', 'connection', 'social', 'party', 'gathering', 'meeting', 'people'],
    'stress': ['anxiety', 'anxious', 'worried', 'worry', 'concern', 'concerned', 'pressure', 'overwhelm', 'overwhelming', 'burden', 'burdened', 'tension', 'tense'],
    'creativity': ['art', 'creative', 'creating', 'create', 'paint', 'painting', 'draw', 'drawing', 'write', 'writing', 'craft', 'design', 'designing', 'music', 'play', 'playing', 'instrument'],
    'finances': ['money', 'financial', 'finances', 'spending', 'saving', 'budget', 'budgeting', 'debt', 'loan', 'expense', 'expenses', 'bill', 'bills', 'pay', 'payment', 'income', 'salary', 'wage'],
    'learning': ['study', 'studying', 'learn', 'learning', 'education', 'school', 'college', 'university', 'class', 'course', 'knowledge', 'skill', 'skills'],
    'future': ['plan', 'planning', 'goal', 'goals', 'dream', 'dreams', 'aspiration', 'aspirations', 'ambition', 'ambitions', 'hope', 'hopes', 'future', 'outlook'],
    'rest': ['sleep', 'sleeping', 'rest', 'resting', 'relax', 'relaxing', 'relaxation', 'break', 'recharge', 'recover', 'recovery', 'nap', 'tired', 'exhausted'],
    'nature': ['outdoor', 'outdoors', 'nature', 'hike', 'hiking', 'walk', 'walking', 'garden', 'gardening', 'plant', 'plants', 'tree', 'trees', 'forest', 'mountain', 'beach', 'park', 'trail'],
    'food': ['eat', 'eating', 'food', 'meal', 'breakfast', 'lunch', 'dinner', 'diet', 'nutrition', 'cooking', 'cook', 'restaurant', 'dining'],
    'technology': ['computer', 'phone', 'device', 'tech', 'technology', 'internet', 'app', 'application', 'software', 'game', 'gaming', 'social media', 'online'],
    'anxiety': ['anxious', 'anxiety', 'nervous', 'worry', 'worried', 'fear', 'scared', 'afraid', 'panic', 'stress', 'stressed', 'overwhelming', 'overwhelmed', 'pressure', 'uneasy']
  };
  
  // Index of words to their concept group
  const wordToConceptMap: Record<string, string> = {};
  Object.entries(conceptGroups).forEach(([concept, words]) => {
    words.forEach(word => {
      wordToConceptMap[word] = concept;
    });
  });
  
  // Track which entry IDs have contributed to which concepts
  // This prevents double-counting the same concept in the same entry
  const entryConceptTracker: Record<string, Set<string>> = {};
  
  entriesWithNotes.forEach(entry => {
    if (!entry.note || !entry.initial_emotion) return;
    
    const entryId = entry.id;
    const noteText = entry.note.toLowerCase();
    
    if (!entryConceptTracker[entryId]) {
      entryConceptTracker[entryId] = new Set();
    }
    
    // Extract significant individual words
    const words = noteText
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && // Longer words more likely to be meaningful
        !stopwords.includes(word) && 
        !word.match(/^\d+$/) // Exclude numbers
      );
    
    // Process each word, mapping to concepts when possible
    words.forEach(word => {
      // Check if this word belongs to a concept group
      let concept = wordToConceptMap[word] || word;
      
      // Check if we've already counted this concept for this entry
      if (entryConceptTracker[entryId].has(concept)) {
        return; // Skip if already counted
      }
      
      // Mark this concept as counted for this entry
      entryConceptTracker[entryId].add(concept);
      
      // Initialize the concept in the word map if needed
      if (!wordMap[concept]) {
        wordMap[concept] = [];
      }
      
      // Check if entry's emotion already exists for this concept
      const existingEmotion = wordMap[concept].find(e => e.emotionId === entry.initial_emotion);
      
      if (existingEmotion) {
        existingEmotion.count++;
        existingEmotion.mentions.add(entryId);
      } else {
        wordMap[concept].push({ 
          emotionId: entry.initial_emotion, 
          count: 1,
          mentions: new Set([entryId])
        });
      }
    });
    
    // Direct concept check - check if any concept keywords appear directly
    Object.entries(conceptGroups).forEach(([concept, keywords]) => {
      // Skip if we've already counted this concept for this entry
      if (entryConceptTracker[entryId].has(concept)) {
        return;
      }
      
      // Check if any keyword for this concept appears in the note
      const hasConceptKeyword = keywords.some(keyword => noteText.includes(keyword));
      
      if (hasConceptKeyword) {
        // Mark this concept as counted
        entryConceptTracker[entryId].add(concept);
        
        // Initialize the concept in the word map if needed
        if (!wordMap[concept]) {
          wordMap[concept] = [];
        }
        
        // Check if entry's emotion already exists for this concept
        const existingEmotion = wordMap[concept].find(e => e.emotionId === entry.initial_emotion);
        
        if (existingEmotion) {
          existingEmotion.count++;
          existingEmotion.mentions.add(entryId);
        } else {
          wordMap[concept].push({ 
            emotionId: entry.initial_emotion, 
            count: 1,
            mentions: new Set([entryId])
          });
        }
      }
    });
  });
  
  // Find concepts/words that appear with the same emotion
  const triggers: EmotionalTrigger[] = [];
  
  Object.entries(wordMap).forEach(([concept, emotions]) => {
    // Sort emotions by count (highest first)
    const sortedEmotions = emotions.sort((a, b) => b.count - a.count);
    
    // Use the most frequent emotion for this concept
    if (sortedEmotions.length > 0) {
      const topEmotion = sortedEmotions[0];
      
      // Get the true count from unique entry mentions
      const realCount = topEmotion.mentions.size;
      
      // Only include if mentioned in at least 1 entry
      if (realCount >= 1) {
        const emotionData = getEmotionById(topEmotion.emotionId);
        if (emotionData) {
          // Use concept from our mapped groups if possible, otherwise capitalize original word
          const displayConcept = Object.keys(conceptGroups).includes(concept) 
            ? capitalizeFirstLetter(concept)
            : capitalizeFirstLetter(concept);
            
          triggers.push({
            keyword: displayConcept,
            emotion: {
              id: emotionData.id,
              label: emotionData.label,
              color: emotionData.color,
            },
            count: realCount,
          });
        }
      }
    }
  });
  
  console.log(`Found ${triggers.length} potential emotional triggers`);
  
  // Sort by count (highest first) and limit to top 5
  const sortedTriggers = triggers
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
    
  // If we don't have enough meaningful triggers, add some from key themes
  if (sortedTriggers.length < 5) {
    const keyThemes = extractKeyThemes(entriesWithNotes);
    
    // Only add themes not already covered
    const existingKeywords = new Set(sortedTriggers.map(t => t.keyword.toLowerCase()));
    const newThemes = keyThemes.filter(theme => !existingKeywords.has(theme.keyword.toLowerCase()));
    
    sortedTriggers.push(...newThemes);
    console.log(`Added ${newThemes.length} key themes as triggers`);
    
    // If we still need more, add sample data
    if (sortedTriggers.length < 5) {
      const sampleTriggers = generateSampleTriggers(entries);
      
      // Filter out any concepts already covered
      const updatedKeywords = new Set(sortedTriggers.map(t => t.keyword.toLowerCase()));
      const newSamples = sampleTriggers.filter(sample => !updatedKeywords.has(sample.keyword.toLowerCase()));
      
      // Only add enough sample triggers to reach 5 total
      const samplesToAdd = Math.min(5 - sortedTriggers.length, newSamples.length);
      sortedTriggers.push(...newSamples.slice(0, samplesToAdd));
      
      console.log(`Added ${samplesToAdd} sample triggers to supplement user data`);
    }
  }
  
  // Sort by count (highest first) and limit to top 5
  return sortedTriggers.slice(0, 5);
};

/**
 * Extract key themes from entries based on emotional context
 */
const extractKeyThemes = (entries: JournalEntry[]): EmotionalTrigger[] => {
  // Group entries by emotion
  const entriesByEmotion: Record<string, JournalEntry[]> = {};
  
  entries.forEach(entry => {
    if (!entry.initial_emotion || !entry.note) return;
    
    if (!entriesByEmotion[entry.initial_emotion]) {
      entriesByEmotion[entry.initial_emotion] = [];
    }
    
    entriesByEmotion[entry.initial_emotion].push(entry);
  });
  
  const triggers: EmotionalTrigger[] = [];
  
  // For each emotion with multiple entries, try to find common themes
  Object.entries(entriesByEmotion).forEach(([emotionId, emotionEntries]) => {
    if (emotionEntries.length < 2) return;
    
    const emotionData = getEmotionById(emotionId);
    if (!emotionData) return;
    
    // Get common activities for this emotion from entry notes
    const activities = [
      'work', 'family', 'friends', 'sleep', 'exercise', 'outdoors', 
      'progress', 'growth', 'rest', 'meditation', 'reading',
      'music', 'art', 'cooking', 'eating', 'travel', 'learning'
    ];
    
    // Look for activities mentioned in the notes
    const activityMentions: Record<string, number> = {};
    
    emotionEntries.forEach(entry => {
      if (!entry.note) return;
      
      const lowerNote = entry.note.toLowerCase();
      activities.forEach(activity => {
        if (lowerNote.includes(activity)) {
          activityMentions[activity] = (activityMentions[activity] || 0) + 1;
        }
      });
    });
    
    // Add the most mentioned activity as a trigger
    const sortedActivities = Object.entries(activityMentions)
      .sort((a, b) => b[1] - a[1]);
      
    if (sortedActivities.length > 0) {
      const [activity, count] = sortedActivities[0];
      
      triggers.push({
        keyword: capitalizeFirstLetter(activity),
        emotion: {
          id: emotionData.id,
          label: emotionData.label,
          color: emotionData.color,
        },
        count: count,
      });
    }
  });
  
  return triggers;
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
  
  // Improved sample triggers for different emotions
  const sampleTriggersByEmotion: Record<string, string[]> = {
    'happy': ['Family Time', 'Outdoor Activities', 'Social Gatherings', 'Personal Achievement', 'Creative Expression'],
    'sad': ['Difficult Conversations', 'Challenging News', 'Loneliness', 'Rainy Weather', 'Past Memories'],
    'angry': ['Work Pressure', 'Miscommunication', 'Feeling Disrespected', 'Unexpected Delays', 'Tech Problems'],
    'scared': ['Health Concerns', 'Major Changes', 'Public Speaking', 'Tight Deadlines', 'Financial Worries'],
    'optimistic': ['New Opportunities', 'Morning Routine', 'Future Planning', 'Learning Something New', 'Positive Feedback'],
    'peaceful': ['Nature Walks', 'Meditation Practice', 'Reading Time', 'Quiet Evenings', 'Deep Breathing'],
    'powerful': ['Exercise Sessions', 'Completing Goals', 'Receiving Recognition', 'Making Decisions', 'Helping Others'],
    'proud': ['Personal Accomplishment', 'Overcoming Challenges', 'Positive Feedback', 'Learning New Skills', 'Growth Moments']
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
        count: 1 // Make it clear these are sample triggers with only 1 occurrence
      });
    }
  });
  
  return sampleTriggers;
};

/**
 * Generates personalized recommendations based on emotional patterns
 */
export const generatePersonalizedRecommendations = async (entries: JournalEntry[]): Promise<PersonalizedRecommendation[]> => {
  // If there are less than 3 entries, we can't generate meaningful recommendations
  if (entries.length < 3) {
    return [
      {
        title: 'Add More Check-ins',
        description: 'Complete more check-ins to receive personalized recommendations based on your emotional patterns.',
        icon: 'calendar-plus',
      }
    ];
  }

  try {
    // Count emotions to determine dominant patterns
    const emotionCounts: Record<string, number> = {};
    
    // Track time of day patterns
    const timePatterns: Record<string, number> = {
      'MORNING': 0,
      'AFTERNOON': 0,
      'EVENING': 0
    };
    
    // Track emotional states by time of day
    const emotionsByTime: Record<string, Record<string, number>> = {
      'MORNING': {},
      'AFTERNOON': {},
      'EVENING': {}
    };
    
    entries.forEach(entry => {
      // Track emotions
      emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
      
      // Track time of day
      if (entry.time_period) {
        timePatterns[entry.time_period] = (timePatterns[entry.time_period] || 0) + 1;
        
        // Track emotions by time of day
        if (!emotionsByTime[entry.time_period][entry.initial_emotion]) {
          emotionsByTime[entry.time_period][entry.initial_emotion] = 0;
        }
        emotionsByTime[entry.time_period][entry.initial_emotion]++;
      }
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

    // Get emotion labels and other stats for better context
    const emotionLabels: Record<string, number> = {};
    Object.entries(emotionCounts).forEach(([emotionId, count]) => {
      const emotion = getEmotionById(emotionId);
      if (emotion) {
        emotionLabels[emotion.label] = count;
      }
    });

    // Extract notes and look for common themes
    const notes = entries
      .filter(entry => entry.note && entry.note.trim().length > 0)
      .map(entry => entry.note)
      .slice(0, 10); // Limit to last 10 notes for API call size
    
    // Calculate emotional growth based on recent entries
    const emotionalGrowth = calculateEmotionalTrend(entries);
    
    // Calculate time patterns - which time of day has most positive emotions
    const timeScores: Record<string, number> = {};
    
    Object.entries(emotionsByTime).forEach(([timePeriod, emotions]) => {
      let positiveScore = 0;
      let totalEmotions = 0;
      
      Object.entries(emotions).forEach(([emotion, count]) => {
        totalEmotions += count;
        
        // Positive emotions increase score, negative emotions decrease it
        if (['happy', 'optimistic', 'peaceful', 'powerful', 'proud'].includes(emotion)) {
          positiveScore += count;
        } else if (['sad', 'angry', 'scared'].includes(emotion)) {
          positiveScore -= count;
        }
      });
      
      // Score from -1 to 1
      timeScores[timePeriod] = totalEmotions > 0 ? positiveScore / totalEmotions : 0;
    });
    
    // Prepare data for AI generation
    const promptData: UserAnalysisData = {
      emotionCounts: emotionLabels,
      mostCommonEmotion: getEmotionById(mostCommonEmotion)?.label || mostCommonEmotion,
      entriesCount: entries.length,
      recentNotes: notes,
      emotionalGrowth: emotionalGrowth,
      timePeriod: entries.length > 60 ? 'long term' : entries.length > 14 ? 'medium term' : 'short term',
      timePatterns: timeScores
    };

    // Generate recommendations based on user data
    const recommendations = await generateAIRecommendations(promptData);
    
    // If generation fails or returns empty, fall back to pattern-based recommendations
    if (!recommendations || recommendations.length === 0) {
      return fallbackRecommendations(mostCommonEmotion);
    }
    
    return recommendations;
  } catch (error) {
    console.error('Error generating recommendations:', error);
    return fallbackRecommendations(entries.length > 0 ? entries[0].initial_emotion : '');
  }
};

/**
 * Define the UserAnalysisData interface
 */
interface UserAnalysisData {
  emotionCounts: Record<string, number>;
  mostCommonEmotion: string;
  entriesCount: number;
  recentNotes: (string | undefined)[];
  emotionalGrowth: number;
  timePeriod: string;
  timePatterns: Record<string, number>;
}

/**
 * Generates AI recommendations based on user data
 * Note: This is a sophisticated pattern matcher, not an actual AI/LLM integration
 */
export const generateAIRecommendations = async (userData: UserAnalysisData): Promise<PersonalizedRecommendation[]> => {
  // Extract user patterns
  const { 
    emotionCounts, 
    mostCommonEmotion, 
    entriesCount, 
    emotionalGrowth,
    timePatterns 
  } = userData;
  
  const recommendations: PersonalizedRecommendation[] = [];
  const allRecommendations: PersonalizedRecommendation[] = [];
  
  // Get all emotion counts and total for percentage calculations
  const totalEmotionCount = Object.values(emotionCounts).reduce((sum, count) => sum + count, 0);
  
  // Create dominant emotion list (emotions that make up at least 20% of entries)
  const dominantEmotions = Object.entries(emotionCounts)
    .filter(([_, count]) => (count / totalEmotionCount) >= 0.2)
    .map(([emotion]) => emotion);
  
  // Determine if user has predominantly positive or negative emotions
  const positiveEmotions = ['Happy', 'Optimistic', 'Peaceful', 'Powerful', 'Proud'];
  const negativeEmotions = ['Sad', 'Angry', 'Anxious', 'Scared', 'Stressed', 'Tired'];
  
  const positiveDominantEmotions = dominantEmotions.filter(emotion => 
    positiveEmotions.includes(emotion));
  const negativeDominantEmotions = dominantEmotions.filter(emotion => 
    negativeEmotions.includes(emotion));
  
  const isPositivelySkewed = positiveDominantEmotions.length > negativeDominantEmotions.length;
  
  // ---------------- EMOTIONAL GROWTH RECOMMENDATIONS ----------------
  
  // Strong positive growth (over 15%)
  if (emotionalGrowth >= 0.15) {
    allRecommendations.push({
      title: 'Maintain Your Positive Momentum',
      description: `You've shown ${Math.round(emotionalGrowth * 100)}% emotional growth recently. Keep up your current practices to maintain this positive trajectory.`,
      icon: 'trending-up'
    });
    
    allRecommendations.push({
      title: 'Celebrate Your Progress',
      description: `Your emotional well-being has improved by ${Math.round(emotionalGrowth * 100)}% recently. Take a moment to recognize and celebrate this achievement.`,
      icon: 'star'
    });
  } 
  // Moderate positive growth (5-15%)
  else if (emotionalGrowth >= 0.05) {
    allRecommendations.push({
      title: 'You\'re Making Progress',
      description: `Your emotional well-being has improved by ${Math.round(emotionalGrowth * 100)}% recently. Continue building on these positive changes.`,
      icon: 'trending-up'
    });
  }
  // Negative growth (decline in emotional well-being)
  else if (emotionalGrowth <= -0.05) {
    allRecommendations.push({
      title: 'Take Time for Self-Care',
      description: `Your emotional well-being has decreased by ${Math.round(Math.abs(emotionalGrowth) * 100)}% recently. Consider prioritizing self-care activities.`,
      icon: 'heart'
    });
    
    allRecommendations.push({
      title: 'Reflect on Recent Changes',
      description: `There's been a ${Math.round(Math.abs(emotionalGrowth) * 100)}% decrease in your emotional well-being. Reflect on what might have changed recently.`,
      icon: 'refresh'
    });
  }
  
  // ---------------- DOMINANT EMOTION RECOMMENDATIONS ----------------
  
  // Happy
  if (dominantEmotions.includes('Happy')) {
    allRecommendations.push({
      title: 'Happiness Spotlight',
      description: 'You\'ve been feeling happy often. Take note of the activities, people, or situations that contribute to this positive emotion.',
      icon: 'emoticon-happy'
    });
  }
  
  // Sad
  if (dominantEmotions.includes('Sad')) {
    allRecommendations.push({
      title: 'Managing Sadness',
      description: 'Sadness has been prominent in your entries. Consider reaching out to someone you trust or engaging in activities that have lifted your mood in the past.',
      icon: 'emoticon-sad'
    });
  }
  
  // Anxious
  if (dominantEmotions.includes('Anxious')) {
    allRecommendations.push({
      title: 'Anxiety Reduction',
      description: 'Your entries show patterns of anxiety. Try incorporating mindfulness or breathing exercises into your daily routine.',
      icon: 'meditation'
    });
  }
  
  // Stressed
  if (dominantEmotions.includes('Stressed')) {
    allRecommendations.push({
      title: 'Stress Management',
      description: 'Stress has been a recurring emotion for you. Consider scheduling short breaks throughout your day or prioritizing relaxation techniques.',
      icon: 'yoga'
    });
  }
  
  // Peaceful
  if (dominantEmotions.includes('Peaceful')) {
    allRecommendations.push({
      title: 'Nurture Your Peace',
      description: 'You\'ve frequently reported feeling peaceful. Continue prioritizing activities that foster this sense of calm and balance.',
      icon: 'weather-sunny'
    });
  }
  
  // ---------------- JOURNALING PATTERN RECOMMENDATIONS ----------------
  
  // Consistent journaling
  if (entriesCount > 14 && entriesCount / 14 >= 0.7) { // At least 70% of days in the last 2 weeks
    allRecommendations.push({
      title: 'Consistent Reflection',
      description: 'You\'ve been journaling consistently, which is great for emotional awareness. Keep up this positive habit!',
      icon: 'calendar-check'
    });
  }
  
  // Infrequent journaling
  if (entriesCount < 7 && entriesCount > 3) {
    allRecommendations.push({
      title: 'Build Your Journaling Habit',
      description: 'Try setting a daily reminder to check in with your emotions for more comprehensive insights.',
      icon: 'bell'
    });
  }
  
  // ---------------- TIME OF DAY PATTERN RECOMMENDATIONS ----------------
  
  // Find best and worst times of day
  const timePatternEntries = Object.entries(timePatterns);
  
  if (timePatternEntries.length > 0) {
    // Sort by positive score (highest first)
    const sortedTimes = [...timePatternEntries].sort((a, b) => b[1] - a[1]);
    
    const bestTime = sortedTimes[0]?.[0];
    const worstTime = sortedTimes[sortedTimes.length - 1]?.[0];
    
    // Only add if there's a significant difference (0.3 or more)
    if (bestTime && worstTime && 
        timePatterns[bestTime] - timePatterns[worstTime] >= 0.3) {
      
      const bestTimeFriendly = bestTime.toLowerCase().charAt(0) + bestTime.toLowerCase().slice(1);
      
      allRecommendations.push({
        title: `${bestTimeFriendly} Positivity`,
        description: `Your ${bestTimeFriendly.toLowerCase()} entries show the most positive emotions. Consider scheduling important activities during this time of day.`,
        icon: 'weather-sunny'
      });
      
      const worstTimeFriendly = worstTime.toLowerCase().charAt(0) + worstTime.toLowerCase().slice(1);
      
      allRecommendations.push({
        title: `${worstTimeFriendly} Self-Care`,
        description: `You tend to experience more challenging emotions during the ${worstTimeFriendly.toLowerCase()}. Try incorporating a self-care routine during this time.`,
        icon: 'heart'
      });
    }
  }
  
  // ---------------- GENERAL WELLNESS RECOMMENDATIONS ----------------
  
  // Always include some general wellness recommendations
  const generalRecommendations = [
    {
      title: 'Consistent Sleep Schedule',
      description: 'Maintaining a regular sleep schedule can help stabilize your mood and energy levels throughout the day.',
      icon: 'sleep'
    },
    {
      title: 'Physical Activity',
      description: 'Regular exercise is linked to improved mood and decreased stress and anxiety.',
      icon: 'run'
    },
    {
      title: 'Mindful Moments',
      description: 'Taking brief mindfulness breaks throughout your day can help manage stress and improve emotional awareness.',
      icon: 'meditation'
    },
    {
      title: 'Connect with Others',
      description: 'Social connections are vital for emotional well-being. Reach out to someone you care about today.',
      icon: 'account-group'
    },
    {
      title: 'Gratitude Practice',
      description: "Taking time to acknowledge things you're grateful for can shift your focus toward positive aspects of life.",
      icon: 'heart'
    }
  ];
  
  // Add specific recommendations first (up to 2)
  // Choose randomly from our personalized recommendations
  const shuffledRecommendations = [...allRecommendations].sort(() => 0.5 - Math.random());
  
  // Add up to 2 personalized recommendations
  for (let i = 0; i < Math.min(2, shuffledRecommendations.length); i++) {
    recommendations.push(shuffledRecommendations[i]);
  }
  
  // If we don't have enough personalized recommendations, add some general ones
  const neededGeneralRecs = Math.max(0, 3 - recommendations.length);
  
  if (neededGeneralRecs > 0) {
    // Get appropriate general recommendations based on emotional state
    let filteredGeneralRecs = [...generalRecommendations];
    
    // If user is predominantly negative, prioritize active interventions
    if (!isPositivelySkewed) {
      filteredGeneralRecs = filteredGeneralRecs.sort(() => 0.5 - Math.random());
    }
    
    // Add needed general recommendations
    for (let i = 0; i < Math.min(neededGeneralRecs, filteredGeneralRecs.length); i++) {
      recommendations.push(filteredGeneralRecs[i]);
    }
  }
  
  return recommendations;
};

/**
 * Fallback recommendations if AI generation fails
 */
const fallbackRecommendations = (dominantEmotion: string): PersonalizedRecommendation[] => {
  const recommendations: PersonalizedRecommendation[] = [];
  
  switch (dominantEmotion) {
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
          description: "Taking time to acknowledge things you're grateful for can shift your focus toward positive aspects of life.",
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
 * Analyzes journal entries to identify activities correlated with emotional states
 */
export const analyzeActivityCorrelations = async (entries: JournalEntry[]): Promise<ActivityCorrelation[]> => {
  if (entries.length < 3) {
    return generateSampleCorrelations();
  }
  
  // Extract activities using common activity keywords
  const activityKeywords = [
    'exercise', 'workout', 'run', 'running', 'jog', 'yoga', 'gym',
    'meditation', 'meditate', 'read', 'reading', 'book', 'study',
    'work', 'meeting', 'project', 'coding', 'programming',
    'cooking', 'cook', 'baking', 'cleaning', 'chores',
    'music', 'listening', 'playing', 'practice', 'instrument',
    'friends', 'family', 'date', 'party', 'social', 'talking',
    'walking', 'hike', 'hiking', 'nature', 'outdoors', 'outside',
    'movie', 'watching', 'tv', 'show', 'netflix', 'streaming',
    'game', 'gaming', 'playing', 'video', 'phone', 'scrolling',
    'sleep', 'nap', 'rest', 'relax', 'relaxing', 'bath',
    'eat', 'eating', 'food', 'meal', 'breakfast', 'lunch', 'dinner'
  ];
  
  // Activity correlations
  const correlations: Record<string, { count: number, totalShift: number, description?: string }> = {};
  
  // Process each entry
  entries.forEach(entry => {
    if (!entry.note) return;
    
    const note = entry.note.toLowerCase();
    const foundActivities = new Set<string>();
    
    // Find activities mentioned in notes
    activityKeywords.forEach(keyword => {
      if (note.includes(keyword)) {
        // Map similar activities to a common category
        let activityCategory = keyword;
        
        // Exercise category
        if (['exercise', 'workout', 'run', 'running', 'jog', 'yoga', 'gym'].includes(keyword)) {
          activityCategory = 'exercise';
        }
        // Reading category
        else if (['read', 'reading', 'book'].includes(keyword)) {
          activityCategory = 'reading';
        }
        // Work category
        else if (['work', 'meeting', 'project', 'coding', 'programming', 'study'].includes(keyword)) {
          activityCategory = 'work';
        }
        // Social category
        else if (['friends', 'family', 'date', 'party', 'social', 'talking'].includes(keyword)) {
          activityCategory = 'socializing';
        }
        // Nature category
        else if (['walking', 'hike', 'hiking', 'nature', 'outdoors', 'outside'].includes(keyword)) {
          activityCategory = 'outdoors';
        }
        // Entertainment category
        else if (['movie', 'watching', 'tv', 'show', 'netflix', 'streaming'].includes(keyword)) {
          activityCategory = 'entertainment';
        }
        // Rest category
        else if (['sleep', 'nap', 'rest', 'relax', 'relaxing', 'bath'].includes(keyword)) {
          activityCategory = 'rest';
        }
        // Food category
        else if (['eat', 'eating', 'food', 'meal', 'breakfast', 'lunch', 'dinner'].includes(keyword)) {
          activityCategory = 'eating';
        }
        
        foundActivities.add(activityCategory);
      }
    });
    
    // Add correlation data for each found activity
    foundActivities.forEach(activity => {
      if (!correlations[activity]) {
        correlations[activity] = { count: 0, totalShift: 0 };
      }
      
      correlations[activity].count++;
      correlations[activity].totalShift += entry.emotional_shift || 0;
    });
  });
  
  // Calculate impact score for each activity (-10 to +10 scale)
  const result: ActivityCorrelation[] = Object.entries(correlations)
    .filter(([_, data]) => data.count >= 2) // Only include activities mentioned multiple times
    .map(([activity, data]) => {
      // Calculate average emotional shift when this activity is mentioned
      const averageShift = data.count > 0 ? data.totalShift / data.count : 0;
      
      // Scale to -10 to +10 range
      const impact = Math.round(averageShift * 10);
      
      // Generate description based on impact
      let description = '';
      if (impact > 5) {
        description = `This activity strongly improves your mood`;
      } else if (impact > 0) {
        description = `This activity tends to have a positive effect on your mood`;
      } else if (impact === 0) {
        description = `This activity has a neutral effect on your mood`;
      } else if (impact > -5) {
        description = `This activity slightly decreases your mood`;
      } else {
        description = `This activity tends to negatively affect your emotional state`;
      }
      
      return {
        activity: capitalizeFirstLetter(activity),
        impact,
        description
      };
    })
    .sort((a, b) => Math.abs(b.impact) - Math.abs(a.impact)); // Sort by absolute impact
  
  // If we found real correlations, return them
  if (result.length > 0) {
    return result.slice(0, 5); // Return top 5 correlations
  }
  
  // Otherwise return sample data
  return generateSampleCorrelations();
};

/**
 * Predicts future emotional states based on patterns in journal entries
 */
export const predictEmotionalState = async (entries: JournalEntry[]): Promise<PredictedEmotion[]> => {
  // This would normally use a more sophisticated ML model
  // For now, we'll use a simplified approach based on frequency and recent trends
  
  // Need a minimum number of entries for meaningful prediction
  if (entries.length < 5) {
    return generateSamplePredictions();
  }
  
  // Count emotion occurrences and track recency
  const emotionData: Record<string, { count: number, recentWeight: number }> = {};
  const totalEntries = entries.length;
  
  // Sort entries by date (newest first)
  const sortedEntries = [...entries].sort((a, b) => {
    const dateA = a.date instanceof Date ? a.date : new Date(a.date);
    const dateB = b.date instanceof Date ? b.date : new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Calculate weighted frequency with more recent entries having higher weight
  sortedEntries.forEach((entry, index) => {
    if (!entry.initial_emotion) return;
    
    const recencyWeight = 1 - (index / totalEntries); // 1 for most recent, approaching 0 for oldest
    
    if (!emotionData[entry.initial_emotion]) {
      emotionData[entry.initial_emotion] = { count: 0, recentWeight: 0 };
    }
    
    emotionData[entry.initial_emotion].count++;
    emotionData[entry.initial_emotion].recentWeight += recencyWeight;
  });
  
  // Calculate total weight
  const totalWeight = Object.values(emotionData)
    .reduce((sum, data) => sum + data.recentWeight, 0);
  
  // Convert to predicted emotions with probabilities
  const predictions: PredictedEmotion[] = Object.entries(emotionData)
    .map(([emotionId, data]) => {
      const emotionInfo = getEmotionById(emotionId);
      
      if (!emotionInfo) return null;
      
      // Calculate probability based on weighted frequency
      const probability = totalWeight > 0 ? data.recentWeight / totalWeight : 0;
      
      return {
        id: emotionId,
        label: emotionInfo.label,
        color: emotionInfo.color,
        probability
      };
    })
    .filter(Boolean) as PredictedEmotion[];
  
  // Sort by probability (highest first) and take top 3
  const topPredictions = predictions
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 3);
  
  // Ensure probabilities sum to 1
  const totalProb = topPredictions.reduce((sum, pred) => sum + pred.probability, 0);
  
  return topPredictions.map(pred => ({
    ...pred,
    probability: totalProb > 0 ? pred.probability / totalProb : pred.probability
  }));
};

/**
 * Extracts meaningful words from journal entries for word cloud generation
 */
export const extractWordsFromEntries = (entries: JournalEntry[]): Array<{text: string, value: number, color: string}> => {
  if (!entries || entries.length === 0) {
    return [];
  }
  
  // Common words to exclude (stopwords)
  const stopwords = [
    'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 
    'from', 'as', 'into', 'after', 'before', 'between', 'during', 'through', 
    'over', 'under', 'above', 'below', 'down', 'up', 'off', 'around', 'am', 
    'is', 'are', 'was', 'were', 'be', 'being', 'been', 'have', 'has', 'had', 
    'do', 'does', 'did', 'will', 'would', 'shall', 'should', 'may', 'might', 
    'must', 'can', 'could', 'of', 'a', 'an', 'it', 'its', 'this', 'that', 
    'these', 'those', 'my', 'your', 'his', 'her', 'our', 'their', 'i', 'me', 
    'you', 'he', 'she', 'we', 'they', 'him', 'them', 'myself', 'yourself', 
    'himself', 'herself', 'ourselves', 'themselves', 'what', 'which', 'who', 
    'whom', 'whose', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 
    'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 
    'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'but',
    'now', 'also', 'like', 'even', 'well', 'back', 'there', 'still'
  ];
  
  // Word frequency map
  const wordMap: Record<string, { count: number, emotions: Record<string, number> }> = {};
  
  // Process each entry
  entries.forEach(entry => {
    if (!entry.note || !entry.initial_emotion) return;
    
    // Extract words from note
    const words = entry.note.toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => 
        word.length > 2 && // Longer than 2 chars
        !stopwords.includes(word) && // Not a stopword
        isNaN(Number(word)) // Not a number
      );
    
    // Count word frequencies and associate with emotions
    words.forEach(word => {
      if (!wordMap[word]) {
        wordMap[word] = { count: 0, emotions: {} };
      }
      
      wordMap[word].count++;
      
      if (!wordMap[word].emotions[entry.initial_emotion]) {
        wordMap[word].emotions[entry.initial_emotion] = 0;
      }
      
      wordMap[word].emotions[entry.initial_emotion]++;
    });
  });
  
  // Convert to format needed for word cloud
  const result = Object.entries(wordMap)
    .filter(([_, data]) => data.count >= 2) // Only include words that appear multiple times
    .map(([word, data]) => {
      // Find most associated emotion
      let topEmotion = '';
      let topCount = 0;
      
      Object.entries(data.emotions).forEach(([emotion, count]) => {
        if (count > topCount) {
          topEmotion = emotion;
          topCount = count;
        }
      });
      
      // Get emotion color
      const emotionInfo = getEmotionById(topEmotion);
      const color = emotionInfo?.color || '#4169E1'; // Default to blue if emotion not found
      
      return {
        text: word,
        value: data.count, // Relative size based on frequency
        color
      };
    })
    .sort((a, b) => b.value - a.value); // Sort by frequency
  
  return result.slice(0, 40); // Return top 40 words for the cloud
};

// Helper function to capitalize first letter of string
function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Calculates the user's emotional balance based on their journal entries
 */
export const calculateEmotionalBalance = (entries: JournalEntry[]) => {
  if (!entries || entries.length === 0) {
    return { 
      score: 0, 
      description: "Record your emotions to see your emotional balance."
    };
  }
  
  // Count positive, negative, and neutral emotions
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  const positiveEmotions = ['happy', 'optimistic', 'peaceful', 'powerful', 'proud'];
  const negativeEmotions = ['sad', 'angry', 'scared', 'disgusted', 'anxious'];
  
  entries.forEach(entry => {
    if (positiveEmotions.includes(entry.initial_emotion)) {
      positiveCount++;
    } else if (negativeEmotions.includes(entry.initial_emotion)) {
      negativeCount++;
    } else {
      neutralCount++;
    }
  });
  
  const totalEntries = positiveCount + negativeCount + neutralCount;
  
  // Calculate balance as a ratio between -1 and 1
  // 1 = all positive, -1 = all negative, 0 = balanced
  const balance = totalEntries > 0 
    ? (positiveCount - negativeCount) / totalEntries 
    : 0;
  
  // Clamp the value between -1 and 1
  const score = Math.max(-1, Math.min(1, balance));
  
  // Get a more nuanced description based on the score
  let description = "";
  
  if (score >= 0.7) {
    description = "Your emotions are strongly positive lately!";
  } else if (score >= 0.4) {
    description = "You're experiencing mostly positive emotions.";
  } else if (score >= 0.1) {
    description = "You're maintaining a positive emotional balance.";
  } else if (score > -0.1) {
    description = "Your emotions are fairly balanced between positive and negative.";
  } else if (score > -0.4) {
    description = "You're experiencing slightly more negative emotions lately.";
  } else if (score > -0.7) {
    description = "Your emotional balance is leaning toward negative emotions.";
  } else {
    description = "Your emotions have been predominantly negative recently.";
  }
  
  // Add specific context about the data
  const positivePercent = Math.round((positiveCount / totalEntries) * 100);
  const negativePercent = Math.round((negativeCount / totalEntries) * 100);
  const dominantEmotion = positiveCount > negativeCount ? "positive" : "negative";
  
  description += ` (${dominantEmotion === "positive" ? positivePercent : negativePercent}% ${dominantEmotion})`;
  
  return { score, description };
};

/**
 * Generates sample activity correlations when real data is insufficient
 */
const generateSampleCorrelations = (): ActivityCorrelation[] => {
  return [
    {
      activity: 'Exercise',
      impact: 8,
      description: 'This activity strongly improves your mood'
    },
    {
      activity: 'Reading',
      impact: 5,
      description: 'This activity tends to have a positive effect on your mood'
    },
    {
      activity: 'Socializing',
      impact: 7,
      description: 'This activity strongly improves your mood'
    },
    {
      activity: 'Work',
      impact: -3,
      description: 'This activity slightly decreases your mood'
    },
    {
      activity: 'Outdoors',
      impact: 6,
      description: 'This activity tends to have a positive effect on your mood'
    }
  ];
};

/**
 * Generates sample emotion predictions when real data is insufficient
 */
const generateSamplePredictions = (): PredictedEmotion[] => {
  const sampleEmotions = ['happy', 'peaceful', 'optimistic'];
  const predictions: PredictedEmotion[] = [];
  
  sampleEmotions.forEach((emotionId, index) => {
    const emotionInfo = getEmotionById(emotionId);
    if (emotionInfo) {
      // Probabilities that add up to 1, with highest for first emotion
      const probability = index === 0 ? 0.6 : (index === 1 ? 0.3 : 0.1);
      
      predictions.push({
        id: emotionId,
        label: emotionInfo.label,
        color: emotionInfo.color,
        probability
      });
    }
  });
  
  return predictions;
};

/**
 * Calculate emotional trend as a growth metric
 * This is a simplified version used for recommendations
 */
const calculateEmotionalTrend = (entries: JournalEntry[]): number => {
  if (entries.length < 5) return 0;
  
  // Sort entries by date
  const sortedEntries = [...entries].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Get first and last 3 entries for comparison
  const firstEntries = sortedEntries.slice(0, 3);
  const lastEntries = sortedEntries.slice(-3);
  
  // Get average emotional value for first and last entries
  const getAverageEmotionValue = (entries: JournalEntry[]) => {
    let total = 0;
    
    entries.forEach(entry => {
      const emotion = getEmotionById(entry.initial_emotion);
      if (emotion) {
        // Assign values from -1 to 1 based on the emotion type
        // This is a simplification, but helps identify trends
        if (['happy', 'optimistic', 'peaceful', 'powerful', 'proud'].includes(entry.initial_emotion)) {
          total += 1; // positive emotions
        } else if (['angry', 'sad', 'scared'].includes(entry.initial_emotion)) {
          total -= 1; // negative emotions
        }
        // neutral emotions don't change the total
      }
    });
    
    return total / entries.length;
  };
  
  const firstAvg = getAverageEmotionValue(firstEntries);
  const lastAvg = getAverageEmotionValue(lastEntries);
  
  // Calculate growth: difference between first and last sets
  return lastAvg - firstAvg;
}; 