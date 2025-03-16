import { getCurrentTimePeriod, getTimePeriodDetails, formatDate, isSameDay } from '../dateTime';
import { TIME_PERIODS } from '@/constants/theme';

// We need to mock the Date object for consistent testing
describe('dateTime utilities', () => {
  describe('getCurrentTimePeriod', () => {
    const mockDate = (hours: number) => {
      // Save the original Date
      const RealDate = global.Date;
      
      // Mock the Date constructor
      const mockDateImplementation = class extends RealDate {
        constructor(...args: any[]) {
          if (args.length === 0) {
            super();
            this.setHours(hours, 0, 0, 0);
          } else {
            // @ts-ignore
            super(...args);
          }
        }
      };
      
      global.Date = mockDateImplementation as DateConstructor;
      
      // Return a cleanup function
      return () => {
        global.Date = RealDate;
      };
    };

    test('should return MORNING for hours between 5 and 11', () => {
      const cleanupMorning = mockDate(8); // 8:00 AM
      expect(getCurrentTimePeriod()).toBe('MORNING');
      cleanupMorning();
      
      const cleanupMorningEdgeStart = mockDate(5); // 5:00 AM
      expect(getCurrentTimePeriod()).toBe('MORNING');
      cleanupMorningEdgeStart();
      
      const cleanupMorningEdgeEnd = mockDate(11); // 11:00 AM
      expect(getCurrentTimePeriod()).toBe('MORNING');
      cleanupMorningEdgeEnd();
    });

    test('should return AFTERNOON for hours between 12 and 16', () => {
      const cleanupAfternoon = mockDate(14); // 2:00 PM
      expect(getCurrentTimePeriod()).toBe('AFTERNOON');
      cleanupAfternoon();
      
      const cleanupAfternoonEdgeStart = mockDate(12); // 12:00 PM
      expect(getCurrentTimePeriod()).toBe('AFTERNOON');
      cleanupAfternoonEdgeStart();
      
      const cleanupAfternoonEdgeEnd = mockDate(16); // 4:00 PM
      expect(getCurrentTimePeriod()).toBe('AFTERNOON');
      cleanupAfternoonEdgeEnd();
    });

    test('should return EVENING for hours between 17 and 4', () => {
      const cleanupEvening = mockDate(20); // 8:00 PM
      expect(getCurrentTimePeriod()).toBe('EVENING');
      cleanupEvening();
      
      const cleanupMidnight = mockDate(0); // 12:00 AM
      expect(getCurrentTimePeriod()).toBe('EVENING');
      cleanupMidnight();
      
      const cleanupEveningEdgeStart = mockDate(17); // 5:00 PM
      expect(getCurrentTimePeriod()).toBe('EVENING');
      cleanupEveningEdgeStart();
      
      const cleanupEveningEdgeEnd = mockDate(4); // 4:00 AM
      expect(getCurrentTimePeriod()).toBe('EVENING');
      cleanupEveningEdgeEnd();
    });
  });

  describe('getTimePeriodDetails', () => {
    test('should return correct details for MORNING', () => {
      const details = getTimePeriodDetails('MORNING');
      expect(details).toEqual(TIME_PERIODS.MORNING);
    });

    test('should return correct details for AFTERNOON', () => {
      const details = getTimePeriodDetails('AFTERNOON');
      expect(details).toEqual(TIME_PERIODS.AFTERNOON);
    });

    test('should return correct details for EVENING', () => {
      const details = getTimePeriodDetails('EVENING');
      expect(details).toEqual(TIME_PERIODS.EVENING);
    });
  });

  describe('formatDate', () => {
    test('should format date correctly', () => {
      // Use a fixed date for consistent testing across environments
      const date = new Date(2025, 2, 13); // March 13, 2025
      
      // This will depend on the locale of the test environment
      // We'll just check that it contains the correct year, month, and day
      const formattedDate = formatDate(date);
      expect(formattedDate).toContain('2025');
      expect(formattedDate).toContain('March');
      expect(formattedDate).toContain('13');
    });
  });

  describe('isSameDay', () => {
    test('should return true for dates on the same day', () => {
      const date1 = new Date(2025, 2, 13, 9, 0); // March 13, 2025, 9:00 AM
      const date2 = new Date(2025, 2, 13, 18, 30); // March 13, 2025, 6:30 PM
      expect(isSameDay(date1, date2)).toBe(true);
    });

    test('should return false for dates on different days', () => {
      const date1 = new Date(2025, 2, 13); // March 13, 2025
      const date2 = new Date(2025, 2, 14); // March 14, 2025
      expect(isSameDay(date1, date2)).toBe(false);
    });

    test('should return false for dates in different months', () => {
      const date1 = new Date(2025, 2, 13); // March 13, 2025
      const date2 = new Date(2025, 3, 13); // April 13, 2025
      expect(isSameDay(date1, date2)).toBe(false);
    });

    test('should return false for dates in different years', () => {
      const date1 = new Date(2025, 2, 13); // March 13, 2025
      const date2 = new Date(2026, 2, 13); // March 13, 2026
      expect(isSameDay(date1, date2)).toBe(false);
    });
  });
}); 