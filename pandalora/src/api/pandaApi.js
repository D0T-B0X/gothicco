import axios from 'axios';

// Define the base URL for the backend API.
const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

// Create an object to encapsulate API call functions.
const pandaApi = {
    /**
     * Sends a text message to the backend.
     * @param {string} message - The text message to send.
     * @param {string|null} conversation_id - The ID of the current conversation.
     * @returns {Promise<object>} The response data from the API.
     * @throws {Error} If the API call fails.
     */
    async sendMessage(message, conversation_id = null) {
        // Construct the full endpoint URL for sending text messages.
        const endpoint = `${API_BASE_URL}/chat/text`;
        // Prepare query parameters, including conversation_id if provided.
        const params = conversation_id ? { conversation_id : conversation_id } : {};

        try {
            // Make a POST request to the endpoint.
            // The request body contains the message text and input type.
            const response = await axios.post(endpoint,
                { text: message, input_type: "text" }, // Request body
                { params } // Query parameters
            );
            return response.data;
        } catch (error) {
            // Log the error to the console for debugging.
            console.error("Error sending message: ", error);
            // Re-throw the error to be handled by the calling function.
            throw error;
        }
    },

    /**
     * Creates a new conversation session with the backend.
     * @returns {Promise<object>} The response data from the API, typically including a new conversation_id.
     * @throws {Error} If the API call fails.
     */
    async createConversation() {
        try {
            // Make a POST request to the new conversation endpoint.
            const response = await axios.post(`${API_BASE_URL}/conversation/new`); // Corrected template literal
            // Return the data part of the API response.
            return response.data;
        } catch (error) {
            // Log the error to the console.
            console.error("Error creating conversation: ", error);
            // Re-throw the error.
            throw error;
        }
    },

    /**
     * Sends an audio file (blob) to the backend for speech-to-text processing.
     * @param {Blob} audioBlob - The audio data as a Blob object.
     * @param {string} language - The language of the audio (defaults to "en-US").
     * @param {string|null} conversation_id - The ID of the current conversation.
     * @returns {Promise<object>} The response data from the API, typically including transcribed text and AI response.
     * @throws {Error} If the API call fails.
     */
    async sendSpeech(audioBlob, language = "en-US", conversation_id = null) {
        // Construct the full endpoint URL for sending speech.
        const endpoint = `${API_BASE_URL}/chat/speech`;
        // Create a FormData object to send the file and other data.
        const formData = new FormData();

        // Append the audio file and language to the FormData.
        formData.append('audio_file', audioBlob); // The audio file itself
        formData.append('language', language);   // The language of the speech

        // Configuration for the axios request, specifying the Content-Type for file uploads.
        const config = {
            headers: { 'Content-Type': 'multipart/form-data' }
        };

        // If a conversation_id is provided, add it as a query parameter.
        if(conversation_id) {
            config.params = { conversation_id: conversation_id };
        }

        try {
            // Make a POST request with the FormData and configuration.
            const response = await axios.post(endpoint, formData, config);
            // Return the data part of the API response.
            return response.data;
        } catch (error) {
            // Log the error to the console.
            console.error("Error sending speech: ", error);
            // Re-throw the error.
            throw error;
        }
    }
};

// Export the pandaApi object to be used in other parts of the application.
export default pandaApi;