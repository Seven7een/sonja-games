"""
Tests for Wordle API router endpoints
"""
import pytest
from datetime import date, timedelta
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db
from app.core.middleware.auth import get_current_user
from app.games.wordle.models import WordleDailyChallenge, WordleGameSession
from app.games.wordle import service


# Create test client
client = TestClient(app)


@pytest.fixture
def authenticated_client(db_session, test_user):
    """Create an authenticated test client with proper dependency overrides"""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    def override_get_current_user():
        return test_user
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user
    yield client
    app.dependency_overrides.clear()


class TestAuthentication:
    """Tests for authentication requirements"""
    
    def test_endpoints_require_authentication(self):
        """Test that all endpoints require authentication"""
        # Test without auth - should get 403
        response = client.get("/api/wordle/daily")
        assert response.status_code == 403
        
        response = client.post("/api/wordle/session", json={})
        assert response.status_code == 403
        
        response = client.get("/api/wordle/can-play-today")
        assert response.status_code == 403
        
        response = client.get("/api/wordle/stats")
        assert response.status_code == 403
        
        response = client.get("/api/wordle/history")
        assert response.status_code == 403


class TestGetGameSession:
    """Tests for GET /api/wordle/session/{session_id} endpoint"""
    
    def test_get_session_success(self, authenticated_client, db_session, test_user):
        """Test getting session details"""
        # Create session directly in database
        challenge = WordleDailyChallenge(
            date=date.today(),
            word="tests"
        )
        db_session.add(challenge)
        db_session.commit()
        
        session = WordleGameSession(
            user_id=test_user.id,
            daily_challenge_id=challenge.id,
            guesses=[],
            won=False,
            attempts_used=0
        )
        db_session.add(session)
        db_session.commit()
        
        response = authenticated_client.get(f"/api/wordle/session/{session.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == str(session.id)
        assert data["user_id"] == test_user.id
        assert data["guesses"] == []
    
    def test_get_session_with_guesses(self, authenticated_client, db_session, test_user):
        """Test getting session with guesses"""
        challenge = WordleDailyChallenge(
            date=date.today(),
            word="tests"
        )
        db_session.add(challenge)
        db_session.commit()
        
        session = WordleGameSession(
            user_id=test_user.id,
            daily_challenge_id=challenge.id,
            guesses=["about", "crane"],
            won=False,
            attempts_used=2
        )
        db_session.add(session)
        db_session.commit()
        
        response = authenticated_client.get(f"/api/wordle/session/{session.id}")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["guesses"]) == 2
        assert data["guesses"][0] == "about"
        assert data["guesses"][1] == "crane"
        assert data["attempts_used"] == 2
    
    def test_get_session_not_found(self, authenticated_client, db_session):
        """Test getting non-existent session"""
        fake_uuid = "00000000-0000-0000-0000-000000000000"
        response = authenticated_client.get(f"/api/wordle/session/{fake_uuid}")
        
        assert response.status_code == 404
        assert "not found" in response.json()["detail"]
    
    def test_get_session_wrong_user(self, authenticated_client, db_session):
        """Test that user cannot access another user's session"""
        # Create session for different user
        challenge = WordleDailyChallenge(
            date=date.today(),
            word="tests"
        )
        db_session.add(challenge)
        db_session.commit()
        
        session = WordleGameSession(
            user_id="other_user_456",
            daily_challenge_id=challenge.id,
            guesses=[],
            won=False,
            attempts_used=0
        )
        db_session.add(session)
        db_session.commit()
        
        response = authenticated_client.get(f"/api/wordle/session/{session.id}")
        
        assert response.status_code == 403
        assert "don't have access" in response.json()["detail"]


class TestCanPlayToday:
    """Tests for GET /api/wordle/can-play-today endpoint"""
    
    def test_can_play_today_true(self, authenticated_client, db_session):
        """Test can play when no session completed"""
        response = authenticated_client.get("/api/wordle/can-play-today")
        
        assert response.status_code == 200
        data = response.json()
        assert data["can_play"] is True
    
    def test_can_play_today_false(self, authenticated_client, db_session, test_user):
        """Test cannot play when already completed today"""
        # Create completed session for today
        challenge = WordleDailyChallenge(
            date=date.today(),
            word="tests"
        )
        db_session.add(challenge)
        db_session.commit()
        
        from datetime import datetime
        session = WordleGameSession(
            user_id=test_user.id,
            daily_challenge_id=challenge.id,
            guesses=["tests"],
            won=True,
            attempts_used=1,
            completed_at=datetime.utcnow()
        )
        db_session.add(session)
        db_session.commit()
        
        response = authenticated_client.get("/api/wordle/can-play-today")
        
        assert response.status_code == 200
        data = response.json()
        assert data["can_play"] is False


