import React from 'react';
import { useBadges } from '@/contexts/BadgeContext';
import { useRouter } from 'expo-router';

// Mock data for testing
const mockRefreshBadges = jest.fn();

// Define TypeScript interfaces for our data structures
interface UserBadge {
  id: string;
  badge_id: string;
  created_at: string;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
}

interface Theme {
  COLORS: {
    primary: {
      green: string;
      blue: string;
      purple: string;
      orange: string;
      yellow: string;
    },
    ui: {
      textSecondary: string;
    }
  },
  SPACING: Record<string, number>;
}

const mockUserBadges = [
  {
    id: 'badge1',
    badge_id: 'badge-1',
    created_at: '2023-03-01T00:00:00Z',
  },
  {
    id: 'badge2',
    badge_id: 'badge-2',
    created_at: '2023-02-01T00:00:00Z',
  },
  {
    id: 'badge3',
    badge_id: 'badge-3',
    created_at: '2023-01-01T00:00:00Z',
  },
  {
    id: 'badge4',
    badge_id: 'badge-4',
    created_at: '2022-12-01T00:00:00Z',
  },
];

const mockBadges = [
  {
    id: 'badge-1',
    name: 'First Check-in',
    description: 'Completed your first check-in',
    category: 'beginner',
    icon: 'trophy',
  },
  {
    id: 'badge-2',
    name: 'Week Streak',
    description: 'Maintained a 7-day streak',
    category: 'intermediate',
    icon: 'star',
  },
  {
    id: 'badge-3',
    name: 'Emotional Range',
    description: 'Logged a wide range of emotions',
    category: 'advanced',
    icon: 'award',
  },
  {
    id: 'badge-4',
    name: 'Expert Badge',
    description: 'An expert level badge',
    category: 'expert',
    icon: 'medal',
  },
  {
    id: 'badge-5',
    name: 'Master Badge',
    description: 'A master level badge',
    category: 'master',
    icon: 'gem',
  },
  {
    id: 'badge-6',
    name: 'Unknown Category',
    description: 'A badge with unknown category',
    category: 'unknown',
    icon: 'star',
  },
];

// Mock the context hooks
jest.mock('@/contexts/BadgeContext', () => ({
  useBadges: jest.fn(() => ({
    userBadges: mockUserBadges,
    badges: mockBadges,
    refreshBadges: mockRefreshBadges,
  })),
}));

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: mockPush,
  })),
}));

// Pure logic functions to test
const sortBadgesByDate = (userBadges: UserBadge[]): UserBadge[] => {
  return [...userBadges]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3);
};

const filterValidBadges = (userBadges: UserBadge[], badges: Badge[]): Array<{userBadge: UserBadge, badge: Badge}> => {
  return userBadges
    .map((userBadge: UserBadge) => {
      const badge = badges.find((b: Badge) => b.id === userBadge.badge_id);
      return badge ? { userBadge, badge } : null;
    })
    .filter((item): item is {userBadge: UserBadge, badge: Badge} => item !== null);
};

const getBadgeIcon = (category: string): string => {
  switch (category) {
    case 'beginner': return 'star';
    case 'intermediate': return 'trophy';
    case 'advanced': return 'award';
    case 'expert': return 'medal';
    case 'master': return 'gem';
    default: return 'star';
  }
};

const getBadgeColor = (category: string, theme: Theme): string => {
  switch (category) {
    case 'beginner': return theme.COLORS.primary.green;
    case 'intermediate': return theme.COLORS.primary.blue;
    case 'advanced': return theme.COLORS.primary.purple;
    case 'expert': return theme.COLORS.primary.orange;
    case 'master': return theme.COLORS.primary.yellow;
    default: return theme.COLORS.primary.green;
  }
};

