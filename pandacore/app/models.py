"""
Data models for the PandaLora application.
"""

from pydantic import BaseModel
from typing import Optional, List
from enum import Enum

class InputType(str, Enum):
    TEXT = "text"
    SPEECH = "speech"

class TextInput(BaseModel):
    text: str
    input_type: InputType = InputType.TEXT

class SpeechInput(BaseModel):
    audio_data: bytes
    input_type: InputType = InputType.SPEECH
    language: str = "en-US"

class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str
    timestamp: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    input_type: InputType
    processing_time: float
    conversation_id: Optional[str] = None

class StreamResponse(BaseModel):
    chunk: str
    is_complete: bool
    conversation_id: Optional[str] = None

class ConversationHistory(BaseModel):
    conversation_id: str
    messages: List[ChatMessage]
    created_at: str
    updated_at: str
