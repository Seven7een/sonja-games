"""
Word service for Wordle game logic.
Handles word list loading, validation, daily word selection, and guess feedback.
"""
import json
import os
from datetime import date
from typing import List, Set
from app.games.wordle.schemas import LetterStatus, LetterResult


class WordService:
    """Service for managing Wordle word operations"""
    
    def __init__(self):
        self._answers: List[str] = []
        self._valid_guesses: Set[str] = set()
        self._load_words()
    
    def _load_words(self) -> None:
        """Load word lists from words.json file"""
        words_file = os.path.join(
            os.path.dirname(__file__),
            'words.json'
        )
        
        with open(words_file, 'r') as f:
            data = json.load(f)
            self._answers = [word.lower() for word in data['answers']]
            self._valid_guesses = set(word.lower() for word in data['valid_guesses'])
    
    def is_valid_word(self, word: str) -> bool:
        """
        Check if a word is valid for guessing.
        
        Args:
            word: The word to validate (case-insensitive)
            
        Returns:
            True if the word is in the valid guesses list
        """
        return word.lower() in self._valid_guesses
    
    def get_daily_word(self, target_date: date) -> str:
        """
        Get the daily challenge word for a specific date.
        Uses cryptographic hash for deterministic but unpredictable selection.
        This ensures all servers get the same word, but the sequence can't be predicted.
        
        Args:
            target_date: The date to get the word for
            
        Returns:
            The daily word (lowercase)
        """
        import hashlib
        import os
        
        # Get secret from environment or use a default (should be set in production)
        secret = os.getenv('WORDLE_SECRET', 'default-secret-change-in-production')
        
        # Create hash from date + secret
        date_str = target_date.isoformat()
        hash_input = f"{date_str}:{secret}".encode('utf-8')
        hash_digest = hashlib.sha256(hash_input).hexdigest()
        
        # Convert first 8 hex chars to integer for index
        hash_int = int(hash_digest[:8], 16)
        index = hash_int % len(self._answers)
        
        return self._answers[index]

    
    def check_guess(self, guess: str, answer: str) -> List[LetterResult]:
        """
        Check a guess against the answer and return feedback for each letter.
        
        Algorithm:
        1. First pass: Mark all exact matches (correct position)
        2. Second pass: Mark letters that exist but are in wrong position
        3. Remaining letters are marked as absent
        
        Handles duplicate letters correctly - if answer has 2 'E's and guess has 3 'E's,
        only 2 will be marked as correct/present.
        
        Args:
            guess: The guessed word (5 letters, case-insensitive)
            answer: The correct answer (5 letters, case-insensitive)
            
        Returns:
            List of LetterResult objects with status for each letter
        """
        guess = guess.lower()
        answer = answer.lower()
        result = [None] * 5
        answer_letters = list(answer)
        
        # First pass: Mark correct positions (green)
        for i in range(5):
            if guess[i] == answer[i]:
                result[i] = LetterResult(
                    letter=guess[i],
                    status=LetterStatus.CORRECT
                )
                answer_letters[i] = None  # Mark as used
        
        # Second pass: Mark present letters (yellow) and absent (gray)
        for i in range(5):
            if result[i] is not None:
                continue  # Already marked as correct
            
            if guess[i] in answer_letters:
                result[i] = LetterResult(
                    letter=guess[i],
                    status=LetterStatus.PRESENT
                )
                # Remove first occurrence to handle duplicates correctly
                answer_letters[answer_letters.index(guess[i])] = None
            else:
                result[i] = LetterResult(
                    letter=guess[i],
                    status=LetterStatus.ABSENT
                )
        
        return result


# Global singleton instance
_word_service = None


def get_word_service() -> WordService:
    """Get the global WordService instance (singleton pattern)"""
    global _word_service
    if _word_service is None:
        _word_service = WordService()
    return _word_service
