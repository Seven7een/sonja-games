/**
 * Home page component
 * Landing page with welcome message and links to available games
 */

import { Link } from 'react-router-dom';
import { useAuth } from '../core/hooks/useAuth';

/**
 * Home page
 * Displays welcome message and game selection
 */
export const Home = () => {
  const { isAuthenticated, user, clerkUser, isLoading } = useAuth();
  
  // Get display name - prioritize first name
  const displayName = 
    clerkUser?.firstName || 
    user?.username || 
    clerkUser?.username || 
    user?.email?.split('@')[0] || 
    clerkUser?.primaryEmailAddress?.emailAddress?.split('@')[0] || 
    'there';

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Sonja Games
        </h1>
        {isAuthenticated ? (
          <p className="text-xl text-gray-600">
            Hello, {displayName}! Choose a game to play.
          </p>
        ) : (
          <p className="text-xl text-gray-600">
            Sign in to play games and track your progress.
          </p>
        )}
      </div>

      {/* Games Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Wordle Game Card */}
        <Link
          to={isAuthenticated ? '/wordle' : '/sign-in'}
          className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Wordle</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Available
            </span>
          </div>
          <p className="text-gray-600 mb-4">
            Guess the five-letter word in six tries. Each guess provides color-coded
            clues to help you find the answer.
          </p>
          <div className="flex items-center text-blue-600 font-medium">
            Play Now
            <svg
              className="w-5 h-5 ml-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </Link>

        {/* Placeholder for Future Games */}
        <div className="p-6 bg-gray-50 rounded-lg shadow-md border border-gray-200 opacity-60">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-500">More Games</h2>
            <span className="px-3 py-1 bg-gray-200 text-gray-600 text-sm font-medium rounded-full">
              Coming Soon
            </span>
          </div>
          <p className="text-gray-500 mb-4">
            More exciting minigames are on the way! Stay tuned for updates.
          </p>
          <div className="flex items-center text-gray-400 font-medium">
            Coming Soon
          </div>
        </div>
      </div>

      {/* Sign In Prompt for Unauthenticated Users */}
      {!isAuthenticated && (
        <div className="mt-12 text-center p-6 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Ready to Play?
          </h3>
          <p className="text-gray-600 mb-4">
            Sign in to save your progress, track your stats, and compete with friends.
          </p>
          <Link
            to="/sign-in"
            className="inline-block px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In Now
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;
