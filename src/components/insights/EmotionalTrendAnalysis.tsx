import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import { VictoryLine, VictoryChart, VictoryScatter, VictoryAxis, VictoryTheme } from 'victory-native';
import theme from '@/constants/theme';
import { getEmotionById } from '@/constants/emotions';
import { Typography } from '@/components/common';

interface JournalEntry {
  id: string;
  date: Date;
  time_period: string;
  initial_emotion: string;
  secondary_emotion?: string;
  emotional_shift: number;
}

interface EmotionalTrendAnalysisProps {
  entries: JournalEntry[];
  days?: number;
}

/**
 * Renders a chart showing how emotional states trend over time
 */
const EmotionalTrendAnalysis: React.FC<EmotionalTrendAnalysisProps> = ({ 
  entries = [],
  days = 14 
}) => {
  const screenWidth = Dimensions.get('window').width - 40; // Account for padding
  
  const chartData = useMemo(() => {
    console.log('EmotionalTrendAnalysis - Number of entries:', entries.length);
    
    // If no entries or insufficient entries, return empty data with message
    if (!entries || entries.length < 2) {
      console.log('EmotionalTrendAnalysis - Insufficient entries for analysis');
      return {
        labels: [],
        datasets: [{
          data: [],
          color: () => theme.COLORS.primary.green
        }],
        message: "You need at least 2 check-ins to see your emotional trends. Complete more entries to visualize how your emotions change over time."
      };
    }
    
    // Filter entries to the last {days} days
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    console.log('EmotionalTrendAnalysis - Cutoff date:', cutoffDate);
    
    // Ensure dates are properly converted
    const processedEntries = entries.map(entry => ({
      ...entry,
      date: entry.date instanceof Date ? entry.date : new Date(entry.date),
      emotional_shift: typeof entry.emotional_shift === 'number' ? entry.emotional_shift : 0
    }));
    
    const recentEntries = processedEntries
      .filter(entry => entry.date >= cutoffDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    console.log('EmotionalTrendAnalysis - Recent entries count:', recentEntries.length);
    
    // If no entries in time range, suggest changing time filter
    if (recentEntries.length < 2) {
      console.log('EmotionalTrendAnalysis - Not enough recent entries');
      
      // Use all entries if available
      if (processedEntries.length >= 2) {
        // Use all entries, sorted by date
        const sortedEntries = [...processedEntries].sort((a, b) => a.date.getTime() - b.date.getTime());
        
        // If more than 14 entries, sample them down
        const entriesToUse = sortedEntries.length > 14 
          ? sortedEntries.filter((_, index) => index % Math.ceil(sortedEntries.length / 14) === 0)
          : sortedEntries;
        
        // Create data from all entries
        const labels = entriesToUse.map(entry => {
          const date = entry.date;
          return `${date.getMonth() + 1}/${date.getDate()}`;
        });
        
        const data = entriesToUse.map(entry => (entry.emotional_shift + 1) * 5); // Convert -1,1 to 0,10 scale
        
        const lineColors = entriesToUse.map(entry => {
          const emotion = getEmotionById(entry.initial_emotion);
          return emotion?.color || theme.COLORS.primary.blue;
        });
        
        const optimismScore = data.length > 0 
          ? Math.round((data.reduce((sum, val) => sum + val, 0) / data.length) * 10)
          : 50;
        
        return {
          labels,
          datasets: [{
            data,
            color: (opacity = 1) => theme.COLORS.primary.blue,
          }],
          lineColors,
          optimismScore,
          message: `No entries found in the selected time period. Showing ${entriesToUse.length} entries from all time instead. Try selecting "All Time" in the filter.`
        };
      } else {
        // Not enough entries at all
        return {
          labels: [],
          datasets: [{
            data: [],
            color: () => theme.COLORS.primary.green
          }],
          message: `You need at least 2 check-ins to see your emotional trends. You currently have ${processedEntries.length} check-in. Add more entries to visualize patterns.`
        };
      }
    }

    // Create daily averages for emotional shift
    const dailyData: Record<string, { total: number, count: number, emotions: Record<string, number> }> = {};
    
    recentEntries.forEach(entry => {
      const dateStr = entry.date.toISOString().split('T')[0];
      
      if (!dailyData[dateStr]) {
        dailyData[dateStr] = { 
          total: 0, 
          count: 0,
          emotions: {}
        };
      }
      
      // Track emotional_shift
      dailyData[dateStr].total += entry.emotional_shift;
      dailyData[dateStr].count += 1;
      
      // Track emotions
      if (!dailyData[dateStr].emotions[entry.initial_emotion]) {
        dailyData[dateStr].emotions[entry.initial_emotion] = 0;
      }
      dailyData[dateStr].emotions[entry.initial_emotion] += 1;
    });
    
    // Create data points for the chart
    const dataPoints = Object.entries(dailyData).map(([date, data]) => {
      // Convert to average emotional shift
      const averageShift = data.count > 0 ? data.total / data.count : 0;
      
      // Find most common emotion
      let topEmotion = '';
      let topCount = 0;
      Object.entries(data.emotions).forEach(([emotion, count]) => {
        if (count > topCount) {
          topEmotion = emotion;
          topCount = count;
        }
      });
      
      return {
        date,
        averageShift,
        dominantEmotion: topEmotion
      };
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Generate labels (short date format)
    const labels = dataPoints.map(point => {
      const date = new Date(point.date);
      return `${date.getMonth() + 1}/${date.getDate()}`;
    });
    
    // Generate data for emotional shift (-1 to 1 scale normalized to 0-10 for display)
    const emotionalShiftData = dataPoints.map(point => (point.averageShift + 1) * 5);
    
    // Generate colors based on the dominant emotion
    const lineColors = dataPoints.map(point => {
      const emotion = getEmotionById(point.dominantEmotion);
      return emotion?.color || theme.COLORS.primary.blue;
    });
    
    // Create an optimism score (scaled 0-100)
    const optimismScore = emotionalShiftData.length > 0 
      ? Math.round((emotionalShiftData.reduce((sum, val) => sum + val, 0) / emotionalShiftData.length) * 10)
      : 50;
    
    return {
      labels,
      datasets: [{
        data: emotionalShiftData,
        color: (opacity = 1) => theme.COLORS.primary.blue,
      }],
      lineColors,
      optimismScore
    };
  }, [entries, days]);
  
  // Generate a descriptive insight about the trend
  const trendInsight = useMemo(() => {
    if (chartData.message) {
      return chartData.message;
    }
    
    if (!chartData.datasets[0].data || chartData.datasets[0].data.length < 2) {
      return "Record more check-ins to see your emotional trend patterns.";
    }
    
    const data = chartData.datasets[0].data;
    
    // Calculate if trend is generally increasing, decreasing, or stable
    let increasing = 0;
    let decreasing = 0;
    for (let i = 1; i < data.length; i++) {
      if (data[i] > data[i-1]) increasing++;
      else if (data[i] < data[i-1]) decreasing++;
    }
    
    const firstValue = data[0];
    const lastValue = data[data.length - 1];
    const netChange = lastValue - firstValue;
    
    // Generate insights based on trend patterns
    if (Math.abs(netChange) < 1) {
      return "Your emotional state has been relatively stable recently.";
    } else if (netChange > 1) {
      return "Your emotional wellbeing shows an upward trend - great job!";
    } else {
      return "Your emotional trend shows some recent challenges. Try self-care activities.";
    }
  }, [chartData]);
  
  if (!chartData.labels || chartData.labels.length === 0) {
    return (
      <View style={styles.container}>
        <Typography variant="h3" style={styles.title}>Emotional Trend</Typography>
        <View style={styles.emptyContainer}>
          <Typography style={styles.emptyText}>
            {chartData.message || "Check in regularly to see your emotional trends. We recommend at least 5-7 daily check-ins to start seeing patterns."}
          </Typography>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Typography variant="h3" style={styles.title}>Emotional Trend</Typography>
      
      <View style={styles.chartContainer}>
        <VictoryChart
          width={screenWidth}
          height={220}
          theme={VictoryTheme.material}
          domainPadding={{ y: 20 }}
          style={{
            background: { fill: 'rgba(37, 19, 59, 0.8)' }
          }}
        >
          <VictoryAxis
            tickFormat={(t) => chartData.labels[t]}
            style={{
              axis: { stroke: 'rgba(255, 255, 255, 0.3)' },
              tickLabels: { 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10
              }
            }}
          />
          <VictoryAxis
            dependentAxis
            domain={[0, 10]}
            style={{
              axis: { stroke: 'rgba(255, 255, 255, 0.3)' },
              tickLabels: { 
                fill: 'rgba(255, 255, 255, 0.7)',
                fontSize: 10
              }
            }}
          />
          <VictoryLine
            data={chartData.datasets[0].data.map((y, x) => ({ x, y }))}
            style={{
              data: { 
                stroke: theme.COLORS.primary.blue,
                strokeWidth: 3
              }
            }}
            animate={{
              duration: 1000,
              onLoad: { duration: 500 }
            }}
            interpolation="monotoneX"
          />
          <VictoryScatter
            data={chartData.datasets[0].data.map((y, x) => ({ x, y }))}
            size={6}
            style={{
              data: {
                fill: theme.COLORS.primary.green,
                stroke: 'white',
                strokeWidth: 2
              }
            }}
          />
        </VictoryChart>
      </View>
      
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: theme.COLORS.primary.blue }]} />
          <Typography style={styles.legendText}>Emotional well-being (higher is better)</Typography>
        </View>
      </View>
      
      <View style={styles.insightContainer}>
        <Typography style={styles.insightText}>{trendInsight}</Typography>
      </View>

      {chartData.optimismScore !== undefined && (
        <View style={styles.scoreContainer}>
          <Typography variant="h3" style={styles.scoreLabel}>Optimism Score</Typography>
          <View style={styles.scoreBarContainer}>
            <View 
              style={[
                styles.scoreBar, 
                { width: `${chartData.optimismScore}%` },
                chartData.optimismScore > 65 ? styles.scoreBarHigh : 
                chartData.optimismScore > 40 ? styles.scoreBarMedium : 
                styles.scoreBarLow
              ]} 
            />
          </View>
          <Typography variant="h3" style={styles.scoreValue}>{chartData.optimismScore}</Typography>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(37, 19, 59, 0.8)',
    padding: 16,
  },
  title: {
    color: theme.COLORS.ui.text,
    marginBottom: 16,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  legendContainer: {
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    color: theme.COLORS.ui.text,
    fontSize: 12,
  },
  insightContainer: {
    backgroundColor: 'rgba(0, 158, 76, 0.2)',
    borderRadius: 12,
    padding: 12,
    marginTop: 16,
  },
  insightText: {
    color: theme.COLORS.ui.text,
    fontSize: 14,
  },
  emptyContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyText: {
    color: theme.COLORS.ui.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  scoreContainer: {
    marginTop: 16,
  },
  scoreLabel: {
    color: theme.COLORS.ui.text,
    marginBottom: 8,
  },
  scoreBarContainer: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  scoreBar: {
    height: '100%',
    borderRadius: 6,
  },
  scoreBarHigh: {
    backgroundColor: theme.COLORS.primary.green,
  },
  scoreBarMedium: {
    backgroundColor: theme.COLORS.primary.yellow,
  },
  scoreBarLow: {
    backgroundColor: theme.COLORS.primary.red,
  },
  scoreValue: {
    color: theme.COLORS.ui.text,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default EmotionalTrendAnalysis; 