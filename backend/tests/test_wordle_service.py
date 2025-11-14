"""
Tests for Wordle game service
"""
import pytest
from datetime import date, datetime, timedelta
from app.games.wordle import service
from app.games.wordle.models import WordleDailyChallenge, WordleGameSession
from app.games.wordle.schemas import LetterStatus


class TestDailyChallenge:
    """Tests for daily challenge management"""
    
    def test_get_or_create_daily_challenge_creates_new(self, db_session):
        """Test creating a new daily challenge"""
        target_date = date(2024, 1, 15)
        
        challenge = service.get_or_create_daily_challenge(db_session, target_date)
        
        assert challenge.id is not None
        assert challenge.date == target_date
        assert len(challenge.word) == 5
        assert challenge.created_at is not None
    
    def test_get_or_create_daily_challenge_returns_existing(self, db_session):
        """Test that same date returns same challenge"""
        target_date = date(2024, 1, 15)
        
        challenge1 = service.get_or_create_daily_challenge(db_session, target_date)
        challenge2 = service.get_or_create_daily_challenge(db_session, target_date)
        
        assert challenge1.id == challenge2.id
        assert challenge1.word == challenge2.word


class TestGameSession:
    """Tests for game session management"""
    
    def test_start_daily_challenge(self, db_session, test_user):
        """Test starting a new game session"""
        target_date = date(2024, 1, 15)
        
        session = service.start_daily_challenge(db_session, test_user.id, target_date)
        
        assert session.id is not None
        assert session.user_id == test_user.id
        assert session.guesses == []
        assert session.won is False
        assert session.attempts_used == 0
        assert session.completed_at is None
    
    def test_start_daily_challenge_defaults_to_today(self, db_session, test_user):
        """Test that start_daily_challenge uses today's date by default"""
        session = service.start_daily_challenge(db_session, test_user.id)
        
        challenge = db_session.query(WordleDailyChallenge).filter(
            WordleDailyChallenge.id == session.daily_challenge_id
        ).first()
        
        assert challenge.date == date.today()


class TestSubmitGuess:
    """Tests for guess submission"""
    
    def test_submit_guess_correct(self, db_session, test_user):
        """Test submitting a correct guess"""
        target_date = date(2024, 1, 15)
        session = service.start_daily_challenge(db_session, test_user.id, target_date)
        
        # Get the answer
        challenge = db_session.query(WordleDailyChallenge).filter(
            WordleDailyChallenge.id == session.daily_challenge_id
        ).first()
        
        result = service.submit_guess(db_session, session.id, challenge.word)
        
        assert result.is_correct is True
        assert result.game_over is True
        assert result.won is True
        assert result.attempts_used == 1
        assert all(lr.status == LetterStatus.CORRECT for lr in result.result)
        
        # Verify session updated
        db_session.refresh(session)
        assert session.won is True
        assert session.completed_at is not None
        assert len(session.guesses) == 1
    
    def test_submit_guess_incorrect_continues(self, db_session, test_user):
        """Test submitting an incorrect guess continues the game"""
        target_date = date(2024, 1, 15)
        session = service.start_daily_challenge(db_session, test_user.id, target_date)
        
        result = service.submit_guess(db_session, session.id, "about")
        
        assert result.is_correct is False
        assert result.game_over is False
        assert result.won is None
        assert result.attempts_used == 1
        
        # Verify session updated
        db_session.refresh(session)
        assert session.won is False
        assert session.completed_at is None
        assert len(session.guesses) == 1
    
    def test_submit_guess_max_attempts_loss(self, db_session, test_user):
        """Test that 6 incorrect guesses ends the game as a loss"""
        target_date = date(2024, 1, 15)
        session = service.start_daily_challenge(db_session, test_user.id, target_date)
        
        # Submit 6 incorrect guesses
        for i in range(6):
            result = service.submit_guess(db_session, session.id, "about")
        
        assert result.game_over is True
        assert result.won is False
        assert result.attempts_used == 6
        
        # Verify session updated
        db_session.refresh(session)
        assert session.won is False
        assert session.completed_at is not None
        assert len(session.guesses) == 6
    
    def test_submit_guess_invalid_word_raises_error(self, db_session, test_user):
        """Test that invalid word raises ValueError"""
        session = service.start_daily_challenge(db_session, test_user.id)
        
        with pytest.raises(ValueError, match="Invalid word"):
            service.submit_guess(db_session, session.id, "zzzzz")
    
    def test_submit_guess_completed_session_raises_error(self, db_session, test_user):
        """Test that submitting to completed session raises error"""
        target_date = date(2024, 1, 15)
        session = service.start_daily_challenge(db_session, test_user.id, target_date)
        
        # Get the answer and win
        challenge = db_session.query(WordleDailyChallenge).filter(
            WordleDailyChallenge.id == session.daily_challenge_id
        ).first()
        service.submit_guess(db_session, session.id, challenge.word)
        
        # Try to submit another guess
        with pytest.raises(ValueError, match="already completed"):
            service.submit_guess(db_session, session.id, "about")


