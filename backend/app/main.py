from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.routers import auth_router
from app.games.wordle.router import router as wordle_router
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Sonja Games API",
    description="Backend API for Sonja Games minigame platform",
    version="0.1.0"
)

# Configure CORS
logger.info(f"Configuring CORS with origins: {settings.cors_origins_list}")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
logger.info("Registering routers...")
app.include_router(auth_router)
app.include_router(wordle_router)
logger.info("Routers registered successfully")


@app.on_event("startup")
async def startup_event():
    logger.info("=" * 50)
    logger.info("🚀 Sonja Games API Starting Up")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"CORS Origins: {settings.cors_origins_list}")
    logger.info(f"Database URL: {settings.DATABASE_URL[:30]}...")
    logger.info(f"Clerk configured: {bool(settings.CLERK_SECRET_KEY)}")
    logger.info("=" * 50)


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("🛑 Sonja Games API Shutting Down")


@app.get("/")
async def root():
    return {"message": "Welcome to Sonja Games API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
