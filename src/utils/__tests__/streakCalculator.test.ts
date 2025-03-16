import { calculateDateStreak, calculateOverallStreak } from '../streakCalculator';
import type { CheckInStreak } from '@/contexts/CheckInStreakContext';

describe('streakCalculator', () => {
  describe('calculateDateStreak', () => {
    test('returns 0 for empty array', () => {
      expect(calculateDateStreak([])).toBe(0);
    });

    test('returns 1 for a single date', () => {
      const dates = [new Date()];
      expect(calculateDateStreak(dates)).toBe(1);
    });

    test('returns correct streak for consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      const dates = [today, yesterday, twoDaysAgo];
      expect(calculateDateStreak(dates)).toBe(3);
    });

    test('breaks streak on non-consecutive days', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3); // Note the gap
      
      const dates = [today, yesterday, threeDaysAgo];
      expect(calculateDateStreak(dates)).toBe(2);
    });

    test('works with unordered dates', () => {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      
      // Unordered
      const dates = [yesterday, today, twoDaysAgo];
      expect(calculateDateStreak(dates)).toBe(3);
    });
  });

  describe('calculateOverallStreak', () => {
    test('returns 0 for null or undefined streaks', () => {
      expect(calculateOverallStreak(null)).toBe(0);
      expect(calculateOverallStreak(undefined)).toBe(0);
    });

    test('returns the maximum streak value when only one period has a streak', () => {
      const streaks: CheckInStreak = {
        morning: 3,
        afternoon: 0,
        evening: 0,
        lastMorningCheckIn: new Date().toISOString(),
        lastAfternoonCheckIn: null,
        lastEveningCheckIn: null
      };
      
      expect(calculateOverallStreak(streaks)).toBe(3);
    });

    test('uses afternoon streak when multiple periods have streaks', () => {
      const streaks: CheckInStreak = {
        morning: 1,
        afternoon: 5,
        evening: 2,
        lastMorningCheckIn: new Date().toISOString(),
        lastAfternoonCheckIn: new Date().toISOString(),
        lastEveningCheckIn: new Date().toISOString()
      };
      
      expect(calculateOverallStreak(streaks)).toBe(5);
    });

    test('returns 0 when no check-in dates are available', () => {
      const streaks: CheckInStreak = {
        morning: 1,
        afternoon: 2,
        evening: 3,
        lastMorningCheckIn: null,
        lastAfternoonCheckIn: null,
        lastEveningCheckIn: null
      };
      
      expect(calculateOverallStreak(streaks)).toBe(0);
    });
  });
}); 