import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { Typography, Card } from '@/components/common';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useProfile } from '@/contexts/UserProfileContext';
import theme from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';

export const AchievementsTab = () => {
  const { achievements, userAchievements } = useAchievements();
  const { userProfile } = useProfile();
  
  const currentStreak = userProfile?.streak || 0;

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
    },
    achievementsContainer: {
      marginTop: 16,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 40,
    },
    achievementCard: {
      marginBottom: 16,
      padding: 16,
      borderRadius: 12,
    },
    earnedCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
    unearnedCard: {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
    },
    achievementHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    iconContainer: {
      width: 48,
      height: 48,
      borderRadius: 24,
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 1,
      marginRight: 12,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementName: {
      marginBottom: 4,
    },
    achievementDescription: {
      opacity: 0.8,
    },
    achievementFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 12,
      paddingTop: 12,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.1)',
    },
    emptyMessage: {
      textAlign: 'center',
      marginVertical: 24,
      opacity: 0.7,
    }
  });

  const renderAchievement = (achievement: any, isEarned: boolean) => {
    const color = isEarned ? theme.COLORS.primary.teal : 'rgba(120, 120, 120, 0.5)';
    const iconName = achievement.icon_name || 'medal-outline';

    return (
      <Card 
        key={achievement.id} 
        style={StyleSheet.flatten([
          styles.achievementCard,
          isEarned ? styles.earnedCard : styles.unearnedCard
        ])}
        variant={isEarned ? "glow" : "default"}
      >
        <View style={styles.achievementHeader}>
          <View 
            style={StyleSheet.flatten([
              styles.iconContainer, 
              {
                backgroundColor: isEarned ? `${color}20` : 'rgba(120, 120, 120, 0.1)',
                borderColor: isEarned ? color : 'rgba(120, 120, 120, 0.2)',
              }
            ])}
          >
            <Ionicons 
              name={iconName as any} 
              size={24} 
              color={isEarned ? color : 'rgba(120, 120, 120, 0.5)'} 
            />
          </View>
          <View style={styles.achievementInfo}>
            <Typography 
              variant="h3" 
              style={styles.achievementName}
              color={isEarned ? theme.COLORS.ui.text : theme.COLORS.ui.textSecondary}
              glow={isEarned ? "medium" : "none"}
            >
              {achievement.name}
            </Typography>
            <Typography 
              variant="body" 
              style={styles.achievementDescription}
              color={isEarned ? theme.COLORS.ui.textSecondary : 'rgba(120, 120, 120, 0.6)'}
            >
              {achievement.description}
            </Typography>
          </View>
        </View>
        <View style={styles.achievementFooter}>
          <Typography 
            variant="caption"
            color={isEarned ? color : 'rgba(120, 120, 120, 0.5)'}
            glow={isEarned ? "soft" : "none"}
          >
            {isEarned ? 'Earned' : achievement.requires_streak ? `Requires ${achievement.requires_streak} day streak` : 'Not yet earned'}
          </Typography>
          <Typography 
            variant="caption"
            color={isEarned ? theme.COLORS.primary.green : 'rgba(120, 120, 120, 0.5)'}
            glow={isEarned ? "soft" : "none"}
          >
            +{achievement.points} pts
          </Typography>
        </View>
      </Card>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {userAchievements.length > 0 ? (
        <View style={styles.achievementsContainer}>
          {userAchievements.map(ua => 
            renderAchievement(ua.achievement, true)
          )}
        </View>
      ) : (
        <View style={styles.emptyContainer}>
          <Typography variant="body" style={styles.emptyMessage}>
            You haven't earned any achievements yet. Keep up your daily check-ins!
          </Typography>
        </View>
      )}
      
      <Typography variant="h3" style={{ marginTop: 24, marginBottom: 16 }} glow="soft">
        Available Achievements
      </Typography>
      
      {/* Available achievements */}
      <View style={styles.achievementsContainer}>
        {achievements
          .filter(a => !userAchievements.some(ua => ua.achievement_id === a.id))
          .map(achievement => renderAchievement(achievement, false))
        }
      </View>
    </ScrollView>
  );
}; 