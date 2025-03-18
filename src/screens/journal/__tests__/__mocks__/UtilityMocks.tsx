/**
 * Mock implementations for utility functions and constants
 */

// Mock emotions data
export const mockEmotions = [
  { id: 'happy', label: 'Happy', color: '#FFDE7D', category: 'joy' },
  { id: 'excited', label: 'Excited', color: '#FFC107', category: 'joy' },
  { id: 'calm', label: 'Calm', color: '#81D4FA', category: 'peace' },
  { id: 'sad', label: 'Sad', color: '#90CAF9', category: 'sadness' },
  { id: 'anxious', label: 'Anxious', color: '#FFAB91', category: 'fear' },
  { id: 'angry', label: 'Angry', color: '#FF8A65', category: 'anger' },
  { id: 'content', label: 'Content', color: '#A5D6A7', category: 'peace' },
  { id: 'relaxed', label: 'Relaxed', color: '#80CBC4', category: 'peace' },
];

// Mock getEmotionById function
export const mockGetEmotionById = (id: string) => {
  return mockEmotions.find(e => e.id === id);
};

// Mock getAllEmotions function
export const mockGetAllEmotions = () => {
  return mockEmotions;
};

// Mock dateTime utilities
export const mockCurrentTimePeriod = 'MORNING';

export const mockTimePeriods = {
  MORNING: 'MORNING',
  AFTERNOON: 'AFTERNOON',
  EVENING: 'EVENING',
};

export const mockGetCurrentTimePeriod = () => mockCurrentTimePeriod;

export const mockFormatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
};

export const mockFormatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
  });
};

// Mock theme constants
export const mockColors = {
  ui: {
    background: '#121212',
    card: '#1E1E1E',
    text: '#FFFFFF',
    accent: '#6200EE',
  },
  emotions: {
    joy: '#FFC107',
    peace: '#81D4FA',
    sadness: '#90CAF9',
    fear: '#FFAB91',
    anger: '#FF8A65',
  },
};

export const mockSpacing = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const mockTimePeriodInfo = {
  MORNING: {
    label: 'Morning',
    description: 'Start your day with reflection',
    color: '#FFC107',
    hours: [6, 7, 8, 9, 10, 11],
    range: {
      start: new Date(2023, 0, 1, 6, 0),
      end: new Date(2023, 0, 1, 11, 59)
    }
  },
  AFTERNOON: {
    label: 'Afternoon',
    description: 'Check in during your day',
    color: '#2196F3',
    hours: [12, 13, 14, 15, 16, 17],
    range: {
      start: new Date(2023, 0, 1, 12, 0),
      end: new Date(2023, 0, 1, 17, 59)
    }
  },
  EVENING: {
    label: 'Evening',
    description: 'Reflect on your day',
    color: '#9C27B0',
    hours: [18, 19, 20, 21, 22, 23],
    range: {
      start: new Date(2023, 0, 1, 18, 0),
      end: new Date(2023, 0, 1, 23, 59)
    }
  },
}; 