/**
 * Application configuration
 * Centralizes access to environment variables
 */

export const config = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  clerkPublishableKey: import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '',
} as const;

// Validate required environment variables
if (!config.clerkPublishableKey) {
  console.warn('VITE_CLERK_PUBLISHABLE_KEY is not set. Authentication will not work.');
}

export default config;
