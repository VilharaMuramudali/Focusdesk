import WebSocket from 'ws';
import http from 'http';
import url from 'url';

class ChatWebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.rooms = new Map(); // bookingId -> Set of WebSocket connections
    this.users = new Map(); // userId -> WebSocket connection
    this.userInfo = new Map(); // userId -> user info

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });
  }

  handleConnection(ws, req) {
    console.log('New WebSocket connection');

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        this.handleMessage(ws, data);
      } catch (error) {
        console.error('Error parsing message:', error);
      }
    });

    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.handleDisconnection(ws);
    });
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case 'join':
        this.handleJoin(ws, data);
        break;
      
      case 'join_room':
        this.handleJoinRoom(ws, data);
        break;
      
      case 'leave_room':
        this.handleLeaveRoom(ws, data);
        break;
      
      case 'message':
        this.handleChatMessage(ws, data);
        break;
      
      case 'typing_start':
        this.handleTypingStart(ws, data);
        break;
      
      case 'typing_stop':
        this.handleTypingStop(ws, data);
        break;
      
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  handleJoin(ws, data) {
    const { userId, userName, userType } = data;
    
    // Store user connection and info
    this.users.set(userId, ws);
    this.userInfo.set(userId, { userName, userType });
    
    console.log(`User ${userName} (${userId}) joined`);
    
    // Send confirmation
    ws.send(JSON.stringify({
      type: 'joined',
      userId,
      userName,
      userType
    }));
  }

  handleJoinRoom(ws, data) {
    const { bookingId, userId, userName } = data;
    
    // Create room if it doesn't exist
    if (!this.rooms.has(bookingId)) {
      this.rooms.set(bookingId, new Set());
    }
    
    // Add user to room
    this.rooms.get(bookingId).add(ws);
    
    // Store room info in connection
    ws.bookingId = bookingId;
    ws.userId = userId;
    
    console.log(`User ${userName} joined room ${bookingId}`);
    
    // Notify other users in the room
    this.broadcastToRoom(bookingId, {
      type: 'user_joined_room',
      userId,
      userName,
      bookingId
    }, ws);
  }

  handleLeaveRoom(ws, data) {
    const { bookingId, userId } = data;
    
    if (this.rooms.has(bookingId)) {
      this.rooms.get(bookingId).delete(ws);
      
      // Remove room if empty
      if (this.rooms.get(bookingId).size === 0) {
        this.rooms.delete(bookingId);
      }
    }
    
    // Clear room info from connection
    ws.bookingId = null;
    ws.userId = null;
    
    console.log(`User ${userId} left room ${bookingId}`);
  }

  handleChatMessage(ws, data) {
    const { bookingId, message } = data;
    
    // Broadcast message to all users in the room
    this.broadcastToRoom(bookingId, {
      type: 'message',
      bookingId,
      message
    });
    
    console.log(`Message sent in room ${bookingId}:`, message.content);
  }

  handleTypingStart(ws, data) {
    const { bookingId, userId, userName } = data;
    
    // Broadcast typing indicator to other users in the room
    this.broadcastToRoom(bookingId, {
      type: 'typing_start',
      bookingId,
      userId,
      userName
    }, ws);
  }

  handleTypingStop(ws, data) {
    const { bookingId, userId, userName } = data;
    
    // Broadcast typing stop to other users in the room
    this.broadcastToRoom(bookingId, {
      type: 'typing_stop',
      bookingId,
      userId,
      userName
    }, ws);
  }

  handleDisconnection(ws) {
    const userId = ws.userId;
    const bookingId = ws.bookingId;
    
    // Remove from users map
    if (userId) {
      this.users.delete(userId);
      this.userInfo.delete(userId);
    }
    
    // Remove from room
    if (bookingId && this.rooms.has(bookingId)) {
      this.rooms.get(bookingId).delete(ws);
      
      // Remove room if empty
      if (this.rooms.get(bookingId).size === 0) {
        this.rooms.delete(bookingId);
      }
    }
    
    console.log(`User ${userId} disconnected`);
  }

  broadcastToRoom(bookingId, message, excludeWs = null) {
    if (!this.rooms.has(bookingId)) return;
    
    const room = this.rooms.get(bookingId);
    const messageStr = JSON.stringify(message);
    
    room.forEach((client) => {
      if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
        client.send(messageStr);
      }
    });
  }

  broadcastToUser(userId, message) {
    const userWs = this.users.get(userId);
    if (userWs && userWs.readyState === WebSocket.OPEN) {
      userWs.send(JSON.stringify(message));
    }
  }

  getRoomInfo(bookingId) {
    if (!this.rooms.has(bookingId)) return [];
    
    const room = this.rooms.get(bookingId);
    const users = [];
    
    room.forEach((ws) => {
      if (ws.userId) {
        const userInfo = this.userInfo.get(ws.userId);
        if (userInfo) {
          users.push({
            userId: ws.userId,
            userName: userInfo.userName,
            userType: userInfo.userType
          });
        }
      }
    });
    
    return users;
  }
}

export default ChatWebSocketServer;
