# PandaCore Backend

This repository contains the backend services for PandaCore, a sophisticated AI-powered talking panda application. The backend processes user input (text or speech), interfaces with Google's Gemini AI model, and streams intelligent responses in real-time to create an interactive conversational experience.

## 🚀 Features

### Core Functionality
- **🎤 Speech/Text Input Processing**: Handles user input in both text and speech formats with automatic speech recognition
- **🤖 AI Model Integration**: Seamless integration with Google's Gemini AI for intelligent, context-aware responses
- **⚡ Real-time Streaming**: Server-Sent Events (SSE) for streaming AI responses to the frontend
- **🎵 Text-to-Speech**: Converts AI responses to speech for the talking panda experience

### Advanced Features
- **📝 Conversation History**: Maintains context across conversations for better user experience
- **🔄 WebSocket Support**: Real-time bidirectional communication
- **📊 Health Monitoring**: Built-in health check endpoints
- **🛡️ Error Handling**: Comprehensive error handling and logging
- **⚙️ Configuration Management**: Environment-based configuration

## 🛠️ Setup

To set up and run the backend, follow these steps:

### Prerequisites
- Python 3.8+
- pip (Python package installer)
- Virtual environment (recommended)

### Installation

1.  **Clone the repository**:

    ```bash
    git clone https://github.com/your-username/pandalora.git
    cd pandalora/pandacore
    ```

2.  **Create a virtual environment** (recommended):

    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows, use `.\venv\Scripts\activate`
    ```

3.  **Install dependencies**:

    ```bash
    pip install -r requirements.txt
    ```

4.  **Environment Configuration**:

    Create a `.env` file in the `pandacore` directory with your API keys and configurations:

    ```env
    # Required: Google Gemini API Key
    GEMINI_API_KEY=your_gemini_api_key_here
    
    # Optional: Server Configuration
    HOST=0.0.0.0
    PORT=8000
    DEBUG=True
    
    # Optional: CORS Configuration
    CORS_ORIGINS=["http://localhost:3000", "http://127.0.0.1:3000"]
    ```

5.  **Run the application**:

    ```bash
    # Development mode with auto-reload
    uvicorn app.main:app --reload
    
    # Production mode
    uvicorn app.main:app --host 0.0.0.0 --port 8000
    ```

    The API will be accessible at `http://127.0.0.1:8000`.

## 📋 API Endpoints

### Core Endpoints

#### Text Chat
- **POST** `/chat/text` - Send text message to the AI panda
  ```json
  {
    "message": "Hello panda!",
    "user_id": "user123"
  }
  ```

#### Speech Processing
- **POST** `/chat/speech` - Upload audio file for speech recognition and AI response
  - Accepts audio files (WAV, MP3, OGG, FLAC)
  - Returns transcribed text and AI response

#### Real-time Streaming
- **GET** `/chat/stream/{user_id}` - Server-Sent Events endpoint for real-time responses
- **WebSocket** `/ws/{user_id}` - WebSocket connection for bidirectional communication

#### Text-to-Speech
- **POST** `/tts/generate` - Convert text to speech audio
  ```json
  {
    "text": "Hello from the panda!",
    "voice": "en-US-Standard-A"
  }
  ```

#### Utility Endpoints
- **GET** `/health` - Health check endpoint
- **GET** `/conversation/{user_id}` - Retrieve conversation history
- **DELETE** `/conversation/{user_id}` - Clear conversation history

### Response Format

All API responses follow this structure:
```json
{
  "success": true,
  "data": {
    // Response data
  },
  "message": "Success message",
  "timestamp": "2025-06-15T10:30:00Z"
}
```

## 🏗️ Project Structure

```
pandacore/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application and routes
│   ├── models.py            # Pydantic models for request/response
│   ├── services.py          # AI service and business logic
│   └── api.py               # API route handlers
├── .env                     # Environment variables (create this)
├── .env.example            # Environment variables template
├── requirements.txt        # Python dependencies
└── README.md              # This file
```

## 🔧 Dependencies

Key dependencies include:
- **FastAPI**: Modern web framework for building APIs
- **Uvicorn**: ASGI server for running FastAPI
- **Google GenerativeAI**: Gemini AI integration
- **SpeechRecognition**: Speech-to-text processing
- **gTTS**: Google Text-to-Speech
- **python-multipart**: File upload support
- **WebSockets**: Real-time communication

## 🚦 Usage Examples

### Text Chat
```bash
curl -X POST "http://localhost:8000/chat/text" \
  -H "Content-Type: application/json" \
  -d '{"message": "Tell me a joke!", "user_id": "user123"}'
```

### Speech Upload
```bash
curl -X POST "http://localhost:8000/chat/speech" \
  -F "audio=@recording.wav" \
  -F "user_id=user123"
```

### Real-time Streaming
```javascript
const eventSource = new EventSource('http://localhost:8000/chat/stream/user123');
eventSource.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('AI Response:', data.response);
};
```

## 🔐 Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GEMINI_API_KEY` | Yes | - | Google Gemini API key |
| `HOST` | No | `0.0.0.0` | Server host |
| `PORT` | No | `8000` | Server port |
| `DEBUG` | No | `False` | Debug mode |
| `CORS_ORIGINS` | No | `["*"]` | CORS allowed origins |

## 🧪 Testing

Run the development server and test the endpoints:

```bash
# Start the server
uvicorn app.main:app --reload

# Test health endpoint
curl http://localhost:8000/health

# Test text chat
curl -X POST http://localhost:8000/chat/text \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello!", "user_id": "test"}'
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow PEP 8 style guidelines
- Write descriptive commit messages
- Add tests for new features
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐼 About PandaCore

PandaCore is the backend engine that powers an interactive AI panda experience. It combines cutting-edge AI technology with real-time communication to create engaging conversations that feel natural and responsive.

For the frontend React application, check out the `pandalora` directory in the parent repository.

---

**Happy Coding! 🚀** 