class TestGetUserStatistics:
    """Tests for GET /api/wordle/stats endpoint"""
    
    def test_get_stats_no_games(self, authenticated_client, db_session):
        """Test stats with no completed games"""
        response = authenticated_client.get("/api/wordle/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_games"] == 0
        assert data["wins"] == 0
        assert data["losses"] == 0
        assert data["win_percentage"] == 0.0
        assert data["current_streak"] == 0
        assert data["max_streak"] == 0
        assert data["guess_distribution"] == [0, 0, 0, 0, 0, 0]
    
    def test_get_stats_with_games(self, authenticated_client, db_session, test_user):
        """Test stats with completed games"""
        from datetime import datetime
        
        # Create a won game
        challenge = WordleDailyChallenge(
            date=date.today(),
            word="tests"
        )
        db_session.add(challenge)
        db_session.commit()
        
        session = WordleGameSession(
            user_id=test_user.id,
            daily_challenge_id=challenge.id,
            guesses=["tests"],
            won=True,
            attempts_used=1,
            completed_at=datetime.utcnow()
        )
        db_session.add(session)
        db_session.commit()
        
        response = authenticated_client.get("/api/wordle/stats")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total_games"] == 1
        assert data["wins"] == 1
        assert data["losses"] == 0
        assert data["win_percentage"] == 100.0


class TestGetGameHistory:
    """Tests for GET /api/wordle/history endpoint"""
    
    def test_get_history_empty(self, authenticated_client, db_session):
        """Test history with no games"""
        response = authenticated_client.get("/api/wordle/history")
        
        assert response.status_code == 200
        data = response.json()
        assert data["games"] == []
        assert data["total"] == 0
        assert data["page"] == 1
        assert data["page_size"] == 20
    
    def test_get_history_with_games(self, authenticated_client, db_session, test_user):
        """Test history with completed games"""
        from datetime import datetime
        
        # Create 2 completed games
        for i in range(2):
            challenge = WordleDailyChallenge(
                date=date.today() - timedelta(days=i),
                word="tests"
            )
            db_session.add(challenge)
            db_session.commit()
            
            session = WordleGameSession(
                user_id=test_user.id,
                daily_challenge_id=challenge.id,
                guesses=["tests"],
                won=True,
                attempts_used=1,
                completed_at=datetime.utcnow()
            )
            db_session.add(session)
            db_session.commit()
        
        response = authenticated_client.get("/api/wordle/history")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["games"]) == 2
        assert data["total"] == 2
        assert data["page"] == 1
        assert data["page_size"] == 20
    
    def test_get_history_pagination(self, authenticated_client, db_session, test_user):
        """Test history pagination"""
        from datetime import datetime
        
        # Create 3 completed games
        for i in range(3):
            challenge = WordleDailyChallenge(
                date=date.today() - timedelta(days=i),
                word="tests"
            )
            db_session.add(challenge)
            db_session.commit()
            
            session = WordleGameSession(
                user_id=test_user.id,
                daily_challenge_id=challenge.id,
                guesses=["tests"],
                won=True,
                attempts_used=1,
                completed_at=datetime.utcnow()
            )
            db_session.add(session)
            db_session.commit()
        
        # Get first page with page_size=2
        response = authenticated_client.get("/api/wordle/history?page=1&page_size=2")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["games"]) == 2
        assert data["total"] == 3
        assert data["page"] == 1
        assert data["page_size"] == 2
        
        # Get second page
        response = authenticated_client.get("/api/wordle/history?page=2&page_size=2")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["games"]) == 1
        assert data["total"] == 3
        assert data["page"] == 2
    
    def test_get_history_invalid_pagination(self, authenticated_client, db_session):
        """Test history with invalid pagination parameters"""
        # Page must be >= 1
        response = authenticated_client.get("/api/wordle/history?page=0")
        assert response.status_code == 422
        
        # Page size must be <= 100
        response = authenticated_client.get("/api/wordle/history?page_size=101")
        assert response.status_code == 422


class TestInputValidation:
    """Tests for input validation"""
    
    def test_submit_guess_invalid_format(self, authenticated_client, db_session, test_user):
        """Test submitting guess with invalid format"""
        # Create a session
        challenge = WordleDailyChallenge(
            date=date.today(),
            word="tests"
        )
        db_session.add(challenge)
        db_session.commit()
        
        session = WordleGameSession(
            user_id=test_user.id,
            daily_challenge_id=challenge.id,
            guesses=[],
            won=False,
            attempts_used=0
        )
        db_session.add(session)
        db_session.commit()
        
        # Too short
        response = authenticated_client.post(
            f"/api/wordle/session/{session.id}/guess",
            json={"guess": "abc"}
        )
        assert response.status_code == 422
        
        # Too long
        response = authenticated_client.post(
            f"/api/wordle/session/{session.id}/guess",
            json={"guess": "abcdef"}
        )
        assert response.status_code == 422
        
        # Non-alphabetic
        response = authenticated_client.post(
            f"/api/wordle/session/{session.id}/guess",
            json={"guess": "12345"}
        )
        assert response.status_code == 422
