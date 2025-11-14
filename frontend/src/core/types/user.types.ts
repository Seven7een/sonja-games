/**
 * User-related TypeScript types
 * Matches backend User model and schemas
 */

/**
 * User model from backend
 * Represents an authenticated user in the system
 */
export interface User {
  id: string; // Clerk user ID
  email: string;
  username: string | null;
  created_at: string; // ISO 8601 datetime string
  updated_at: string; // ISO 8601 datetime string
}

/**
 * User sync request payload
 * Sent to backend after Clerk authentication
 */
export interface UserSyncRequest {
  clerk_id: string;
  email: string;
  username?: string;
}

/**
 * User sync response
 * Returned from backend after syncing user
 */
export interface UserSyncResponse {
  user: User;
  message: string;
}

/**
 * Partial user data for updates
 */
export interface UserUpdateData {
  username?: string;
  email?: string;
}

/**
 * User authentication state
 * Used by auth hooks and context
 */
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
