import { generateInsights } from '../ai';
import { JournalEntry } from '@/types';

describe('AI Utilities', () => {
  describe('generateInsights', () => {
    it('should return an array of insights', async () => {
      // Arrange
      const mockEntries: JournalEntry[] = [
        {
          id: '1',
          date: new Date(),
          initial_emotion: 'happy',
          emotional_shift: 1,
          time_period: 'MORNING',
          notes: 'I had a great day today!',
        }
      ];

      // Act
      const insights = await generateInsights(mockEntries);

      // Assert
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
      insights.forEach(insight => {
        expect(typeof insight).toBe('string');
        expect(insight.length).toBeGreaterThan(0);
      });
    });

    it('should return insights even when no entries are provided', async () => {
      // Arrange
      const mockEntries: JournalEntry[] = [];

      // Act
      const insights = await generateInsights(mockEntries);

      // Assert
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should work with many entries', async () => {
      // Arrange
      const emotions = ['happy', 'sad', 'anxious', 'content', 'excited'];
      const timePeriods: Array<'MORNING' | 'AFTERNOON' | 'EVENING'> = ['MORNING', 'AFTERNOON', 'EVENING'];
      
      const mockEntries: JournalEntry[] = Array(10).fill(null).map((_, index) => ({
        id: `${index}`,
        date: new Date(Date.now() - index * 86400000), // 1 day apart
        initial_emotion: emotions[index % emotions.length],
        emotional_shift: (index % 5) - 2, // Range from -2 to 2
        time_period: timePeriods[index % timePeriods.length],
        notes: `Entry number ${index}`,
      }));

      // Act
      const insights = await generateInsights(mockEntries);

      // Assert
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should handle entries with minimal data', async () => {
      // Arrange
      const mockEntries: JournalEntry[] = [
        {
          id: '1',
          date: new Date(),
          initial_emotion: 'neutral',
          emotional_shift: 0,
          time_period: 'EVENING',
          // notes is optional, so we're not including it
        }
      ];

      // Act
      const insights = await generateInsights(mockEntries);

      // Assert
      expect(insights).toBeDefined();
      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });

    it('should gracefully handle errors and still return insights', async () => {
      // Arrange
      const mockEntries = null as unknown as JournalEntry[]; // Force an error scenario

      // Act & Assert
      await expect(generateInsights(mockEntries)).resolves.toBeDefined();
      // This test expects generateInsights to handle the error internally and still return results
      // If the implementation doesn't handle this case, you might need to modify either the test or the implementation
    });
  });
}); 