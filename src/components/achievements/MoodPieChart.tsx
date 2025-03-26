import React from 'react';
import { View, StyleSheet } from 'react-native';
import { VictoryPie } from 'victory-native';
import theme from '@/constants/theme';
import { Typography } from '@/components/common';

interface MoodPieChartProps {
  positive: number;
  neutral: number;
  negative: number;
  size?: number;
}

const MoodPieChart: React.FC<MoodPieChartProps> = ({
  positive,
  neutral,
  negative,
  size = 120,
}) => {
  const total = positive + neutral + negative;
  
  // If no data, show empty chart
  const isEmpty = total === 0;
  
  // Data for VictoryPie
  const pieData = isEmpty
    ? [{ x: 'Empty', y: 1 }]
    : [
        { x: 'Positive', y: positive },
        { x: 'Neutral', y: neutral },
        { x: 'Negative', y: negative },
      ];

  // Colors for VictoryPie
  const colorScale = isEmpty
    ? ['rgba(255, 255, 255, 0.1)']
    : [
        theme.COLORS.primary.green,
        theme.COLORS.primary.yellow,
        theme.COLORS.primary.red,
      ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <VictoryPie
        data={pieData}
        width={size}
        height={size}
        padding={0}
        innerRadius={size * 0.25}
        cornerRadius={4}
        colorScale={colorScale}
        labels={() => null}
        animate={{ duration: 1000 }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MoodPieChart; 