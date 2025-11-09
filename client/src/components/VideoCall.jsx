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
  
  // Control states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [participants, setParticipants] = useState([{ id: userId, name: 'You' }]);

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
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
      if (timerInterval) clearInterval(timerInterval);
    };
  }, [inCall, timerInterval]);

  // Notification logic
  const showNotification = (msg) => {
    const notificationId = Date.now();
    setNotifications((prev) => [...prev, { id: notificationId, message: msg }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter(n => n.id !== notificationId));
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
    let cleanupFunctions = [];

    const startCall = async () => {
      try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }
        
        pc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
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

        // Socket event handlers
        const handleUserJoined = async ({ userId: joinedUser }) => {
          showNotification(`${joinedUser} joined the session`);
          setParticipants(prev => [...prev, { id: joinedUser, name: joinedUser }]);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          socket.emit("offer", { roomId, offer, userId });
        };

        const handleOffer = async ({ offer }) => {
          await pc.setRemoteDescription(new window.RTCSessionDescription(offer));
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          socket.emit("answer", { roomId, answer, userId });
        };

        const handleAnswer = async ({ answer }) => {
          await pc.setRemoteDescription(new window.RTCSessionDescription(answer));
        };

        const handleIceCandidate = async ({ candidate }) => {
          try {
            await pc.addIceCandidate(new window.RTCIceCandidate(candidate));
          } catch (e) {
            // Ignore duplicate candidates
          }
        };

        const handleChatMessage = ({ userId: from, message, file, fileName }) => {
          setChatMessages((prev) => [
            ...prev,
            { from, message, file, fileName, timestamp: new Date() }
          ]);
          if (file) {
            showNotification(`File received: ${fileName}`);
          }
        };

        const handleUserLeft = ({ userId: leftUser }) => {
          showNotification(`${leftUser} left the session`);
          setParticipants(prev => prev.filter(p => p.id !== leftUser));
        };

        // Add event listeners
        socket.on("user-joined", handleUserJoined);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);
        socket.on("chat-message", handleChatMessage);
        socket.on("user-left", handleUserLeft);

        // Store cleanup functions
        cleanupFunctions = [
          () => socket.off("user-joined", handleUserJoined),
          () => socket.off("offer", handleOffer),
          () => socket.off("answer", handleAnswer),
          () => socket.off("ice-candidate", handleIceCandidate),
          () => socket.off("chat-message", handleChatMessage),
          () => socket.off("user-left", handleUserLeft)
        ];

        setInCall(true);
      } catch (error) {
        console.error('Error starting call:', error);
        showNotification('Failed to start call');
      }
    };

    startCall();

    return () => {
      // Cleanup socket event listeners
      cleanupFunctions.forEach(cleanup => cleanup());
      
      // Cleanup media streams
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      
      // Cleanup peer connection
      if (pc) {
        pc.close();
      }
      
      socket.emit("leave-room", { roomId, userId });
      setInCall(false);
      setPeerConnection(null);
    };
  }, [socket, roomId, userId]);

  // Control functions
  const toggleAudio = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTrack = localVideoRef.current.srcObject.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const videoTrack = localVideoRef.current.srcObject.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const toggleScreenShare = async () => {
    // Screen sharing logic would go here
    setIsScreenSharing(!isScreenSharing);
    showNotification(isScreenSharing ? 'Screen sharing stopped' : 'Screen sharing started');
  };

  // Send chat message
  const sendMessage = (e) => {
    e.preventDefault();
    if (chatInput.trim() && socket) {
      const message = {
        from: userId,
        message: chatInput,
        timestamp: new Date()
      };
      socket.emit("chat-message", { roomId, userId, message: chatInput });
      setChatMessages((prev) => [...prev, message]);
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
          { from: userId, file: reader.result, fileName: file.name, timestamp: new Date() }
        ]);
        showNotification(`File sent: ${file.name}`);
      };
      reader.readAsDataURL(file);
    }
    setFileInput(null);
  };

  const formatTimer = (seconds) => {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return h > 0 ? `${h}:${m}:${s}` : `${m}:${s}`;
  };

  return (
    <div className="video-conference">
      {/* Notifications */}
      <div className="notifications-container">
        {notifications.map((notif) => (
          <div key={notif.id} className="notification-toast">
            {notif.message}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="conference-header">
        <div className="session-info">
          <h3>Learning Session</h3>
          <span className="session-time">{formatTimer(timer)}</span>
        </div>
        <div className="header-controls">
          <button 
            className={`header-btn ${showParticipants ? 'active' : ''}`}
            onClick={() => setShowParticipants(!showParticipants)}
          >
            👥 {participants.length}
          </button>
          <button 
            className={`header-btn ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(!showChat)}
          >
            💬
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="conference-body">
        {/* Video area */}
        <div className="video-area">
          <div className="video-grid">
            {/* Remote participant video */}
            <div className="video-tile main-speaker">
              <video ref={remoteVideoRef} autoPlay playsInline className="participant-video" />
              <div className="participant-overlay">
                <span className="participant-name">Remote Participant</span>
              </div>
            </div>
          </div>

          {/* Local video (floating) */}
          <div className="local-video-container">
            <video 
              ref={localVideoRef} 
              autoPlay 
              muted 
              playsInline 
              className={`local-video ${isVideoOff ? 'video-off' : ''}`}
            />
            <div className="local-video-overlay">
              <span className="local-name">You</span>
            </div>
          </div>
        </div>

        {/* Side panels */}
        {showChat && (
          <div className="side-panel chat-panel">
            <div className="panel-header">
              <h4>Chat</h4>
              <button onClick={() => setShowChat(false)}>✕</button>
            </div>
            <div className="chat-messages">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className={`chat-message ${msg.from === userId ? 'own-message' : 'other-message'}`}>
                  <div className="message-header">
                    <span className="sender-name">{msg.from === userId ? 'You' : msg.from}</span>
                    <span className="message-time">
                      {msg.timestamp?.toLocaleTimeString() || ''}
                    </span>
                  </div>
                  {msg.message && <div className="message-text">{msg.message}</div>}
                  {msg.file && (
                    <div className="message-file">
                      <a href={msg.file} download={msg.fileName} target="_blank" rel="noopener noreferrer">
                        📎 {msg.fileName}
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <form className="chat-input-form" onSubmit={sendMessage}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Send a message..."
                className="chat-input-field"
              />
              <input
                type="file"
                style={{ display: 'none' }}
                ref={(ref) => setFileInput(ref)}
                onChange={sendFile}
              />
              <button type="button" className="file-btn" onClick={() => fileInput && fileInput.click()}>
                📎
              </button>
              <button type="submit" className="send-btn">Send</button>
            </form>
          </div>
        )}

        {showParticipants && (
          <div className="side-panel participants-panel">
            <div className="panel-header">
              <h4>Participants ({participants.length})</h4>
              <button onClick={() => setShowParticipants(false)}>✕</button>
            </div>
            <div className="participants-list">
              {participants.map((participant) => (
                <div key={participant.id} className="participant-item">
                  <div className="participant-avatar">
                    {participant.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="participant-name">{participant.name}</span>
                  {participant.id === userId && <span className="you-badge">You</span>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="conference-controls">
        <div className="controls-left">
          <div className="meeting-id">Room: {roomId}</div>
        </div>

        <div className="controls-center">
          <button 
            className={`control-btn ${isAudioMuted ? 'muted' : ''}`}
            onClick={toggleAudio}
            title={isAudioMuted ? 'Unmute' : 'Mute'}
          >
            {isAudioMuted ? '🎤❌' : '🎤'}
          </button>

          <button 
            className={`control-btn ${isVideoOff ? 'video-off' : ''}`}
            onClick={toggleVideo}
            title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
          >
            {isVideoOff ? '📹❌' : '📹'}
          </button>

          <button 
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title="Share screen"
          >
            🖥️
          </button>

          <button className="control-btn" title="More options">
            ⚙️
          </button>

          <button className="leave-btn" onClick={onLeave} title="Leave call">
            📞❌
          </button>
        </div>

        <div className="controls-right">
          <button 
            className={`control-btn ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(!showChat)}
          >
            💬
          </button>
          <button 
            className={`control-btn ${showParticipants ? 'active' : ''}`}
            onClick={() => setShowParticipants(!showParticipants)}
          >
            👥
          </button>
        </div>
      </div>

      {!inCall && (
        <div className="connecting-overlay">
          <div className="connecting-spinner"></div>
          <p>Connecting to session...</p>
        </div>
      )}
    </div>
  );
}
