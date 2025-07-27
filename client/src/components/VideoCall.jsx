import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import "./VideoCall.scss";

const SIGNALING_SERVER_URL = "http://localhost:8800";

export default function VideoCall({ roomId, userId, onLeave }) {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [fileInput, setFileInput] = useState(null);
  const [timer, setTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Timer logic
  useEffect(() => {
    let interval;
    if (inCall) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
      setTimerInterval(interval);
    } else {
      setTimer(0);
      if (timerInterval) clearInterval(timerInterval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
    // eslint-disable-next-line
  }, [inCall]);

  // Notification logic
  const showNotification = (msg) => {
    setNotifications((prev) => [...prev, msg]);
    setTimeout(() => {
      setNotifications((prev) => prev.slice(1));
    }, 4000);
  };

  useEffect(() => {
    const s = io(SIGNALING_SERVER_URL, { transports: ["websocket"] });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.emit("join-room", { roomId, userId });

    let pc;
    let localStream;

    const startCall = async () => {
      localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }
      pc = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" }
        ]
      });
      setPeerConnection(pc);
      localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          socket.emit("ice-candidate", { roomId, candidate: event.candidate, userId });
        }
      };
      pc.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // If you are the second user, create an offer
      socket.on("user-joined", async ({ userId: joinedUser }) => {
        showNotification(`User ${joinedUser === userId ? "(You)" : joinedUser} joined the session.`);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("offer", { roomId, offer, userId });
      });

      socket.on("offer", async ({ offer }) => {
        await pc.setRemoteDescription(new window.RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("answer", { roomId, answer, userId });
      });

      socket.on("answer", async ({ answer }) => {
        await pc.setRemoteDescription(new window.RTCSessionDescription(answer));
      });

      socket.on("ice-candidate", async ({ candidate }) => {
        try {
          await pc.addIceCandidate(new window.RTCIceCandidate(candidate));
        } catch (e) {
          // Ignore duplicate candidates
        }
      });

      setInCall(true);
    };

    // Chat events
    socket.on("chat-message", ({ userId: from, message, file, fileName }) => {
      setChatMessages((prev) => [
        ...prev,
        { from, message, file, fileName }
      ]);
      if (file) {
        showNotification(`File received: ${fileName}`);
      }
    });

    socket.on("user-left", ({ userId: leftUser }) => {
      showNotification(`User ${leftUser === userId ? "(You)" : leftUser} left the session.`);
    });

    startCall();

    return () => {
      if (pc) {
        pc.close();
      }
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      socket.emit("leave-room", { roomId, userId });
      setInCall(false);
    };
    // eslint-disable-next-line
  }, [socket]);

  // Send chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      socket.emit("chat-message", { roomId, userId, message: chatInput });
      setChatMessages((prev) => [...prev, { from: userId, message: chatInput }]);
      setChatInput("");
    }
  };

  // Send file
  const sendFile = async (e) => {
    const file = e.target.files[0];
    if (file && socket) {
      const reader = new FileReader();
      reader.onload = () => {
        socket.emit("chat-message", {
          roomId,
          userId,
          file: reader.result,
          fileName: file.name
        });
        setChatMessages((prev) => [
          ...prev,
          { from: userId, file: reader.result, fileName: file.name }
        ]);
        showNotification(`File sent: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
    setFileInput(null);
  };

  // Format timer as mm:ss
  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="video-call-modal">
      <div className="notification-banner">
        {notifications.map((msg, idx) => (
          <div key={idx} className="notification">{msg}</div>
        ))}
      </div>
      <div className="video-main">
        <div className="session-timer">Session Time: {formatTimer(timer)}</div>
        <div className="video-container">
          <video ref={localVideoRef} autoPlay muted playsInline className="local-video" />
          <video ref={remoteVideoRef} autoPlay playsInline className="remote-video" />
        </div>
        <div className="controls">
          <button onClick={onLeave}>Leave Session</button>
        </div>
        {!inCall && <div>Connecting...</div>}
      </div>
      <div className="chat-sidebar">
        <div className="chat-messages">
          {chatMessages.map((msg, idx) => (
            <div key={idx} className={msg.from === userId ? "my-message" : "their-message"}>
              {msg.message && <span>{msg.message}</span>}
              {msg.file && (
                <div>
                  <a href={msg.file} download={msg.fileName} target="_blank" rel="noopener noreferrer">
                    📎 {msg.fileName}
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
        <form className="chat-input" onSubmit={sendMessage}>
          <input
            type="text"
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            placeholder="Type a message..."
          />
          <input
            type="file"
            style={{ display: 'none' }}
            ref={ref => setFileInput(ref)}
            onChange={sendFile}
          />
          <button type="button" onClick={() => fileInput && fileInput.click()}>📎</button>
          <button type="submit">Send</button>
        </form>
      </div>
    </div>
  );
} 