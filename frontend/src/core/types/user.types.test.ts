import { describe, it, expect } from 'vitest';
import type { User, UserSyncRequest, AuthState } from './user.types';

describe('User Types', () => {
  describe('User interface', () => {
    it('should accept valid user object', () => {
      const user: User = {
        id: 'user_123',
        email: 'test@example.com',
        username: 'testuser',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(user.id).toBe('user_123');
      expect(user.email).toBe('test@example.com');
      expect(user.username).toBe('testuser');
    });

    it('should allow null username', () => {
      const user: User = {
        id: 'user_123',
        email: 'test@example.com',
        username: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      expect(user.username).toBeNull();
    });
  });

  describe('UserSyncRequest interface', () => {
    it('should accept valid sync request', () => {
      const syncRequest: UserSyncRequest = {
        clerk_id: 'user_clerk_123',
        email: 'test@example.com',
        username: 'testuser',
      };

      expect(syncRequest.clerk_id).toBe('user_clerk_123');
      expect(syncRequest.email).toBe('test@example.com');
    });

    it('should allow optional username', () => {
      const syncRequest: UserSyncRequest = {
        clerk_id: 'user_clerk_123',
        email: 'test@example.com',
      };

      expect(syncRequest.username).toBeUndefined();
    });
  });

  describe('AuthState interface', () => {
    it('should accept authenticated state', () => {
      const authState: AuthState = {
        user: {
          id: 'user_123',
          email: 'test@example.com',
          username: 'testuser',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

      expect(authState.isAuthenticated).toBe(true);
      expect(authState.user).not.toBeNull();
    });

    it('should accept unauthenticated state', () => {
      const authState: AuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

      expect(authState.isAuthenticated).toBe(false);
      expect(authState.user).toBeNull();
    });

    it('should accept error state', () => {
      const authState: AuthState = {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Authentication failed',
      };

      expect(authState.error).toBe('Authentication failed');
    });
  });
});
