import React from 'react';
import { Image, StyleSheet, View, ImageStyle, ViewStyle, TextStyle } from 'react-native';
import { Typography } from './Typography';
import theme from '@/constants/theme';

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  textStyle?: TextStyle;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'medium',
  showText = true,
  style,
  imageStyle,
  textStyle,
}) => {
  // Define sizes for different variants
  const sizes = {
    small: { image: 24, text: 16 },
    medium: { image: 60, text: 24 },
    large: { image: 90, text: 36 },
  };

  const selectedSize = sizes[size];

  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../../assets/default_transparent_353x345.png')}
        style={[
          styles.logo,
          { width: selectedSize.image, height: selectedSize.image },
          imageStyle,
        ]}
        resizeMode="contain"
      />
      {showText && (
        <Typography
          variant={size === 'large' ? 'h1' : size === 'medium' ? 'h2' : 'h3'}
          style={{
            ...styles.text,
            fontSize: selectedSize.text,
            ...textStyle,
          }}
          glow="medium"
          color={theme.COLORS.primary.green}
        >
          Daily Glow
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginRight: theme.SPACING.xs,
  },
  text: {
    textAlign: 'center',
  },
}); 