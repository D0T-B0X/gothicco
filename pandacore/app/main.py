'''
Main file for the api of pandalora.

This file is the entry point for the api.
It is responsible for:
- Loading the environment variables
- Creating the FastAPI app
- Creating the database connection
- Creating the routes
- Running the app
'''

import os
import logging

from fastapi import FastAPI, Depends, Request, Response, APIRouter, HTTPException, status
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="PandaLora Backend API",
    description="API for processing user input and interacting with an AI model for the talking panda application.",
    version="0.1.0",
)

# Basic health check
@app.get("/health", status_code=status.HTTP_200_OK)
async def health_check():
    return {"status": "ok"}

class TextInput(BaseModel):
    text: str

@app.post("/chat")
async def chat_with_panda(input: TextInput):
    logger.info(f"Received text input: {input.text}")
    
    # Placeholder for ML model integration
    # In a real application, you would send input.text to an ML model (e.g., Gemini, ChatGPT)
    # and get a response.
    
    ai_response = f"Panda received: '{input.text}'. (This is a placeholder response)"
    logger.info(f"AI model responded: {ai_response}")
    
    return {"response": ai_response}