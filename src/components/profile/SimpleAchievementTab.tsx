import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Typography, Card } from '@/components/common';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';

export const SimpleAchievementTab = () => {
  console.log('Rendering SimpleAchievementTab');
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Fixed test content */}
        <View style={styles.debugBox}>
          <Typography variant="h2" glow="medium" style={styles.debugText}>
            Fixed Test Content
          </Typography>
          <Typography variant="body">
            This is a simplified test component
          </Typography>
        </View>
        
        <Card style={styles.sampleCard} variant="glow">
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome6 
                name="medal" 
                size={24} 
                color={theme.COLORS.primary.green} 
              />
            </View>
            <View style={styles.textContainer}>
              <Typography variant="h3" glow="soft">
                Static Achievement
              </Typography>
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                This is a static test achievement
              </Typography>
            </View>
          </View>
        </Card>
        
        <Card style={styles.sampleCard} variant="glow">
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <FontAwesome6 
                name="trophy" 
                size={24} 
                color={theme.COLORS.primary.orange} 
              />
            </View>
            <View style={styles.textContainer}>
              <Typography variant="h3" glow="soft">
                Static Badge
              </Typography>
              <Typography variant="body" color={theme.COLORS.ui.textSecondary}>
                This is a static test badge
              </Typography>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 600,
    backgroundColor: theme.COLORS.ui.background,
  },
  content: {
    padding: theme.SPACING.lg,
  },
  debugBox: {
    height: 120,
    backgroundColor: 'rgba(255, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 8,
    padding: 10,
  },
  debugText: {
    marginBottom: 10,
  },
  sampleCard: {
    backgroundColor: 'rgba(38, 20, 60, 0.9)',
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
}); 