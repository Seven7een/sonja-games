/**
 * CrosswordStatsPanel Component
 * Displays user statistics including total completed, average time, streaks, and hints usage
 */

import React from 'react';
import { CrosswordStats } from '../types/crossword.types';

interface CrosswordStatsPanelProps {
  stats: CrosswordStats;
}

const CrosswordStatsPanel: React.FC<CrosswordStatsPanelProps> = ({ stats }) => {
  const formatTime = (seconds: number | null): string => {
    if (seconds === null) return 'N/A';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }
    
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {stats.total_completed}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Completed
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {formatTime(stats.average_completion_time_seconds ? Math.round(stats.average_completion_time_seconds) : null)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Avg Time
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {stats.current_streak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Current Streak
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {stats.max_streak}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Max Streak
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {stats.average_hints_used !== null ? stats.average_hints_used.toFixed(1) : 'N/A'}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Avg Hints
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {stats.puzzles_revealed}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Revealed
          </div>
        </div>
      </div>
    </div>
  );
};

export default CrosswordStatsPanel;
