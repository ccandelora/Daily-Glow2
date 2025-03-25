import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import theme from '@/constants/theme';
import { VideoBackground } from '@/components/common';
import { SafeAreaView } from 'react-native-safe-area-context';

// Create a type declaration for our WelcomeScreen props
interface OnboardingPageProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  isLast?: boolean;
}

const OnboardingScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = React.useState(0);

  console.log('📱 Rendering OnboardingScreen for user:', user?.id);

  // Pages data for the onboarding flow
  const pages: OnboardingPageProps[] = [
    {
      icon: "heart",
      title: "Welcome to Daily Glow!",
      subtitle: "Begin your journey to wellness and mindfulness"
    },
    {
      icon: "calendar",
      title: "Track Your Progress",
      subtitle: "Daily check-ins help build healthy habits and maintain your streak"
    },
    {
      icon: "trophy",
      title: "Complete Challenges",
      subtitle: "Earn badges and track your achievements as you grow"
    },
    {
      icon: "analytics",
      title: "Gain Insights",
      subtitle: "Learn more about your wellness journey through personalized analytics",
      isLast: true
    }
  ];

  const completeOnboarding = async () => {
    // Log the user ID for debugging
    console.log('🎉 Completing onboarding for user ID:', user?.id);
    
    if (user?.id) {
      try {
        // Update user profile to mark onboarding as completed
        const { error } = await supabase
          .from('profiles')
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
      router.replace('/(app)');
    } catch (error) {
      console.error('❌ Navigation failed:', error);
      Alert.alert('Error', 'Failed to navigate to the main app. Please restart the app.');
    }
  };

  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      completeOnboarding();
    }
  };

  const OnboardingPage = ({ icon, title, subtitle, isLast }: OnboardingPageProps) => (
    <View style={styles.pageContainer}>
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={60} color={theme.COLORS.primary.green} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <VideoBackground />
      
      {/* Onboarding Content */}
      <View style={styles.content}>
        {/* Progress Indicators */}
        <View style={styles.progressContainer}>
          {pages.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.progressDot,
                currentPage === index && styles.progressDotActive
              ]}
            />
          ))}
        </View>
        
        {/* Current Page Content */}
        <OnboardingPage {...pages[currentPage]} />
        
        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentPage > 0 && (
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => setCurrentPage(currentPage - 1)}
            >
              <Ionicons name="arrow-back" size={24} color="rgba(255, 255, 255, 0.8)" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={styles.nextButton}
            onPress={goToNextPage}
          >
            <Text style={styles.buttonText}>
              {currentPage === pages.length - 1 ? "Get Started" : "Next"}
            </Text>
            <Ionicons 
              name={currentPage === pages.length - 1 ? "checkmark-circle" : "arrow-forward"} 
              size={20} 
              color="#fff" 
              style={styles.buttonIcon}
            />
          </TouchableOpacity>
          
          {currentPage < pages.length - 1 && (
            <TouchableOpacity 
              style={styles.skipButton}
              onPress={completeOnboarding}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 4,
  },
  progressDotActive: {
    backgroundColor: theme.COLORS.primary.green,
    width: 20,
  },
  pageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(0, 158, 76, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
    color: theme.COLORS.primary.green,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    color: '#fff',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    marginTop: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    padding: 10,
  },
  nextButton: {
    backgroundColor: theme.COLORS.primary.green,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 5,
  },
  skipButton: {
    padding: 10,
  },
  skipButtonText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  }
});

export default OnboardingScreen; 