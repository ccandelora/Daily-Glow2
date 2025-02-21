import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import theme from '@/constants/theme';

interface AnimatedBackgroundProps {
  intensity?: 'light' | 'medium' | 'strong';
  animated?: boolean;
}

export const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({ 
  intensity = 'medium',
  animated = true 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      // Fade in
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }).start();

      // Faster rotation
      const rotateAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 30000, // 30 seconds per rotation
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          })
        ])
      );

      rotateAnimation.start();
    } else {
      fadeAnim.setValue(1);
    }
  }, [animated]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <View style={styles.container}>
      {/* Static base gradient */}
      <LinearGradient
        colors={[
          'rgba(255,255,255,0.92)',
          'rgba(235,230,255,0.95)',
          'rgba(255,255,255,0.92)',
        ]}
        style={styles.baseGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />

      <Animated.View
        style={[
          styles.gradientContainer,
          {
            opacity: fadeAnim,
            transform: [{ rotate: spin }]
          }
        ]}
      >
        {/* Brighter purple glow */}
        <LinearGradient
          colors={[
            'transparent',
            `${theme.COLORS.primary.blue}15`,
            `${theme.COLORS.primary.blue}20`,
            `${theme.COLORS.primary.blue}15`,
            'transparent',
          ]}
          style={styles.gradient}
          start={{ x: 0.3, y: 0.3 }}
          end={{ x: 0.7, y: 0.7 }}
          locations={[0, 0.3, 0.5, 0.7, 1]}
        />

        {/* Stronger accent highlights */}
        <LinearGradient
          colors={[
            'transparent',
            'rgba(230,230,255,0.35)',
            'transparent'
          ]}
          style={styles.gradient}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />

        {/* Enhanced color variation */}
        <LinearGradient
          colors={[
            'transparent',
            `${theme.COLORS.primary.blue}12`,
            'transparent'
          ]}
          style={styles.gradient}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
  },
  baseGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  gradientContainer: {
    position: 'absolute',
    top: -400,
    left: -400,
    right: -400,
    bottom: -400,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ scale: 2 }],
  },
}); 