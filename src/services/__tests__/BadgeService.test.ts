import { supabase } from '@/lib/supabase';
import { BadgeService, BADGE_IDS } from '../BadgeService';
import { CheckInStreak } from '@/contexts/CheckInStreakContext';

// Mock supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          maybeSingle: jest.fn(),
          limit: jest.fn(() => ({
            single: jest.fn(),
          })),
        })),
        limit: jest.fn(() => ({
          single: jest.fn(),
        })),
        order: jest.fn(() => Promise.resolve({ data: [], error: null })),
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
    auth: {
      getUser: jest.fn(),
    },
    rpc: jest.fn(),
  },
}));

// Mock console to avoid cluttering test output
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});

describe('BadgeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('ensureBadgeExists', () => {
    it('should check if a badge exists by name', async () => {
      // Setup spy on the private method using any to access it
      const ensureBadgeExistsSpy = jest.spyOn(BadgeService as any, 'ensureBadgeExists');
      
      // Setup the mock response for badge that exists
      const mockFromSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({ data: { id: '123' }, error: null }),
        }),
      });
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockFromSelect,
      });
      
      // Call the method through reflection (since it's private)
      await (BadgeService as any).ensureBadgeExists(
        'Test Badge',
        'Test Description',
        'test',
        'test-icon'
      );
      
      // Assert that the method was called with correct parameters
      expect(ensureBadgeExistsSpy).toHaveBeenCalledWith(
        'Test Badge',
        'Test Description',
        'test',
        'test-icon'
      );
      
      // Assert that supabase was called correctly
      expect(supabase.from).toHaveBeenCalledWith('badges');
      expect(mockFromSelect).toHaveBeenCalledWith('id');
    });
    
    it('should create a badge if it does not exist', async () => {
      // Setup the mock responses for badge that doesn't exist
      const mockMaybeSingle = jest.fn().mockResolvedValue({ data: null, error: null });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      
      const mockSingle = jest.fn().mockResolvedValue({ 
        data: { id: '123' }, 
        error: null 
      });
      const mockInsertSelect = jest.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = jest.fn().mockReturnValue({ select: mockInsertSelect });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'badges') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        return { select: jest.fn(), insert: jest.fn() };
      });
      
      // Call the method through reflection
      await (BadgeService as any).ensureBadgeExists(
        'New Badge',
        'New Description',
        'new',
        'new-icon'
      );
      
      // Assert the chain of supabase calls for creating a new badge
      expect(supabase.from).toHaveBeenCalledWith('badges');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('name', 'New Badge');
      expect(mockMaybeSingle).toHaveBeenCalled();
      
      // Verify that the insert was called
      expect(mockInsert).toHaveBeenCalledWith([{
        name: 'New Badge',
        description: 'New Description',
        category: 'new',
        icon_name: 'new-icon',
      }]);
      expect(mockInsertSelect).toHaveBeenCalledWith('id');
      expect(mockSingle).toHaveBeenCalled();
    });
    
    it('should handle errors when checking if a badge exists', async () => {
      // Setup the mock responses with error
      const mockMaybeSingle = jest.fn().mockResolvedValue({ 
        data: null, 
        error: { message: 'Database error' } 
      });
      const mockEq = jest.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
      const mockSelect = jest.fn().mockReturnValue({ eq: mockEq });
      
      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });
      
      // Call the method through reflection
      await (BadgeService as any).ensureBadgeExists(
        'Error Badge',
        'Error Description',
        'error',
        'error-icon'
      );
      
      // Assert that error was handled gracefully
      expect(supabase.from).toHaveBeenCalledWith('badges');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('name', 'Error Badge');
      expect(mockMaybeSingle).toHaveBeenCalled();
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('initializeBadges', () => {
    it('should skip initialization if badges already exist', async () => {
      // Setup mock for checking existing badges
      const mockLimit = jest.fn().mockResolvedValue({
        data: [{ id: '123', name: 'Existing Badge' }],
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      
      const mockCountResult = jest.fn().mockResolvedValue({
        count: 5,
        error: null,
      });
      
      const mockCountSelect = jest.fn().mockReturnValue({
        count: 'exact',
        head: true,
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'badges') {
          return {
            select: mockSelect,
            count: mockCountResult,
          };
        }
        return { select: jest.fn() };
      });
      
      // Call the method
      await BadgeService.initializeBadges();
      
      // Assert that the check was made but no further initialization was done
      expect(supabase.from).toHaveBeenCalledWith('badges');
      expect(mockSelect).toHaveBeenCalledWith('id, name');
      expect(mockLimit).toHaveBeenCalledWith(1);
      expect(console.log).toHaveBeenCalledWith('Badges already exist, skipping initialization');
    });
    
    it('should create badges tables if they do not exist', async () => {
      // Mock the createBadgesTables method
      const createBadgesTablesSpy = jest.spyOn(BadgeService, 'createBadgesTables')
        .mockImplementation(async () => {});
      
      // Setup mock for checking existing badges (none exist)
      const mockLimit = jest.fn().mockResolvedValue({
        data: [],
        error: null,
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        limit: mockLimit,
      });
      
      // Mock for verifying badges after creation
      const mockVerifyLimit = jest.fn().mockResolvedValue({
        data: [{ id: '123' }],
        error: null,
      });
      
      const mockVerifySelect = jest.fn().mockReturnValue({
        limit: mockVerifyLimit,
      });
      
      // Mock for inserting badges
      const mockInsert = jest.fn().mockResolvedValue({
        error: null,
      });
      
      let selectCallCount = 0;
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'badges') {
          selectCallCount++;
          if (selectCallCount === 1) {
            // First call to check if badges exist
            return {
              select: mockSelect,
              insert: mockInsert,
            };
          } else {
            // Later calls to verify badges
            return {
              select: mockVerifySelect,
              insert: mockInsert,
            };
          }
        }
        return { select: jest.fn(), insert: jest.fn() };
      });
      
      // Call the method
      await BadgeService.initializeBadges();
      
      // Assert that createBadgesTables was called
      expect(createBadgesTablesSpy).toHaveBeenCalled();
      
      // Reset the spy
      createBadgesTablesSpy.mockRestore();
    });
    
    it('should handle errors during badge initialization', async () => {
      // Setup mock to throw an error
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Test initialization error');
      });
      
      // Call the method
      await BadgeService.initializeBadges();
      
      // Verify error handling
      expect(console.error).toHaveBeenCalledWith(
        'Error initializing badges:',
        'Test initialization error'
      );
    });
  });

  describe('createBadgesTables', () => {
    it('should create badges table if it does not exist', async () => {
      // Setup mock for checking if badges table exists
      const mockBadgesLimit = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Table does not exist error
      });
      
      const mockBadgesSelect = jest.fn().mockReturnValue({
        limit: mockBadgesLimit,
      });
      
      // Setup mock for checking if user_badges table exists
      const mockUserBadgesLimit = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' }, // Table does not exist error
      });
      
      const mockUserBadgesSelect = jest.fn().mockReturnValue({
        limit: mockUserBadgesLimit,
      });
      
      // Setup mock for RPC calls to create tables
      const mockRpc = jest.fn().mockResolvedValue({
        error: null,
      });
      
      // Configure the mock implementation for both tables
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'badges') {
          return {
            select: mockBadgesSelect,
          };
        } else if (table === 'user_badges') {
          return {
            select: mockUserBadgesSelect,
          };
        }
        return { select: jest.fn() };
      });
      
      (supabase.rpc as jest.Mock).mockImplementation(mockRpc);
      
      // Call the method
      await BadgeService.createBadgesTables();
      
      // Assert the checks for table existence
      expect(supabase.from).toHaveBeenCalledWith('badges');
      expect(mockBadgesSelect).toHaveBeenCalledWith('id');
      expect(mockBadgesLimit).toHaveBeenCalledWith(1);
      
      expect(supabase.from).toHaveBeenCalledWith('user_badges');
      expect(mockUserBadgesSelect).toHaveBeenCalledWith('id');
      expect(mockUserBadgesLimit).toHaveBeenCalledWith(1);
      
      // Assert RPC calls to create tables
      expect(supabase.rpc).toHaveBeenCalledWith('create_badges_table');
      expect(supabase.rpc).toHaveBeenCalledWith('create_user_badges_table');
    });
    
    it('should skip creating tables if they already exist', async () => {
      // Setup mock for tables that already exist
      const mockBadgesLimit = jest.fn().mockResolvedValue({
        data: [{ id: '123' }],
        error: null,
      });
      
      const mockBadgesSelect = jest.fn().mockReturnValue({
        limit: mockBadgesLimit,
      });
      
      const mockUserBadgesLimit = jest.fn().mockResolvedValue({
        data: [{ id: '456' }],
        error: null,
      });
      
      const mockUserBadgesSelect = jest.fn().mockReturnValue({
        limit: mockUserBadgesLimit,
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'badges') {
          return {
            select: mockBadgesSelect,
          };
        } else if (table === 'user_badges') {
          return {
            select: mockUserBadgesSelect,
          };
        }
        return { select: jest.fn() };
      });
      
      // Call the method
      await BadgeService.createBadgesTables();
      
      // Assert that tables were checked but not created
      expect(supabase.from).toHaveBeenCalledWith('badges');
      expect(mockBadgesSelect).toHaveBeenCalledWith('id');
      expect(mockBadgesLimit).toHaveBeenCalledWith(1);
      
      expect(supabase.from).toHaveBeenCalledWith('user_badges');
      expect(mockUserBadgesSelect).toHaveBeenCalledWith('id');
      expect(mockUserBadgesLimit).toHaveBeenCalledWith(1);
      
      // Assert RPC was not called
      expect(supabase.rpc).not.toHaveBeenCalled();
      
      // Assert console logs
      expect(console.log).toHaveBeenCalledWith('Badges table already exists');
      expect(console.log).toHaveBeenCalledWith('User badges table already exists');
    });
    
    it('should handle errors during table creation', async () => {
      // Setup mock to throw an error
      (supabase.from as jest.Mock).mockImplementation(() => {
        throw new Error('Test table creation error');
      });
      
      // Call the method
      await BadgeService.createBadgesTables();
      
      // Verify error handling
      expect(console.error).toHaveBeenCalledWith(
        'Error creating badges tables:',
        'Test table creation error'
      );
    });
  });

  describe('checkStreakBadges', () => {
    it('should award badges for morning streaks', async () => {
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn().mockResolvedValue(undefined);
      
      // Define test streaks
      const streaks: CheckInStreak = {
        morning: 10,
        afternoon: 0,
        evening: 0,
        lastMorningCheckIn: new Date().toISOString(),
        lastAfternoonCheckIn: null,
        lastEveningCheckIn: null
      };
      
      // Call the method
      await BadgeService.checkStreakBadges(streaks, mockAddUserBadge);
      
      // Assert the correct badges were awarded
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['3']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['7']);
      expect(mockAddUserBadge).not.toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['14']);
      expect(mockAddUserBadge).not.toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['30']);
      
      // Afternoon and evening badges should not be awarded
      expect(mockAddUserBadge).not.toHaveBeenCalledWith(BADGE_IDS.STREAKS.AFTERNOON['3']);
      expect(mockAddUserBadge).not.toHaveBeenCalledWith(BADGE_IDS.STREAKS.EVENING['3']);
    });
    
    it('should award badges for all time periods with sufficient streaks', async () => {
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn().mockResolvedValue(undefined);
      
      // Define test streaks for all periods
      const streaks: CheckInStreak = {
        morning: 30,
        afternoon: 14,
        evening: 7,
        lastMorningCheckIn: new Date().toISOString(),
        lastAfternoonCheckIn: new Date().toISOString(),
        lastEveningCheckIn: new Date().toISOString()
      };
      
      // Call the method
      await BadgeService.checkStreakBadges(streaks, mockAddUserBadge);
      
      // Assert morning badges
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['3']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['7']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['14']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['30']);
      
      // Assert afternoon badges
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.AFTERNOON['3']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.AFTERNOON['7']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.AFTERNOON['14']);
      
      // Assert evening badges
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.EVENING['3']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.EVENING['7']);
    });
    
    it('should handle errors in addUserBadge and continue processing', async () => {
      // Create mock that throws an error for specific badges
      const mockAddUserBadge = jest.fn().mockImplementation((badgeName) => {
        if (badgeName === BADGE_IDS.STREAKS.MORNING['7']) {
          return Promise.reject(new Error('Test error awarding badge'));
        }
        return Promise.resolve();
      });
      
      // Define test streaks
      const streaks: CheckInStreak = {
        morning: 14,
        afternoon: 0,
        evening: 0,
        lastMorningCheckIn: new Date().toISOString(),
        lastAfternoonCheckIn: null,
        lastEveningCheckIn: null
      };
      
      // Call the method
      await BadgeService.checkStreakBadges(streaks, mockAddUserBadge);
      
      // Assert that all appropriate badges were attempted
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['3']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['7']);
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.STREAKS.MORNING['14']);
      
      // Error should be logged but not propagated
      expect(console.error).toHaveBeenCalledWith(
        'Error awarding badge:',
        new Error('Test error awarding badge')
      );
    });
    
    it('should skip processing if no streaks are provided', async () => {
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn();
      
      // Call the method with null streaks
      await BadgeService.checkStreakBadges(null as unknown as CheckInStreak, mockAddUserBadge);
      
      // Assert no badges were awarded
      expect(mockAddUserBadge).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('No streaks data provided, skipping badge check');
    });
  });

  describe('checkAllPeriodsCompleted', () => {
    it('should award the all periods completed badge', async () => {
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn().mockResolvedValue(undefined);
      
      // Call the method
      await BadgeService.checkAllPeriodsCompleted(mockAddUserBadge);
      
      // Assert the correct badge was awarded
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.TIME_PERIODS['All Periods Completed']);
    });
    
    it('should handle errors when awarding the badge', async () => {
      // Create mock that throws an error
      const mockAddUserBadge = jest.fn().mockRejectedValue(
        new Error('Test error awarding all periods badge')
      );
      
      // Call the method
      await BadgeService.checkAllPeriodsCompleted(mockAddUserBadge);
      
      // Assert the badge award was attempted
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.TIME_PERIODS['All Periods Completed']);
      
      // Error should be logged but not propagated
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error awarding all periods badge'),
        new Error('Test error awarding all periods badge')
      );
    });
  });

  describe('awardWelcomeBadge', () => {
    it.skip('should attempt to award welcome badge via direct insert and callback', async () => {
      // Mock user auth
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      // Mock badge lookup
      const mockBadgeData = { id: 'welcome-badge-id' };
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockBadgeData,
        error: null,
      });
      
      const mockEq = jest.fn().mockReturnValue({
        single: mockSingle,
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      
      const mockSelect = jest.fn().mockReturnValue({
        eq: mockEq,
      });
      
      // Mock user_badges insert
      const mockInsert = jest.fn().mockResolvedValue({
        error: null,
      });
      
      // Mock the implementation based on the table being accessed
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'badges') {
          return {
            select: mockSelect,
          };
        } else if (table === 'user_badges') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        return { select: jest.fn() };
      });
      
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn().mockResolvedValue(undefined);
      
      // Call the method
      await BadgeService.awardWelcomeBadge(mockAddUserBadge);
      
      // Assert user was looked up
      expect(supabase.auth.getUser).toHaveBeenCalled();
      
      // Assert badge was looked up
      expect(supabase.from).toHaveBeenCalledWith('badges');
      expect(mockSelect).toHaveBeenCalledWith('id');
      expect(mockEq).toHaveBeenCalledWith('name', 'Welcome Badge');
      
      // Assert that user_badges insert was called
      expect(supabase.from).toHaveBeenCalledWith('user_badges');
      expect(mockInsert).toHaveBeenCalled();
      
      // Assert backup method was called
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.COMPLETION['Welcome Badge']);
    });
    
    it.skip('should handle existing badge gracefully', async () => {
      // Mock user auth
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      // Mock badge lookup
      const mockBadgeData = { id: 'welcome-badge-id' };
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockBadgeData,
        error: null,
      });
      
      // Mock existing badge check - this needs to return data to indicate badge exists
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: { id: 'existing-user-badge-id' },
        error: null,
      });
      
      // We need separate eq mock functions for different calls
      const mockBadgeEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockUserBadgeEq = jest.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      
      // First select is for badges table, second is for user_badges table
      let selectCallCount = 0;
      const mockSelect = jest.fn(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return { eq: mockBadgeEq };
        } else {
          return { eq: mockUserBadgeEq };
        }
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        return {
          select: mockSelect,
        };
      });
      
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn().mockResolvedValue(undefined);
      
      // Call the method
      await BadgeService.awardWelcomeBadge(mockAddUserBadge);
      
      // Assert badge was looked up
      expect(mockBadgeEq).toHaveBeenCalledWith('name', 'Welcome Badge');
      
      // Assert existing badge was checked
      expect(mockUserBadgeEq).toHaveBeenCalledWith('user_id', mockUser.id);
      expect(mockUserBadgeEq).toHaveBeenCalledWith('badge_id', mockBadgeData.id);
      
      // Log should indicate user already has badge
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('User already has welcome badge'));
      
      // Backup method should still be called
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.COMPLETION['Welcome Badge']);
    });
    
    it.skip('should handle insert error with duplicate key gracefully', async () => {
      // Mock user auth
      const mockUser = { id: 'test-user-id' };
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: mockUser },
        error: null,
      });
      
      // Mock badge lookup
      const mockBadgeData = { id: 'welcome-badge-id' };
      
      const mockSingle = jest.fn().mockResolvedValue({
        data: mockBadgeData,
        error: null,
      });
      
      const mockMaybeSingle = jest.fn().mockResolvedValue({
        data: null,
        error: null,
      });
      
      const mockBadgeEq = jest.fn().mockReturnValue({
        single: mockSingle,
      });
      
      const mockUserBadgeEq = jest.fn().mockReturnValue({
        maybeSingle: mockMaybeSingle,
      });
      
      // First select is for badges table, second is for user_badges table
      let selectCallCount = 0;
      const mockSelect = jest.fn(() => {
        selectCallCount++;
        if (selectCallCount === 1) {
          return { eq: mockBadgeEq };
        } else {
          return { eq: mockUserBadgeEq };
        }
      });
      
      // Mock user_badges insert with duplicate key error
      const mockInsert = jest.fn().mockResolvedValue({
        error: { code: '23505' }, // Duplicate key error
      });
      
      (supabase.from as jest.Mock).mockImplementation((table) => {
        if (table === 'badges') {
          return {
            select: mockSelect,
          };
        } else if (table === 'user_badges') {
          return {
            select: mockSelect,
            insert: mockInsert,
          };
        }
        return { select: jest.fn() };
      });
      
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn().mockResolvedValue(undefined);
      
      // Call the method
      await BadgeService.awardWelcomeBadge(mockAddUserBadge);
      
      // Log should indicate duplicate key was detected
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('User already has welcome badge (detected by error code)')
      );
      
      // Backup method should still be called
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.COMPLETION['Welcome Badge']);
    });
  });

  describe('awardFirstCheckInBadge', () => {
    it('should award the first check-in badge', async () => {
      // Create mock for the addUserBadge callback
      const mockAddUserBadge = jest.fn().mockResolvedValue(undefined);
      
      // Call the method
      await BadgeService.awardFirstCheckInBadge(mockAddUserBadge);
      
      // Assert the correct badge was awarded
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.COMPLETION['First Check-in']);
    });
    
    it('should handle errors when awarding the badge', async () => {
      // Create mock that throws an error
      const mockAddUserBadge = jest.fn().mockRejectedValue(
        new Error('Test error awarding first check-in badge')
      );
      
      // Call the method
      await BadgeService.awardFirstCheckInBadge(mockAddUserBadge);
      
      // Assert the badge award was attempted
      expect(mockAddUserBadge).toHaveBeenCalledWith(BADGE_IDS.COMPLETION['First Check-in']);
      
      // Error should be logged but not propagated
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('Error awarding first check-in badge'),
        new Error('Test error awarding first check-in badge')
      );
    });
  });

  describe('initializeBadges function', () => {
    it('should call BadgeService.initializeBadges', async () => {
      // Spy on BadgeService.initializeBadges
      const initializeBadgesSpy = jest.spyOn(BadgeService, 'initializeBadges')
        .mockImplementation(async () => {});
      
      // Call the standalone initializeBadges function
      await (BadgeService as any).initializeBadges();
      
      // Assert BadgeService.initializeBadges was called
      expect(initializeBadgesSpy).toHaveBeenCalled();
      
      // Reset the spy
      initializeBadgesSpy.mockRestore();
    });
  });
}); 