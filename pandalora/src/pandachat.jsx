import React, { useRef, useState } from "react";
import GLBViewer from './components/glbviewer';
const PANDA_AVATAR = "/assets/panda-avatar.png";

const PandaChat = () => {
  const recognitionRef = useRef(null);
  const isRecognitionActive = useRef(false);
  const [isListening, setIsListening] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [pandaTyping, setPandaTyping] = useState(false);
  const [pandaTalking, setPandaTalking] = useState(false);
  const [avatarBounce, setAvatarBounce] = useState(false);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return alert("Speech recognition not supported");

    if (!recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.lang = "en-US";
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (e) => {
        const spoken = e.results[0][0].transcript;
        setInput(spoken);
        setIsListening(false);
        isRecognitionActive.current = false;
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
        isRecognitionActive.current = false;
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        isRecognitionActive.current = false;
      };
    }

    if (isRecognitionActive.current) return;

    isRecognitionActive.current = true;
    setIsListening(true);
    recognitionRef.current.start();
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
      isRecognitionActive.current = false;
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const you = { sender: "you", text: input };
    setMessages((prev) => [...prev, you]);
    setInput("");
    setPandaTyping(true);

    setTimeout(() => {
      setPandaTyping(false);
      setPandaTalking(true);
      const panda = {
        sender: "panda",
        text: "I'm your panda buddy. How can I help?",
      };
      setMessages((prev) => [...prev, panda]);
      setTimeout(() => setPandaTalking(false), 900);
    }, 900);
  };

  const handleAvatarClick = () => {
    setAvatarBounce(true);
    setTimeout(() => setAvatarBounce(false), 500);
  };

  return (
    <div
      style={{
        background: "#23272f",
        color: "#fff",
        minHeight: "100vh",
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        fontFamily: "Inter, sans-serif",
        justifyContent: "flex-end",
        boxSizing: "border-box",
        padding: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minHeight: 0,
        }}
      >
        {/* Speech bubble above panda's head */}
        <div
          style={{
            position: "absolute",
            top: "calc(50% - 120px)",
            left: "50%",
            transform: "translate(-50%, -100%)",
            background: "#353740",
            color: "#fff",
            padding: "14px 18px",
            borderRadius: "18px",
            minWidth: 80,
            maxWidth: "80vw",
            boxShadow: "0 2px 8px #0002",
            fontSize: 16,
            zIndex: 10,
            display:
              messages.length > 0 && messages[messages.length - 1].sender === "panda"
                ? "block"
                : "none",
            transition: "opacity 0.3s",
            wordBreak: "break-word",
            textAlign: "center",
          }}
        >
          {messages.length > 0 && messages[messages.length - 1].sender === "panda"
            ? messages[messages.length - 1].text
            : ""}
          <div
            style={{
              position: "absolute",
              bottom: "-16px",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "12px solid transparent",
              borderRight: "12px solid transparent",
              borderTop: "16px solid #353740",
            }}
          />
        </div>
        <div
  style={{
    width: "50vw",
    maxWidth: 260,
    minWidth: 150,
    height: "50vw",
    maxHeight: 260,
    minHeight: 150,
    borderRadius: "50%",
    background: "#23234a",
    boxShadow: pandaTalking
      ? "0 0 32px 8px #00fff7, 0 0 8px 2px #8f00ff"
      : isListening
      ? "0 0 24px 4px #19c37d"
      : "0 2px 16px #222",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "box-shadow 0.3s",
    cursor: "pointer",
    animation: pandaTalking
      ? "pandaTalk 0.7s infinite alternate"
      : avatarBounce
      ? "avatarBounce 0.5s"
      : "none",
    position: "relative",
    zIndex: 2,
    marginTop: "8vh",
    marginBottom: "8vh",
  }}
  onClick={handleAvatarClick}
>

          <div
  style={{
    width: "90%",
    height: "90%",
    borderRadius: "50%",
    overflow: "hidden",
    pointerEvents: "none",
    position: "relative",
    zIndex: 1,
  }}
>
  <GLBViewer />
</div>

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
            maxWidth: 600,
            margin: "0 auto",
            width: "100%",
            gap: 8,
            padding: "0 4vw",
            boxSizing: "border-box",
          }}
          onSubmit={e => {
            e.preventDefault();
            handleSend();
          }}
        >
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Type your message…"
            style={{
              flex: 1,
              padding: "12px",
              borderRadius: 8,
              border: "1px solid #2d323b",
              background: "#353740",
              color: "#fff",
              fontSize: 16,
              outline: "none",
            }}
          />
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
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
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="8" y="4" width="6" height="10" rx="3" fill={isListening ? "#00fff7" : "#888"} />
              <rect x="10" y="15" width="2" height="4" rx="1" fill="#aaa" />
              <rect x="7" y="19" width="8" height="2" rx="1" fill="#222" />
              <rect x="9" y="2" width="4" height="2" rx="1" fill="#222" />
            </svg>
          </button>
          <button
            type="submit"
            style={{
              background: "#19c37d",
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
      <style>
        {`
          @keyframes pandaTalk {
            0% { transform: scale(1) rotate(-2deg);}
            100% { transform: scale(1.08) rotate(2deg);}
          }
          @keyframes avatarBounce {
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

document.addEventListener('DOMContentLoaded', () => {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioCtx.createAnalyser();
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        const dataArray = new Uint8Array(analyser.fftSize);

        function getVolume() {
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
                let val = (dataArray[i] - 128) / 128;
                sum += val * val;
            }
            return Math.sqrt(sum / dataArray.length);
        }

        function animate() {
            const volume = getVolume();
            updateAvatarRing(volume);
            requestAnimationFrame(animate);
        }

        animate();
    });

    function updateAvatarRing(intensity) {
        const min = 2, max = 20;
        const thickness = min + (max - min) * Math.min(intensity * 10, 1);
        const ring = document.getElementById('avatar-ring');
        if (ring) {
            ring.setAttribute('stroke-width', thickness);
        }
    }
});