import { JournalEntry } from '@/types';
import { getEmotionById } from '@/constants/emotions';

/**
 * Analyzes journal entries and generates meaningful insights based on emotional patterns
 * @param entries Journal entries to analyze
 * @returns Array of insight strings
 */
export async function generateInsights(entries: JournalEntry[]): Promise<string[]> {
  console.log(`Generating insights from ${entries?.length || 0} entries`);
  
  // Ensure we have valid entries
  if (!entries || entries.length === 0) {
    console.log('No entries found, returning starter guidance');
    return [
      "Your personal insights will appear here after you record your first entries.",
      "We need data from your emotional check-ins to generate meaningful insights.",
      "Record at least 5 entries with different emotions to see personalized insights."
    ];
  }
  
  // Process entries to ensure proper dates
  const processedEntries = entries.map(entry => ({
    ...entry,
    date: entry.date instanceof Date ? entry.date : new Date(entry.date),
    emotional_shift: typeof entry.emotional_shift === 'number' ? entry.emotional_shift : 0
  }));
  
  // If only a few entries, provide specific guidance
  if (processedEntries.length < 5) {
    console.log('Few entries found, returning guidance for more data');
    
    const entriesNeeded = 5 - processedEntries.length;
    return [
      `You've recorded ${processedEntries.length} check-in${processedEntries.length !== 1 ? 's' : ''}. Add ${entriesNeeded} more to unlock personal insights.`,
      "For best results, check in at different times of day (morning, afternoon, evening).",
      "Add notes about activities and experiences to get deeper insights about what affects your emotions.",
      "Try recording a variety of emotions to help us understand your emotional patterns better.",
      "Insights become more accurate with at least 7-10 entries across different days."
    ];
  }
  
  // Count entries with notes for better guidance
  const entriesWithNotes = processedEntries.filter(entry => entry.notes && entry.notes.trim().length > 10);
  
  // If all entries are from the same day, recommend more days
  const uniqueDays = new Set(processedEntries.map(entry => entry.date.toISOString().split('T')[0])).size;
  
  // Check if all entries have the same emotion
  const uniqueEmotions = new Set(processedEntries.map(entry => entry.initial_emotion));
  
  // If we have entries but they're not diverse enough for good insights
  if (uniqueDays === 1 || uniqueEmotions.size === 1 || entriesWithNotes.length === 0) {
    const insights: string[] = [];
    
    // Only show these messages if they have very few entries
    if (processedEntries.length < 10) {
      if (uniqueDays === 1) {
        insights.push("Record entries across multiple days to see patterns in your emotional journey.");
      }
      
      if (uniqueEmotions.size === 1) {
        insights.push("Try recording different emotions to help us understand your full emotional range.");
      }
      
      if (entriesWithNotes.length === 0) {
        insights.push("Add notes to your entries to get more personalized insights about what affects your emotions.");
      }
      
      insights.push(`You've recorded ${processedEntries.length} entries. Our best insights come after 10+ check-ins.`);
      
      // Add some encouragement
      insights.push("Keep checking in regularly - you're on your way to valuable emotional insights!");
      
      return insights;
    }
    
    // If they have 10+ entries but missing notes, still try to generate real insights
    // and just add a suggestion to add notes
    if (entriesWithNotes.length === 0) {
      insights.push("Add notes to your entries to get more personalized insights about what affects your emotions.");
    }
  }
  
  const insights: string[] = [];
  
  // Analyze emotional patterns
  const emotionCounts: Record<string, number> = {};
  const periodEmotions: Record<string, Record<string, number>> = {
    'MORNING': {},
    'AFTERNOON': {},
    'EVENING': {},
  };
  let positiveCount = 0;
  let negativeCount = 0;
  let neutralCount = 0;
  
  // Track emotional shifts
  let positiveShifts = 0;
  let negativeShifts = 0;
  
  // Track sequential emotional changes
  const emotionSequence: string[] = [];
  
  // Sort entries by date (newest first) for recency analysis
  const sortedEntries = [...processedEntries].sort((a, b) => 
    b.date.getTime() - a.date.getTime()
  );
  
  // Process each entry
  sortedEntries.forEach(entry => {
    // Skip entries with invalid emotions
    if (!entry.initial_emotion) return;
    
    // Count emotions
    emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
    
    // Count by time period (if valid)
    if (entry.time_period && periodEmotions[entry.time_period]) {
      periodEmotions[entry.time_period][entry.initial_emotion] = 
        (periodEmotions[entry.time_period][entry.initial_emotion] || 0) + 1;
    }
    
    // Track sentiment
    const emotion = getEmotionById(entry.initial_emotion);
    if (emotion) {
      if (['happy', 'optimistic', 'peaceful', 'powerful', 'proud'].includes(emotion.id)) {
        positiveCount++;
      } else if (['sad', 'scared', 'angry', 'disgusted'].includes(emotion.id)) {
        negativeCount++;
      } else {
        neutralCount++;
      }
    }
    
    // Track emotional shifts (with safety check)
    if (typeof entry.emotional_shift === 'number') {
      if (entry.emotional_shift > 0.2) {
        positiveShifts++;
      } else if (entry.emotional_shift < -0.2) {
        negativeShifts++;
      }
    }
    
    // Track emotion sequences for last 7 entries
    if (emotionSequence.length < 7) {
      emotionSequence.push(entry.initial_emotion);
    }
  });
  
  // Make sure we have valid emotional data before proceeding
  if (Object.keys(emotionCounts).length === 0) {
    console.log('No valid emotion data found, returning guidance');
    return [
      "Please select emotions in your check-ins to receive insights.",
      "Each check-in should include how you're feeling for proper analysis.",
      "Include different emotions over time to see patterns and trends.",
      "Try to check in multiple times per day for more detailed insights.",
      "Add notes about your activities to get deeper emotional understanding."
    ];
  }
  
  // Find most common emotion
  let mostCommonEmotion = '';
  let highestCount = 0;
  Object.entries(emotionCounts).forEach(([emotion, count]) => {
    if (count > highestCount) {
      mostCommonEmotion = emotion;
      highestCount = count;
    }
  });
  
  // Find preferred time period (most entries)
  const periodCounts = Object.entries(periodEmotions).map(([period, emotions]) => {
    return {
      period,
      count: Object.values(emotions).reduce((sum, count) => sum + count, 0)
    };
  }).sort((a, b) => b.count - a.count);
  
  const preferredPeriod = periodCounts[0]?.period || 'EVENING';
  
  // Find dominant emotion per time period
  const dominantPeriodEmotions: Record<string, string> = {};
  Object.entries(periodEmotions).forEach(([period, emotions]) => {
    let topEmotion = '';
    let topCount = 0;
    Object.entries(emotions).forEach(([emotion, count]) => {
      if (count > topCount) {
        topEmotion = emotion;
        topCount = count;
      }
    });
    if (topEmotion) {
      dominantPeriodEmotions[period] = topEmotion;
    }
  });
  
  // Calculate emotion consistency (what % of entries have the most common emotion)
  const totalEntries = sortedEntries.length;
  const consistencyPercentage = Math.round((highestCount / totalEntries) * 100);
  
  // Generate meaningful insights
  
  // Insight about most common emotion
  if (mostCommonEmotion) {
    const emotion = getEmotionById(mostCommonEmotion);
    if (emotion) {
      insights.push(`Your most frequent emotion is "${emotion.label}" (${consistencyPercentage}% of entries).`);
    }
  }
  
  // Insight about emotional balance
  const totalSentiment = positiveCount + negativeCount + neutralCount;
  if (totalSentiment > 0) {
    const positivePercentage = Math.round((positiveCount / totalSentiment) * 100);
    const negativePercentage = Math.round((negativeCount / totalSentiment) * 100);
    
    if (positivePercentage > 70) {
      insights.push(`You experience positive emotions in ${positivePercentage}% of your entries - that's great emotional well-being!`);
    } else if (positivePercentage > 50) {
      insights.push(`Your emotional balance is good with ${positivePercentage}% positive emotions.`);
    } else if (negativePercentage > 70) {
      insights.push(`You've been experiencing a high frequency of challenging emotions (${negativePercentage}%). Consider self-care activities.`);
    } else {
      insights.push(`Your emotional landscape is balanced with ${positivePercentage}% positive and ${negativePercentage}% challenging emotions.`);
    }
  }
  
  // Insight about time period patterns
  if (dominantPeriodEmotions['MORNING'] && dominantPeriodEmotions['EVENING']) {
    const morningEmotion = getEmotionById(dominantPeriodEmotions['MORNING']);
    const eveningEmotion = getEmotionById(dominantPeriodEmotions['EVENING']);
    
    if (morningEmotion && eveningEmotion && morningEmotion.id !== eveningEmotion.id) {
      insights.push(`You tend to feel "${morningEmotion.label}" in the morning and "${eveningEmotion.label}" in the evening.`);
    }
  }
  
  // Insight about preferred check-in time
  const periodDisplay = preferredPeriod.toLowerCase();
  insights.push(`You check in most frequently during the ${periodDisplay} - excellent consistency!`);
  
  // Insight about emotional shifts
  if (positiveShifts + negativeShifts > 0) {
    const shiftsRatio = Math.round((positiveShifts / (positiveShifts + negativeShifts)) * 100);
    if (shiftsRatio > 70) {
      insights.push(`Your journal entries show that your mood typically improves throughout your check-ins - excellent emotional regulation!`);
    } else if (shiftsRatio < 30) {
      insights.push(`Your journal shows your mood often decreases during check-ins. Consider adding positive activities to your day.`);
    }
  }
  
  // Insight about recent emotional patterns
  if (emotionSequence.length >= 3) {
    const recentEmotions = emotionSequence.slice(0, 3).map(id => getEmotionById(id)?.label || id);
    insights.push(`Your recent emotional journey: ${recentEmotions.join(' → ')}`);
  }
  
  console.log(`Generated ${insights.length} insights`);
  
  // Final advice about improving insights
  if (uniqueDays < 5) {
    insights.push("For deeper trend analysis, continue adding entries over several days.");
  }
  
  if (entriesWithNotes.length < 5) {
    insights.push("Add notes to more entries to help identify what impacts your emotions most.");
  }
  
  // If we still don't have any insights but have data, generate something useful
  if (insights.length === 0 && processedEntries.length >= 5) {
    // Basic frequency insight
    if (mostCommonEmotion) {
      const emotion = getEmotionById(mostCommonEmotion);
      if (emotion) {
        insights.push(
          `Your most frequent emotion is ${emotion.label.toLowerCase()} (${Math.round((highestCount / totalEntries) * 100)}% of entries).`
        );
      }
    }
    
    // Time period insight
    if (Object.keys(dominantPeriodEmotions).length > 0) {
      const periodNameMap: Record<string, string> = {
        'MORNING': 'mornings',
        'AFTERNOON': 'afternoons',
        'EVENING': 'evenings'
      };
      
      const periodWithMostEntries = periodCounts[0]?.period;
      if (periodWithMostEntries && periodCounts[0]?.count > 2) {
        insights.push(
          `You tend to check in most often during ${periodNameMap[periodWithMostEntries] || periodWithMostEntries.toLowerCase()}.`
        );
      }
    }
    
    // Emotional shift insight
    if (positiveShifts > 0 || negativeShifts > 0) {
      const totalShifts = positiveShifts + negativeShifts;
      if (totalShifts > 3) {
        if (positiveShifts > negativeShifts * 2) {
          insights.push(
            `You often experience positive emotional shifts during your check-ins (${Math.round((positiveShifts / totalShifts) * 100)}% positive).`
          );
        } else if (negativeShifts > positiveShifts * 2) {
          insights.push(
            `You frequently report negative emotional shifts during your check-ins. Consider reflecting on what happens during these times.`
          );
        } else {
          insights.push(
            `Your emotional shifts are balanced between positive and negative, showing emotional flexibility.`
          );
        }
      }
    }
    
    // Overall sentiment
    if (positiveCount + negativeCount > 5) {
      const totalEmotionCount = positiveCount + negativeCount + neutralCount;
      const positivePercent = Math.round((positiveCount / totalEmotionCount) * 100);
      const negativePercent = Math.round((negativeCount / totalEmotionCount) * 100);
      
      if (positiveCount > negativeCount * 2) {
        insights.push(
          `Overall, you report positive emotions ${positivePercent}% of the time, which suggests good emotional well-being.`
        );
      } else if (negativeCount > positiveCount * 2) {
        insights.push(
          `You report negative emotions ${negativePercent}% of the time. Consider activities that boost your mood.`
        );
      } else {
        insights.push(
          `Your emotions are balanced with ${positivePercent}% positive and ${negativePercent}% negative entries.`
        );
      }
    }
  }
  
  // Final check - if we still have no insights, add a generic one
  if (insights.length === 0) {
    insights.push("Keep recording your emotions regularly to see more detailed insights about your patterns.");
    insights.push("Try adding notes to your entries to get more personalized insights about what affects your emotions.");
  }
  
  // Select 3-5 most relevant insights
  return insights.slice(0, Math.min(5, insights.length));
} 