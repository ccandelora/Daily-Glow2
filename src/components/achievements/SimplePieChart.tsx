import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import theme from '@/constants/theme';
import { Typography } from '@/components/common';

interface SimplePieChartProps {
  percentage: number;
  color: string;
  centerText: string;
  subtitle: string;
  size?: number;
}

const SimplePieChart: React.FC<SimplePieChartProps> = ({
  percentage,
  color,
  centerText,
  subtitle,
  size = 120,
}) => {
  // Clamp percentage between 0 and 100
  const clampedPercentage = Math.max(0, Math.min(100, percentage));
  
  // For empty chart (0%), still show a small segment so the pie is visible
  const isEmpty = clampedPercentage === 0;
  
  // Data for VictoryPie
  const pieData = isEmpty
    ? [{ x: 'Empty', y: 1 }]
    : [
        { x: 'Completed', y: clampedPercentage },
        { x: 'Remaining', y: 100 - clampedPercentage },
      ];

  // Colors for VictoryPie
  const colorScale = isEmpty
    ? ['rgba(255, 255, 255, 0.1)']
    : [color, 'rgba(0, 0, 0, 0.3)'];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <VictoryPie
        data={pieData}
        width={size}
        height={size}
        padding={0}
        innerRadius={size * 0.35}
        cornerRadius={4}
        colorScale={colorScale}
        labels={() => null}
        animate={{ duration: 1000 }}
      />
      <View style={styles.centerLabel}>
        <Typography variant="h2" color={color} glow="medium">
          {centerText}
        </Typography>
        <Typography variant="caption" color={theme.COLORS.ui.textSecondary}>
          {subtitle}
        </Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SimplePieChart; 