class TestUserStats:
    """Tests for user statistics"""
    
    def test_get_user_stats_no_games(self, db_session, test_user):
        """Test stats for user with no completed games"""
        stats = service.get_user_stats(db_session, test_user.id)
        
        assert stats.total_games == 0
        assert stats.wins == 0
        assert stats.losses == 0
        assert stats.win_percentage == 0.0
        assert stats.current_streak == 0
        assert stats.max_streak == 0
        assert stats.guess_distribution == [0, 0, 0, 0, 0, 0]
    
    def test_get_user_stats_with_wins(self, db_session, test_user):
        """Test stats calculation with wins"""
        # Create completed sessions
        for i in range(3):
            target_date = date(2024, 1, 15) + timedelta(days=i)
            session = service.start_daily_challenge(db_session, test_user.id, target_date)
            
            challenge = db_session.query(WordleDailyChallenge).filter(
                WordleDailyChallenge.id == session.daily_challenge_id
            ).first()
            
            # Win in different number of attempts
            for _ in range(i + 1):
                service.submit_guess(db_session, session.id, "about")
            service.submit_guess(db_session, session.id, challenge.word)
        
        stats = service.get_user_stats(db_session, test_user.id)
        
        assert stats.total_games == 3
        assert stats.wins == 3
        assert stats.losses == 0
        assert stats.win_percentage == 100.0
        assert stats.guess_distribution[1] == 1  # 2 guesses
        assert stats.guess_distribution[2] == 1  # 3 guesses
        assert stats.guess_distribution[3] == 1  # 4 guesses
    
    def test_get_user_stats_with_losses(self, db_session, test_user):
        """Test stats calculation with losses"""
        session = service.start_daily_challenge(db_session, test_user.id)
        
        # Lose by using all 6 attempts
        for _ in range(6):
            service.submit_guess(db_session, session.id, "about")
        
        stats = service.get_user_stats(db_session, test_user.id)
        
        assert stats.total_games == 1
        assert stats.wins == 0
        assert stats.losses == 1
        assert stats.win_percentage == 0.0


class TestGameHistory:
    """Tests for game history"""
    
    def test_get_game_history_empty(self, db_session, test_user):
        """Test game history for user with no games"""
        history, total = service.get_game_history(db_session, test_user.id)
        
        assert len(history) == 0
        assert total == 0
    
    def test_get_game_history_with_games(self, db_session, test_user):
        """Test game history retrieval"""
        # Create 3 completed games
        for i in range(3):
            target_date = date(2024, 1, 15) + timedelta(days=i)
            session = service.start_daily_challenge(db_session, test_user.id, target_date)
            
            challenge = db_session.query(WordleDailyChallenge).filter(
                WordleDailyChallenge.id == session.daily_challenge_id
            ).first()
            
            service.submit_guess(db_session, session.id, challenge.word)
        
        history, total = service.get_game_history(db_session, test_user.id)
        
        assert len(history) == 3
        assert total == 3
        # Should be ordered by date descending (most recent first)
        assert history[0].date > history[1].date
        assert history[1].date > history[2].date
    
    def test_get_game_history_pagination(self, db_session, test_user):
        """Test game history pagination"""
        # Create 5 completed games
        for i in range(5):
            target_date = date(2024, 1, 15) + timedelta(days=i)
            session = service.start_daily_challenge(db_session, test_user.id, target_date)
            
            challenge = db_session.query(WordleDailyChallenge).filter(
                WordleDailyChallenge.id == session.daily_challenge_id
            ).first()
            
            service.submit_guess(db_session, session.id, challenge.word)
        
        # Get first page
        history_page1, total = service.get_game_history(db_session, test_user.id, page=1, page_size=2)
        assert len(history_page1) == 2
        assert total == 5
        
        # Get second page
        history_page2, _ = service.get_game_history(db_session, test_user.id, page=2, page_size=2)
        assert len(history_page2) == 2
        
        # Verify different games
        assert history_page1[0].id != history_page2[0].id


class TestCanPlayToday:
    """Tests for can_play_today function"""
    
    def test_can_play_today_no_challenge(self, db_session, test_user):
        """Test can play when no challenge exists"""
        assert service.can_play_today(db_session, test_user.id) is True
    
    def test_can_play_today_not_completed(self, db_session, test_user):
        """Test can play when challenge exists but not completed"""
        service.start_daily_challenge(db_session, test_user.id)
        
        assert service.can_play_today(db_session, test_user.id) is True
    
    def test_can_play_today_already_completed(self, db_session, test_user):
        """Test cannot play when already completed today"""
        session = service.start_daily_challenge(db_session, test_user.id)
        
        # Complete the game
        challenge = db_session.query(WordleDailyChallenge).filter(
            WordleDailyChallenge.id == session.daily_challenge_id
        ).first()
        service.submit_guess(db_session, session.id, challenge.word)
        
        assert service.can_play_today(db_session, test_user.id) is False
