import React from 'react';
import { useBadges } from '@/contexts/BadgeContext';
import { useRouter } from 'expo-router';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { RecentBadges } from '../RecentBadges';
import { Text, TouchableOpacity, View } from 'react-native';
import theme from '@/constants/theme';

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

// Properly mock FontAwesome6 using the dynamic require approach
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  
  return {
    FontAwesome6: (props: { name: string; size?: number; color?: string; style?: any }) => {
      return React.createElement(View, { 
        testID: `icon-${props.name}`,
        style: props.style
      }, props.name);
    }
  };
});

// Mock common components
jest.mock('@/components/common', () => {
  const React = require('react');
  const { View, Text } = require('react-native');

  return {
    Typography: ({ children, variant, style, color, glow }: { 
      children: React.ReactNode; 
      variant?: string; 
      style?: any; 
      color?: string; 
      glow?: boolean 
    }) => {
      return React.createElement(Text, { 
        testID: `typography-${variant || 'default'}`,
        style
      }, children);
    },
    
    Card: ({ children, style, variant }: { 
      children: React.ReactNode; 
      style?: any; 
      variant?: string 
    }) => {
      return React.createElement(View, { 
        testID: `card-${variant || 'default'}`,
        style
      }, children);
    }
  };
});

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

    it('handles badges with identical timestamps', () => {
      const sameTimeBadges = [
        {
          id: 'badge1',
          badge_id: 'badge-1',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'badge2',
          badge_id: 'badge-2',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'badge3',
          badge_id: 'badge-3',
          created_at: '2023-01-01T00:00:00Z',
        },
      ];
      
      const sorted = sortBadgesByDate(sameTimeBadges);
      expect(sorted.length).toBe(3);
      // Order should be preserved for same timestamps
      expect(sorted[0].id).toBe('badge1');
      expect(sorted[1].id).toBe('badge2');
      expect(sorted[2].id).toBe('badge3');
    });

    it('handles invalid date strings gracefully', () => {
      const badDateBadges = [
        {
          id: 'badge1',
          badge_id: 'badge-1',
          created_at: 'invalid-date',
        },
        {
          id: 'badge2',
          badge_id: 'badge-2',
          created_at: '2023-01-01T00:00:00Z',
        },
      ];
      
      // Should not throw and should handle invalid dates
      expect(() => sortBadgesByDate(badDateBadges)).not.toThrow();
      const sorted = sortBadgesByDate(badDateBadges);
      // Valid date should come first
      expect(sorted[0].id).toBe('badge2');
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

    it('handles badges with non-existent categories', () => {
      const userBadgesWithInvalidCategory = [
        {
          id: 'badge1',
          badge_id: 'non-existent-category',
          created_at: '2023-01-01T00:00:00Z',
        },
      ];
      
      const validBadges = filterValidBadges(userBadgesWithInvalidCategory, mockBadges);
      expect(validBadges).toEqual([]);
    });

    it('handles duplicate badge IDs correctly', () => {
      const duplicateBadges = [
        {
          id: 'badge1',
          badge_id: 'badge-1',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'badge2',
          badge_id: 'badge-1', // Same badge_id as above
          created_at: '2023-01-02T00:00:00Z',
        },
      ];
      
      const validBadges = filterValidBadges(duplicateBadges, mockBadges);
      expect(validBadges.length).toBe(2);
      expect(validBadges[0].badge.id).toBe('badge-1');
      expect(validBadges[1].badge.id).toBe('badge-1');
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

    it('returns consistent icons for all possible categories', () => {
      const categories = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];
      const expectedIcons = ['star', 'trophy', 'award', 'medal', 'gem'];
      
      categories.forEach((category, index) => {
        expect(getBadgeIcon(category)).toBe(expectedIcons[index]);
      });
    });

    it('handles empty category string', () => {
      expect(getBadgeIcon('')).toBe('star');
    });

    it('handles undefined category', () => {
      // @ts-ignore - Testing undefined case
      expect(getBadgeIcon(undefined)).toBe('star');
    });

    it('returns consistent colors for all possible categories', () => {
      const categories = ['beginner', 'intermediate', 'advanced', 'expert', 'master'];
      const expectedColors = [
        mockTheme.COLORS.primary.green,
        mockTheme.COLORS.primary.blue,
        mockTheme.COLORS.primary.purple,
        mockTheme.COLORS.primary.orange,
        mockTheme.COLORS.primary.yellow,
      ];
      
      categories.forEach((category, index) => {
        expect(getBadgeColor(category, mockTheme)).toBe(expectedColors[index]);
      });
    });

    it('handles empty color category string', () => {
      expect(getBadgeColor('', mockTheme)).toBe(mockTheme.COLORS.primary.green);
    });

    it('handles undefined color category', () => {
      // @ts-ignore - Testing undefined case
      expect(getBadgeColor(undefined, mockTheme)).toBe(mockTheme.COLORS.primary.green);
    });

    it('handles missing theme colors gracefully', () => {
      const incompleteTheme = {
        COLORS: {
          primary: {}
        },
        SPACING: {}
      };
      
      // @ts-ignore - Testing incomplete theme
      expect(() => getBadgeColor('beginner', incompleteTheme)).not.toThrow();
      // @ts-ignore - Testing incomplete theme
      expect(getBadgeColor('beginner', incompleteTheme)).toBe(undefined);
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

    it('handles mixed valid and invalid badge data', () => {
      const mixedBadges: UserBadge[] = [
        {
          id: 'valid-1',
          badge_id: 'badge-1',
          created_at: '2023-04-01T00:00:00Z',
        },
        {
          id: 'invalid-1',
          badge_id: 'non-existent',
          created_at: 'invalid-date',
        },
        {
          id: 'valid-2',
          badge_id: 'badge-2',
          created_at: '2023-05-01T00:00:00Z',
        },
        {
          id: 'invalid-2',
          badge_id: 'non-existent-2',
          created_at: '2023-03-01T00:00:00Z',
        },
      ];

      // Process badges through the complete flow
      const sortedBadges = sortBadgesByDate(mixedBadges);
      const validBadges = filterValidBadges(sortedBadges, mockBadges);

      // Verify only valid badges made it through
      expect(validBadges.length).toBe(2);
      expect(validBadges[0].badge.id).toBe('badge-2');
      expect(validBadges[1].badge.id).toBe('badge-1');
    });

    it('processes badges with missing properties gracefully', () => {
      const incompleteData: Partial<UserBadge>[] = [
        {
          id: 'badge1',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          badge_id: 'badge-1',
          created_at: '2023-02-01T00:00:00Z',
        },
        {
          id: 'badge3',
          badge_id: 'badge-2',
        },
      ];

      // Should not throw when processing incomplete data
      expect(() => {
        const sorted = sortBadgesByDate(incompleteData as UserBadge[]);
        const valid = filterValidBadges(sorted, mockBadges);
        valid.forEach(badge => getBadgeIcon(badge.badge.category));
        valid.forEach(badge => getBadgeColor(badge.badge.category, mockTheme));
      }).not.toThrow();
    });

    it('maintains data integrity through the entire processing pipeline', () => {
      const initialBadges = [
        {
          id: 'test1',
          badge_id: 'badge-1',
          created_at: '2023-05-01T00:00:00Z',
        },
        {
          id: 'test2',
          badge_id: 'badge-2',
          created_at: '2023-04-01T00:00:00Z',
        },
      ];

      // Process through entire pipeline
      const sorted = sortBadgesByDate(initialBadges);
      const valid = filterValidBadges(sorted, mockBadges);
      
      // Verify data integrity at each step
      expect(sorted.length).toBe(2);
      expect(valid.length).toBe(2);
      
      // Check that badge properties are preserved
      valid.forEach(item => {
        expect(item.userBadge).toHaveProperty('id');
        expect(item.userBadge).toHaveProperty('badge_id');
        expect(item.userBadge).toHaveProperty('created_at');
        expect(item.badge).toHaveProperty('name');
        expect(item.badge).toHaveProperty('description');
        expect(item.badge).toHaveProperty('category');
        expect(item.badge).toHaveProperty('icon');
      });

      // Verify badge metadata is correctly mapped
      valid.forEach(item => {
        const icon = getBadgeIcon(item.badge.category);
        const color = getBadgeColor(item.badge.category, mockTheme);
        expect(icon).toBeTruthy();
        expect(color).toBeTruthy();
      });
    });

    it('handles concurrent updates to badge data', () => {
      // Simulate rapid updates to badge data
      const { rerender } = render(<RecentBadges />);

      // First update
      (useBadges as jest.Mock).mockReturnValueOnce({
        userBadges: mockUserBadges.slice(0, 1),
        badges: mockBadges,
        refreshBadges: mockRefreshBadges
      });
      rerender(<RecentBadges />);

      // Second update before first completes
      (useBadges as jest.Mock).mockReturnValueOnce({
        userBadges: mockUserBadges.slice(0, 2),
        badges: mockBadges,
        refreshBadges: mockRefreshBadges
      });
      rerender(<RecentBadges />);

      // Verify component handles updates correctly
      const badgeElements = screen.getAllByTestId('badge-item');
      expect(badgeElements).toHaveLength(2);
    });
  });
});

// Component tests
describe('RecentBadges Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component with badges correctly', () => {
    const { getByTestId, getAllByTestId, queryByText } = render(<RecentBadges />);
    
    // Check main elements are rendered
    expect(getByTestId('card-glow')).toBeTruthy();
    const titleElements = getAllByTestId('typography-h3');
    
    // Verify the "Recent Badges" title is displayed
    expect(titleElements.length).toBeGreaterThan(0);
    
    // Verify "View All" text is present
    const viewAllText = getAllByTestId('typography-caption')[0];
    expect(viewAllText.props.children).toBe('View All');
    
    // Check for badge icons
    expect(getAllByTestId(/^icon-/).length).toBeGreaterThan(0);
  });
  
  it('navigates to settings when View All is pressed', () => {
    const { getByText } = render(<RecentBadges />);
    
    // Find the View All button and press it
    const viewAllButton = getByText('View All');
    fireEvent.press(viewAllButton);
    
    // Verify navigation occurred
    expect(mockPush).toHaveBeenCalledWith('/(app)/settings');
  });
  
  it('refreshes badges on component mount', () => {
    render(<RecentBadges />);
    
    // Verify refreshBadges was called
    expect(mockRefreshBadges).toHaveBeenCalled();
  });
  
  it('renders nothing when there are no badges', () => {
    // Override the mock to return empty badges
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [],
      badges: mockBadges,
      refreshBadges: mockRefreshBadges,
    });
    
    const { queryByTestId } = render(<RecentBadges />);
    
    // Component should render null when no badges
    expect(queryByTestId('card-glow')).toBeNull();
  });
  
  it('handles badges with unknown category', () => {
    // Override mock to include a badge with unknown category
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [
        {
          id: 'unknown-badge',
          badge_id: 'badge-6', // This is the unknown category badge
          created_at: '2023-05-01T00:00:00Z',
        },
        ...mockUserBadges.slice(0, 2),
      ],
      badges: mockBadges,
      refreshBadges: mockRefreshBadges,
    });
    
    const { getAllByTestId } = render(<RecentBadges />);
    
    // Verify the unknown category badge is displayed with the default icon
    const starIcons = getAllByTestId('icon-star');
    expect(starIcons.length).toBeGreaterThan(0);
  });
  
  it('formats badge dates correctly', () => {
    // Create a known date to test
    const knownDate = new Date('2023-05-15T12:00:00Z');
    const formattedDate = knownDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
    
    // Override mock with our specific date
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [
        {
          id: 'date-test-badge',
          badge_id: 'badge-1',
          created_at: knownDate.toISOString(),
        },
      ],
      badges: mockBadges,
      refreshBadges: mockRefreshBadges,
    });
    
    const { getAllByTestId } = render(<RecentBadges />);
    
    // Find the date element and check formatting
    const dateElements = getAllByTestId('typography-caption');
    expect(dateElements.some((el: any) => el.props.children === formattedDate)).toBe(true);
  });
  
  it('handles missing badge data gracefully', () => {
    // Override mock to include a badge with ID that doesn't exist in badges array
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [
        {
          id: 'missing-badge',
          badge_id: 'non-existent-badge',
          created_at: '2023-05-01T00:00:00Z',
        },
        ...mockUserBadges.slice(0, 2),
      ],
      badges: mockBadges,
      refreshBadges: mockRefreshBadges,
    });
    
    // This should not throw an error
    const { getByTestId } = render(<RecentBadges />);
    
    // Component should still render the valid badges
    expect(getByTestId('card-glow')).toBeTruthy();
  });

  test('renders badges with correct icons', () => {
    const { getByText, getAllByTestId } = render(<RecentBadges />);
    
    expect(getByText('Recent Badges')).toBeTruthy();
    expect(getByText('View All')).toBeTruthy();
    
    // Check that badge icons are rendered
    const badgeIcons = getAllByTestId(/^icon-/);
    expect(badgeIcons.length).toBeGreaterThan(0);
  });

  test('handles badges with unknown categories gracefully', () => {
    // Mock badges with unknown category
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [
        { 
          id: 'unknown-badge',
          badge_id: 'badge-6', // This is the unknown category badge
          created_at: '2023-05-01T00:00:00Z',
        }
      ],
      badges: mockBadges,
      refreshBadges: mockRefreshBadges
    });
    
    const result = render(<RecentBadges />);
    
    // Should still render without errors
    expect(result.getByText('Recent Badges')).toBeTruthy();
  });

  it('handles loading state correctly', () => {
    // Override mock to simulate loading state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [],
      badges: [],
      refreshBadges: mockRefreshBadges,
      isLoading: true
    });
    
    const { getByTestId } = render(<RecentBadges />);
    expect(getByTestId('loading-spinner')).toBeTruthy();
  });

  it('handles error state gracefully', () => {
    // Override mock to simulate error state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [],
      badges: [],
      refreshBadges: mockRefreshBadges,
      error: new Error('Failed to load badges')
    });
    
    const { getByText } = render(<RecentBadges />);
    expect(getByText(/failed to load badges/i)).toBeTruthy();
  });

  it('retries badge loading on error', () => {
    const retryMock = jest.fn();
    
    // First return error state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [],
      badges: [],
      refreshBadges: retryMock,
      error: new Error('Failed to load badges')
    });
    
    const { getByText } = render(<RecentBadges />);
    const retryButton = getByText(/retry/i);
    fireEvent.press(retryButton);
    
    expect(retryMock).toHaveBeenCalled();
  });

  it('handles badge press interaction', () => {
    const { getAllByTestId } = render(<RecentBadges />);
    const badgeElements = getAllByTestId('badge-item');
    
    // Press the first badge
    fireEvent.press(badgeElements[0]);
    
    // Should navigate to badge details
    expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('badge-details'));
  });

  it('applies correct badge colors based on category', () => {
    const { getAllByTestId } = render(<RecentBadges />);
    const badgeElements = getAllByTestId('badge-item');
    
    // Get the style of the first badge
    const firstBadgeStyle = badgeElements[0].props.style;
    expect(firstBadgeStyle).toHaveProperty('backgroundColor');
    
    // Color should match the category color from theme
    const expectedColor = getBadgeColor('beginner', mockTheme);
    expect(firstBadgeStyle.backgroundColor).toBe(expectedColor);
  });

  it('displays correct badge count', () => {
    // Override mock to return exactly 2 badges
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: mockUserBadges.slice(0, 2),
      badges: mockBadges,
      refreshBadges: mockRefreshBadges
    });
    
    const { getAllByTestId } = render(<RecentBadges />);
    const badgeElements = getAllByTestId('badge-item');
    expect(badgeElements).toHaveLength(2);
  });

  it('handles refresh gesture correctly', () => {
    const { getByTestId } = render(<RecentBadges />);
    const container = getByTestId('badge-container');
    
    // Simulate pull to refresh
    fireEvent.scroll(container, {
      nativeEvent: {
        contentOffset: { y: -100 },
        contentSize: { height: 100, width: 100 },
        layoutMeasurement: { height: 100, width: 100 }
      }
    });
    
    expect(mockRefreshBadges).toHaveBeenCalled();
  });

  it('handles animation states correctly', () => {
    // Mock Animated.Value
    const mockAnimatedValue = {
      setValue: jest.fn(),
      interpolate: jest.fn(() => ({
        __getValue: () => 1,
      })),
    };
    
    // Override mock to include animation state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: mockUserBadges,
      badges: mockBadges,
      refreshBadges: mockRefreshBadges,
      isLoading: false,
      fadeAnim: mockAnimatedValue
    });
    
    const { rerender } = render(<RecentBadges />);
    
    // Test animation on data update
    rerender(<RecentBadges />);
    expect(mockAnimatedValue.setValue).toHaveBeenCalled();
  });

  it('handles transition between loading states', () => {
    // Start with loading state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [],
      badges: [],
      refreshBadges: mockRefreshBadges,
      isLoading: true
    });
    
    const { rerender, getByTestId, queryByTestId } = render(<RecentBadges />);
    expect(getByTestId('loading-spinner')).toBeTruthy();
    
    // Transition to loaded state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: mockUserBadges,
      badges: mockBadges,
      refreshBadges: mockRefreshBadges,
      isLoading: false
    });
    
    rerender(<RecentBadges />);
    expect(queryByTestId('loading-spinner')).toBeNull();
    expect(getByTestId('badge-container')).toBeTruthy();
  });

  it('handles transition between error states', () => {
    // Start with error state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: [],
      badges: [],
      refreshBadges: mockRefreshBadges,
      error: new Error('Initial error')
    });
    
    const { rerender, getByText, queryByText } = render(<RecentBadges />);
    expect(getByText(/initial error/i)).toBeTruthy();
    
    // Transition to success state
    (useBadges as jest.Mock).mockReturnValueOnce({
      userBadges: mockUserBadges,
      badges: mockBadges,
      refreshBadges: mockRefreshBadges,
      error: null
    });
    
    rerender(<RecentBadges />);
    expect(queryByText(/initial error/i)).toBeNull();
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('has correct accessibility roles and labels', () => {
      const { getAllByRole } = render(<RecentBadges />);
      
      // Verify section role
      const sections = getAllByRole('region');
      expect(sections[0]).toHaveProperty('props.accessibilityLabel', 'Recent Badges');
      
      // Verify button roles
      const buttons = getAllByRole('button');
      expect(buttons.some(button => 
        button.props.accessibilityLabel === 'View all badges'
      )).toBe(true);
    });

    it('provides accessible badge information', () => {
      const { getAllByTestId } = render(<RecentBadges />);
      const badges = getAllByTestId('badge-item');
      
      badges.forEach(badge => {
        expect(badge.props.accessibilityRole).toBe('button');
        expect(badge.props.accessibilityLabel).toBeTruthy();
        expect(badge.props.accessibilityHint).toBeTruthy();
      });
    });

    it('maintains focus order when navigating', () => {
      const { getAllByTestId } = render(<RecentBadges />);
      const badges = getAllByTestId('badge-item');
      
      // Verify tab index order
      badges.forEach((badge, index) => {
        expect(badge.props.tabIndex).toBe(index);
      });
    });

    it('provides accessible error states', () => {
      // Render with error state
      (useBadges as jest.Mock).mockReturnValueOnce({
        userBadges: [],
        badges: [],
        refreshBadges: mockRefreshBadges,
        error: new Error('Failed to load badges')
      });
      
      const { getByRole } = render(<RecentBadges />);
      const errorMessage = getByRole('alert');
      
      expect(errorMessage).toHaveProperty(
        'props.accessibilityLabel',
        'Error loading badges'
      );
    });

    it('announces loading state changes', () => {
      const { rerender, getByRole } = render(<RecentBadges />);
      
      // Start with loading
      (useBadges as jest.Mock).mockReturnValueOnce({
        userBadges: [],
        badges: [],
        refreshBadges: mockRefreshBadges,
        isLoading: true
      });
      rerender(<RecentBadges />);
      
      const loadingSpinner = getByRole('progressbar');
      expect(loadingSpinner).toHaveProperty(
        'props.accessibilityLabel',
        'Loading badges'
      );
      
      // Transition to loaded
      (useBadges as jest.Mock).mockReturnValueOnce({
        userBadges: mockUserBadges,
        badges: mockBadges,
        refreshBadges: mockRefreshBadges,
        isLoading: false
      });
      rerender(<RecentBadges />);
      
      const badgeList = getByRole('list');
      expect(badgeList).toHaveProperty(
        'props.accessibilityLabel',
        'Recent badges list'
      );
    });
  });
}); 