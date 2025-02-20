import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';
import { Emotion, primaryEmotions, getAllEmotions } from '@/constants/emotions';

const windowWidth = Dimensions.get('window').width;

interface EmotionWheelProps {
  onSelectEmotion: (emotion: Emotion) => void;
  selectedEmotion: string | undefined;
  type?: 'primary' | 'secondary';
  primaryEmotion?: string;
}

export const EmotionWheel: React.FC<EmotionWheelProps> = ({
  onSelectEmotion,
  selectedEmotion,
  type = 'primary',
  primaryEmotion,
}) => {
  const getEmotionsToShow = () => {
    if (type === 'primary') {
      return primaryEmotions.map(category => ({
        id: category.id,
        label: `${getEmojiForEmotion(category.id)} ${category.label}`,
        color: category.color
      }));
    }
    
    if (primaryEmotion) {
      const category = primaryEmotions.find(c => c.id === primaryEmotion);
      return category?.emotions.map(emotion => ({
        ...emotion,
        label: `${getEmojiForEmotion(emotion.id)} ${emotion.label}`
      })) || [];
    }
    
    return [];
  };

  const getEmojiForEmotion = (id: string): string => {
    switch (id) {
      // Primary emotions
      case 'happy': return '😊';
      case 'sad': return '😢';
      case 'angry': return '😠';
      case 'scared': return '😨';
      
      // Happy secondary emotions
      case 'optimistic': return '✨';
      case 'peaceful': return '😌';
      case 'powerful': return '💪';
      case 'proud': return '🦋';
      
      // Sad secondary emotions
      case 'lonely': return '🫂';
      case 'vulnerable': return '🥺';
      case 'despair': return '💔';
      case 'guilty': return '😣';
      
      // Angry secondary emotions
      case 'frustrated': return '😤';
      case 'critical': return '🤨';
      case 'distant': return '🫥';
      case 'irritated': return '😒';
      
      // Scared secondary emotions
      case 'confused': return '😕';
      case 'rejected': return '😞';
      case 'helpless': return '😰';
      case 'anxious': return '😥';
      
      default: return '😐';
    }
  };

  const emotions = getEmotionsToShow();

  return (
    <View style={styles.container}>
      {emotions.map((emotion) => (
        <TouchableOpacity
          key={emotion.id}
          onPress={() => onSelectEmotion(emotion)}
          style={[
            styles.emotionButton,
            selectedEmotion === emotion.id && styles.selectedEmotion,
            { backgroundColor: emotion.color }
          ]}
        >
          <Typography style={styles.emotionText}>
            {emotion.label}
          </Typography>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    gap: theme.SPACING.md,
  },
  emotionButton: {
    width: windowWidth - theme.SPACING.md * 8,
    height: 56,
    borderRadius: theme.BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.COLORS.ui.card,
    padding: theme.SPACING.sm,
  },
  selectedEmotion: {
    borderWidth: 3,
    borderColor: theme.COLORS.primary.green,
  },
  emotionText: {
    color: theme.COLORS.ui.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 