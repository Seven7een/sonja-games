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
  // Debug: Log when component renders
  console.log('SignIn component rendered, current path:', window.location.pathname + window.location.hash);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ClerkSignIn 
        routing="path"
        path="/sign-in"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
      />
    </div>
  );
};

export default SignIn;
