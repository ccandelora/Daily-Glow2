/**
 * Utility functions for working with icons across different icon libraries
 */

/**
 * Converts Ionicons style names to compatible FontAwesome6 names
 * This helps when transitioning from Ionicons to FontAwesome6 or when
 * you have mixed icon libraries in your project
 * 
 * @param iconName The original icon name (possibly from Ionicons)
 * @returns A compatible FontAwesome6 icon name
 */
export const getCompatibleIconName = (iconName: string): string => {
  if (!iconName) return 'question';
  
  // Strip "-outline" suffix which is used in Ionicons but not in FontAwesome6
  if (iconName.endsWith('-outline')) {
    iconName = iconName.replace('-outline', '');
  }
  
  // Map icon names that might not be available in FontAwesome6
  const iconMap: Record<string, string> = {
    // Direct Ionicons to FontAwesome6 mappings
    'time': 'clock',
    'flame': 'fire',
    'checkmark-circle': 'circle-check',
    'person': 'user',
    'partly-sunny': 'cloud-sun',
    'analytics': 'chart-line',
    'mail-unread': 'envelope',
    'person-circle': 'user-circle',
    'information-circle': 'circle-info',
    'ribbon': 'award',
    'leaf': 'leaf',
    'pulse': 'heart-pulse',
    'fitness': 'dumbbell',
    'sunny': 'sun',
    'trending-up': 'arrow-trend-up',
    'hand-wave': 'hand-sparkles',
    'rainbow': 'rainbow',
    'balance-scale': 'scale-balanced',
    'compass': 'compass',
    'lightbulb': 'lightbulb',
    'bookmark': 'bookmark',
    'calendar-day': 'calendar-day',
    'heart-circle': 'heart-circle',
    
    // Standard FontAwesome6 icons
    'moon': 'moon',
    'sun': 'sun',
    'cloud-sun': 'cloud-sun',
    'heart': 'heart',
    'calendar': 'calendar',
    'trophy': 'trophy',
    'star': 'star',
    'arrow-trend-up': 'arrow-trend-up',
    'arrow-trend-down': 'arrow-trend-down',
    'minus': 'minus',
    'circle-info': 'circle-info',
    'user-circle': 'user-circle',
    'hourglass': 'hourglass',
    'book': 'book',
    'bell': 'bell',
    'rotate': 'rotate',
    'clock': 'clock',
    'calendar-week': 'calendar-week',
    'trash': 'trash',
    'award': 'award',
    'check': 'check',
    'gear': 'gear',
    'settings': 'gear',
    'bars': 'bars',
    'xmark': 'xmark',
    'plus': 'plus',
    'magnifying-glass': 'magnifying-glass',
    'triangle-exclamation': 'triangle-exclamation',
    'circle-check': 'circle-check',
    'circle-xmark': 'circle-xmark',
    'circle-question': 'circle-question',
    'house': 'house',
    'user': 'user',
    'lock': 'lock',
    'unlock': 'unlock',
    'eye': 'eye',
    'eye-slash': 'eye-slash',
    'arrow-left': 'arrow-left',
    'arrow-right': 'arrow-right',
    'arrow-up': 'arrow-up',
    'arrow-down': 'arrow-down',
    'fire': 'fire',
    'face-smile': 'face-smile',
  };
  
  // Return the mapped icon name if it exists, otherwise return original (stripped of -outline)
  return iconMap[iconName] || iconName;
}; 