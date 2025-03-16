import { extractTokenFromUrl, verifyEmailWithToken } from '../authUtils';
import { supabase } from '@/lib/supabase';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      exchangeCodeForSession: jest.fn(),
      verifyOtp: jest.fn(),
      getSession: jest.fn(),
      refreshSession: jest.fn(),
      setSession: jest.fn(),
    },
  },
}));

// Mock console to avoid cluttering test output
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'log').mockImplementation(() => {});

describe('authUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractTokenFromUrl', () => {
    test('should extract token from a valid URL', () => {
      // Arrange
      const url = 'https://example.com/auth/confirm?token=abc123xyz&type=signup';
      
      // Act
      const result = extractTokenFromUrl(url);
      
      // Assert
      expect(result).toBe('abc123xyz');
    });

    test('should return null when token parameter is missing', () => {
      // Arrange
      const url = 'https://example.com/auth/confirm?type=signup';
      
      // Act
      const result = extractTokenFromUrl(url);
      
      // Assert
      expect(result).toBeNull();
    });

    test('should return null for an invalid URL', () => {
      // Arrange
      const url = 'not-a-valid-url';
      
      // Act
      const result = extractTokenFromUrl(url);
      
      // Assert
      expect(result).toBeNull();
    });

    test('should return null if URL is empty', () => {
      // Arrange
      const url = '';
      
      // Act
      const result = extractTokenFromUrl(url);
      
      // Assert
      expect(result).toBeNull();
    });
  });

  describe('verifyEmailWithToken', () => {
    test('should return true when exchangeCodeForSession succeeds', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = { email: 'test@example.com', email_confirmed_at: new Date().toISOString() };
      const mockSession = { 
        user: mockUser,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };
      
      // Mock the exchangeCodeForSession method to return a successful response
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      // Act
      const result = await verifyEmailWithToken(token);
      
      // Assert
      expect(result).toBe(true);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(token);
      expect(supabase.auth.setSession).toHaveBeenCalledWith({
        access_token: mockSession.access_token,
        refresh_token: mockSession.refresh_token,
      });
    });

    test('should try verifyOtp when exchangeCodeForSession fails', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = { email: 'test@example.com', email_confirmed_at: new Date().toISOString() };
      const mockSession = { 
        user: mockUser,
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };
      
      // Mock exchangeCodeForSession to fail
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token' },
      });
      
      // Mock verifyOtp to succeed
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      // Act
      const result = await verifyEmailWithToken(token);
      
      // Assert
      expect(result).toBe(true);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(token);
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: token,
        type: 'email',
      });
    });

    test('should check current session when both verification methods fail', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = { email: 'test@example.com', email_confirmed_at: new Date().toISOString() };
      const mockSession = { user: mockUser };
      
      // Mock exchangeCodeForSession to fail
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token' },
      });
      
      // Mock verifyOtp to fail
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid OTP' },
      });
      
      // Mock getSession to succeed with a verified user
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      // Act
      const result = await verifyEmailWithToken(token);
      
      // Assert
      expect(result).toBe(true);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(token);
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: token,
        type: 'email',
      });
      expect(supabase.auth.getSession).toHaveBeenCalled();
    });

    test('should try to refresh session as a last resort', async () => {
      // Arrange
      const token = 'valid-token';
      const mockUser = { email: 'test@example.com', email_confirmed_at: new Date().toISOString() };
      const mockSession = { user: mockUser };
      
      // Mock all previous methods to fail
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token' },
      });
      
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid OTP' },
      });
      
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: { user: { ...mockUser, email_confirmed_at: null } } },
        error: null,
      });
      
      // Mock refreshSession to succeed with a verified user
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: mockSession },
        error: null,
      });
      
      // Act
      const result = await verifyEmailWithToken(token);
      
      // Assert
      expect(result).toBe(true);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(token);
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: token,
        type: 'email',
      });
      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });

    test('should return false when all verification methods fail', async () => {
      // Arrange
      const token = 'invalid-token';
      
      // Mock all methods to fail
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid token' },
      });
      
      (supabase.auth.verifyOtp as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'Invalid OTP' },
      });
      
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: null,
      });
      
      (supabase.auth.refreshSession as jest.Mock).mockResolvedValue({
        data: { session: null },
        error: { message: 'No session to refresh' },
      });
      
      // Act
      const result = await verifyEmailWithToken(token);
      
      // Assert
      expect(result).toBe(false);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(token);
      expect(supabase.auth.verifyOtp).toHaveBeenCalledWith({
        token_hash: token,
        type: 'email',
      });
      expect(supabase.auth.getSession).toHaveBeenCalled();
      expect(supabase.auth.refreshSession).toHaveBeenCalled();
    });

    test('should handle exceptions during the verification process', async () => {
      // Arrange
      const token = 'error-token';
      
      // Mock exchangeCodeForSession to throw an error
      (supabase.auth.exchangeCodeForSession as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );
      
      // Mock other methods to fail as well
      (supabase.auth.verifyOtp as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );
      
      (supabase.auth.getSession as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );
      
      (supabase.auth.refreshSession as jest.Mock).mockRejectedValue(
        new Error('Unexpected error')
      );
      
      // Act
      const result = await verifyEmailWithToken(token);
      
      // Assert
      expect(result).toBe(false);
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith(token);
    });
  });
}); 