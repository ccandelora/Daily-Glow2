import { Redirect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useEffect } from 'react';

export default function Index() {
  const { session } = useAuth();
  const { hasCompletedOnboarding } = useOnboarding();
  
  useEffect(() => {
    console.log('Root index mounted, checking state:', {
      session: !!session,
      hasCompletedOnboarding
    });
  }, [session, hasCompletedOnboarding]);

  // If we're coming from onboarding completion, go straight to app
  if (hasCompletedOnboarding) {
    console.log('Onboarding complete, redirecting to app');
    return <Redirect href="/(app)" />;
  }

  if (!session) {
    console.log('No session, redirecting to login');
    return <Redirect href="/(auth)/login" />;
  }
  
  console.log('Session present but onboarding incomplete, redirecting to welcome');
  return <Redirect href="/(onboarding)/welcome" />;
} 