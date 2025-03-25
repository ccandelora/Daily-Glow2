import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Typography } from '@/components/common';
import { JournalEntry } from '@/types';
import theme from '@/constants/theme';
import { getEmotionById } from '@/constants/emotions';
import Svg, { Line, Path, Circle } from 'react-native-svg';

interface EmotionalGrowthChartProps {
  entries: JournalEntry[];
  timeFilter: 'week' | 'month' | 'all';
}

export const EmotionalGrowthChart: React.FC<EmotionalGrowthChartProps> = ({ entries, timeFilter }) => {
  const chartData = useMemo(() => {
    console.log('EmotionalGrowthChart - Number of entries:', entries.length);
    
    // Process entries to ensure proper date and emotional_shift values
    const processedEntries = entries.map(entry => ({
      ...entry,
      date: entry.date instanceof Date ? entry.date : new Date(entry.date),
      emotional_shift: typeof entry.emotional_shift === 'number' ? entry.emotional_shift : 0
    }));
    
    // Get the date range based on the time filter
    const now = new Date();
    let startDate: Date;
    
    switch (timeFilter) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 6); // Last 7 days
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 29); // Last 30 days
        break;
      default: // 'all' - use all entries but limit to 30 data points
        startDate = new Date(0);
    }
    
    // Filter entries by date
    const filteredEntries = processedEntries
      .filter(entry => entry.date >= startDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    console.log('EmotionalGrowthChart - Filtered entries count:', filteredEntries.length);
    
    // If not enough entries, return explanation message rather than sample data
    if (filteredEntries.length < 2) {
      console.log('EmotionalGrowthChart - Insufficient data for analysis');
      
      let message = "";
      if (processedEntries.length === 0) {
        message = "Start your emotional journey by logging your first check-in.";
      } else if (processedEntries.length === 1) {
        message = "You need at least one more check-in to track your emotional growth. Growth is measured by comparing changes over time.";
      } else if (timeFilter === 'week') {
        message = "Not enough check-ins this week. Try the 'Month' or 'All Time' filter, or add more entries this week.";
      } else if (timeFilter === 'month') {
        message = "Not enough check-ins this month. Try the 'All Time' filter, or add more entries this month.";
      } else {
        message = "You need at least 2 check-ins to track emotional growth. Log your emotions regularly for meaningful insights.";
      }
      
      return {
        dataPoints: [],
        minValue: 0,
        maxValue: 0,
        trend: 0,
        message
      };
    }
    
    // Group entries by day
    const entriesByDay: Record<string, JournalEntry[]> = {};
    
    filteredEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      if (!entriesByDay[dateStr]) {
        entriesByDay[dateStr] = [];
      }
      entriesByDay[dateStr].push(entry);
    });
    
    // Calculate average emotional shift for each day
    const dataPoints: { date: Date; value: number; emotion: string; color: string }[] = [];
    
    Object.entries(entriesByDay).forEach(([dateStr, dayEntries]) => {
      // Calculate average emotional shift
      const totalShift = dayEntries.reduce((sum, entry) => sum + entry.emotional_shift, 0);
      const avgShift = totalShift / dayEntries.length;
      
      // Find most common emotion for the day
      const emotionCounts: Record<string, number> = {};
      dayEntries.forEach(entry => {
        emotionCounts[entry.initial_emotion] = (emotionCounts[entry.initial_emotion] || 0) + 1;
      });
      
      let dominantEmotion = '';
      let maxCount = 0;
      
      Object.entries(emotionCounts).forEach(([emotion, count]) => {
        if (count > maxCount) {
          dominantEmotion = emotion;
          maxCount = count;
        }
      });
      
      const emotionData = getEmotionById(dominantEmotion);
      
      dataPoints.push({
        date: new Date(dateStr),
        value: avgShift,
        emotion: dominantEmotion,
        color: emotionData?.color || theme.COLORS.primary.green,
      });
    });
    
    // If we have too many data points, sample them
    let processedDataPoints = dataPoints;
    if (timeFilter === 'all' && dataPoints.length > 30) {
      const step = Math.ceil(dataPoints.length / 30);
      processedDataPoints = dataPoints.filter((_, index) => index % step === 0);
    }
    
    // Calculate min and max values for scaling
    const values = processedDataPoints.map(point => point.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values, 1);
    
    // Calculate overall trend
    const trend = processedDataPoints.length >= 2 
      ? processedDataPoints[processedDataPoints.length - 1].value - processedDataPoints[0].value
      : 0;
    
    return {
      dataPoints: processedDataPoints,
      minValue,
      maxValue,
      trend,
    };
  }, [entries, timeFilter]);
  
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = screenWidth - 80; // Adjust based on card padding
  const chartHeight = 150;
  
  // Calculate scaling factors
  const valueRange = Math.max(1, chartData.maxValue - chartData.minValue);
  const xScale = chartWidth / Math.max(1, chartData.dataPoints.length - 1);
  const yScale = chartHeight / valueRange;
  
  // Calculate y-position for a data point
  const getYPosition = (value: number) => {
    return chartHeight - ((value - chartData.minValue) * yScale);
  };
  
  // Generate path for the line
  const generateLinePath = () => {
    if (chartData.dataPoints.length === 0) return '';
    
    return chartData.dataPoints.map((point, index) => {
      const x = index * xScale;
      const y = getYPosition(point.value);
      return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };
  
  // Generate area under the line
  const generateAreaPath = () => {
    if (chartData.dataPoints.length === 0) return '';
    
    const linePath = generateLinePath();
    const lastPoint = chartData.dataPoints.length - 1;
    const lastX = lastPoint * xScale;
    const baselineY = getYPosition(0);
    
    return `${linePath} L ${lastX} ${baselineY} L 0 ${baselineY} Z`;
  };
  
  return (
    <View style={styles.container}>
      {chartData.dataPoints.length === 0 ? (
        <Typography style={styles.noDataText} color={theme.COLORS.ui.textSecondary}>
          {chartData.message || "Not enough data to display chart. Complete more check-ins to see your emotional growth over time."}
        </Typography>
      ) : (
        <>
          {/* Chart title and trend indicator */}
          <View style={styles.chartHeader}>
            <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
              Emotional Growth
            </Typography>
            {chartData.trend !== 0 && (
              <Typography 
                style={styles.trendIndicator} 
                color={chartData.trend > 0 ? theme.COLORS.primary.green : theme.COLORS.primary.red}
              >
                {chartData.trend > 0 ? '↑' : '↓'} {Math.abs(Math.round(chartData.trend * 100))}%
              </Typography>
            )}
          </View>
          
          {/* SVG Chart */}
          <View style={styles.chartContainer}>
            <Svg width={chartWidth} height={chartHeight} style={styles.chart}>
              {/* Horizontal grid lines */}
              <Line 
                x1="0" 
                y1={getYPosition(0)} 
                x2={chartWidth} 
                y2={getYPosition(0)} 
                stroke={theme.COLORS.ui.border} 
                strokeWidth="1" 
                strokeDasharray="4, 4" 
              />
              
              {/* Area under the line */}
              <Path 
                d={generateAreaPath()} 
                fill={`${theme.COLORS.primary.green}20`} 
              />
              
              {/* Line chart */}
              <Path 
                d={generateLinePath()} 
                stroke={theme.COLORS.primary.green} 
                strokeWidth="2" 
                fill="none" 
              />
              
              {/* Data points */}
              {chartData.dataPoints.map((point, index) => (
                <Circle 
                  key={index}
                  cx={index * xScale} 
                  cy={getYPosition(point.value)} 
                  r="4" 
                  fill={point.color} 
                  stroke={theme.COLORS.ui.background}
                  strokeWidth="1"
                />
              ))}
            </Svg>
            
            {/* X-axis labels */}
            <View style={styles.xAxisLabels}>
              {chartData.dataPoints.length > 0 && (
                <>
                  <Typography variant="caption" style={styles.axisLabel}>
                    {chartData.dataPoints[0].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Typography>
                  
                  {chartData.dataPoints.length > 2 && (
                    <Typography variant="caption" style={styles.axisLabel}>
                      {chartData.dataPoints[Math.floor(chartData.dataPoints.length / 2)].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </Typography>
                  )}
                  
                  <Typography variant="caption" style={styles.axisLabel}>
                    {chartData.dataPoints[chartData.dataPoints.length - 1].date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </Typography>
                </>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: theme.SPACING.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.SPACING.sm,
  },
  trendIndicator: {
    fontWeight: 'bold',
  },
  chartContainer: {
    marginBottom: theme.SPACING.md,
  },
  chart: {
    backgroundColor: 'transparent',
  },
  xAxisLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.xs,
  },
  axisLabel: {
    fontSize: 10,
    color: theme.COLORS.ui.textSecondary,
  },
  noDataText: {
    textAlign: 'center',
    marginVertical: theme.SPACING.xl,
  },
}); 