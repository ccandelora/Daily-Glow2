import React from 'react';
import { Image, StyleSheet, View, ImageStyle, ViewStyle, TextStyle, Dimensions } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large' | 'xlarge' | 'xxlarge';
  showText?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
  glow?: boolean;
}

// Get screen dimensions for responsive sizing
const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const isSmallScreen = screenHeight < 700;
const isLargeScreen = screenHeight > 900;

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  showText = true,
  style,
  imageStyle,
  textStyle,
  glow = true,
}) => {
  // Define sizes for different variants with responsive adjustments
  const sizes = {
    small: { 
      image: isSmallScreen ? 40 : 60, 
      text: isSmallScreen ? 12 : 14 
    },
    medium: { 
      image: isSmallScreen ? 80 : (isLargeScreen ? 120 : 100), 
      text: isSmallScreen ? 18 : 22 
    },
    large: { 
      image: isSmallScreen ? 120 : (isLargeScreen ? 160 : 140), 
      text: isSmallScreen ? 26 : 30 
    },
    xlarge: { 
      image: isSmallScreen ? 160 : (isLargeScreen ? 200 : 180), 
      text: isSmallScreen ? 34 : 40 
    },
    xxlarge: { 
      image: isSmallScreen ? 180 : (isLargeScreen ? 220 : 200), 
      text: isSmallScreen ? 40 : 46 
    },
  };

  const selectedSize = sizes[size];

  return (
    <View style={[styles.container, { marginBottom: -10 }, style]}>
      <View style={glow ? styles.glowContainer : null}>
        <Image
          source={require('../../../assets/default_transparent_765x625.png')}
          style={[
            styles.logo,
            { width: selectedSize.image, height: selectedSize.image },
            imageStyle,
          ]}
          resizeMode="contain"
        />
      </View>
      
      {showText && (
        <Typography 
          variant="h1" 
          style={{
            textAlign: 'center',
            fontSize: selectedSize.text,
            color: theme.COLORS.ui.text,
            fontWeight: '600',
            marginTop: -10, // Increase negative margin from -5 to -10
            ...textStyle
          }}
          glow={glow ? "strong" : "none"}
        >
          Daily Glow
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0, // Ensure no padding
    margin: 0, // Ensure no margin
  },
  glowContainer: {
    shadowColor: theme.COLORS.primary.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 25,
    elevation: 20,
    padding: 0, // Ensure no padding
    margin: 0, // Ensure no margin
  },
  logo: {
    marginBottom: 0,
  },
  text: {
    textAlign: 'center',
    color: theme.COLORS.ui.text,
    fontWeight: '600',
  },
}); 