import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Typography } from '@/components/common';
import { FontAwesome6 } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { getCompatibleIconName } from '@/utils/iconUtils';
import { Card } from '@/components/common';

interface AchievementProgressProps {
  title: string;
  description: string;
  icon: string;
  progress: number; // 0 to 1
  target: number;
  current: number;
  color?: string;
  onPress?: () => void;
  isEarned?: boolean;
}

export const AchievementProgress: React.FC<AchievementProgressProps> = ({
  title,
  description,
  icon,
  progress,
  target,
  current,
  color = theme.COLORS.primary.teal,
  onPress,
  isEarned = false,
}) => {
  // Animation refs
  const progressAnim = useRef(new Animated.Value(0)).current;
  const progressAnimValue = useRef(0);
  
  // Update progress animation when progress changes
  useEffect(() => {
    // Don't animate if it's less than the current animation value
    // This prevents the bar from "shrinking" when the component remounts
    if (progress > progressAnimValue.current) {
      progressAnimValue.current = progress;
      Animated.timing(progressAnim, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false, // We can't use native driver for width/backgroundColor
      }).start();
    } else {
      // Just set it directly if it's less
      progressAnim.setValue(progress);
      progressAnimValue.current = progress;
    }
  }, [progress]);

  const borderColor = isEarned ? color : 'rgba(255, 255, 255, 0.1)';
  
  // Determine appropriate text based on progress
  const getProgressText = () => {
    if (isEarned) return 'Completed!';
    if (target === 0) return 'Not started';
    return `${current} / ${target}`;
  };

  return (
    <Card 
      style={[
        styles.container, 
        isEarned ? styles.earnedContainer : styles.unearnedContainer
      ] as any} 
      variant={isEarned ? "glow" : "default"}
    >
      <View style={styles.contentContainer}>
        <View 
          style={[
            styles.iconContainer, 
            {
              backgroundColor: isEarned ? `${color}80` : 'rgba(120, 120, 120, 0.5)',
              borderColor: isEarned ? color : 'white',
            }
          ]}
        >
          <FontAwesome6 
            name={getCompatibleIconName(icon) as any} 
            size={28} 
            color={isEarned ? 'white' : 'rgba(255, 255, 255, 0.9)'} 
          />
        </View>
        
        <View style={styles.textContainer}>
          <Typography 
            variant="h3" 
            glow={isEarned ? "medium" : "soft"}
            color="white"
            style={[styles.title, {fontWeight: 'bold'}] as any}
          >
            {title}
          </Typography>
          
          <Typography 
            variant="body" 
            color="white"
            style={styles.description}
          >
            {description}
          </Typography>
          
          {target > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: isEarned ? color : 'rgba(255, 255, 255, 0.7)',
                    }
                  ]} 
                />
              </View>
              
              <Typography 
                variant="caption" 
                color="white"
                style={[styles.progressText, {fontWeight: 'bold'}] as any}
              >
                {`${current} / ${target}`}
              </Typography>
            </View>
          )}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  earnedContainer: {
    backgroundColor: 'rgba(100, 60, 150, 0.95)',
    borderColor: '#90ff90',
  },
  unearnedContainer: {
    backgroundColor: 'rgba(80, 50, 120, 0.95)',
    borderColor: 'rgba(200, 200, 200, 0.6)',
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    opacity: 0.7,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 4,
    marginRight: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.7,
  },
}); 