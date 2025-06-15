"""
AI and Speech processing services for PandaLora.
"""

import os
import logging
import asyncio
import io
import time
from typing import AsyncGenerator, Optional
import speech_recognition as sr
import google.generativeai as genai
from pydub import AudioSegment
from .models import ChatMessage, InputType

logger = logging.getLogger(__name__)

class SpeechService:
    """Service for handling speech-to-text conversion."""
    
    def __init__(self):
        self.recognizer = sr.Recognizer()
        # Optimize recognizer settings
        self.recognizer.energy_threshold = 300
        self.recognizer.dynamic_energy_threshold = True
        self.recognizer.pause_threshold = 0.8
        
    async def speech_to_text(self, audio_data: bytes, language: str = "en-US") -> str:
        """Convert speech audio to text."""
        try:
            # Convert bytes to AudioFile format that speech_recognition can use
            audio_segment = AudioSegment.from_file(io.BytesIO(audio_data))
            
            # Convert to wav format for better compatibility
            wav_data = io.BytesIO()
            audio_segment.export(wav_data, format="wav")
            wav_data.seek(0)
            
            # Use speech recognition
            with sr.AudioFile(wav_data) as source:
                audio = self.recognizer.record(source)
                
            # Perform recognition
            text = await asyncio.get_event_loop().run_in_executor(
                None, 
                lambda: self.recognizer.recognize_google(audio, language=language)
            )
            
            logger.info(f"Speech-to-text successful: {text[:50]}...")
            return text
            
        except sr.UnknownValueError:
            logger.warning("Could not understand the audio")
            raise ValueError("Could not understand the audio")
        except sr.RequestError as e:
            logger.error(f"Speech recognition service error: {e}")
            raise RuntimeError(f"Speech recognition service error: {e}")
        except Exception as e:
            logger.error(f"Error in speech-to-text conversion: {e}")
            raise RuntimeError(f"Error processing audio: {e}")

class GeminiAIService:
    """Service for integrating with Google's Gemini AI model."""
    
    def __init__(self):
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            logger.warning("GEMINI_API_KEY not found in environment variables")
        else:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash-lite')
        
        # Panda personality prompt
        self.system_prompt = """
        You are a friendly, wise, and playful talking panda named gothicco bambinipanda or 'gbp' for short. You love to help users with their questions and provide thoughtful, engaging responses. You have a warm personality and occasionally reference your love for bamboo, nature, and peaceful living. Keep your responses conversational and friendly, but also informative and helpful. You can discuss any topic but always maintain your panda personality.
        """
    
    async def generate_response(self, message: str, conversation_history: list = None) -> str:
        """Generate a single response from Gemini."""
        if not self.api_key:
            return "I'm sorry, but I'm not properly configured to connect to my AI brain right now. Please check that the GEMINI_API_KEY is set up correctly."
        
        try:
            # Prepare the full conversation context
            context = self.system_prompt + "\n\n"
            
            if conversation_history:
                for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                    role_prefix = "Human: " if msg.role == "user" else "PandaLora: "
                    context += f"{role_prefix}{msg.content}\n"
            
            context += f"Human: {message}\nPandaLora: "
            
            # Generate response
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(context)
            )
            
            return response.text.strip()
            
        except Exception as e:
            logger.error(f"Error generating AI response: {e}")
            return f"Oops! I had a little brain hiccup there. As a panda, sometimes I get distracted by thoughts of bamboo! Could you try asking me again?"
    
    async def generate_streaming_response(self, message: str, conversation_history: list = None) -> AsyncGenerator[str, None]:
        """Generate a streaming response from Gemini."""
        if not self.api_key:
            yield "I'm sorry, but I'm not properly configured to connect to my AI brain right now. Please check that the GEMINI_API_KEY is set up correctly."
            return
        
        try:
            # Prepare the full conversation context
            context = self.system_prompt + "\n\n"
            
            if conversation_history:
                for msg in conversation_history[-10:]:  # Keep last 10 messages for context
                    role_prefix = "Human: " if msg.role == "user" else "PandaLora: "
                    context += f"{role_prefix}{msg.content}\n"
            
            context += f"Human: {message}\nPandaLora: "
            
            # Generate streaming response
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.model.generate_content(
                    context,
                    stream=True
                )
            )
            
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    await asyncio.sleep(0.01)  # Small delay for better streaming effect
                    
        except Exception as e:
            logger.error(f"Error generating streaming AI response: {e}")
            yield f"Oops! I had a little brain hiccup there. As a panda, sometimes I get distracted by thoughts of bamboo! Could you try asking me again?"

class ConversationService:
    """Service for managing conversation history and context."""
    
    def __init__(self):
        self.conversations = {}  # In production, this would be a database
    
    def get_conversation_history(self, conversation_id: str) -> list:
        """Get conversation history by ID."""
        return self.conversations.get(conversation_id, [])
    
    def add_message(self, conversation_id: str, message: ChatMessage):
        """Add a message to conversation history."""
        if conversation_id not in self.conversations:
            self.conversations[conversation_id] = []
        
        self.conversations[conversation_id].append(message)
        
        # Keep only last 50 messages to prevent memory issues
        if len(self.conversations[conversation_id]) > 50:
            self.conversations[conversation_id] = self.conversations[conversation_id][-50:]
    
    def create_conversation_id(self) -> str:
        """Create a new conversation ID."""
        import uuid
        return str(uuid.uuid4())

# Global service instances
speech_service = SpeechService()
ai_service = GeminiAIService()
conversation_service = ConversationService()
