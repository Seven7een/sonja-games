"""
Pytest configuration and fixtures for tests
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.database import Base
from app.core.models.user import User
# Import Wordle models to ensure tables are created
from app.games.wordle.models import WordleDailyChallenge, WordleGameSession


# Use in-memory SQLite for tests with StaticPool to share connection
TEST_DATABASE_URL = "sqlite:///:memory:"


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test"""
    # Use StaticPool to ensure the same connection is reused
    engine = create_engine(
        TEST_DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create session with expire_on_commit=False to avoid lazy loading issues
    TestingSessionLocal = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
        expire_on_commit=False
    )
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)
        engine.dispose()


@pytest.fixture
def test_user(db_session):
    """Create a test user"""
    user = User(
        id="test_user_123",
        email="test@example.com",
        username="testuser"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user
