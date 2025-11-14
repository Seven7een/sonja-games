from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.core.routers import auth_router
from app.games.wordle.router import router as wordle_router

app = FastAPI(
    title="Sonja Games API",
    description="Backend API for Sonja Games minigame platform",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(auth_router)
app.include_router(wordle_router)


@app.get("/")
async def root():
    return {"message": "Welcome to Sonja Games API"}


@app.get("/health")
async def health_check():
    return {"status": "healthy", "environment": settings.ENVIRONMENT}
