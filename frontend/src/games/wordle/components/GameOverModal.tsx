/**
 * GameOverModal Component
 * Displays win/loss message, reveals answer, shows statistics, and offers to view full stats
 */

import { WordleStats } from '../types/wordle.types';

interface GameOverModalProps {
  isOpen: boolean;
  won: boolean;
  answer: string;
  attemptsUsed: number;
  stats?: WordleStats;
  onClose: () => void;
  onViewStats: () => void;
}

export default function GameOverModal({
  isOpen,
  won,
  answer,
  attemptsUsed,
  stats,
  onClose,
  onViewStats
}: GameOverModalProps) {
  if (!isOpen) return null;

  const getMessage = () => {
    if (won) {
      const messages = [
        'Genius!',
        'Magnificent!',
        'Impressive!',
        'Splendid!',
        'Great!',
        'Phew!'
      ];
      return messages[attemptsUsed - 1] || 'Well done!';
    }
    return 'Better luck next time!';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold mb-2">
            {won ? '🎉 ' : '😔 '}
            {getMessage()}
          </h2>
          <p className="text-gray-600">
            {won ? (
              <>You guessed the word in <span className="font-bold">{attemptsUsed}</span> {attemptsUsed === 1 ? 'try' : 'tries'}!</>
            ) : (
              <>The word was <span className="font-bold uppercase">{answer}</span></>
            )}
          </p>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-3 text-center">Your Statistics</h3>
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{stats.total_games}</div>
                <div className="text-xs text-gray-600">Played</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.win_percentage}</div>
                <div className="text-xs text-gray-600">Win %</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.current_streak}</div>
                <div className="text-xs text-gray-600">Current Streak</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.max_streak}</div>
                <div className="text-xs text-gray-600">Max Streak</div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          <button
            onClick={onViewStats}
            className="w-full py-3 px-4 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
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
          Come back tomorrow for a new challenge!
        </p>
      </div>
    </div>
  );
}
