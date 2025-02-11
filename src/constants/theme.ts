export const COLORS = {
  // Primary colors for emotions
  primary: {
    red: '#FF6B6B',     // For negative emotions
    green: '#4CAF50',   // For positive emotions
    blue: '#2196F3',    // For calm emotions
    yellow: '#FFC107',  // For energetic emotions
  },
  
  // UI colors
  ui: {
    background: '#FFFFFF',
    card: '#F5F5F5',
    text: '#212121',
    textSecondary: '#757575',
    border: '#E0E0E0',
    disabled: '#BDBDBD',
  },

  // Status colors
  status: {
    success: '#4CD964',
    error: '#FF3B30',
    warning: '#FF9500',
    info: '#5856D6',
  },

  // Gradient colors
  gradient: {
    start: '#FF6B6B',
    middle: '#4CD964',
    end: '#5856D6',
  },
};

export const FONTS = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 16,
  xl: 24,
  circle: 999,
};

export default {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
}; 