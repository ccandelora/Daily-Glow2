import { TIME_PERIODS } from '@/constants/theme';

export type TimePeriod = keyof typeof TIME_PERIODS;

export const getCurrentTimePeriod = (): TimePeriod => {
  const hour = new Date().getHours();
  
  if (hour >= TIME_PERIODS.MORNING.range.start && hour <= TIME_PERIODS.MORNING.range.end) {
    return 'MORNING';
  } else if (hour >= TIME_PERIODS.AFTERNOON.range.start && hour <= TIME_PERIODS.AFTERNOON.range.end) {
    return 'AFTERNOON';
  } else {
    return 'EVENING';
  }
};

export const getTimePeriodDetails = (period: TimePeriod) => {
  return TIME_PERIODS[period];
};

export const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

/**
 * Returns an array of Date objects for the past n days, including today
 * @param days Number of days to return
 * @returns Array of Date objects, ordered from oldest to newest (today is last)
 */
export const getPastDays = (days: number): Date[] => {
  const result: Date[] = [];
  const now = new Date();

  // Go back 'days-1' days from today and create a Date for each day
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(now.getDate() - i);
    // Reset time to midnight
    date.setHours(0, 0, 0, 0);
    result.push(date);
  }

  return result;
}; 