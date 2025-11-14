/**
 * Authentication service
 * Handles user sync and auth-related API calls
 */

import api from './api';
import { UserSyncRequest, UserSyncResponse } from '../types/user.types';

/**
 * Sync authenticated user with backend
 * Called after successful Clerk authentication
 */
export const syncUser = async (
  clerkId: string,
  email: string,
  username?: string
): Promise<UserSyncResponse> => {
  const payload: UserSyncRequest = {
    clerk_id: clerkId,
    email,
    username,
  };

  return api.post<UserSyncResponse>('/api/auth/sync', payload);
};

/**
 * Auth service object
 */
export const authService = {
  syncUser,
};

export default authService;
