import React, { useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Typography, Button, VideoBackground, Logo, EmailVerificationBanner } from '@/components/common';
import { useRouter } from 'expo-router';
import theme from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { useOnboarding } from '@/contexts/OnboardingContext';

export const WelcomeScreen = () => {
  const router = useRouter();
  const { user, isEmailVerified, resendVerificationEmail } = useAuth();
  const { resetOnboarding } = useOnboarding();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    console.log('🔍 DEBUG: CRITICAL FIX - WelcomeScreen mounted with state (new structure):', {
      isEmailVerified,
      userEmail: user?.email
    });
    
    // Log the current route for debugging
    try {
      const { useSegments, usePathname } = require('expo-router');
      const segments = useSegments();
      const pathname = usePathname();
      console.log('🔍 DEBUG: CRITICAL FIX - Current route info (new structure):', { 
        segments, 
        pathname,
        isArray: Array.isArray(segments),
        segmentsJoined: segments.join('/') 
      });
    } catch (error) {
      console.error('🔍 DEBUG: CRITICAL FIX - Error getting route segments:', error);
    }
    
    // Log the screen dimensions and platform info
    try {
      const { Dimensions, Platform } = require('react-native');
      const window = Dimensions.get('window');
      console.log('🔍 DEBUG: CRITICAL FIX - Screen dimensions:', window);
      console.log('🔍 DEBUG: CRITICAL FIX - Platform:', Platform.OS, Platform.Version);
    } catch (error) {
      console.error('🔍 DEBUG: CRITICAL FIX - Error getting device info:', error);
    }
    
    // Ensure onboarding state is reset when welcome screen is shown
    resetOnboarding()
      .then(() => {
        console.log('🔍 DEBUG: CRITICAL FIX - Onboarding state reset in WelcomeScreen');
      })
      .catch((error) => {
        console.error('🔍 DEBUG: CRITICAL FIX - Error resetting onboarding state:', error);
      });
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleResendVerification = async () => {
    if (user?.email) {
      await resendVerificationEmail(user.email);
    }
  };

  return (
    <View style={styles.container}>
      <VideoBackground />
      
      {/* Dark overlay gradient for better text readability */}
      <LinearGradient
        colors={[
          'rgba(28, 14, 45, 0.8)',
          'rgba(28, 14, 45, 0.6)',
          'rgba(28, 14, 45, 0.8)',
        ]}
        style={StyleSheet.absoluteFill}
      />

      <Animated.View 
        style={[
          styles.content,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}
      >
        <View style={styles.logoContainer}>
          <Logo size="xxlarge" />
        </View>

        <Typography variant="h1" style={styles.title} glow="strong">
          Welcome to Daily Glow
        </Typography>

        <Typography variant="body" style={styles.subtitle} glow="medium">
          Your journey to mindfulness and self-discovery starts here
        </Typography>

        {/* Email Verification Banner */}
        {!isEmailVerified && user?.email && (
          <View style={styles.bannerContainer}>
            <EmailVerificationBanner 
              email={user.email}
              onResendVerification={handleResendVerification}
            />
          </View>
        )}
      </Animated.View>

      <Animated.View 
        style={[
          styles.footer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [20, 0],
            })}],
          }
        ]}
      >
        <Button
          title="Get Started"
          onPress={() => {
            console.log('🔍 DEBUG: CRITICAL FIX - Get Started button pressed, navigating to first-check-in');
            router.push('/(onboarding)/first-check-in');
          }}
          style={styles.button}
          variant="primary"
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.SPACING.xl,
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(65, 105, 225, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 0,
    borderWidth: 2,
    borderColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    textAlign: 'center',
    marginBottom: 0,
    color: theme.COLORS.ui.text,
    fontSize: theme.FONTS.sizes.xxxl,
    textShadowColor: theme.COLORS.ui.accent,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    textAlign: 'center',
    color: theme.COLORS.ui.textSecondary,
    maxWidth: '90%',
    lineHeight: 28,
    fontSize: theme.FONTS.sizes.md,
    marginTop: 5,
  },
  bannerContainer: {
    width: '100%',
    marginTop: theme.SPACING.xl,
  },
  footer: {
    padding: theme.SPACING.xl,
    paddingBottom: theme.SPACING.xl * 2,
  },
  button: {
    backgroundColor: theme.COLORS.ui.accent,
    shadowColor: theme.COLORS.ui.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
}); 