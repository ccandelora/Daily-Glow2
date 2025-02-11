import React, { useEffect } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import theme from '../../constants/theme';

interface AnimatedMoodIconProps {
  size?: number;
  color: string;
  style?: ViewStyle;
  children: React.ReactNode;
  active?: boolean;
}

export const AnimatedMoodIcon: React.FC<AnimatedMoodIconProps> = ({
  size = 60,
  color,
  style,
  children,
  active = false,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: active ? 1.1 : 1,
        useNativeDriver: true,
        damping: 10,
      }),
      Animated.timing(opacityAnim, {
        toValue: active ? 1 : 0.6,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [active, scaleAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: color,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.BORDER_RADIUS.circle,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
}); 