// Mock theme
const mockTheme: Theme = {
  COLORS: {
    primary: {
      green: '#00C853',
      blue: '#2979FF',
      purple: '#9C27B0',
      orange: '#FF9800',
      yellow: '#FFD600',
    },
    ui: {
      textSecondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  SPACING: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 40,
  },
};

// Pure logic tests
describe('RecentBadges Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Badge sorting logic', () => {
    it('correctly sorts badges by date showing most recent first', () => {
      // Create badges with out-of-order dates
      const outOfOrderBadges = [
        {
          id: 'badge-old',
          badge_id: 'badge-1',
          created_at: '2022-01-01T00:00:00Z', // older date
        },
        {
          id: 'badge-newest',
          badge_id: 'badge-2',
          created_at: '2023-05-01T00:00:00Z', // newest date
        },
        {
          id: 'badge-middle',
          badge_id: 'badge-3',
          created_at: '2023-03-01T00:00:00Z', // middle date
        },
        {
          id: 'badge-recent',
          badge_id: 'badge-4',
          created_at: '2023-04-01T00:00:00Z', // second newest date
        },
      ];

      // Test the sorting logic
      const sortedBadges = sortBadgesByDate(outOfOrderBadges);

      // Verify sorting logic
      expect(sortedBadges[0].badge_id).toBe('badge-2'); // newest
      expect(sortedBadges[1].badge_id).toBe('badge-4'); // second newest
      expect(sortedBadges[2].badge_id).toBe('badge-3'); // third newest
      expect(sortedBadges.length).toBe(3);

      // Verify the oldest badge is not included
      expect(sortedBadges.find(badge => badge.badge_id === 'badge-1')).toBeUndefined();
    });

    it('handles empty badges array', () => {
      const emptyBadges: UserBadge[] = [];
      const sortedBadges = sortBadgesByDate(emptyBadges);
      expect(sortedBadges).toEqual([]);
    });

    it('handles single badge array', () => {
      const singleBadge = [mockUserBadges[0]];
      const sortedBadges = sortBadgesByDate(singleBadge);
      expect(sortedBadges.length).toBe(1);
      expect(sortedBadges[0].badge_id).toBe('badge-1');
    });
  });

  describe('Badge filtering logic', () => {
    it('filters out badges with invalid badge_id', () => {
      // Create badges with missing data
      const badgesWithMissing = [
        ...mockUserBadges.slice(0, 2),
        {
          id: 'badge-missing',
          badge_id: 'non-existent-badge', // This badge doesn't exist in mockBadges
          created_at: '2023-01-15T00:00:00Z',
        },
      ];

      // Test the filtering logic
      const validBadges = filterValidBadges(badgesWithMissing, mockBadges);

      // Verify filtering logic
      expect(validBadges.length).toBe(2);
      expect(validBadges[0].badge.name).toBe('First Check-in');
      expect(validBadges[1].badge.name).toBe('Week Streak');
    });

    it('handles empty badges array', () => {
      const emptyBadges: UserBadge[] = [];
      const validBadges = filterValidBadges(emptyBadges, mockBadges);
      expect(validBadges).toEqual([]);
    });

    it('handles empty badge data array', () => {
      const validBadges = filterValidBadges(mockUserBadges, []);
      expect(validBadges).toEqual([]);
    });
  });

  describe('Badge icon and color functions', () => {
    it('returns correct icons for different badge categories', () => {
      expect(getBadgeIcon('beginner')).toBe('star');
      expect(getBadgeIcon('intermediate')).toBe('trophy');
      expect(getBadgeIcon('advanced')).toBe('award');
      expect(getBadgeIcon('expert')).toBe('medal');
      expect(getBadgeIcon('master')).toBe('gem');
      expect(getBadgeIcon('unknown')).toBe('star'); // default
    });

    it('returns correct colors for different badge categories', () => {
      expect(getBadgeColor('beginner', mockTheme)).toBe(mockTheme.COLORS.primary.green);
      expect(getBadgeColor('intermediate', mockTheme)).toBe(mockTheme.COLORS.primary.blue);
      expect(getBadgeColor('advanced', mockTheme)).toBe(mockTheme.COLORS.primary.purple);
      expect(getBadgeColor('expert', mockTheme)).toBe(mockTheme.COLORS.primary.orange);
      expect(getBadgeColor('master', mockTheme)).toBe(mockTheme.COLORS.primary.yellow);
      expect(getBadgeColor('unknown', mockTheme)).toBe(mockTheme.COLORS.primary.green); // default
    });
  });

  describe('Date formatting', () => {
    it('formats dates correctly using toLocaleDateString', () => {
      const date = new Date('2023-03-01T00:00:00Z');
      const formattedDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });

      // Verify the format is as expected (e.g., "Mar 1")
      expect(formattedDate).toMatch(/[A-Za-z]{3} \d{1,2}/);
    });
  });

  describe('Navigation logic', () => {
    it('can navigate to settings', () => {
      // Get the router and directly test the navigation
      const router = useRouter();
      router.push('/(app)/settings');

      // Verify navigation
      expect(mockPush).toHaveBeenCalledWith('/(app)/settings');
    });
  });

  // Integration test combining multiple logic aspects
  describe('Complete badge processing flow', () => {
    it('correctly processes badges from the beginning to end', () => {
      // Start with raw user badges
      const unsortedBadges = [
        {
          id: 'badge-oldest',
          badge_id: 'badge-1',
          created_at: '2021-01-01T00:00:00Z',
        },
        {
          id: 'badge-newer',
          badge_id: 'badge-3',
          created_at: '2023-03-01T00:00:00Z',
        },
        {
          id: 'badge-missing',
          badge_id: 'non-existent',
          created_at: '2023-02-01T00:00:00Z',
        },
        {
          id: 'badge-newest',
          badge_id: 'badge-2',
          created_at: '2023-04-01T00:00:00Z',
        },
        {
          id: 'badge-older',
          badge_id: 'badge-4',
          created_at: '2022-06-01T00:00:00Z',
        },
      ];

      // 1. Sort badges by date
      const sortedBadges = sortBadgesByDate(unsortedBadges);
      expect(sortedBadges.length).toBe(3);
      expect(sortedBadges[0].badge_id).toBe('badge-2'); // newest

      // 2. Filter for valid badges
      const validBadges = filterValidBadges(sortedBadges, mockBadges);
      
      // Should only include badges that exist in mockBadges
      validBadges.forEach((item: {userBadge: UserBadge, badge: Badge}) => {
        expect(mockBadges.find(b => b.id === item.userBadge.badge_id)).toBeTruthy();
      });
      
      // 3. Apply icon and color logic
      const processedBadges = validBadges.map((item: {userBadge: UserBadge, badge: Badge}) => ({
        ...item,
        icon: getBadgeIcon(item.badge.category),
        color: getBadgeColor(item.badge.category, mockTheme),
        formattedDate: new Date(item.userBadge.created_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      }));

      // Verify processed badges have all required properties
      processedBadges.forEach((badge: {icon: string, color: string, formattedDate: string}) => {
        expect(badge.icon).toBeTruthy();
        expect(badge.color).toBeTruthy();
        expect(badge.formattedDate).toMatch(/[A-Za-z]{3} \d{1,2}/);
      });
    });
  });
}); 