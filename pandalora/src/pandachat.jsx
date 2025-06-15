import React, { useRef, useState, useEffect } from "react";
import GLBViewer from './components/glbviewer'; // Component to display the 3D Panda model
import pandaApi from "./api/pandaApi"; // API client for backend communication

const PANDA_AVATAR = "/assets/panda-avatar.png";

const PandaChat = () => {
  // Refs for managing browser APIs and DOM elements directly
  const recognitionRef = useRef(null); // Holds the SpeechRecognition instance
  const isRecognitionActive = useRef(false); // Tracks if speech recognition is currently active
  const mediaRecorderRef = useRef(null); // Holds the MediaRecorder instance for audio capture
  const audioChunksRef = useRef([]); // Stores chunks of recorded audio data

  // State variables for managing component's data and UI
  const [isListening, setIsListening] = useState(false); // True if the app is actively listening for voice input
  const [input, setInput] = useState(""); // Current text in the input field
  const [messages, setMessages] = useState([]); // Array of chat messages 
  const [pandaTyping, setPandaTyping] = useState(false); // True if panda is "typing" 
  const [pandaTalking, setPandaTalking] = useState(false); // True if panda is "talking" 
  const [avatarBounce, setAvatarBounce] = useState(false); // True to trigger avatar bounce animation
  const [conversation_id, setConversationId] = useState(null); // ID for the current chat conversation

  // useEffect hook to initialize a new conversation when the component mounts
  useEffect(() => {
    async function initConversation() {
      try {
        const result = await pandaApi.createConversation(); // API call to create a new conversation
        setConversationId(result.conversation_id); // Store the received conversation ID
        console.log("Conversation created:", result.conversation_id);
      } catch (error) {
        setMessages(prev => [...prev, {
          sender: "panda",
          text: "Something went wrong. Please try again."
        }]);
      }
    }

    initConversation(); // Call the initialization function
  }, []); // Empty dependency array means this runs once on mount

  // Function to start voice input recognition
  const startListening = () => {
    // Get the browser's SpeechRecognition API, with vendor prefix for compatibility
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    // Check if SpeechRecognition is supported by the browser
    if (!SpeechRecognition) {
      setMessages(prev => [...prev, {
        sender: "panda",
        text: "Speech recognition isn't working properly. Try changing your browser to typing your message instead"
      }]);
      return;
    }

    // Timeout to stop listening if no speech is detected
    const timeoutID = setTimeout(() => {
      if(isRecognitionActive.current) {
        stopListening();
        setMessages(prev => [...prev, {
          sender: "panda",
          text: "I didn't hear anything. Please try speaking again or typing your message."
        }]);
      }
    }, 10000); // 10 seconds timeout 

    // Request microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        audioChunksRef.current = []; // Reset audio chunks for new recording
        mediaRecorderRef.current = new MediaRecorder(stream); // Initialize MediaRecorder with the audio stream

        // Event handler for when MediaRecorder has new audio data
        mediaRecorderRef.current.ondataavailable = (event) => {
          if(event.data.size > 0) {
            audioChunksRef.current.push(event.data); // Store the audio chunk
          }
        };

        // Initialize SpeechRecognition
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false; // Stop after first detection of speech
        recognitionRef.current.lang = "en-US"; // Set language
        recognitionRef.current.interimResults = false; // Only final results

        // Event handler when speech recognition starts
        recognitionRef.current.onstart = () => {
          isRecognitionActive.current = true;
          setIsListening(true); // Update UI state
          mediaRecorderRef.current.start(); // Start recording audio
        }

        // Event handler when speech recognition ends
        recognitionRef.current.onend = () => {
          isRecognitionActive.current = false;
          setIsListening(false); // Update UI state

          // Stop MediaRecorder if it's still recording
          if(mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
            mediaRecorderRef.current.stop();
          }

          clearTimeout(timeoutID); // Clear the no-speech timeout
        };

        // Event handler when speech recognition produces a result (transcribed text)
        recognitionRef.current.onresult = (event) => {
          const spoken = event.results[0][0].transcript; // Get the transcribed text
          setInput(spoken); // Set the input field with the spoken text
          // Add the spoken text as a user message to the chat
          setMessages(prev => [...prev, {
            sender: "you",
            text: spoken,
          }]);
        };

        // Event handler when MediaRecorder stops recording
        mediaRecorderRef.current.onstop = async () => {
          stream.getTracks().forEach(track => track.stop()); // Release microphone access

          // Create a Blob from the recorded audio chunks
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });

          try {
            setPandaTyping(true); // Indicate panda is processing

            // Send the audio blob to the backend API
            const response = await pandaApi.sendSpeech(audioBlob, "en-US", conversation_id);

            setPandaTalking(true); // Trigger panda talking animation
            setPandaTyping(false); // Panda is no longer "typing"

            // Add panda's response to the chat messages
            const pandaMessage = {
              sender: "panda",
              text: response.response,
            };
            setMessages(prev => [...prev, pandaMessage]);

            // If the backend indicates the response was to speech, use browser's TTS
            if(response.input_type === "speech" && response.audio_data && response.audio_format) {
              // This part assumes playAudioResponse function is defined and handles base64 audio
              // playAudioResponse(response.audio_data, response.audio_format);
              // If not using playAudioResponse, and relying on browser TTS for text:
              const utterance = new SpeechSynthesisUtterance(response.response);
              // Configure voice (optional)
              const voices = window.speechSynthesis.getVoices();
              const voice = voices.find(v => v.name.includes('Female') || v.name.includes('female'));
              if (voice) utterance.voice = voice;
              utterance.onend = () => setPandaTalking(false); // Stop animation when speech ends
              window.speechSynthesis.speak(utterance);
            } else if (response.audio_data && response.audio_format) {
                // If backend sent audio data (e.g., from Gemini TTS)
                // This part assumes playAudioResponse function is defined and handles base64 audio
                // playAudioResponse(response.audio_data, response.audio_format);
                // For now, let's use browser TTS as a placeholder if playAudioResponse isn't here
                const utterance = new SpeechSynthesisUtterance(response.response);
                utterance.onend = () => setPandaTalking(false);
                window.speechSynthesis.speak(utterance);
            } else {
              // Fallback animation timing if no specific audio playback
              const talkTime = Math.min(900 + pandaMessage.text.length * 30, 3000);
              setTimeout(() => setPandaTalking(false), talkTime);
            }

          } catch (error) {
            console.error("Error processing speech:", error);
            setPandaTyping(false);
            setMessages(prev => [...prev, {
              sender: "panda",
              text: "Sorry, I couldn't process your audio. Please try again."
            }]);
          }
        };

        recognitionRef.current.start(); // Start speech recognition
      })
      .catch(error => {
        console.error("Error accessing your microphone: ", error);
        setMessages(prev => [...prev, {
          sender: "panda",
          text: "I couldn't access your microphone, Please check your permissions",
        }]);
      });
  };

  // Function to stop voice input recognition
  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop(); // Stop speech recognition
    }
    // UI state updates are handled by recognitionRef.current.onend

    // Stop MediaRecorder if it's still recording
    if(mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    // Ensure states are reset if stopListening is called abruptly
    setIsListening(false);
    isRecognitionActive.current = false;
  };

  // Function to handle sending a text message
  const handleSend = async () => {
    if (!input.trim()) return; // Don't send empty messages

    // Add user's message to the chat UI
    const userMessage = { sender: "you", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput(""); // Clear the input field
    setPandaTyping(true); // Indicate panda is processing

    try {
      // Send the text message to the backend API
      const response = await pandaApi.sendMessage(input, conversation_id);

      setPandaTyping(false); // Panda is no longer "typing"
      setPandaTalking(true); // Trigger panda talking animation

      // Add panda's response to the chat messages
      const pandaMessage = {
        sender: "panda",
        text: response.response || "I'm not sure how to respond to that.", // Fallback response
      };
      setMessages((prev) => [...prev, pandaMessage]);
      
      // If backend sent audio data for the text response
      if (response.audio_data && response.audio_format) {
        // This part assumes playAudioResponse function is defined and handles base64 audio
        // playAudioResponse(response.audio_data, response.audio_format);
        // For now, let's use browser TTS as a placeholder if playAudioResponse isn't here
        const utterance = new SpeechSynthesisUtterance(response.response);
        utterance.onend = () => setPandaTalking(false);
        window.speechSynthesis.speak(utterance);
      } else {
        // Fallback animation timing if no specific audio playback
        const talkTime = Math.min(900 + pandaMessage.text.length * 30, 3000);
        setTimeout(() => setPandaTalking(false), talkTime);
      }

    } catch (error) {
      console.error("error getting response: ", error);
      setPandaTyping(false);
      // Display an error message in the chat
      const errorMsg = {
        sender: "panda",
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    }
  };

  // Function to handle clicking the panda avatar (triggers bounce animation)
  const handleAvatarClick = () => {
    setAvatarBounce(true);
    setTimeout(() => setAvatarBounce(false), 500); // Reset bounce after 0.5s
  };

  // JSX for rendering the chat interface
  return (
    <div
      // Main container styling
      style={{
        background: "#23272f",
        color: "#fff",
        minHeight: "100vh",
        minHeight: "100dvh", // For better mobile viewport height
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        justifyContent: "flex-end", // Aligns input bar to the bottom
        boxSizing: "border-box",
        padding: 0,
      }}
    >
      <div
        // Panda avatar and speech bubble area
        style={{
          flex: 1, // Takes up available vertical space
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative", // For positioning speech bubble
          minHeight: 0, // Allows shrinking if needed
        }}
      >
        {/* Speech bubble above panda's head */}
        <div
          style={{
            position: "absolute",
            top: "calc(50% - 120px)", // Position above the panda
            left: "50%",
            transform: "translate(-50%, -100%)", // Center and move up
            background: "#353740",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: "18px",
            minWidth: 80,
            maxWidth: "80vw",
            boxShadow: "0 2px 8px #0002",
            fontSize: 16,
            zIndex: 10, // Ensure it's above other elements
            // Display only if the last message is from panda
            display:
              messages.length > 0 && messages[messages.length - 1].sender === "panda"
                ? "block"
                : "none",
            transition: "opacity 0.3s",
            wordBreak: "break-word",
            textAlign: "center",
          }}
        >
          {/* Display text of the last panda message */}
          {messages.length > 0 && messages[messages.length - 1].sender === "panda"
            ? messages[messages.length - 1].text
            : ""}
          {/* Speech bubble tail */}
          <div
            style={{
              position: "absolute",
              bottom: "-16px", // Position at the bottom of the bubble
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "16px solid #353740", // Triangle pointing down
            }}
          />
        </div>
        {/* Panda avatar container */}
        <div
          style={{
            width: "50vw", // Responsive width
            maxWidth: 260,
            minWidth: 150,
            height: "50vw", // Responsive height
            maxHeight: 260,
            minHeight: 150,
            borderRadius: "50%", // Circular shape
            background: "#23234a", // Background color
            // Dynamic box shadow for talking/listening states
            boxShadow: pandaTalking
              ? "0 0 32px 8px #00fff7, 0 0 8px 2px #8f00ff" // Talking glow
              : isListening
              ? "0 0 24px 4px #19c37d" // Listening glow
              : "0 2px 16px #222", // Default shadow
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "box-shadow 0.3s",
            cursor: "pointer",
            // Apply animations based on state
            animation: pandaTalking
              ? "pandaTalk 0.7s infinite alternate"
              : avatarBounce
              ? "avatarBounce 0.5s"
              : "none",
            position: "relative", // For positioning elements inside
            zIndex: 2,
            marginTop: "8vh",
            marginBottom: "8vh",
          }}
          onClick={handleAvatarClick} // Trigger bounce on click
        >
          {/* Container for the 3D GLB model */}
          <div
            style={{
              width: "90%",
              height: "90%",
              borderRadius: "50%",
              overflow: "hidden", // Clip the GLB model to the circle
              pointerEvents: "none", // Prevent interaction with the GLB model directly
              position: "relative",
              zIndex: 1,
            }}
          >
            <GLBViewer /> {/* The 3D Panda model component */}
          </div>

          {/* Panda's mouth animation when talking */}
          {pandaTalking && (
            <svg
              width="40"
              height="20"
              style={{
                position: "absolute",
                bottom: 18,
                left: "50%",
                transform: "translateX(-50%)",
              }}
            >
              <ellipse cx="20" cy="10" rx="10" ry="4" fill="#222" />
            </svg>
          )}
        </div>
      </div>
      {/* Footer containing the message input form */}
      <footer
        style={{
          borderTop: "1px solid #2d323b",
          background: "#23272f",
          padding: "16px 0",
          width: "100%",
        }}
      >
        <form
          style={{
            display: "flex",
            alignItems: "center",
            maxWidth: 600, // Max width for the input area
            margin: "0 auto", // Center the form
            width: "100%",
            gap: 8, // Spacing between elements
            padding: "0 4vw", // Responsive padding
            boxSizing: "border-box",
          }}
          onSubmit={e => {
            e.preventDefault(); // Prevent default form submission
            handleSend(); // Call the message sending function
          }}
        >
          {/* Text input field */}
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message…"
            style={{
              flex: 1, // Take up available space
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #2d323b",
              background: "#353740",
              color: "#fff",
              fontSize: 16,
              outline: "none", // Remove default outline
            }}
          />
          {/* Voice input button */}
          <button
            type="button" // Not a submit button
            onClick={isListening ? stopListening : startListening} // Toggle listening state
            style={{
              background: "#353740",
              border: "1px solid #2d323b",
              borderRadius: 8,
              padding: 10,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              transition: "background 0.2s",
            }}
            aria-label="Voice input"
          >
            {/* Microphone icon (SVG) */}
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="8" y="4" width="6" height="10" rx="3" fill={isListening ? "#00fff7" : "#888"} /> {/* Mic body, color changes when listening */}
              <rect x="10" y="15" width="2" height="4" rx="1" fill="#aaa" /> {/* Mic stand part */}
              <rect x="7" y="19" width="8" height="2" rx="1" fill="#222" /> {/* Mic base */}
              <rect x="9" y="2" width="4" height="2" rx="1" fill="#222" /> {/* Mic top */}
            </svg>
          </button>
          {/* Send button */}
          <button
            type="submit"
            style={{
              background: "#19c37d", // Send button color
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "10px 18px",
              fontWeight: 600,
              fontSize: 16,
              cursor: "pointer",
              transition: "background 0.2s",
            }}
          >
            Send
          </button>
        </form>
      </footer>
      {/* Inline CSS for animations */}
      <style>
        {`
          @keyframes pandaTalk { /* Panda talking animation */
            0% { transform: scale(1) rotate(-2deg);}
            100% { transform: scale(1.08) rotate(2deg);}
          }
          @keyframes avatarBounce { /* Panda avatar bounce animation */
            0% { transform: scale(1);}
            30% { transform: scale(1.10) translateY(-8px);}
            60% { transform: scale(0.97) translateY(2px);}
            100% { transform: scale(1);}
          }
        `}
      </style>
    </div>
  );
};

export default PandaChat;

// This part of the code runs after the DOM is fully loaded.
// It sets up audio analysis for visual feedback (avatar ring),
// but it's currently not connected to the React component's state or UI elements
// in a way that would update the 'avatar-ring' (which isn't defined in the JSX).
// This seems like a leftover or an incomplete feature for a visualizer.
document.addEventListener('DOMContentLoaded', () => {
    // Request microphone access again (this might be redundant if already granted for speech recognition)
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)(); // Create audio context
        const analyser = audioCtx.createAnalyser(); // Create analyser node
        const source = audioCtx.createMediaStreamSource(stream); // Create source from microphone stream
        source.connect(analyser); // Connect source to analyser

        const dataArray = new Uint8Array(analyser.fftSize); // Array to hold audio data

        // Function to calculate current audio volume/intensity
        function getVolume() {
            analyser.getByteTimeDomainData(dataArray); // Get time domain data
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                let val = (dataArray[i] - 128) / 128; // Normalize data
                sum += val * val; // Sum of squares
            }
            return Math.sqrt(sum / dataArray.length); // RMS (Root Mean Square) value
        }

        // Animation loop to continuously get volume and update visualizer
        function animate() {
            const volume = getVolume();
            updateAvatarRing(volume); // Call function to update the visualizer
            requestAnimationFrame(animate); // Request next animation frame
        }

        animate(); // Start the animation loop
    }).catch(err => {
        console.error("Error initializing audio visualizer:", err);
    });

    // Function to update the avatar ring visualizer (currently targets a non-existent 'avatar-ring' element)
    function updateAvatarRing(intensity) {
        const min = 2, max = 20; // Min/max thickness for the ring
        const thickness = min + (max - min) * Math.min(intensity * 10, 1); // Calculate thickness based on intensity
        const ring = document.getElementById('avatar-ring'); // Attempt to get the ring element
        if (ring) { // If element exists, update its stroke width
            ring.setAttribute('stroke-width', thickness);
        }
    }
});