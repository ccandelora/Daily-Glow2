export const COLORS = {
  // Primary colors for emotions (keeping these for emotional context)
  primary: {
    red: '#FF6B6B',     // Warm red for negative emotions
    green: '#00C853',   // Vibrant green for positive emotions
    blue: '#2979FF',    // Bright blue for calm emotions
    yellow: '#FFD600',  // Bright yellow for energetic emotions
  },
  
  // UI colors updated for dark theme with glowing accents
  ui: {
    background: 'rgba(28, 14, 45, 0.95)',  // Dark purple background
    card: 'rgba(38, 20, 60, 0.85)',        // Slightly lighter purple for cards
    text: '#FFFFFF',                        // White text for contrast
    textSecondary: 'rgba(255, 255, 255, 0.7)', // Semi-transparent white
    border: 'rgba(82, 67, 194, 0.3)',      // Subtle purple border
    disabled: 'rgba(82, 67, 194, 0.2)',    // Dimmed purple for disabled state
    accent: '#4169E1',                     // Royal blue for accents
    highlight: 'rgba(65, 105, 225, 0.15)', // Soft blue highlight
  },

  // Status colors with glow effects
  status: {
    success: '#00E676',
    error: '#FF5252',
    warning: '#FFD600',
    info: '#4169E1',
  },

  // Gradient colors for glow effects
  gradient: {
    start: 'rgba(65, 105, 225, 0.2)',  // Royal blue glow
    middle: 'rgba(147, 112, 219, 0.15)', // Purple glow
    end: 'rgba(28, 14, 45, 0.9)',     // Dark purple base
  },
};

export const FONTS = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 22,
    xl: 28,
    xxl: 36,
    xxxl: 44,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  // Adding font families for more sophistication
  families: {
    heading: 'System',
    body: 'System',
  }
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

export const TIME_PERIODS = {
  MORNING: {
    label: 'Morning',
    range: { start: 5, end: 11 }, // 5:00 AM - 11:59 AM
    greeting: 'Good morning',
    icon: '🌅'
  },
  AFTERNOON: {
    label: 'Afternoon',
    range: { start: 12, end: 16 }, // 12:00 PM - 4:59 PM
    greeting: 'Good afternoon',
    icon: '☀️'
  },
  EVENING: {
    label: 'Evening',
    range: { start: 17, end: 4 }, // 5:00 PM - 4:59 AM
    greeting: 'Good evening',
    icon: '��'
  }
} as const;

export default {
  COLORS,
  FONTS,
  SPACING,
  BORDER_RADIUS,
  TIME_PERIODS,
}; 