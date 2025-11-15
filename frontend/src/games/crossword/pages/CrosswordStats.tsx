/**
 * CrosswordStats Page
 * Displays user statistics and game history for Crossword
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../core/hooks/useAuth';
import { getUserStats, getGameHistory } from '../services/crosswordApi';
import { CrosswordStats as CrosswordStatsType, GameHistoryItem } from '../types/crossword.types';
import CrosswordStatsPanel from '../components/CrosswordStatsPanel';

const CrosswordStats: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState<CrosswordStatsType | null>(null);
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const PAGE_SIZE = 20;

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/sign-in');
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatsAndHistory();
    }
  }, [isAuthenticated]);

  const fetchStatsAndHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, historyData] = await Promise.all([
        getUserStats(),
        getGameHistory(1, PAGE_SIZE),
      ]);

      setStats(statsData);
      setHistory(historyData.games);
      setHasMore(historyData.games.length < historyData.total);
      setPage(1);
    } catch (err) {
      console.error('Error fetching stats and history:', err);
      setError('Failed to load statistics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreHistory = async () => {
    if (loadingMore || !hasMore) return;

    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const historyData = await getGameHistory(nextPage, PAGE_SIZE);

      setHistory((prev) => [...prev, ...historyData.games]);
      setPage(nextPage);
      setHasMore(history.length + historyData.games.length < historyData.total);
    } catch (err) {
      console.error('Error loading more history:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading statistics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-red-600 dark:text-red-400 mb-4">{error}</div>
          <button
            onClick={fetchStatsAndHistory}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-2">
            Your Crossword Statistics
          </h1>
          <button
            onClick={() => navigate('/crossword')}
            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            ← Back to Game
          </button>
        </div>

        {/* Stats Panel */}
        <div className="mb-8">
          <CrosswordStatsPanel stats={stats} />
        </div>

        {/* Game History */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Game History
          </h2>

          {history.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              No puzzles completed yet. Start playing to build your history!
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {history.map((game) => (
                  <div
                    key={game.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 min-w-[100px]">
                        {formatDate(game.date)}
                      </div>
                      <div
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          game.completed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                        }`}
                      >
                        {game.completed ? 'Completed' : 'In Progress'}
                      </div>
                    </div>
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {game.completed ? formatTime(game.completion_time_seconds) : '-'}
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="mt-6 text-center">
                  <button
                    onClick={loadMoreHistory}
                    disabled={loadingMore}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {loadingMore ? 'Loading...' : 'Load More'}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CrosswordStats;
