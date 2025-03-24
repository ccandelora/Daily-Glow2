import { useCallback } from 'react';
import { useAchievements } from '@/contexts/AchievementsContext';
import { useBadges, Badge } from '@/contexts/BadgeContext';
import { useBadgeService } from '@/hooks/useBadgeService';
import { CheckInStreak } from '@/contexts/CheckInStreakContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { Achievement } from '@/contexts/UserProfileContext';
import { useJournal } from '@/contexts/JournalContext';
import { BADGE_IDS } from '@/services/BadgeService';

// Extended Badge interface with earned property
interface BadgeWithStatus extends Badge {
  earned: boolean;
}

/**
 * Hook that provides methods to trigger achievements and badges based on user actions
 * 
 * @param options Optional configuration to control which features are enabled
 */
export const useAchievementTriggers = (options?: { 
  skipAchievements?: boolean,  // Set to true if AchievementsContext is not available
  skipJournal?: boolean,       // Set to true if JournalContext is not available
  skipNotifications?: boolean  // Set to true if NotificationProvider is not available
}) => {
  // Get optional achievements context - might not be available in some contexts
  let achievementsContext: ReturnType<typeof useAchievements> | null = null;
  
  try {
    // Only try to use achievements if not explicitly skipped
    if (!options?.skipAchievements) {
      achievementsContext = useAchievements();
    }
  } catch (error) {
    console.log('AchievementsContext not available, some features will be disabled');
  }
  
  // Get optional journal context
  let journalEntries: any[] = [];
  try {
    // Only try to use journal if not explicitly skipped
    if (!options?.skipJournal) {
      const journal = useJournal();
      journalEntries = journal.entries;
    }
  } catch (error) {
    console.log('JournalContext not available, journal features will be disabled');
  }
  
  const badgeService = useBadgeService();
  const { isLoading: badgesLoading, addUserBadge, badges, userBadges } = useBadges();
  
  // Try to use notifications, but gracefully handle if not available
  let notificationsContext: ReturnType<typeof useNotifications> | null = null;
  try {
    // Only try to use notifications if not explicitly skipped
    if (!options?.skipNotifications) {
      notificationsContext = useNotifications();
    }
  } catch (error) {
    console.log('NotificationsContext not available, notifications will be disabled');
  }
  
  const showAchievementNotification = notificationsContext?.showAchievementNotification || 
    (() => console.log('Achievement notification skipped - context not available'));
  const showBadgeNotification = notificationsContext?.showBadgeNotification || 
    (() => console.log('Badge notification skipped - context not available'));

  // Helper to determine if a badge is earned
  const getBadgesWithEarnedStatus = useCallback(() => {
    // Create a set of earned badge IDs for faster lookup
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));
    
    // Return a new array with earned status
    return badges.map(badge => ({
      ...badge,
      earned: earnedBadgeIds.has(badge.id)
    })) as BadgeWithStatus[];
  }, [badges, userBadges]);

  /**
   * Trigger achievements and badges for a completed check-in
   */
  const triggerCheckInCompleted = useCallback(async (
    streaks: CheckInStreak,
    isFirstCheckIn: boolean = false,
    allPeriodsCompleted: boolean = false,
    mood?: string
  ) => {
    try {
      // Check for streak achievements if achievements context is available
      if (streaks && achievementsContext) {
        // Calculate current streak for achievements
        const currentStreak = Math.max(
          streaks.morning || 0,
          streaks.afternoon || 0,
          streaks.evening || 0
        );

        // Check if we qualify for any streak-based achievements
        const newAchievements = await achievementsContext.checkForPossibleAchievements(currentStreak);
        if (newAchievements && newAchievements.length > 0) {
          // Show notification for the first achievement
          showAchievementNotification(newAchievements[0].id);
        }
      }

      // Award first check-in badge and achievement if applicable
      if (isFirstCheckIn) {
        // We'll manually handle badge notifications since the methods don't return badge IDs
        await badgeService.awardFirstCheckInBadge();
        
        // Show first check-in badge notification
        showBadgeNotification('First Check-in');
        
        // Add first check-in achievement
        if (achievementsContext) {
          try {
            await achievementsContext.addUserAchievement('firstCheckIn');
            showAchievementNotification('firstCheckIn');
          } catch (error) {
            console.error('Error adding first check-in achievement:', error);
          }
        }
      }

      // Award streak badges
      await badgeService.checkStreakBadges(streaks);
      
      // Award badge for completing all periods in a day
      if (allPeriodsCompleted) {
        await badgeService.checkAllPeriodsCompleted();
        showBadgeNotification('All Periods Completed');
      }

      // Check for mood pattern badges and journal frequency badges only if journal is available
      if (journalEntries.length > 0) {
        // Check for mood pattern badges - do this on every check-in
        // We'll only show notification for one new badge at a time to avoid overwhelming
        await triggerMoodPatternAchievements(false);
        
        // Check for journal frequency badges - do this on every check-in
        await triggerJournalFrequencyAchievements(false);
      }

    } catch (error) {
      console.error('Error triggering check-in achievements:', error);
    }
  }, [
    achievementsContext,
    badgeService,
    showAchievementNotification,
    showBadgeNotification,
    journalEntries
  ]);

  /**
   * Trigger achievements for profile completion
   */
  const triggerProfileCompleted = useCallback(async () => {
    try {
      if (badgesLoading || !achievementsContext) return;

      // Award profile completion achievement
      await achievementsContext.addUserAchievement('completeProfile');
      showAchievementNotification('completeProfile');

    } catch (error) {
      console.error('Error triggering profile completion achievement:', error);
    }
  }, [achievementsContext, badgesLoading, showAchievementNotification]);

  /**
   * Trigger welcome achievements and badges for new users
   */
  const triggerWelcome = useCallback(async () => {
    try {
      if (badgesLoading) return;

      // Award welcome badge
      await badgeService.awardWelcomeBadge();
      showBadgeNotification('Welcome Badge');

    } catch (error) {
      console.error('Error triggering welcome achievement:', error);
    }
  }, [badgeService, badgesLoading, showBadgeNotification]);

  /**
   * Trigger mood-related achievements (for emotion tracking)
   */
  const triggerMoodAchievement = useCallback(async (
    currentMood: string, 
    previousMood?: string
  ) => {
    try {
      // Track mood improvements (positive shifts)
      if (previousMood && currentMood) {
        const moodValues: Record<string, number> = {
          'terrible': 1,
          'bad': 2,
          'neutral': 3,
          'good': 4,
          'great': 5
        };

        // Check if there was a significant positive shift
        if (
          moodValues[currentMood] && 
          moodValues[previousMood] && 
          moodValues[currentMood] - moodValues[previousMood] >= 2
        ) {
          // Award positive shift badge
          try {
            const badgeName = 'Positive Shift';
            await addUserBadge(badgeName);
            showBadgeNotification(badgeName);
          } catch (error) {
            console.error('Error awarding positive shift badge:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error triggering mood achievement:', error);
    }
  }, [addUserBadge, showBadgeNotification]);
  
  /**
   * Trigger mood pattern achievements based on journal entries
   */
  const triggerMoodPatternAchievements = useCallback(async (showNotifications: boolean = true) => {
    try {
      if (badgesLoading || journalEntries.length === 0) return;
      
      // Track previously awarded badges
      const badgesBefore = getBadgesWithEarnedStatus().filter(b => b.earned);
      const badgeBeforeSet = new Set(badgesBefore.map(b => b.name));
      
      // Check for mood pattern badges
      await badgeService.checkMoodPatternBadges(journalEntries);
      
      // Show notification for new badges if requested
      if (showNotifications) {
        // Get badges after check
        const badgesAfter = getBadgesWithEarnedStatus();
        const newBadges = badgesAfter
          .filter(b => b.earned && !badgeBeforeSet.has(b.name))
          .filter(b => {
            // Check if badge is a mood pattern badge
            const moodPatternBadges = Object.values(BADGE_IDS.MOOD_PATTERNS);
            return moodPatternBadges.includes(b.name);
          });
        
        // Show notification for the first new badge
        if (newBadges.length > 0) {
          showBadgeNotification(newBadges[0].name);
        }
      }
    } catch (error) {
      console.error('Error triggering mood pattern achievements:', error);
    }
  }, [badgesLoading, journalEntries, badgeService, getBadgesWithEarnedStatus, addUserBadge, showBadgeNotification]);
  
  /**
   * Trigger journal frequency achievements based on journal entries
   */
  const triggerJournalFrequencyAchievements = useCallback(async (showNotifications: boolean = true) => {
    try {
      if (badgesLoading || journalEntries.length === 0) return;
      
      // Track previously awarded badges
      const badgesBefore = getBadgesWithEarnedStatus().filter(b => b.earned);
      const badgeBeforeSet = new Set(badgesBefore.map(b => b.name));
      
      // Check for journal frequency badges
      await badgeService.checkJournalFrequencyBadges(journalEntries);
      
      // Show notification for new badges if requested
      if (showNotifications) {
        // Get badges after check
        const badgesAfter = getBadgesWithEarnedStatus();
        const newBadges = badgesAfter
          .filter(b => b.earned && !badgeBeforeSet.has(b.name))
          .filter(b => {
            // Check if badge is a journal frequency badge
            const journalFrequencyBadges = Object.values(BADGE_IDS.JOURNAL_FREQUENCY);
            return journalFrequencyBadges.includes(b.name);
          });
        
        // Show notification for the first new badge
        if (newBadges.length > 0) {
          showBadgeNotification(newBadges[0].name);
        }
      }
    } catch (error) {
      console.error('Error triggering journal frequency achievements:', error);
    }
  }, [badgesLoading, journalEntries, badgeService, getBadgesWithEarnedStatus, addUserBadge, showBadgeNotification]);

  return {
    triggerCheckInCompleted,
    triggerProfileCompleted,
    triggerWelcome,
    triggerMoodAchievement,
    triggerMoodPatternAchievements,
    triggerJournalFrequencyAchievements
  };
}; 