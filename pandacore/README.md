# PandaLora Backend

This repository contains the backend services for PandaLora, an application that streams an interactive talking panda to the user's frontend. Similar to 'Talking Tom', this backend processes user input (text or speech), interfaces with an AI model (like ChatGPT or Gemini), and generates responses.

## Features

- **Speech/Text Input Processing**: Handles user input in both text and speech formats.
- **AI Model Integration**: Communicates with large language models (e.g., Gemini) to generate intelligent responses.
- **Real-time Streaming**: Prepares and streams AI-generated responses to the frontend for the talking panda.

## Setup

To set up and run the backend, follow these steps:

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

    *Note: A `requirements.txt` file will be created shortly.* 

4.  **Environment Variables**:

    Create a `.env` file in the `pandacore` directory with your API keys and other configurations. For example:

    ```
    GEMINI_API_KEY=YOUR_GEMINI_API_KEY
    ```

5.  **Run the application**:

    ```bash
    uvicorn app.main:app --reload
    ```

    The API will be accessible at `http://127.0.0.1:8000`.

## Project Structure

```
pandacore/
├── app/
│   ├── main.py
│   └── ... (other modules for API routes, logic)
├── venv/
├── .env
├── requirements.txt
└── README.md
```

## Contributing

Contributions are welcome! Please refer to the contributing guidelines for more information. 