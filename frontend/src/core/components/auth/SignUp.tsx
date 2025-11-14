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
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Join Sonja Games to start playing
          </p>
        </div>
        <div className="flex justify-center">
          <ClerkSignUp 
            routing="hash"
            signInUrl="/sign-in"
            afterSignUpUrl="/"
            redirectUrl="/"
          />
        </div>
      </div>
    </div>
  );
};

export default SignUp;
