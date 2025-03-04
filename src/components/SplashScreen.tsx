import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export function SplashScreen() {
  const { isDarkMode } = useTheme();
  const opacity = new Animated.Value(0);
  
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration: 800,
      easing: Easing.ease,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <View style={[
      styles.container, 
      { backgroundColor: isDarkMode ? '#121212' : '#FFFFFF' }
    ]}>
      <Animated.View style={[styles.content, { opacity }]}>
        <Text style={[
          styles.title, 
          { color: isDarkMode ? '#FFFFFF' : '#333333' }
        ]}>
          Daily Glow
        </Text>
        <Text style={[
          styles.subtitle, 
          { color: isDarkMode ? '#CCCCCC' : '#666666' }
        ]}>
          Start your skincare journey
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
  },
}); 