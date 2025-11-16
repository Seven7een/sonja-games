/**
 * CrosswordCompletionModal Component
 * Shows completion time and statistics
 */

import { CrosswordStats } from '../types/crossword.types';

interface CrosswordCompletionModalProps {
  isOpen: boolean;
  completionTimeSeconds: number;
  hintsUsed: number;
  revealedAll: boolean;
  stats?: CrosswordStats;
  onClose: () => void;
  onViewStats: () => void;
}

export default function CrosswordCompletionModal({
  isOpen,
  completionTimeSeconds,
  hintsUsed,
  revealedAll,
  stats,
  onClose,
  onViewStats
}: CrosswordCompletionModalProps) {
  if (!isOpen) return null;

  const formatTime = (totalSeconds: number): string => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  const getMessage = () => {
    if (revealedAll) {
      return 'Puzzle Revealed';
    }
    if (hintsUsed === 0) {
      return 'Perfect! No hints used!';
    }
    if (hintsUsed <= 3) {
      return 'Great job!';
    }
    return 'Puzzle Complete!';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">
            {revealedAll ? '📖 ' : '🎉 '}
            {getMessage()}
          </h2>
          <div className="text-gray-600 space-y-1">
            <p className="text-2xl font-bold text-blue-600">
              {formatTime(completionTimeSeconds)}
            </p>
            {hintsUsed > 0 && (
              <p className="text-sm">
                {hintsUsed} {hintsUsed === 1 ? 'hint' : 'hints'} used
              </p>
            )}
            {revealedAll && (
              <p className="text-sm text-orange-600 font-semibold">
                Full board was revealed
              </p>
            )}
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-center">Your Statistics</h3>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.total_completed}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats.average_completion_time_seconds
                    ? formatTime(Math.round(stats.average_completion_time_seconds))
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-600">Avg Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.current_streak}</div>
                <div className="text-xs text-gray-600">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {stats.average_hints_used !== null
                    ? stats.average_hints_used.toFixed(1)
                    : 'N/A'}
                </div>
                <div className="text-xs text-gray-600">Avg Hints</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onViewStats}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            View Full Statistics
          </button>
          <button
            onClick={onClose}
            className="w-full py-3 px-4 bg-gray-200 text-gray-800 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            Close
          </button>
        </div>

        {/* Next Challenge Info */}
        <p className="text-center text-sm text-gray-500 mt-4">
          Come back tomorrow for a new puzzle!
        </p>
      </div>
    </div>
  );
}
