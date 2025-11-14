/**
 * Header component
 * Navigation header with app title, game links, and user menu
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useState } from 'react';

/**
 * Header component
 * Displays app title, navigation links, and user menu with logout
 */
export const Header = () => {
  const { user, isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setIsMenuOpen(false);
    navigate('/sign-in');
  };

  return (
    <header className="bg-white shadow-sm">
      <nav className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between">
          {/* App Title */}
          <Link to="/" className="text-2xl font-bold text-gray-900 hover:text-gray-700">
            Sonja Games
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-6">
            {isAuthenticated && (
              <>
                <Link
                  to="/wordle"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Wordle
                </Link>
                <Link
                  to="/wordle/stats"
                  className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  Stats
                </Link>
              </>
            )}

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 font-medium transition-colors"
                >
                  <span className="hidden sm:inline">
                    {user?.username || user?.email || 'User'}
                  </span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isMenuOpen && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsMenuOpen(false)}
                    />
                    
                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20 border border-gray-200">
                      <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                        <div className="font-medium">{user?.username || 'User'}</div>
                        <div className="text-gray-500 truncate">{user?.email}</div>
                      </div>
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/sign-in"
                className="text-gray-700 hover:text-gray-900 font-medium transition-colors"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;
