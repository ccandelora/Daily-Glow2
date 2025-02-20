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

// Legacy emotion mappings to new emotion types
const legacyEmotionMappings: Record<string, string> = {
  'tired': 'sad',
  'calm': 'peaceful',
  'joyful': 'happy',
  'content': 'peaceful',
  'relieved': 'peaceful',
  'accepting': 'peaceful',
  'determined': 'powerful',
  'inspired': 'optimistic',
  'accomplished': 'proud',
  'serene': 'peaceful',
  'hopeful': 'optimistic',
  'positive': 'optimistic',
  'grateful': 'happy',
  'satisfied': 'peaceful',
};

export const primaryEmotions: EmotionCategory[] = [
  {
    id: 'happy',
    label: 'Happy',
    color: '#2E7D32',
    emotions: [
      { id: 'optimistic', label: 'Optimistic', color: '#388E3C' },
      { id: 'peaceful', label: 'Peaceful', color: '#43A047' },
      { id: 'powerful', label: 'Powerful', color: '#4CAF50' },
      { id: 'proud', label: 'Proud', color: '#66BB6A' },
    ]
  },
  {
    id: 'sad',
    label: 'Sad',
    color: '#1565C0',
    emotions: [
      { id: 'lonely', label: 'Lonely', color: '#1976D2' },
      { id: 'vulnerable', label: 'Vulnerable', color: '#1E88E5' },
      { id: 'despair', label: 'Despair', color: '#2196F3' },
      { id: 'guilty', label: 'Guilty', color: '#42A5F5' },
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
    color: '#F57F17',
    emotions: [
      { id: 'confused', label: 'Confused', color: '#E65100' },
      { id: 'rejected', label: 'Rejected', color: '#EF6C00' },
      { id: 'helpless', label: 'Helpless', color: '#F57F17' },
      { id: 'anxious', label: 'Anxious', color: '#FF8F00' },
    ]
  }
];

export const getEmotionById = (id: string): Emotion | undefined => {
  // First try to map legacy emotion to new emotion type
  const mappedId = legacyEmotionMappings[id] || id;
  
  // Then look for the emotion in our current set
  for (const category of primaryEmotions) {
    if (category.id === mappedId) {
      return { id: mappedId, label: category.label, color: category.color };
    }
    const secondaryEmotion = category.emotions.find(e => e.id === mappedId);
    if (secondaryEmotion) {
      return secondaryEmotion;
    }
  }

  // If we can't find a mapping, create a default emotion
  if (id) {
    return {
      id,
      label: id.charAt(0).toUpperCase() + id.slice(1),
      color: '#808080', // Default gray color for unknown emotions
    };
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