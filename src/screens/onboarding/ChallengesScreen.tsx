import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, Animated, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Typography, Button, Card } from '@/components/common';
import { useOnboarding } from '@/contexts/OnboardingContext';
import theme from '@/constants/theme';
import { FontAwesome6 } from '@expo/vector-icons';

export const ChallengesScreen = () => {
  const router = useRouter();
  const headerAnim = React.useRef(new Animated.Value(0)).current;
  const cardAnim = React.useRef(new Animated.Value(50)).current;
  const footerAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Fade in header
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Slide up card
      Animated.spring(cardAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      // Fade in footer
      Animated.timing(footerAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    router.push('/first-check-in');
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <Animated.View style={[styles.header, { opacity: headerAnim }]}>
          <Typography variant="h2" style={styles.title}>
            Daily Challenges
          </Typography>
          <Typography variant="body" style={styles.subtitle}>
            Grow through consistent practice and earn rewards
          </Typography>
        </Animated.View>

        <Animated.View
          style={{
            transform: [{ translateY: cardAnim }],
            opacity: headerAnim,
          }}
        >
          <Card style={styles.card}>
            <View style={styles.challengeHeader}>
              <FontAwesome6
                name="medal"
                size={28}
                color={theme.COLORS.primary.yellow}
                style={styles.icon}
              />
              <Typography variant="h3">What are Daily Challenges?</Typography>
            </View>
            <Typography style={styles.description}>
              Daily Challenges are personalized prompts designed to boost your 
              emotional well-being and mindfulness practice. Each day, you'll 
              receive new challenges that encourage self-reflection and personal growth.
            </Typography>
          </Card>

          <Card style={styles.card}>
            <View style={styles.challengeHeader}>
              <FontAwesome6
                name="heart"
                size={28}
                color={theme.COLORS.primary.red}
                style={styles.icon}
              />
              <Typography variant="h3">Types of Challenges</Typography>
            </View>
            <View style={styles.typeContainer}>
              <View style={styles.typeItem}>
                <FontAwesome6 
                  name="face-smile" 
                  size={24} 
                  color={theme.COLORS.primary.green} 
                />
                <Typography style={styles.typeTitle}>Gratitude</Typography>
                <Typography variant="caption" style={styles.typeDescription}>
                  Express appreciation for the positive aspects of your life
                </Typography>
              </View>
              
              <View style={styles.typeItem}>
                <FontAwesome6 
                  name="heart" 
                  size={24} 
                  color={theme.COLORS.primary.red} 
                />
                <Typography style={styles.typeTitle}>Mood</Typography>
                <Typography variant="caption" style={styles.typeDescription}>
                  Explore and understand your emotional patterns
                </Typography>
              </View>
              
              <View style={styles.typeItem}>
                <FontAwesome6 
                  name="leaf" 
                  size={24} 
                  color={theme.COLORS.primary.blue} 
                />
                <Typography style={styles.typeTitle}>Mindfulness</Typography>
                <Typography variant="caption" style={styles.typeDescription}>
                  Practice being present in the moment
                </Typography>
              </View>
              
              <View style={styles.typeItem}>
                <FontAwesome6 
                  name="paintbrush" 
                  size={24} 
                  color={theme.COLORS.primary.yellow} 
                />
                <Typography style={styles.typeTitle}>Creative</Typography>
                <Typography variant="caption" style={styles.typeDescription}>
                  Express yourself through creative reflection
                </Typography>
              </View>
            </View>
          </Card>

          <Card style={styles.card}>
            <View style={styles.challengeHeader}>
              <FontAwesome6
                name="trophy"
                size={28}
                color={theme.COLORS.primary.green}
                style={styles.icon}
              />
              <Typography variant="h3">Benefits & Rewards</Typography>
            </View>
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <FontAwesome6 
                  name="chart-line" 
                  size={20} 
                  color={theme.COLORS.primary.green} 
                />
              </View>
              <View style={styles.benefitContent}>
                <Typography style={styles.benefitTitle}>Track Your Progress</Typography>
                <Typography variant="caption" style={styles.benefitDescription}>
                  See your growth over time with detailed insights
                </Typography>
              </View>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <FontAwesome6 
                  name="gem" 
                  size={20} 
                  color={theme.COLORS.primary.blue} 
                />
              </View>
              <View style={styles.benefitContent}>
                <Typography style={styles.benefitTitle}>Earn Points</Typography>
                <Typography variant="caption" style={styles.benefitDescription}>
                  Complete challenges to earn points and level up
                </Typography>
              </View>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <FontAwesome6 
                  name="award" 
                  size={20} 
                  color={theme.COLORS.primary.yellow} 
                />
              </View>
              <View style={styles.benefitContent}>
                <Typography style={styles.benefitTitle}>Unlock Achievements</Typography>
                <Typography variant="caption" style={styles.benefitDescription}>
                  Earn badges and achievements as you continue your journey
                </Typography>
              </View>
            </View>
            
            <View style={styles.benefitRow}>
              <View style={styles.benefitIcon}>
                <FontAwesome6 
                  name="brain" 
                  size={20} 
                  color={theme.COLORS.primary.red} 
                />
              </View>
              <View style={styles.benefitContent}>
                <Typography style={styles.benefitTitle}>Improve Well-being</Typography>
                <Typography variant="caption" style={styles.benefitDescription}>
                  Develop positive habits that enhance your emotional health
                </Typography>
              </View>
            </View>
          </Card>
        </Animated.View>
      </ScrollView>

      <Animated.View style={[styles.footer, { opacity: footerAnim }]}>
        <Button
          title="Continue to First Check-In"
          onPress={handleContinue}
          style={styles.button}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: theme.SPACING.lg,
    paddingTop: theme.SPACING.xl,
    paddingBottom: theme.SPACING.lg,
  },
  title: {
    marginBottom: theme.SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
  },
  card: {
    marginHorizontal: theme.SPACING.lg,
    marginBottom: theme.SPACING.lg,
    padding: theme.SPACING.lg,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  icon: {
    marginRight: theme.SPACING.md,
  },
  description: {
    color: theme.COLORS.ui.textSecondary,
    lineHeight: 22,
  },
  typeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: theme.SPACING.sm,
  },
  typeItem: {
    width: '48%',
    padding: theme.SPACING.md,
    marginBottom: theme.SPACING.md,
    backgroundColor: theme.COLORS.ui.card,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeTitle: {
    marginTop: theme.SPACING.sm,
    marginBottom: theme.SPACING.xs,
    fontWeight: 'bold',
  },
  typeDescription: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.SPACING.md,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.COLORS.ui.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: theme.SPACING.md,
  },
  benefitContent: {
    flex: 1,
  },
  benefitTitle: {
    fontWeight: 'bold',
    marginBottom: 2,
  },
  benefitDescription: {
    color: theme.COLORS.ui.textSecondary,
  },
  footer: {
    paddingHorizontal: theme.SPACING.lg,
    paddingVertical: theme.SPACING.xl,
  },
  button: {
    marginBottom: theme.SPACING.md,
  },
}); 