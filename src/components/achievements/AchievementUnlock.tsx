import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions, TouchableOpacity } from 'react-native';
import { FontAwesome6 } from '@expo/vector-icons';
import { Typography } from '@/components/common';
import theme from '@/constants/theme';
import { BlurView } from 'expo-blur';
import { getCompatibleIconName } from '@/utils/iconUtils';

interface AchievementUnlockProps {
  title: string;
  description: string;
  icon: string;
  iconColor: string;
  type: 'achievement' | 'badge';
  onAnimationComplete?: () => void;
  visible: boolean;
}

// Create confetti particle
const Confetti = ({ color, left, delay, size, duration }: any) => {
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(position, {
          toValue: { x: Math.random() * 200 - 100, y: Math.random() * 200 + 100 },
          duration,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(rotate, {
          toValue: Math.random() * 10,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left,
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: size / 5,
        opacity,
        transform: [
          { translateX: position.x },
          { translateY: position.y },
          { rotate: spin },
          { scale },
        ],
      }}
    />
  );
};

export const AchievementUnlock: React.FC<AchievementUnlockProps> = ({
  title,
  description,
  icon,
  iconColor,
  type,
  onAnimationComplete,
  visible
}) => {
  // Animation values
  const translateY = useRef(new Animated.Value(150)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;
  const iconRotate = useRef(new Animated.Value(0)).current;
  const iconScale = useRef(new Animated.Value(0.5)).current;
  const shinePosition = useRef(new Animated.Value(-50)).current;

  // Convert to interpolated values for use in styles
  const iconRotateInterpolate = iconRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const shineOpacity = shinePosition.interpolate({
    inputRange: [-50, 0, 100, 150],
    outputRange: [0, 0.5, 0.5, 0]
  });

  useEffect(() => {
    if (visible) {
      // Reset all animations to beginning state
      translateY.setValue(150);
      opacity.setValue(0);
      scale.setValue(0.8);
      iconRotate.setValue(0);
      iconScale.setValue(0.5);
      shinePosition.setValue(-50);

      // Start animation sequence
      Animated.sequence([
        // Fade in and slide up
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
        
        // Rotate and scale icon
        Animated.parallel([
          Animated.timing(iconRotate, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(iconScale, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          // Shine effect animation
          Animated.timing(shinePosition, {
            toValue: 150,
            duration: 1000,
            useNativeDriver: true,
          }),
        ]),
        
        // Scale icon back down
        Animated.timing(iconScale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        
        // Keep showing for a moment
        Animated.delay(2000),
        
        // Fade out and slide up
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -100,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.8,
            duration: 800,
            useNativeDriver: true,
          }),
        ]),
      ]).start(({ finished }) => {
        if (finished && onAnimationComplete) {
          onAnimationComplete();
        }
      });
    }
  }, [visible]);

  const handlePress = () => {
    // Immediately hide when tapped
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished && onAnimationComplete) {
        onAnimationComplete();
      }
    });
  };

  if (!visible) return null;

  return (
    <BlurView intensity={30} style={styles.container}>
      <TouchableOpacity 
        activeOpacity={0.9}
        onPress={handlePress}
        style={StyleSheet.absoluteFillObject}
      >
        <Animated.View
          style={[
            styles.notification,
            {
              transform: [
                { translateY },
                { scale },
              ],
              opacity,
            },
          ]}
        >
          <View style={styles.content}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: `${iconColor}20`,
                  borderColor: iconColor,
                  transform: [
                    { rotate: iconRotateInterpolate },
                    { scale: iconScale },
                  ],
                },
              ]}
            >
              <FontAwesome6 name={getCompatibleIconName(icon) as any} size={28} color={iconColor} />
              
              {/* Shine effect */}
              <Animated.View
                style={[
                  styles.shine,
                  {
                    backgroundColor: iconColor,
                    opacity: shineOpacity,
                    transform: [{ translateX: shinePosition }],
                  },
                ]}
              />
            </Animated.View>
            
            <View style={styles.textContainer}>
              <Typography variant="h3" style={styles.typeLabel} color={iconColor} glow="medium">
                {type === 'achievement' ? 'Achievement Unlocked!' : 'Badge Earned!'}
              </Typography>
              
              <Typography variant="h2" style={styles.title} color={theme.COLORS.ui.text} glow="medium">
                {title}
              </Typography>
              
              <Typography variant="body" style={styles.description} color={theme.COLORS.ui.textSecondary}>
                {description}
              </Typography>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </BlurView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  notification: {
    width: Dimensions.get('window').width * 0.9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(30, 15, 45, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 5,
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden', // For shine effect
    position: 'relative', // For shine effect
  },
  shine: {
    position: 'absolute',
    width: 40,
    height: 100,
    transform: [{ rotate: '45deg' }],
  },
  textContainer: {
    alignItems: 'center',
  },
  typeLabel: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 14,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    opacity: 0.8,
  },
}); 