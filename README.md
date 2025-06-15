# PandaLora - Your Goth AI Panda Companion

PandaLora is an interactive application featuring a 3D talking panda powered by AI. Engage in conversations via text or voice, and experience a unique AI personality with a penchant for the gothic. This project combines a React-based frontend with a Python FastAPI backend.

## ✨ Features

**User Experience & Frontend:**
*   **Interactive 3D Panda:** A visually engaging 3D panda avatar that animates while "talking."
*   **Dual Input Modes:** Communicate via traditional text chat or use your voice for a hands-free experience.
*   **Real-time Feedback:** Visual cues for when the panda is "listening," "typing" (processing), or "talking."
*   **Dynamic Speech Bubble:** AI responses are displayed in a speech bubble above the panda.
*   **Responsive Design:** Interface designed for a pleasant user experience.

**AI & Backend Capabilities:**
*   **Intelligent Conversations:** Powered by Google's Gemini AI, providing context-aware and engaging responses.
*   **Unique Goth Panda Personality:** The AI embodies a calm, reserved, and subtly goth persona with dry humor.
*   **Speech-to-Text:** Converts your voice input into text for the AI to process.
*   **Text-to-Speech (Backend Driven):** AI text responses are converted to audio by the backend (using Gemini's TTS features) and played by the frontend, giving the panda its voice.
*   **Conversation History:** Maintains context within a session for more coherent interactions.
*   **Efficient Backend:** Built with FastAPI for high performance.
*   **Streaming Support (Backend):** Capable of streaming responses for potentially faster perceived interaction (though current frontend might not fully utilize SSE/WebSocket streaming for message display).

## 🛠️ Project Structure

The project is organized into two main directories:

*   `pandalora/`: Contains the frontend React application.
    *   `src/`: Main source code for the React app.
        *   `App.js`: Main application component.
        *   `pandachat.jsx`: Core chat interface component.
        *   `api/pandaApi.js`: Client for backend API communication.
        *   `components/glbviewer.jsx`: Renders the 3D panda model.
*   `pandacore/`: Contains the backend FastAPI application.
    *   `app/`: Main source code for the FastAPI app.
        *   `main.py`: FastAPI application entry point and core configuration.
        *   `api.py`: Defines API routes for chat, speech, etc.
        *   `services.py`: Business logic, AI integration (Gemini), speech processing.
        *   `models.py`: Pydantic models for data validation.
    *   `requirements.txt`: Python dependencies.
    *   `.env` (you'll need to create this): For environment variables like API keys.

## ⚙️ Technologies Used

*   **Frontend (`pandalora`):**
    *   React
    *   JavaScript (JSX)
    *   Axios (for API calls)
    *   React Three Fiber & Drei (for 3D rendering)
    *   HTML5 Web Speech API (SpeechRecognition, MediaRecorder)
    *   CSS (inline styles and basic CSS)
*   **Backend (`pandacore`):**
    *   Python 3.9+
    *   FastAPI (web framework)
    *   Uvicorn (ASGI server)
    *   Google Generative AI SDK (for Gemini text and speech)
    *   SpeechRecognition (library for audio input processing)
    *   Pydub (for audio manipulation)
    *   Python-dotenv (for environment variables)
*   **Development & Workflow:**
    *   Node.js & npm
    *   Python Virtual Environment
    *   Concurrently (to run frontend and backend simultaneously)
    *   Git

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   **Node.js:** Latest LTS version recommended (e.g., v18+). This includes npm.
*   **Python:** Version 3.9 or higher. This includes pip.
*   **Git:** For cloning the repository.

## 🚀 Setup and Installation

Follow these steps to get the project running locally:

1.  **Clone the Repository:**
    ```bash
    git clone <your-repository-url>
    cd <repository-name> # e.g., cd gothicco
    ```

2.  **Backend Setup (`pandacore`):**
    *   Navigate to the backend directory:
        ```bash
        cd pandacore
        ```
    *   Create and activate a Python virtual environment:
        ```bash
        python -m venv .venv 
        # On macOS/Linux:
        source .venv/bin/activate
        # On Windows (PowerShell):
        # .\.venv\Scripts\Activate.ps1
        # On Windows (CMD):
        # .\.venv\Scripts\activate.bat
        ```
    *   Install Python dependencies:
        ```bash
        pip install -r requirements.txt
        ```
    *   Create an environment file:
        Copy `.env.example` to `.env` if an example file exists, or create a new `.env` file in the `pandacore` directory.
        Add your Google Gemini API key:
        ```env
        # /home/DotBox/Programming/mlsa_hackathon/gothicco/pandacore/.env
        GEMINI_API_KEY="YOUR_GEMINI_API_KEY_HERE"
        
        # Optional: You can also define HOST and PORT if needed, but defaults are usually fine.
        # HOST=0.0.0.0
        # PORT=8000
        ```
        **Important:** Replace `"YOUR_GEMINI_API_KEY_HERE"` with your actual API key.

3.  **Frontend Setup (`pandalora`):**
    *   Navigate to the frontend directory (from the project root):
        ```bash
        cd ../pandalora 
        # Or if you are in pandacore, cd ../pandalora
        # Or if you are at the root, cd pandalora
        ```
    *   Install Node.js dependencies:
        ```bash
        npm install
        ```

## ▶️ Running the Application

Once both backend and frontend are set up, you can start the entire application with a single command:

1.  **Navigate to the frontend directory (`pandalora`):**
    ```bash
    # If you are not already there:
    cd /path/to/your/project/gothicco/pandalora 
    ```

2.  **Run the development script:**
    ```bash
    npm run dev
    ```
    This command uses `concurrently` (defined in `pandalora/package.json`) to:
    *   Start the React frontend development server (usually on `http://localhost:3000`).
    *   Start the FastAPI backend server (usually on `http://127.0.0.1:8000`).

3.  **Open the Application:**
    Open your web browser and navigate to `http://localhost:3000`.

You should now see the PandaLora application running!

## 💡 How It Works

1.  The **React frontend (`pandalora`)** renders the chat interface and the 3D panda.
2.  User input (text or voice) is captured by `pandachat.jsx`.
    *   Voice input is processed using the browser's `SpeechRecognition` and `MediaRecorder` APIs.
3.  The `pandaApi.js` client sends the processed input to the **FastAPI backend (`pandacore`)**.
4.  The backend's `api.py` routes the request to the appropriate service in `services.py`.
    *   `SpeechService` transcribes audio to text if needed.
    *   `GeminiAIService` interacts with the Google Gemini API, incorporating the "goth panda" system prompt and conversation history, to generate a text response. It then uses Gemini's TTS capabilities to generate audio data for this response.
    *   `ConversationService` manages the chat history for the session.
5.  The backend sends back a JSON response containing the AI's text reply and the base64 encoded audio data.
6.  The frontend receives this response:
    *   Displays the AI's text message.
    *   Plays the received audio data, making the panda "speak."
    *   Updates UI animations (e.g., talking panda).

## 🔧 Troubleshooting

*   **`GEMINI_API_KEY` not found:** Ensure your `.env` file is correctly placed in the `pandacore` directory and contains your valid API key. The backend logs will indicate if the key is missing.
*   **Backend not starting (`No module named uvicorn` or similar):** Make sure you have activated the Python virtual environment for `pandacore` before running `npm run dev` or when installing dependencies. The `npm run dev` script in `pandalora/package.json` attempts to use the Python executable from `pandacore/.venv/bin/python`. Verify this path is correct for your setup.
*   **Port conflicts:** If `localhost:3000` or `localhost:8000` are in use, `npm run dev` might fail or one of the services might not start. Ensure these ports are free.
*   **Microphone Permissions:** The browser will ask for microphone permission for voice input. Ensure you grant it.
*   **Frontend Warnings (ESLint, Source Maps):** The console might show some frontend warnings (e.g., unused variables, source map issues). These are generally non-critical for functionality but should be addressed for code quality.

---

Enjoy your conversations with PandaLora!