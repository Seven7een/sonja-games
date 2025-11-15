/**
 * Sign Up page component
 * Wraps Clerk's SignUp component with custom styling and layout
 */

import { SignUp as ClerkSignUp } from '@clerk/clerk-react';

/**
 * SignUp component
 * Displays Clerk's sign-up interface with centered layout
 */
export const SignUp = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ClerkSignUp 
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
      />
    </div>
  );
};

export default SignUp;
