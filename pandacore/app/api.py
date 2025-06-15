"""
API routes for PandaLora backend.
"""

import logging
import time
import uuid
from typing import Optional
from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Form
from fastapi.responses import StreamingResponse
from .models import TextInput, ChatResponse, StreamResponse, ChatMessage, InputType
from .services import speech_service, ai_service, conversation_service

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    """Manages WebSocket connections for real-time streaming."""
    
    def __init__(self):
        self.active_connections: list[WebSocket] = []
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: str, websocket: WebSocket):
        try:
            await websocket.send_text(message)
        except Exception as e:
            logger.error(f"Error sending WebSocket message: {e}")
            self.disconnect(websocket)

manager = ConnectionManager()

@router.post("/chat/text", response_model=ChatResponse)
async def chat_with_text(input_data: TextInput, conversation_id: Optional[str] = None):
    """Process text input and return AI response."""
    start_time = time.time()
    
    try:
        # Create conversation ID if not provided
        if not conversation_id:
            conversation_id = conversation_service.create_conversation_id()
        
        # Get conversation history
        history = conversation_service.get_conversation_history(conversation_id)
        
        # Add user message to history
        user_message = ChatMessage(role="user", content=input_data.text)
        conversation_service.add_message(conversation_id, user_message)
        
        # Generate AI response
        ai_response = await ai_service.generate_response(input_data.text, history)
        
        # Add AI response to history
        ai_message = ChatMessage(role="assistant", content=ai_response)
        conversation_service.add_message(conversation_id, ai_message)
        
        processing_time = time.time() - start_time
        
        return ChatResponse(
            response=ai_response,
            input_type=InputType.TEXT,
            processing_time=processing_time,
            conversation_id=conversation_id
        )
        
    except Exception as e:
        logger.error(f"Error in text chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/speech", response_model=ChatResponse)
async def chat_with_speech(
    audio_file: UploadFile = File(...),
    language: str = Form("en-US"),
    conversation_id: Optional[str] = Form(None)
):
    """Process speech input and return AI response."""
    start_time = time.time()
    
    try:
        # Validate file type
        if not audio_file.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Read audio data
        audio_data = await audio_file.read()
        
        # Convert speech to text
        text_input = await speech_service.speech_to_text(audio_data, language)
        logger.info(f"Speech converted to text: {text_input}")
        
        # Create conversation ID if not provided
        if not conversation_id:
            conversation_id = conversation_service.create_conversation_id()
        
        # Get conversation history
        history = conversation_service.get_conversation_history(conversation_id)
        
        # Add user message to history
        user_message = ChatMessage(role="user", content=text_input)
        conversation_service.add_message(conversation_id, user_message)
        
        # Generate AI response
        ai_response = await ai_service.generate_response(text_input, history)
        
        # Add AI response to history
        ai_message = ChatMessage(role="assistant", content=ai_response)
        conversation_service.add_message(conversation_id, ai_message)
        
        processing_time = time.time() - start_time
        
        return ChatResponse(
            response=ai_response,
            input_type=InputType.SPEECH,
            processing_time=processing_time,
            conversation_id=conversation_id
        )
        
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error in speech chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/chat/stream/{conversation_id}")
async def stream_chat_response(conversation_id: str, message: str):
    """Stream AI response for better user experience."""
    
    async def generate_stream():
        try:
            # Get conversation history
            history = conversation_service.get_conversation_history(conversation_id)
            
            # Add user message to history
            user_message = ChatMessage(role="user", content=message)
            conversation_service.add_message(conversation_id, user_message)
            
            # Generate streaming response
            full_response = ""
            async for chunk in ai_service.generate_streaming_response(message, history):
                full_response += chunk
                response_data = StreamResponse(
                    chunk=chunk,
                    is_complete=False,
                    conversation_id=conversation_id
                )
                yield f"data: {response_data.json()}\n\n"
            
            # Add complete AI response to history
            ai_message = ChatMessage(role="assistant", content=full_response)
            conversation_service.add_message(conversation_id, ai_message)
            
            # Send completion signal
            final_response = StreamResponse(
                chunk="",
                is_complete=True,
                conversation_id=conversation_id
            )
            yield f"data: {final_response.json()}\n\n"
            
        except Exception as e:
            logger.error(f"Error in streaming response: {e}")
            error_response = StreamResponse(
                chunk=f"Error: {str(e)}",
                is_complete=True,
                conversation_id=conversation_id
            )
            yield f"data: {error_response.json()}\n\n"
    
    return StreamingResponse(
        generate_stream(),
        media_type="text/plain",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Content-Type": "text/event-stream"
        }
    )

@router.websocket("/ws/chat/{conversation_id}")
async def websocket_chat(websocket: WebSocket, conversation_id: str):
    """WebSocket endpoint for real-time chat."""
    await manager.connect(websocket)
    
    try:
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            logger.info(f"Received WebSocket message: {data}")
            
            try:
                # Get conversation history
                history = conversation_service.get_conversation_history(conversation_id)
                
                # Add user message to history
                user_message = ChatMessage(role="user", content=data)
                conversation_service.add_message(conversation_id, user_message)
                
                # Stream AI response back
                full_response = ""
                async for chunk in ai_service.generate_streaming_response(data, history):
                    full_response += chunk
                    await manager.send_personal_message(chunk, websocket)
                
                # Add complete AI response to history
                ai_message = ChatMessage(role="assistant", content=full_response)
                conversation_service.add_message(conversation_id, ai_message)
                
                # Send end-of-response marker
                await manager.send_personal_message("[END]", websocket)
                
            except Exception as e:
                logger.error(f"Error processing WebSocket message: {e}")
                await manager.send_personal_message(f"Error: {str(e)}", websocket)
                
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        logger.info("WebSocket client disconnected")

@router.get("/conversation/{conversation_id}")
async def get_conversation_history(conversation_id: str):
    """Get conversation history."""
    history = conversation_service.get_conversation_history(conversation_id)
    return {"conversation_id": conversation_id, "messages": history}

@router.post("/conversation/new")
async def create_new_conversation():
    """Create a new conversation."""
    conversation_id = conversation_service.create_conversation_id()
    return {"conversation_id": conversation_id}
