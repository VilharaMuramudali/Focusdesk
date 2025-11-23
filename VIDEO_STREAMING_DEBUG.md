# 📹 Video Streaming Troubleshooting Guide

## Issue: Video Stream Not Displaying

### Quick Fixes Applied

I've added several improvements to fix video streaming:

1. **Explicit Video Play Calls**: Added `.play()` calls after setting `srcObject`
2. **onLoadedMetadata Handlers**: Ensures videos play when metadata loads
3. **Better Error Logging**: Console logs for debugging stream setup
4. **Remote Video Notification**: Shows "Remote video connected" when peer connects

### Common Video Streaming Issues

#### 1. **Browser Permissions Not Granted**
**Symptoms**: No video appears, console shows permission errors

**Solution**:
- Check browser URL bar for camera/microphone permission prompt
- Click "Allow" when prompted
- If already blocked: Click lock icon → Site settings → Camera/Microphone → Allow

**Chrome**:
```
chrome://settings/content/camera
chrome://settings/content/microphone
```

**Firefox**:
```
about:preferences#privacy → Permissions → Camera/Microphone
```

**Edge**:
```
edge://settings/content/camera
edge://settings/content/microphone
```

#### 2. **Local Video Not Showing**
**Symptoms**: Remote can see you, but you can't see yourself

**Debug Steps**:
1. Open browser DevTools (F12)
2. Check Console for errors
3. Look for: "Local video stream set"
4. Look for: "Local video metadata loaded"

**Common Fixes**:
- Refresh the page
- Clear browser cache (Ctrl+Shift+Delete)
- Try incognito/private mode
- Restart browser

#### 3. **Remote Video Not Showing**
**Symptoms**: You can see yourself, but not the remote participant

**Debug Steps**:
1. Check Console for:
   - "Remote track received: video"
   - "Remote video stream set"
   - "Remote video metadata loaded"
   - "Remote video connected"

2. Check Network tab:
   - WebSocket connection to `ws://localhost:8800/socket.io/`
   - Should show "101 Switching Protocols"

**Common Issues**:

**A. WebRTC Connection Failed**
```javascript
// Look for ICE connection state in console
ICE connection state: failed
```
**Fix**: 
- Check firewall settings
- Ensure both users are on same network (for localhost testing)
- Try using TURN server (not just STUN)

**B. No Remote Tracks Received**
```javascript
// Should see this when peer connects:
Remote track received: audio
Remote track received: video
```
**Fix**:
- Remote user needs to grant camera/microphone access
- Remote user should see "Local video stream set" in their console
- Check if remote user is in audio-only mode

**C. Offer/Answer Not Exchanged**
```javascript
// Should see:
Offer created and set as local description
// OR
Offer received, creating answer...
Answer created and set as local description
```
**Fix**:
- Both users must be in the same room
- Check Socket.IO connection (should show connected in Console)
- Refresh both browsers

#### 4. **Black Screen**
**Symptoms**: Video element is there but shows black/nothing

**Causes & Fixes**:

**A. Video Track Disabled**
- Check if camera button shows ❌ (video off)
- Click camera button to toggle on

**B. Stream Has No Video Track**
```javascript
// In console, check:
localVideoRef.current.srcObject.getVideoTracks()
// Should return array with at least 1 track
```

**C. CSS Hiding Video**
- Check if `display: none` or `visibility: hidden`
- Verify `z-index` not putting video behind other elements
- Check parent container dimensions (should have width/height)

#### 5. **Audio Works, Video Doesn't**
**Symptoms**: Can hear but not see each other

**This is the Audio-Only Mode feature!**

Check for orange "🎧 Audio Only" badge in header.

**Why it happens**:
- Camera in use by another app (Zoom, Teams, Skype)
- Camera in use by another browser tab
- No camera device available
- Camera permission granted but camera hardware failed

**Fix**:
1. Close other apps using camera
2. Close other browser tabs with video calls
3. Click camera button to retry
4. Refresh page completely
5. Use different browser for student vs educator

### Testing Video Streaming

#### Test Setup
1. **Open Two Browser Windows** (or two different browsers)
2. **Window 1**: Login as Student → Join room "test123"
3. **Window 2**: Login as Educator → Join room "test123"

#### Expected Console Output

**Window 1 (First to Join)**:
```
Requesting media access...
Found 1 video and 1 audio devices
Media attempt 1/4 {video: {...}, audio: {...}}
Media access granted with config: ...
Local video stream set
Local video metadata loaded
PeerConnection created
Added track: video true
Added track: audio true
Another user joined, creating offer...
Offer created and set as local description
ICE candidate: candidate:... (multiple times)
ICE connection state: checking
ICE connection state: connected
```

**Window 2 (Second to Join)**:
```
Requesting media access...
Found 1 video and 1 audio devices
Media attempt 1/4 {video: {...}, audio: {...}}
Media access granted with config: ...
Local video stream set
Local video metadata loaded
PeerConnection created
Added track: video true
Added track: audio true
Offer received, creating answer...
Answer created and set as local description
ICE candidate: candidate:... (multiple times)
Remote track received: audio
Remote track received: video
Remote video stream set
Remote video metadata loaded
Remote video connected (notification)
ICE connection state: checking
ICE connection state: connected
```

