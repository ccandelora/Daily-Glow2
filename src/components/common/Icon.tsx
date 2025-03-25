import React from 'react';
import { View, StyleSheet } from 'react-native';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Ionicons } from '@expo/vector-icons';

type FontAwesomeIconName = 
  | 'award' | 'certificate' | 'book' | 'calendar' | 'chart-line'
  | 'circle-check' | 'cloud' | 'cloud-sun' | 'dumbbell' | 'fire'
  | 'heart' | 'heart-pulse' | 'leaf' | 'moon' | 'star' | 'sun'
  | 'user' | 'crown' | 'trophy' | 'clock';

type IoniconsName = 
  | 'partly-sunny-outline' | 'partly-sunny' | 'sunny-outline' | 'sunny'
  | 'heart-outline' | 'calendar-outline' | 'person-outline'
  | 'checkmark-circle-outline' | 'moon-outline' | 'star-outline'
  | 'book-outline' | 'time-outline' | 'time' | 'flame-outline'
  | 'flame' | 'fitness-outline' | 'fitness' | 'pulse-outline'
  | 'pulse' | 'analytics-outline' | 'analytics' | 'leaf-outline'
  | 'person-circle';

// Map icon names to the appropriate icon family and name
const ICON_MAP: Record<string, { family: 'fa' | 'ionicons'; name: FontAwesomeIconName | IoniconsName }> = {
  // Ionicons mappings
  'partly-sunny-outline': { family: 'ionicons', name: 'partly-sunny-outline' },
  'partly-sunny': { family: 'ionicons', name: 'partly-sunny' },
  'sunny-outline': { family: 'ionicons', name: 'sunny-outline' },
  'sunny': { family: 'ionicons', name: 'sunny' },
  'heart-outline': { family: 'ionicons', name: 'heart-outline' },
  'calendar-outline': { family: 'ionicons', name: 'calendar-outline' },
  'person-outline': { family: 'ionicons', name: 'person-outline' },
  'checkmark-circle-outline': { family: 'ionicons', name: 'checkmark-circle-outline' },
  'moon-outline': { family: 'ionicons', name: 'moon-outline' },
  'star-outline': { family: 'ionicons', name: 'star-outline' },
  'book-outline': { family: 'ionicons', name: 'book-outline' },
  'time-outline': { family: 'ionicons', name: 'time-outline' },
  'time': { family: 'ionicons', name: 'time' },
  'flame-outline': { family: 'ionicons', name: 'flame-outline' },
  'flame': { family: 'ionicons', name: 'flame' },
  'fitness-outline': { family: 'ionicons', name: 'fitness-outline' },
  'fitness': { family: 'ionicons', name: 'fitness' },
  'pulse-outline': { family: 'ionicons', name: 'pulse-outline' },
  'pulse': { family: 'ionicons', name: 'pulse' },
  'analytics-outline': { family: 'ionicons', name: 'analytics-outline' },
  'analytics': { family: 'ionicons', name: 'analytics' },
  'leaf-outline': { family: 'ionicons', name: 'leaf-outline' },
  'person-circle': { family: 'ionicons', name: 'person-circle' },
  
  // FontAwesome mappings
  'award': { family: 'fa', name: 'award' },
  'badge-check': { family: 'fa', name: 'certificate' }, // Closest equivalent
  'book': { family: 'fa', name: 'book' },
  'calendar': { family: 'fa', name: 'calendar' },
  'chart-line': { family: 'fa', name: 'chart-line' },
  'circle-check': { family: 'fa', name: 'circle-check' },
  'cloud': { family: 'fa', name: 'cloud' },
  'cloud-sun': { family: 'fa', name: 'cloud-sun' },
  'dumbbell': { family: 'fa', name: 'dumbbell' },
  'fire': { family: 'fa', name: 'fire' },
  'heart': { family: 'fa', name: 'heart' },
  'heart-pulse': { family: 'fa', name: 'heart-pulse' },
  'leaf': { family: 'fa', name: 'leaf' },
  'moon': { family: 'fa', name: 'moon' },
  'star': { family: 'fa', name: 'star' },
  'sun': { family: 'fa', name: 'sun' },
  'user': { family: 'fa', name: 'user' },
  'user-crown': { family: 'fa', name: 'crown' }, // Closest equivalent
  'user-large': { family: 'fa', name: 'user' },
  'trophy': { family: 'fa', name: 'trophy' },
  'clock': { family: 'fa', name: 'clock' },
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  style?: any;
}

export const Icon: React.FC<IconProps> = ({ name, size = 24, color = 'white', style }) => {
  // Get the appropriate icon family and name
  const iconInfo = ICON_MAP[name];
  
  if (!iconInfo) {
    console.warn(`Icon not found: ${name}`);
    return <View style={[{ width: size, height: size }, style]} />;
  }
  
  // Render the icon based on its family
  if (iconInfo.family === 'fa') {
    return (
      <FontAwesome6 
        name={iconInfo.name as FontAwesomeIconName}
        size={size}
        color={color}
        style={style}
      />
    );
  } else {
    return (
      <Ionicons
        name={iconInfo.name as IoniconsName}
        size={size}
        color={color}
        style={style}
      />
    );
  }
};

export default Icon; 