import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import theme from '../../constants/theme';

interface MoodButtonProps {
  label: string;
  color: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export const MoodButton: React.FC<MoodButtonProps> = ({
  label,
  color,
  selected = false,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: color },
        selected && styles.selected,
        style,
      ]}
      onPress={onPress}
    >
      <Text style={styles.text}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    width: 80,
    height: 80,
    borderRadius: theme.BORDER_RADIUS.circle,
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.SPACING.xs,
  },
  selected: {
    borderWidth: 3,
    borderColor: theme.COLORS.ui.text,
  },
  text: {
    color: theme.COLORS.ui.text,
    fontSize: theme.FONTS.sizes.sm,
    fontWeight: theme.FONTS.weights.medium,
    textAlign: 'center',
  },
}); 