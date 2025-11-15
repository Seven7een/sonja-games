/**
 * Custom authentication hook
 * Wraps Clerk's useUser and useAuth hooks with additional functionality
 */

import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import { setAuthToken } from '../services/api';
import { User } from '../types/user.types';
import { syncUser } from '../services/authService';

/**
 * Extended auth hook return type
 */
export interface UseAuthReturn {
  // User data
  user: User | null;
  clerkUser: any; // Clerk's user object
  
  // Auth state
  isAuthenticated: boolean;
  isLoading: boolean;
  isSyncing: boolean;
  hasToken: boolean;
  
  // Auth methods
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

/**
 * Custom hook for authentication
 * Provides user data, auth state, and auth methods
 */
export const useAuth = (): UseAuthReturn => {
  const { user: clerkUser, isLoaded: isUserLoaded } = useUser();
  const { signOut: clerkSignOut, getToken: clerkGetToken } = useClerkAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [lastSyncedUserId, setLastSyncedUserId] = useState<string | null>(null);

  // Update auth token and sync user when Clerk user changes
  useEffect(() => {
    const updateTokenAndSyncUser = async () => {
      if (clerkUser && clerkUser.id !== lastSyncedUserId) {
        try {
          const token = await clerkGetToken();
          setAuthToken(token);
          setHasToken(!!token);
          
          // Sync user with backend
          setIsSyncing(true);
          try {
            console.log('🔄 Syncing user with backend...', {
              id: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress,
              username: clerkUser.username
            });
            
            const response = await syncUser(
              clerkUser.id,
              clerkUser.primaryEmailAddress?.emailAddress || '',
              clerkUser.username || undefined
            );
            
            console.log('✅ User sync response:', response);
            
            // Backend returns user directly
            setUser(response);
            setLastSyncedUserId(clerkUser.id);
            console.log('✅ User state updated:', response);
          } catch (syncError) {
            console.error('❌ Failed to sync user with backend:', syncError);
            
            // Fallback: Map Clerk user to our User type
            const mappedUser: User = {
              id: clerkUser.id,
              email: clerkUser.primaryEmailAddress?.emailAddress || '',
              username: clerkUser.username || null,
              created_at: new Date(clerkUser.createdAt || Date.now()).toISOString(),
              updated_at: new Date(clerkUser.updatedAt || Date.now()).toISOString(),
            };
            
            setUser(mappedUser);
          } finally {
            setIsSyncing(false);
          }
        } catch (error) {
          console.error('Failed to get auth token:', error);
          setAuthToken(null);
          setUser(null);
          setIsSyncing(false);
        }
      } else {
        setAuthToken(null);
        setHasToken(false);
        setUser(null);
        setIsSyncing(false);
        setLastSyncedUserId(null);
      }
    };

    updateTokenAndSyncUser();
  }, [clerkUser, clerkGetToken, lastSyncedUserId]);

  // Wrapper for sign out
  const signOut = async () => {
    await clerkSignOut();
    setAuthToken(null);
    setUser(null);
  };

  // Wrapper for get token
  const getToken = async (): Promise<string | null> => {
    try {
      return await clerkGetToken();
    } catch (error) {
      console.error('Failed to get token:', error);
      return null;
    }
  };

  return {
    user,
    clerkUser,
    isAuthenticated: !!clerkUser,
    isLoading: !isUserLoaded || isSyncing,
    isSyncing,
    hasToken,
    signOut,
    getToken,
  };
};

export default useAuth;
