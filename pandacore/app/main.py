'''
Main file for the api of pandalora.

This file is the entry point for the api.
It is responsible for:
- Loading the environment variables
- Creating the FastAPI app
- Setting up CORS for frontend integration
- Creating the routes for text/speech processing and AI integration
- Running the app with WebSocket support
'''

import os
import logging

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load environment variables FIRST
load_dotenv()

# Import our custom modules AFTER loading environment
from .api import router
from .models import TextInput

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app with enhanced configuration
app = FastAPI(
    title="PandaLora Backend API",
    description="API for processing user input (text/speech) and interacting with AI models for the talking panda application. Features real-time streaming and WebSocket support.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router, prefix="/api/v1")

# Basic health check
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    """Health check endpoint to verify API is running."""
    return {
        "status": "healthy",
        "service": "PandaLora Backend API",
        "version": "1.0.0",
        "features": [
            "Text input processing",
            "Speech input processing", 
            "AI model integration (Gemini)",
            "Real-time streaming responses",
            "WebSocket support",
            "Conversation history"
        ]
    }

# Legacy endpoint for backward compatibility
@app.post("/chat")
async def chat_with_panda_legacy(input_data: TextInput):
    """Legacy chat endpoint - redirects to new text chat endpoint."""
    logger.info(f"Legacy endpoint called with: {input_data.text}")
    
    # This would redirect to the new endpoint, but for now we'll provide a simple response
    return {
        "message": "Please use the new endpoints: /api/v1/chat/text for text input or /api/v1/chat/speech for speech input",
        "legacy_response": f"PandaLora received: '{input_data.text}'. (Please migrate to new API endpoints)"
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("Starting PandaLora Backend API...")
    logger.info("✅ FastAPI server started")
    logger.info("✅ CORS middleware configured")
    logger.info("✅ API routes loaded")
    logger.info("✅ WebSocket support enabled")
    
    # Check if Gemini API key is configured
    if os.getenv("GEMINI_API_KEY"):
        logger.info("✅ Gemini API key found")
    else:
        logger.warning("⚠️  GEMINI_API_KEY not found - AI features will use fallback responses")
    
    logger.info("🐼 PandaLora is ready to chat!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    logger.info("Shutting down PandaLora Backend API...")
    logger.info("👋 Goodbye!")

if __name__ == "__main__":
    import uvicorn
    
    # Run the application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )