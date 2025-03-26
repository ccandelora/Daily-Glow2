import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { VictoryPie } from 'victory-native';
import theme from '@/constants/theme';
import { Typography } from '@/components/common';

interface MoodData {
  positive: number;
  neutral: number;
  negative: number;
}

interface MoodPatternPieChartProps {
  data: MoodData;
}

export const MoodPatternPieChart = ({ data }: MoodPatternPieChartProps) => {
  const { positive, neutral, negative } = data;
  const total = positive + neutral + negative;
  
  // If no data, show empty chart
  const isEmpty = total === 0;
  
  // Transform data for VictoryPie
  const pieData = isEmpty
    ? [{ x: 'Empty', y: 1 }]
    : [
        { x: 'Positive', y: positive, label: `${Math.round((positive / total) * 100)}%` },
        { x: 'Neutral', y: neutral, label: `${Math.round((neutral / total) * 100)}%` },
        { x: 'Negative', y: negative, label: `${Math.round((negative / total) * 100)}%` },
      ];

  // Colors for different mood categories
  const colorScale = isEmpty
    ? ['rgba(255, 255, 255, 0.1)']
    : [
        theme.COLORS.primary.green,  // Positive
        theme.COLORS.primary.yellow, // Neutral
        theme.COLORS.primary.red,    // Negative
      ];

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <VictoryPie
          data={pieData}
          width={280}
          height={280}
          colorScale={colorScale}
          innerRadius={50}
          labelRadius={90}
          cornerRadius={4}
          padAngle={2}
          style={{
            labels: {
              fill: theme.COLORS.ui.text,
              fontSize: 16,
              fontWeight: 'bold',
            },
            data: {
              filter: 'drop-shadow(0px 2px 2px rgba(0, 0, 0, 0.3))',
            }
          }}
          animate={{
            duration: 1000,
            easing: 'bounce'
          }}
        />
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.COLORS.primary.green }]} />
          <Typography style={styles.legendText}>Positive: {positive}</Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.COLORS.primary.yellow }]} />
          <Typography style={styles.legendText}>Neutral: {neutral}</Typography>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: theme.COLORS.primary.red }]} />
          <Typography style={styles.legendText}>Negative: {negative}</Typography>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.SPACING.md,
  },
  chartContainer: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: theme.SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: theme.BORDER_RADIUS.md,
    padding: theme.SPACING.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.SPACING.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: theme.SPACING.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  legendText: {
    fontSize: 14,
    color: theme.COLORS.ui.textSecondary,
  },
});

export default MoodPatternPieChart; 