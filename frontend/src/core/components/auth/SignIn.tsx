/**
 * Sign In page component
 * Wraps Clerk's SignIn component with custom styling and layout
 */

import { SignIn as ClerkSignIn } from '@clerk/clerk-react';

/**
 * SignIn component
 * Displays Clerk's sign-in interface with centered layout
 */
export const SignIn = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Sonja Games
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to play games and track your progress
          </p>
        </div>
        <div className="flex justify-center">
          <ClerkSignIn 
            routing="hash"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
};

export default SignIn;
