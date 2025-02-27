import { useCallback } from 'react';
import { useBadges } from '@/contexts/BadgeContext';
import { BadgeService } from '@/services/BadgeService';
import { CheckInStreak } from '@/contexts/CheckInStreakContext';

export const useBadgeService = () => {
  const { addUserBadge, isLoading } = useBadges();
  
  const checkStreakBadges = useCallback(async (streaks: CheckInStreak) => {
    if (isLoading) {
      console.log('Badges still loading, skipping streak badge check');
      return;
    }
    
    try {
      await BadgeService.checkStreakBadges(streaks, addUserBadge);
    } catch (error) {
      console.error('Error in checkStreakBadges:', error);
      // Don't let errors propagate to UI
    }
  }, [addUserBadge, isLoading]);
  
  const checkAllPeriodsCompleted = useCallback(async () => {
    if (isLoading) {
      console.log('Badges still loading, skipping all periods completed check');
      return;
    }
    
    try {
      await BadgeService.checkAllPeriodsCompleted(addUserBadge);
    } catch (error) {
      console.error('Error in checkAllPeriodsCompleted:', error);
      // Don't let errors propagate to UI
    }
  }, [addUserBadge, isLoading]);
  
  const awardFirstCheckInBadge = useCallback(async () => {
    if (isLoading) {
      console.log('Badges still loading, skipping first check-in badge award');
      return;
    }
    
    try {
      await BadgeService.awardFirstCheckInBadge(addUserBadge);
    } catch (error) {
      console.error('Error in awardFirstCheckInBadge:', error);
      // Don't let errors propagate to UI
    }
  }, [addUserBadge, isLoading]);
  
  const awardWelcomeBadge = useCallback(async () => {
    if (isLoading) {
      console.log('Badges still loading, skipping welcome badge award');
      return;
    }
    
    try {
      await BadgeService.awardWelcomeBadge(addUserBadge);
    } catch (error) {
      console.error('Error in awardWelcomeBadge:', error);
      // Don't let errors propagate to UI
    }
  }, [addUserBadge, isLoading]);
  
  return {
    checkStreakBadges,
    checkAllPeriodsCompleted,
    awardFirstCheckInBadge,
    awardWelcomeBadge,
    isLoading
  };
}; 