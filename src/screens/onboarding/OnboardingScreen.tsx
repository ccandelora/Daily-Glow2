import React from 'react';
import { View, Text, StyleSheet, Dimensions, Button, Platform, Alert } from 'react-native';
// Add type declaration for the package
// @ts-ignore
import Onboarding from 'react-native-onboarding-swiper';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';

// Create a type declaration for our WelcomeScreen props
interface WelcomeScreenProps {
  icon: any; // Using any temporarily for Ionicons names
  title: string;
  subtitle: string;
}

const { width, height } = Dimensions.get('window');

const OnboardingScreen = () => {
  const router = useRouter();
  const { user } = useAuth();

  console.log('📱 Rendering OnboardingScreen for user:', user?.id);

  const completeOnboarding = async () => {
    // Log the user ID for debugging
    console.log('🎉 Completing onboarding for user ID:', user?.id);
    
    if (user?.id) {
      try {
        // Update user profile to mark onboarding as completed
        const { error } = await supabase
          .from('user_profiles')
          .update({ has_completed_onboarding: true })
          .eq('user_id', user.id);
        
        if (error) {
          console.error('❌ Failed to update onboarding status:', error.message);
        } else {
          console.log('✅ Successfully marked onboarding as completed');
        }
      } catch (error) {
        console.error('❌ Error during onboarding completion:', error);
      }
    }
    
    // Navigate to the main app regardless of database update success
    console.log('🔀 Navigating to main app after onboarding');
    
    try {
      Alert.alert(
        'Onboarding Complete',
        'You have completed the onboarding process. You will now be redirected to the main app.',
        [
          {
            text: 'OK',
            onPress: () => {
              router.replace('/(app)');
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      Alert.alert('Error', 'Failed to navigate to the main app. Please restart the app.');
    }
  };

  // Custom components for the onboarding screens
  const WelcomeScreen = ({ icon, title, subtitle }: WelcomeScreenProps) => (
    <View style={styles.screenContainer}>
      <Ionicons name={icon} size={120} color={theme.COLORS.primary.green} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );

  // Add a skip button
  const renderSkipButton = () => {
    return (
      <Button
        title="Skip"
        onPress={completeOnboarding}
        color={Platform.OS === 'ios' ? theme.COLORS.primary.blue : undefined}
      />
    );
  };

  // Add a next button
  const renderNextButton = () => {
    return (
      <Button
        title="Next"
        onPress={() => console.log('Next pressed')}
        color={Platform.OS === 'ios' ? theme.COLORS.primary.green : undefined}
      />
    );
  };

  // Add a done button
  const renderDoneButton = () => {
    return (
      <Button
        title="Get Started!"
        onPress={completeOnboarding}
        color={Platform.OS === 'ios' ? theme.COLORS.primary.green : undefined}
      />
    );
  };

  return (
    <View style={styles.container}>
      <Onboarding
        onSkip={completeOnboarding}
        onDone={completeOnboarding}
        SkipButtonComponent={renderSkipButton}
        NextButtonComponent={renderNextButton}
        DoneButtonComponent={renderDoneButton}
        pages={[
          {
            backgroundColor: theme.COLORS.ui.background,
            image: <WelcomeScreen 
              icon="happy" 
              title="Welcome to Daily Glow!" 
              subtitle="Begin your journey to wellness" 
            />,
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: theme.COLORS.ui.background,
            image: <WelcomeScreen 
              icon="calendar" 
              title="Track Your Progress" 
              subtitle="Daily check-ins help build healthy habits" 
            />,
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: theme.COLORS.ui.background,
            image: <WelcomeScreen 
              icon="trophy" 
              title="Complete Challenges" 
              subtitle="Earn badges and track your achievements" 
            />,
            title: '',
            subtitle: '',
          },
          {
            backgroundColor: theme.COLORS.ui.background,
            image: <WelcomeScreen 
              icon="analytics" 
              title="Gain Insights" 
              subtitle="Learn more about your wellness journey" 
            />,
            title: '',
            subtitle: '',
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.COLORS.ui.background,
  },
  screenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
    color: theme.COLORS.ui.text,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    paddingHorizontal: 20,
  }
});

export default OnboardingScreen; 