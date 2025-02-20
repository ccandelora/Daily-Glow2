export interface Emotion {
  id: string;
  label: string;
  color: string;
  icon?: string;
}

export interface EmotionCategory {
  id: string;
  label: string;
  color: string;
  emotions: Emotion[];
}

export const primaryEmotions: EmotionCategory[] = [
  {
    id: 'happy',
    label: 'Happy',
    color: '#4CAF50',
    emotions: [
      { id: 'optimistic', label: 'Optimistic', color: '#66BB6A' },
      { id: 'peaceful', label: 'Peaceful', color: '#81C784' },
      { id: 'powerful', label: 'Powerful', color: '#A5D6A7' },
      { id: 'proud', label: 'Proud', color: '#C8E6C9' },
    ]
  },
  {
    id: 'sad',
    label: 'Sad',
    color: '#2196F3',
    emotions: [
      { id: 'lonely', label: 'Lonely', color: '#42A5F5' },
      { id: 'vulnerable', label: 'Vulnerable', color: '#64B5F6' },
      { id: 'despair', label: 'Despair', color: '#90CAF9' },
      { id: 'guilty', label: 'Guilty', color: '#BBDEFB' },
    ]
  },
  {
    id: 'angry',
    label: 'Angry',
    color: '#FF5252',
    emotions: [
      { id: 'frustrated', label: 'Frustrated', color: '#FF8A80' },
      { id: 'critical', label: 'Critical', color: '#FF80AB' },
      { id: 'distant', label: 'Distant', color: '#FF4081' },
      { id: 'irritated', label: 'Irritated', color: '#F50057' },
    ]
  },
  {
    id: 'scared',
    label: 'Scared',
    color: '#FFC107',
    emotions: [
      { id: 'confused', label: 'Confused', color: '#FFD54F' },
      { id: 'rejected', label: 'Rejected', color: '#FFE082' },
      { id: 'helpless', label: 'Helpless', color: '#FFECB3' },
      { id: 'anxious', label: 'Anxious', color: '#FFF3E0' },
    ]
  }
];

export const getEmotionById = (id: string): Emotion | undefined => {
  for (const category of primaryEmotions) {
    if (category.id === id) {
      return { id: category.id, label: category.label, color: category.color };
    }
    const secondaryEmotion = category.emotions.find(e => e.id === id);
    if (secondaryEmotion) {
      return secondaryEmotion;
    }
  }
  return undefined;
};

export const getAllEmotions = (): Emotion[] => {
  const emotions: Emotion[] = [];
  primaryEmotions.forEach(category => {
    emotions.push({ id: category.id, label: category.label, color: category.color });
    emotions.push(...category.emotions);
  });
  return emotions;
}; 