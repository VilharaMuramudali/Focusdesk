import React, { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import Whiteboard from "./Whiteboard";
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
  const [notifications, setNotifications] = useState([]);
  
  // Control states
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWhiteboard, setShowWhiteboard] = useState(false);
  const [participants, setParticipants] = useState([{ id: userId, name: 'You' }]);
  const [connectionState, setConnectionState] = useState('disconnected');
  const [errorMessage, setErrorMessage] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoQuality, setVideoQuality] = useState('720p');
  const [handRaised, setHandRaised] = useState(false);
  const [reactions, setReactions] = useState([]);
  const [networkQuality, setNetworkQuality] = useState('good');
  const [layout, setLayout] = useState('speaker'); // speaker, grid, sidebar
  const [audioOnlyMode, setAudioOnlyMode] = useState(false);
  const [availableDevices, setAvailableDevices] = useState({ video: [], audio: [] });
  const isOfferCreatorRef = useRef(false);
  const recordingIntervalRef = useRef(null);

  // Timer logic
  useEffect(() => {
    let interval;
    if (inCall) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    } else {
      setTimer(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [inCall]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
    return () => {
      if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
    };
  }, [isRecording]);

  // Network quality monitoring
  useEffect(() => {
    if (!peerConnection) return;

    const checkStats = async () => {
      try {
        const stats = await peerConnection.getStats();
        let packetsLost = 0;
        let packetsReceived = 0;

        stats.forEach((report) => {
          if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
            packetsLost += report.packetsLost || 0;
            packetsReceived += report.packetsReceived || 0;
          }
        });

        const lossRate = packetsReceived > 0 ? packetsLost / packetsReceived : 0;
        if (lossRate < 0.02) setNetworkQuality('excellent');
        else if (lossRate < 0.05) setNetworkQuality('good');
        else if (lossRate < 0.1) setNetworkQuality('fair');
        else setNetworkQuality('poor');
      } catch (error) {
        console.error('Error checking network stats:', error);
      }
    };

    const interval = setInterval(checkStats, 5000);
    return () => clearInterval(interval);
  }, [peerConnection]);

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
        
        // Enumerate available devices first
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(d => d.kind === 'videoinput');
          const audioDevices = devices.filter(d => d.kind === 'audioinput');
          setAvailableDevices({ video: videoDevices, audio: audioDevices });
          console.log(`Found ${videoDevices.length} video and ${audioDevices.length} audio devices`);
        } catch (enumError) {
          console.warn('Could not enumerate devices:', enumError);
        }

        // Try multiple configurations in order of preference
        const mediaConfigs = [
          {
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
          },
          {
            video: { 
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: 'user'
            }, 
            audio: true
          },
          {
            video: true,
            audio: true
          },
          // FALLBACK: Audio-only mode if camera is in use
          {
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          }
        ];

        let mediaAttempt = 0;
        let lastError = null;
        let isAudioOnly = false;

        for (const config of mediaConfigs) {
          try {
            console.log(`Media attempt ${mediaAttempt + 1}/${mediaConfigs.length}`, config);
            localStream = await navigator.mediaDevices.getUserMedia(config);
            console.log('Media access granted with config:', config);
            
            // Check if this is audio-only
            if (!config.video) {
              isAudioOnly = true;
              setAudioOnlyMode(true);
              showNotification('⚠️ Camera unavailable. Joined in audio-only mode.');
              console.log('Audio-only mode activated');
            }
            
            break; // Success, exit the loop
          } catch (attemptError) {
            console.warn(`Attempt ${mediaAttempt + 1} failed:`, attemptError.message);
            lastError = attemptError;
            mediaAttempt++;
            
            // If it's a permission error or device not found, don't try other configs
            if (attemptError.name === 'NotAllowedError' || 
                attemptError.name === 'PermissionDeniedError') {
              // Skip to audio-only on last attempt
              if (mediaAttempt < mediaConfigs.length - 1) {
                continue;
              }
              break;
            }
            
            if (attemptError.name === 'NotFoundError' || 
                attemptError.name === 'DevicesNotFoundError') {
              // No devices, try audio-only
              continue;
            }
            
            // Wait a bit before next attempt
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        if (!localStream) {
          // All attempts failed
          const mediaError = lastError;
          console.error('All getUserMedia attempts failed:', mediaError);
          let errorMsg = 'Failed to access camera and microphone. ';
          
          if (mediaError.name === 'NotAllowedError' || mediaError.name === 'PermissionDeniedError') {
            errorMsg += 'Please allow camera and microphone access in your browser settings.';
          } else if (mediaError.name === 'NotFoundError' || mediaError.name === 'DevicesNotFoundError') {
            errorMsg += 'No camera or microphone found. Please connect a device.';
          } else if (mediaError.name === 'NotReadableError' || mediaError.name === 'TrackStartError') {
            errorMsg += 'Camera and microphone are in use by another application.';
          } else if (mediaError.name === 'OverconstrainedError') {
            errorMsg += 'Unable to satisfy camera/microphone constraints. Try a different device.';
          } else if (mediaError.name === 'AbortError') {
            errorMsg += 'Media access was aborted. Please try again.';
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
          
          // Ensure video plays
          localVideoRef.current.play().catch(e => {
            console.error('Error playing local video:', e);
          });
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
            
            // Ensure video plays
            remoteVideoRef.current.play().catch(e => {
              console.error('Error playing remote video:', e);
            });
            
            showNotification('Remote video connected');
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

        const handleRecordingStatus = ({ isRecording: remoteRecording, userId: recordingUserId }) => {
          if (recordingUserId !== userId) {
            showNotification(`${recordingUserId} ${remoteRecording ? 'started' : 'stopped'} recording`);
          }
        };

        const handleHandRaise = ({ userId: handUserId, raised }) => {
          if (handUserId !== userId) {
            showNotification(`${handUserId} ${raised ? 'raised hand ✋' : 'lowered hand'}`);
            setParticipants(prev => prev.map(p => 
              p.id === handUserId ? { ...p, handRaised: raised } : p
            ));
          }
        };

        const handleReaction = ({ reaction }) => {
          if (reaction.userId !== userId) {
            setReactions(prev => [...prev, reaction]);
            setTimeout(() => {
              setReactions(prev => prev.filter(r => r.id !== reaction.id));
            }, 3000);
          }
        };

        // Add event listeners
        socket.on("user-joined", handleUserJoined);
        socket.on("offer", handleOffer);
        socket.on("answer", handleAnswer);
        socket.on("ice-candidate", handleIceCandidate);
        socket.on("chat-message", handleChatMessage);
        socket.on("user-left", handleUserLeft);
        socket.on("recording-status", handleRecordingStatus);
        socket.on("hand-raise", handleHandRaise);
        socket.on("reaction", handleReaction);

        // Store cleanup functions
        cleanupFunctions = [
          () => socket.off("user-joined", handleUserJoined),
          () => socket.off("offer", handleOffer),
          () => socket.off("answer", handleAnswer),
          () => socket.off("ice-candidate", handleIceCandidate),
          () => socket.off("chat-message", handleChatMessage),
          () => socket.off("user-left", handleUserLeft),
          () => socket.off("recording-status", handleRecordingStatus),
          () => socket.off("hand-raise", handleHandRaise),
          () => socket.off("reaction", handleReaction)
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
        stopAllMediaTracks(localStream);
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
    try {
      if (!isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { cursor: 'always' }, 
          audio: false 
        });
        
        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
          await sender.replaceTrack(screenTrack);
          setIsScreenSharing(true);
          showNotification('Screen sharing started');
          
          screenTrack.onended = () => {
            toggleScreenShare(); // Stop sharing when user stops
          };
        }
      } else {
        const localStream = localVideoRef.current.srcObject;
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
          setIsScreenSharing(false);
          showNotification('Screen sharing stopped');
        }
      }
    } catch (error) {
      console.error('Screen share error:', error);
      showNotification('Failed to share screen');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    showNotification(isRecording ? 'Recording stopped' : 'Recording started');
    if (socket) {
      socket.emit('recording-status', { roomId, isRecording: !isRecording, userId });
    }
  };

  const toggleHandRaise = () => {
    const newState = !handRaised;
    setHandRaised(newState);
    showNotification(newState ? '✋ Hand raised' : 'Hand lowered');
    if (socket) {
      socket.emit('hand-raise', { roomId, userId, raised: newState });
    }
  };

  const sendReaction = (emoji) => {
    const reaction = { id: Date.now(), emoji, userId };
    setReactions(prev => [...prev, reaction]);
    if (socket) {
      socket.emit('reaction', { roomId, reaction });
    }
    setTimeout(() => {
      setReactions(prev => prev.filter(r => r.id !== reaction.id));
    }, 3000);
  };

  const changeVideoQuality = async (quality) => {
    const constraints = {
      '360p': { width: 640, height: 360 },
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 }
    };

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: constraints[quality],
        audio: true
      });
      
      const videoTrack = stream.getVideoTracks()[0];
      const sender = peerConnection.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
        localVideoRef.current.srcObject = stream;
        setVideoQuality(quality);
        showNotification(`Video quality changed to ${quality}`);
      }
    } catch (error) {
      console.error('Quality change error:', error);
      showNotification('Failed to change video quality');
    }
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

  const stopAllMediaTracks = (stream) => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped ${track.kind} track`);
      });
    }
  };

  const retryConnection = () => {
    setErrorMessage(null);
    setConnectionState('disconnected');
    // Reload the component by changing key (parent should handle this)
    // Or manually restart the connection
    window.location.reload();
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

      {/* Reactions overlay */}
      <div className="reactions-overlay">
        {reactions.map((reaction) => (
          <div key={reaction.id} className="reaction-bubble">
            {reaction.emoji}
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="conference-header">
        <div className="session-info">
          <h3>Learning Session</h3>
          {audioOnlyMode && (
            <span className="audio-only-badge">
              🎧 Audio Only
            </span>
          )}
          <span className="session-time">{formatTimer(timer)}</span>
          {isRecording && (
            <span className="recording-indicator">
              <span className="rec-dot"></span>
              REC {formatTimer(recordingTime)}
            </span>
          )}
          <span className={`network-indicator ${networkQuality}`}>
            <span className="signal-icon">📶</span>
            {networkQuality}
          </span>
        </div>
        <div className="header-controls">
          <button 
            className="header-btn layout-btn"
            onClick={() => setLayout(layout === 'speaker' ? 'grid' : 'speaker')}
            title="Change layout"
          >
            {layout === 'speaker' ? '▦' : '▢'}
          </button>
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
        <div className={`video-area layout-${layout}`}>
          <div className="video-grid">
            {/* Remote participant video */}
            <div className="video-tile main-speaker">
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="participant-video"
                onLoadedMetadata={(e) => {
                  console.log('Remote video metadata loaded');
                  e.target.play().catch(err => console.error('Error auto-playing remote video:', err));
                }}
              />
              <div className="participant-overlay">
                <span className="participant-name">Remote Participant</span>
                {isScreenSharing && <span className="screen-share-badge">🖥️ Sharing</span>}
              </div>
              <div className="video-tile-controls">
                <button className="tile-control-btn" title="Pin">📌</button>
                <button className="tile-control-btn" title="Fullscreen">⛶</button>
              </div>
            </div>
          </div>

          {/* Local video (floating) */}
          <div className="local-video-container">
            {!audioOnlyMode ? (
              <>
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  muted 
                  playsInline 
                  className={`local-video ${isVideoOff ? 'video-off' : ''}`}
                  onLoadedMetadata={(e) => {
                    console.log('Local video metadata loaded');
                    e.target.play().catch(err => console.error('Error auto-playing local video:', err));
                  }}
                />
                {isVideoOff && (
                  <div className="video-off-placeholder">
                    <div className="avatar-placeholder">{userId?.charAt(0).toUpperCase()}</div>
                  </div>
                )}
              </>
            ) : (
              <div className="audio-only-placeholder">
                <div className="audio-icon">🎧</div>
                <span className="audio-label">Audio Only</span>
              </div>
            )}
            <div className="local-video-overlay">
              <span className="local-name">You</span>
              {handRaised && <span className="hand-raised-badge">✋</span>}
            </div>
          </div>

          {/* Whiteboard */}
          {showWhiteboard && (
            <Whiteboard 
              socket={socket}
              roomId={roomId}
              userId={userId}
              onClose={() => setShowWhiteboard(false)}
            />
          )}
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
                  {handRaised && participant.id === userId && <span className="hand-icon">✋</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {showSettings && (
          <div className="side-panel settings-panel">
            <div className="panel-header">
              <h4>Settings</h4>
              <button onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="settings-content">
              <div className="settings-section">
                <h5>Video Quality</h5>
                <div className="quality-buttons">
                  {['360p', '720p', '1080p'].map((quality) => (
                    <button
                      key={quality}
                      className={`quality-btn ${videoQuality === quality ? 'active' : ''}`}
                      onClick={() => changeVideoQuality(quality)}
                    >
                      {quality}
                    </button>
                  ))}
                </div>
              </div>
              <div className="settings-section">
                <h5>Audio</h5>
                <label className="setting-item">
                  <span>Echo Cancellation</span>
                  <input type="checkbox" defaultChecked />
                </label>
                <label className="setting-item">
                  <span>Noise Suppression</span>
                  <input type="checkbox" defaultChecked />
                </label>
              </div>
              <div className="settings-section">
                <h5>About</h5>
                <p className="setting-info">Connection: {connectionState}</p>
                <p className="setting-info">Room ID: {roomId}</p>
                <p className="setting-info">Quality: {videoQuality}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom controls */}
      <div className="conference-controls">
        <div className="controls-left">
          <div className="meeting-id">Room: {roomId}</div>
          <button 
            className={`control-btn-small ${handRaised ? 'active' : ''}`}
            onClick={toggleHandRaise}
            title={handRaised ? 'Lower hand' : 'Raise hand'}
          >
            ✋
          </button>
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
            className={`control-btn ${isVideoOff || audioOnlyMode ? 'video-off' : ''}`}
            onClick={toggleVideo}
            disabled={audioOnlyMode}
            title={audioOnlyMode ? 'Camera unavailable (audio-only mode)' : (isVideoOff ? 'Turn on camera' : 'Turn off camera')}
          >
            {audioOnlyMode ? '📹🚫' : (isVideoOff ? '📹❌' : '📹')}
          </button>

          <button 
            className={`control-btn ${isScreenSharing ? 'active' : ''}`}
            onClick={toggleScreenShare}
            title="Share screen"
          >
            🖥️
          </button>

          <button 
            className={`control-btn ${isRecording ? 'active recording' : ''}`}
            onClick={toggleRecording}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            ⏺️
          </button>

          {/* Reactions */}
          <div className="reactions-popup">
            <button className="control-btn reactions-btn" title="React">
              😊
            </button>
            <div className="reactions-menu">
              {['👍', '👏', '❤️', '😂', '😮', '🎉'].map((emoji) => (
                <button
                  key={emoji}
                  className="reaction-option"
                  onClick={() => sendReaction(emoji)}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button 
            className="control-btn"
            onClick={() => setShowWhiteboard(!showWhiteboard)}
            title="Whiteboard"
          >
            ✏️
          </button>

          <button 
            className={`control-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings(!showSettings)}
            title="Settings"
          >
            ⚙️
          </button>

          <button className="leave-btn" onClick={onLeave} title="Leave call">
            📞
          </button>
        </div>

        <div className="controls-right">
          <button 
            className={`control-btn-small ${showChat ? 'active' : ''}`}
            onClick={() => setShowChat(!showChat)}
          >
            💬
          </button>
          <button 
            className={`control-btn-small ${showParticipants ? 'active' : ''}`}
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
                {errorMessage.includes('already in use') && (
                  <>
                    <strong>Possible solutions:</strong><br />
                    • Close other browser tabs or applications using your camera/microphone<br />
                    • Check if Skype, Teams, Zoom, or other video apps are running<br />
                    • Use a different browser (e.g., Chrome for student, Firefox for educator)<br />
                    • Restart your browser completely<br />
                    • Check Windows Settings &gt; Privacy &gt; Camera/Microphone permissions
                  </>
                )}
                {errorMessage.includes('allow camera') && (
                  <>
                    <strong>How to allow camera access:</strong><br />
                    • Click the camera icon in your browser's address bar<br />
                    • Select "Allow" for camera and microphone<br />
                    • Refresh the page after granting permission
                  </>
                )}
              </p>
              <div className="error-actions">
                <button onClick={retryConnection} className="retry-btn">
                  🔄 Retry Connection
                </button>
                <button onClick={onLeave} className="cancel-btn">
                  ← Back
                </button>
              </div>
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
