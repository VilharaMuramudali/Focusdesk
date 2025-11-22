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
  const [connectionState, setConnectionState] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);
  const isOfferCreatorRef = useRef(false);

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
    
    setConnectionState('connecting');
    socket.emit("join-room", { roomId, userId });

    let pc;
    let localStream;
    let cleanupFunctions = [];
    isOfferCreatorRef.current = false;

    const startCall = async () => {
      try {
        // Request camera and microphone with better error handling
        console.log('Requesting media access...');
        setConnectionState('requesting-media');
        
        try {
          localStream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'user'
            }, 
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          console.log('Media access granted');
        } catch (mediaError) {
          console.error('getUserMedia error:', mediaError);
          let errorMsg = 'Failed to access camera/microphone. ';
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            errorMsg += 'Please allow camera and microphone access in your browser settings.';
          } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
            errorMsg += 'No camera/microphone found. Please connect a device.';
          } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
            errorMsg += 'Camera/microphone is already in use by another application.';
          } else {
            errorMsg += mediaError.message || 'Unknown error occurred.';
          }
          setErrorMessage(errorMsg);
          showNotification(errorMsg);
          setConnectionState('error');
          return;
        }

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
          console.log('Local video stream set');
        }
        
        // Enhanced ICE servers for better connectivity (including TURN for localhost)
        pc = new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            { urls: "stun:stun2.l.google.com:19302" }
          ],
          iceCandidatePoolSize: 10
        });
        setPeerConnection(pc);
        console.log('PeerConnection created');

        // Add local tracks to peer connection
        localStream.getTracks().forEach(track => {
          pc.addTrack(track, localStream);
          console.log('Added track:', track.kind, track.enabled);
        });

        // ICE candidate handling
        pc.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('ICE candidate:', event.candidate.candidate);
            socket.emit("ice-candidate", { roomId, candidate: event.candidate, userId });
          } else {
            console.log('ICE gathering complete');
          }
        };

        // ICE connection state tracking
        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', pc.iceConnectionState);
          setConnectionState(pc.iceConnectionState);
          if (pc.iceConnectionState === 'connected' || pc.iceConnectionState === 'completed') {
            showNotification('Connected to peer');
          } else if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
            showNotification('Connection lost. Trying to reconnect...');
          }
        };

        // Connection state tracking
        pc.onconnectionstatechange = () => {
          console.log('Connection state:', pc.connectionState);
          setConnectionState(pc.connectionState);
        };
        
        // Remote track handling
        pc.ontrack = (event) => {
          console.log('Remote track received:', event.track.kind);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = event.streams[0];
            console.log('Remote video stream set');
          }
        };

        // Socket event handlers
        const handleUserJoined = async ({ userId: joinedUser }) => {
          // Only create offer if we haven't already and we're not the one who just joined
          if (joinedUser !== userId && !isOfferCreatorRef.current) {
            console.log('Another user joined, creating offer...');
            isOfferCreatorRef.current = true;
            showNotification(`${joinedUser} joined the session`);
            setParticipants(prev => {
              const exists = prev.find(p => p.id === joinedUser);
              if (!exists) {
                return [...prev, { id: joinedUser, name: joinedUser }];
              }
              return prev;
            });
            
            try {
              const offer = await pc.createOffer({ offerToReceiveAudio: true, offerToReceiveVideo: true });
              await pc.setLocalDescription(offer);
              console.log('Offer created and set as local description');
              socket.emit("offer", { roomId, offer, userId });
            } catch (error) {
              console.error('Error creating offer:', error);
              showNotification('Failed to create offer');
            }
          }
        };

        const handleOffer = async ({ offer, userId: offerUserId }) => {
          // Don't handle our own offer
          if (offerUserId === userId) return;
          
          console.log('Offer received, creating answer...');
          isOfferCreatorRef.current = false; // We're answering, not creating offer
          
          try {
            await pc.setRemoteDescription(new window.RTCSessionDescription(offer));
            console.log('Remote description set from offer');
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            console.log('Answer created and set as local description');
            socket.emit("answer", { roomId, answer, userId });
          } catch (error) {
            console.error('Error handling offer:', error);
            showNotification('Failed to handle offer');
          }
        };

        const handleAnswer = async ({ answer, userId: answerUserId }) => {
          // Don't handle our own answer
          if (answerUserId === userId) return;
          
          console.log('Answer received');
          try {
            if (pc.signalingState !== 'stable') {
              console.log('Waiting for stable signaling state...');
              await new Promise(resolve => {
                const checkState = () => {
                  if (pc.signalingState === 'stable') {
                    resolve();
                  } else {
                    setTimeout(checkState, 100);
                  }
                };
                checkState();
              });
            }
            await pc.setRemoteDescription(new window.RTCSessionDescription(answer));
            console.log('Remote description set from answer');
          } catch (error) {
            console.error('Error handling answer:', error);
            showNotification('Failed to handle answer');
          }
        };

        const handleIceCandidate = async ({ candidate, userId: candidateUserId }) => {
          // Don't handle our own candidates
          if (candidateUserId === userId) return;
          
          try {
            if (candidate && pc.remoteDescription) {
              await pc.addIceCandidate(new window.RTCIceCandidate(candidate));
              console.log('ICE candidate added');
            } else if (candidate) {
              // Store candidate if remote description not set yet
              console.log('Storing ICE candidate for later');
              setTimeout(() => handleIceCandidate({ candidate, userId: candidateUserId }), 100);
            }
          } catch (e) {
            if (e.name !== 'OperationError') {
              console.error('Error adding ICE candidate:', e);
            }
            // Ignore duplicate candidates and other non-critical errors
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
          if (leftUser !== userId) {
            showNotification(`${leftUser} left the session`);
            setParticipants(prev => prev.filter(p => p.id !== leftUser));
          }
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

        setConnectionState('connecting');
        setInCall(true);
        showNotification('Call started');
      } catch (error) {
        console.error('Error starting call:', error);
        setErrorMessage(error.message || 'Failed to start call');
        showNotification('Failed to start call: ' + (error.message || 'Unknown error'));
        setConnectionState('error');
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
          {errorMessage && (
            <div className="error-message">
              <p>{errorMessage}</p>
              <p className="error-hint">
                {errorMessage.includes('already in use') && 
                  'Tip: Close other applications using your camera/microphone, or test in different browsers (e.g., Chrome for student, Firefox for educator).'
                }
              </p>
            </div>
          )}
        </div>
      )}

      {/* Connection Status Indicator */}
      <div className={`connection-status ${connectionState}`}>
        <div className="status-dot"></div>
        <span className="status-text">
          {connectionState === 'connecting' && 'Connecting...'}
          {connectionState === 'connected' && 'Connected'}
          {connectionState === 'completed' && 'Connected'}
          {connectionState === 'disconnected' && 'Disconnected'}
          {connectionState === 'failed' && 'Connection Failed'}
          {connectionState === 'requesting-media' && 'Requesting Camera/Mic...'}
          {connectionState === 'error' && 'Error'}
        </span>
      </div>
    </div>
  );
}
