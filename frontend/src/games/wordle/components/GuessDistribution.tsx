/**
 * GuessDistribution Component
 * Displays a bar chart showing the distribution of guesses across winning games
 */

import React from 'react';

interface GuessDistributionProps {
  distribution: number[];  // Index 0 = 1 guess, index 1 = 2 guesses, etc.
}

const GuessDistribution: React.FC<GuessDistributionProps> = ({ distribution }) => {
  // Find the maximum value for scaling bars
  const maxValue = Math.max(...distribution, 1);

  return (
    <div className="w-full">
      <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
        Guess Distribution
      </h3>
      <div className="space-y-2">
        {distribution.map((count, index) => {
          const guessNumber = index + 1;
          const percentage = maxValue > 0 ? (count / maxValue) * 100 : 0;
          const hasGames = count > 0;

          return (
            <div key={guessNumber} className="flex items-center gap-2">
              <span className="text-sm font-medium w-4 text-gray-700 dark:text-gray-300">
                {guessNumber}
              </span>
              <div className="flex-1 relative">
                <div
                  className={`h-8 rounded transition-all duration-300 flex items-center justify-end px-2 ${
                    hasGames
                      ? 'bg-green-500 dark:bg-green-600'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                  style={{ width: `${Math.max(percentage, hasGames ? 10 : 100)}%` }}
                >
                  <span className="text-sm font-bold text-white">
                    {count}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GuessDistribution;
