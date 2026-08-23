"""
backend/app/main.py — FastAPI Application Entry Point

FastAPI app entry point. Wires together routes/*.py. Business logic lives in
services/*.py, not here.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import health, learner, mentor, profile, roadmap

app = FastAPI(title="AI-Powered Personalized Learning Path Recommender API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(learner.router, prefix="/api")
app.include_router(profile.router, prefix="/api")
app.include_router(roadmap.router, prefix="/api")
app.include_router(mentor.router, prefix="/api")


@app.get("/")
def root():
    return {"service": "learning-path-recommender-backend", "docs": "/docs"}