### Advanced Debugging

#### Check Video Element State
Open DevTools Console and run:
```javascript
// Check local video
console.log('Local video:', {
  ref: document.querySelector('.local-video'),
  srcObject: document.querySelector('.local-video')?.srcObject,
  tracks: document.querySelector('.local-video')?.srcObject?.getTracks(),
  videoTracks: document.querySelector('.local-video')?.srcObject?.getVideoTracks(),
  paused: document.querySelector('.local-video')?.paused,
  readyState: document.querySelector('.local-video')?.readyState
});

// Check remote video
console.log('Remote video:', {
  ref: document.querySelector('.participant-video'),
  srcObject: document.querySelector('.participant-video')?.srcObject,
  tracks: document.querySelector('.participant-video')?.srcObject?.getTracks(),
  videoTracks: document.querySelector('.participant-video')?.srcObject?.getVideoTracks(),
  paused: document.querySelector('.participant-video')?.paused,
  readyState: document.querySelector('.participant-video')?.readyState
});
```

#### Check PeerConnection State
```javascript
// Get peer connection from React component (in DevTools)
// Look for RTCPeerConnection in scope
console.log('PC State:', {
  connectionState: peerConnection?.connectionState,
  iceConnectionState: peerConnection?.iceConnectionState,
  iceGatheringState: peerConnection?.iceGatheringState,
  signalingState: peerConnection?.signalingState
});

// Check transceivers
peerConnection?.getTransceivers().forEach((t, i) => {
  console.log(`Transceiver ${i}:`, {
    direction: t.direction,
    currentDirection: t.currentDirection,
    sender: t.sender.track,
    receiver: t.receiver.track
  });
});
```

### Network Requirements

#### For Localhost Testing
- Both users on same computer OR same local network
- Backend server running on `http://localhost:8800`
- Frontend served from same machine or accessible network address

#### For Production/Remote Testing
- HTTPS required for camera/microphone access
- Valid SSL certificate
- TURN server needed (STUN not enough for NAT traversal)
- WebSocket must support WSS (secure WebSocket)

### Backend Server Check

Ensure server is running and showing these messages:

```
✓ Connected to MongoDB!
✓ Backend server (with Socket.io and Chat functionality) is running on port 8800!
✓ New Socket.io connection: [socket-id]
✓ User [userId] joined
```

Check Socket.IO events are being received:
- `join-room` event
- `offer` event
- `answer` event
- `ice-candidate` events

### Browser Compatibility

| Feature | Chrome | Edge | Firefox | Safari |
|---------|--------|------|---------|--------|
| WebRTC | ✅ Full | ✅ Full | ✅ Full | ✅ Limited |
| getUserMedia | ✅ | ✅ | ✅ | ⚠️ HTTPS only |
| Socket.IO | ✅ | ✅ | ✅ | ✅ |
| Video Codecs | VP8/VP9/H264 | VP8/VP9/H264 | VP8/VP9 | H264 only |

**Best for testing**: Chrome or Edge
**Works well**: Firefox
**Needs HTTPS**: Safari (especially iOS)

### Still Not Working?

Try these in order:

1. **Hard Refresh**: Ctrl+Shift+R (Ctrl+Shift+Delete → Clear cache)
2. **Different Browser**: Switch from Chrome to Firefox or vice versa
3. **Incognito Mode**: Eliminates extension interference
4. **Check Antivirus/Firewall**: May block WebRTC
5. **Different Network**: Try mobile hotspot
6. **Restart Everything**: 
   - Close all browser windows
   - Kill backend server (taskkill /F /PID [pid])
   - Restart backend: `npm start`
   - Open fresh browser window

### Getting Help

When reporting issues, provide:

1. **Browser & Version**: Chrome 120, Firefox 121, etc.
2. **Console Errors**: Full error messages from DevTools
3. **Console Logs**: Copy "Requesting media access..." through connection logs
4. **Network Tab**: Screenshot of Socket.IO connection
5. **What You See**: Screenshots of both user windows
6. **What Works**: Audio? Chat? Partial video?

---

## Changes Made to Fix Video Streaming

### 1. Added Explicit play() Calls
```javascript
localVideoRef.current.srcObject = localStream;
localVideoRef.current.play().catch(e => {
  console.error('Error playing local video:', e);
});
```

### 2. Added onLoadedMetadata Handlers
```jsx
<video 
  ref={localVideoRef}
  autoPlay 
  muted 
  playsInline
  onLoadedMetadata={(e) => {
    console.log('Local video metadata loaded');
    e.target.play().catch(err => console.error('Error auto-playing:', err));
  }}
/>
```

### 3. Better Remote Track Handling
```javascript
pc.ontrack = (event) => {
  console.log('Remote track received:', event.track.kind);
  remoteVideoRef.current.srcObject = event.streams[0];
  remoteVideoRef.current.play().catch(e => console.error('Error playing remote video:', e));
  showNotification('Remote video connected');
};
```

These changes ensure videos play even if browser autoplay policies are strict.

---

**Next Steps**: 
1. Open browser DevTools (F12)
2. Go to Console tab
3. Join a video call
4. Look for the messages mentioned in "Expected Console Output"
5. Report any errors you see
