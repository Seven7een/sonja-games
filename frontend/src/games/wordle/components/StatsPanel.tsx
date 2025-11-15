/**
 * StatsPanel Component
 * Displays user statistics including total games, win percentage, streaks, and guess distribution
 */

import React from 'react';
import { WordleStats } from '../types/wordle.types';
import GuessDistribution from './GuessDistribution';

interface StatsPanelProps {
  stats: WordleStats;
}

const StatsPanel: React.FC<StatsPanelProps> = ({ stats }) => {
  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {stats.total_games}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Played
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 text-center shadow-sm">
          <div className="text-3xl font-bold text-gray-800 dark:text-gray-200">
            {Math.round(stats.win_percentage)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Win %
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
      </div>

      {/* Guess Distribution */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm">
        <GuessDistribution distribution={stats.guess_distribution} />
      </div>
    </div>
  );
};

export default StatsPanel;
