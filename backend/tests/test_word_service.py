"""
Basic tests for Wordle word service
"""
import pytest
from datetime import date
from app.games.wordle.word_service import get_word_service
from app.games.wordle.schemas import LetterStatus


def test_word_validation():
    """Test that valid words are recognized"""
    ws = get_word_service()
    
    assert ws.is_valid_word("about") is True
    assert ws.is_valid_word("ABOUT") is True  # Case insensitive
    assert ws.is_valid_word("zzzzz") is False


def test_daily_word_deterministic():
    """Test that daily word selection is deterministic"""
    ws = get_word_service()
    
    word1 = ws.get_daily_word(date(2024, 1, 1))
    word2 = ws.get_daily_word(date(2024, 1, 1))
    word3 = ws.get_daily_word(date(2024, 1, 2))
    
    assert word1 == word2  # Same date returns same word
    assert word1 != word3  # Different dates return different words
    assert len(word1) == 5  # Word is 5 letters


def test_guess_feedback_correct():
    """Test feedback when guess is correct"""
    ws = get_word_service()
    
    result = ws.check_guess("about", "about")
    
    assert len(result) == 5
    for lr in result:
        assert lr.status == LetterStatus.CORRECT


def test_guess_feedback_mixed():
    """Test feedback with correct, present, and absent letters"""
    ws = get_word_service()
    
    # Guess "about" when answer is "abort"
    # a: correct (position 0)
    # b: correct (position 1)
    # o: correct (position 2)
    # u: absent (not in word)
    # t: correct (position 4)
    result = ws.check_guess("about", "abort")
    
    assert result[0].letter == "a"
    assert result[0].status == LetterStatus.CORRECT
    
    assert result[1].letter == "b"
    assert result[1].status == LetterStatus.CORRECT
    
    assert result[2].letter == "o"
    assert result[2].status == LetterStatus.CORRECT
    
    assert result[3].letter == "u"
    assert result[3].status == LetterStatus.ABSENT
    
    assert result[4].letter == "t"
    assert result[4].status == LetterStatus.CORRECT


def test_guess_feedback_duplicates():
    """Test feedback handles duplicate letters correctly"""
    ws = get_word_service()
    
    # Guess "speed" when answer is "spade"
    # s: correct (position 0)
    # p: correct (position 1)
    # e: present (letter 'e' exists in position 4 of answer)
    # e: absent (second e, since answer only has one 'e')
    # d: present (letter 'd' exists in position 3 of answer)
    result = ws.check_guess("speed", "spade")
    
    assert result[0].status == LetterStatus.CORRECT  # s
    assert result[1].status == LetterStatus.CORRECT  # p
    assert result[2].status == LetterStatus.PRESENT  # e (in word but wrong position)
    assert result[3].status == LetterStatus.ABSENT   # e (extra)
    assert result[4].status == LetterStatus.PRESENT  # d (in word but wrong position)
