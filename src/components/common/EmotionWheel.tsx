import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Typography } from './Typography';
import { Card } from './Card';
import { primaryEmotions, EmotionCategory, Emotion } from '@/constants/emotions';
import theme from '@/constants/theme';

const emotionEmojis: Record<string, string> = {
  // Primary emotions
  happy: '🥰',
  sad: '😢',
  angry: '😠',
  scared: '😨',

  // Happy secondary emotions
  optimistic: '✨',
  peaceful: '😌',
  powerful: '💪',
  proud: '🦋',

  // Sad secondary emotions
  lonely: '🫂',
  vulnerable: '🥺',
  despair: '💔',
  guilty: '😣',

  // Angry secondary emotions
  frustrated: '😤',
  critical: '🤨',
  distant: '🫥',
  irritated: '😒',

  // Scared secondary emotions
  confused: '😕',
  rejected: '😞',
  helpless: '😰',
  anxious: '😥',
};

interface EmotionWheelProps {
  onSelectEmotion: (emotion: Emotion) => void;
  selectedEmotion?: string;
}

export const EmotionWheel: React.FC<EmotionWheelProps> = ({
  onSelectEmotion,
  selectedEmotion,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<EmotionCategory | null>(null);

  const handleCategorySelect = (category: EmotionCategory) => {
    setSelectedCategory(category);
    onSelectEmotion({ id: category.id, label: category.label, color: category.color });
  };

  const handleSecondaryEmotionSelect = (emotion: Emotion) => {
    onSelectEmotion(emotion);
  };

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.primaryEmotions}>
          {primaryEmotions.map((category) => (
            <TouchableOpacity
              key={category.id}
              onPress={() => handleCategorySelect(category)}
              style={[
                styles.categoryButton,
                selectedCategory?.id === category.id && styles.selectedCategory,
                selectedEmotion === category.id && styles.selectedEmotion,
                { backgroundColor: category.color + '20' }, // 20% opacity
                { borderColor: category.color },
              ]}
            >
              <Typography style={styles.emoji}>
                {emotionEmojis[category.id]}
              </Typography>
              <Typography
                variant="h3"
                color={selectedCategory?.id === category.id ? category.color : theme.COLORS.ui.text}
                style={styles.categoryLabel}
              >
                {category.label}
              </Typography>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {selectedCategory && (
        <Card style={styles.secondaryEmotions}>
          <Typography variant="h3" style={styles.sectionTitle}>
            More specifically...
          </Typography>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emotionGrid}>
              {selectedCategory.emotions.map((emotion) => (
                <TouchableOpacity
                  key={emotion.id}
                  onPress={() => handleSecondaryEmotionSelect(emotion)}
                  style={[
                    styles.emotionButton,
                    selectedEmotion === emotion.id && styles.selectedEmotion,
                    { backgroundColor: emotion.color + '20' }, // 20% opacity
                    { borderColor: emotion.color },
                  ]}
                >
                  <Typography style={styles.emoji}>
                    {emotionEmojis[emotion.id]}
                  </Typography>
                  <Typography
                    variant="h3"
                    color={selectedEmotion === emotion.id ? emotion.color : theme.COLORS.ui.text}
                    style={styles.emotionLabel}
                  >
                    {emotion.label}
                  </Typography>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  primaryEmotions: {
    flexDirection: 'row',
    paddingHorizontal: theme.SPACING.md,
    paddingVertical: theme.SPACING.lg,
    gap: theme.SPACING.md,
  },
  categoryButton: {
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
    width: 120,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: theme.COLORS.ui.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  selectedCategory: {
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  selectedEmotion: {
    borderWidth: 3,
    transform: [{ scale: 1.05 }],
  },
  emoji: {
    fontSize: 32,
    lineHeight: 36,
    marginBottom: theme.SPACING.xs,
    textAlign: 'center',
  },
  categoryLabel: {
    textAlign: 'center',
    width: '100%',
    fontSize: 16,
  },
  secondaryEmotions: {
    marginTop: theme.SPACING.md,
    padding: theme.SPACING.lg,
    shadowColor: theme.COLORS.ui.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    marginBottom: theme.SPACING.lg,
  },
  emotionGrid: {
    flexDirection: 'row',
    paddingHorizontal: theme.SPACING.md,
    gap: theme.SPACING.md,
  },
  emotionButton: {
    padding: theme.SPACING.md,
    borderRadius: theme.BORDER_RADIUS.lg,
    width: 120,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: theme.COLORS.ui.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  emotionLabel: {
    textAlign: 'center',
    width: '100%',
    fontSize: 16,
  },
}); 