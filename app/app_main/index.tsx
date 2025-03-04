import HomeScreen from '@/screens/home/HomeScreen';
import { useEffect, useState } from 'react';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import theme from '@/constants/theme';

export default function Home() {
  const { hasCompletedOnboarding, checkDatabaseOnboardingStatus } = useOnboarding();
  const { isEmailVerified, user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  
  useEffect(() => {
    const checkStatus = async () => {
      setIsChecking(true);
      
      console.log('Home screen (app/index.tsx) mounted with state:', {
        hasCompletedOnboarding,
        isEmailVerified,
        userId: user?.id
      });
      
      if (isEmailVerified && user?.id) {
        // Check database directly
        const dbStatus = await checkDatabaseOnboardingStatus(user.id);
        console.log('Database onboarding status check result:', dbStatus);
        
        if (!dbStatus) {
          console.log('Database indicates onboarding not complete, will redirect');
          setShouldRedirect(true);
        }
      }
      
      setIsChecking(false);
    };
    
    checkStatus();
  }, [hasCompletedOnboarding, isEmailVerified, user?.id]);

  // Show loading while checking
  if (isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.COLORS.ui.background }}>
        <ActivityIndicator size="large" color={theme.COLORS.primary.green} />
      </View>
    );
  }

  // Force redirect to onboarding if not completed
  if (shouldRedirect || (isEmailVerified && !hasCompletedOnboarding)) {
    console.log('Redirecting from home to onboarding welcome screen');
    return <Redirect href="/(onboarding)/welcome" />;
  }

  return <HomeScreen />;
} 