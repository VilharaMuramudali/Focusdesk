import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
import jwt from "jsonwebtoken";
import userRoute from "./routes/user.route.js";
import profileRoute from "./routes/profile.routes.js";
import packageRoute from "./routes/package.routes.js";
import bookingRoute from "./routes/booking.routes.js";
import authRoute from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import imageRoutes from "./routes/image.routes.js";
import activityRoute from "./routes/activity.routes.js";
import messageRoute from "./routes/message.route.js";
import conversationRoute from "./routes/conversation.routes.js";
import chatUploadRoute from "./routes/chatUpload.routes.js";
import reviewRoute from "./routes/review.route.js";
import learningRoute from "./routes/learning.routes.js";
import recommendRoute from "./routes/recommend.routes.js";
import withdrawalRoute from "./routes/withdrawal.routes.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { verifyToken } from "./middleware/jwt.js";
import startPayoutsJob from './jobs/payoutsJob.js';
const app = express();
dotenv.config();
mongoose.set("strictQuery", true);

// Create HTTP server and Socket.io server
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Make io available to Express routes/controllers via app
app.set('io', io);
// Chat rooms management
const chatRooms = new Map(); // conversationId -> Set of socket IDs
const userInfo = new Map(); // socketId -> user info
const userSockets = new Map(); // userId -> Set of socket IDs

// Socket.io authentication middleware
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    console.log('Socket.IO auth attempt:', { 
      hasToken: !!token, 
      socketId: socket.id 
    });
    
    if (!token) {
      console.warn('Socket.IO connection without token - allowing anyway');
      // Allow connection but mark as unauthenticated
      socket.isAuthenticated = false;
      return next();
    }

    // Verify token manually since verifyToken is middleware
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.userName = decoded.username;
    socket.userType = decoded.isEducator ? 'educator' : 'student';
    socket.isAuthenticated = true;
    console.log('Socket.IO authenticated:', { userId: socket.userId, userName: socket.userName });
    next();
  } catch (error) {
    console.error('Socket.IO authentication error:', error.message);
    // Allow connection but mark as unauthenticated
    socket.isAuthenticated = false;
    next();
  }
});

// WebRTC signaling logic
io.on("connection", (socket) => {
  console.log('New Socket.io connection:', socket.id);

  // Store user socket mapping
  if (!userSockets.has(socket.userId)) {
    userSockets.set(socket.userId, new Set());
  }
  userSockets.get(socket.userId).add(socket.id);

  // Chat functionality
  socket.on("join", ({ userId, userName, userType }) => {
    userInfo.set(socket.id, { userId, userName, userType });
    console.log(`User ${userName} (${userId}) joined`);
    
    socket.emit("joined", { userId, userName, userType });
    
    // Notify other users that this user is online
    socket.broadcast.emit("user_online", { userId, userName });
  });

  socket.on("join_conversation", ({ conversationId, userId }) => {
    if (!chatRooms.has(conversationId)) {
      chatRooms.set(conversationId, new Set());
    }
    
    chatRooms.get(conversationId).add(socket.id);
    socket.join(conversationId);
    
    // Store room info in socket
    socket.conversationId = conversationId;
    socket.userId = userId;
    
    console.log(`User ${userId} joined conversation ${conversationId}`);
    
    // Notify other users in the conversation
    socket.to(conversationId).emit("user_joined_conversation", { userId, conversationId });
  });

  socket.on("leave_conversation", ({ conversationId, userId }) => {
    if (chatRooms.has(conversationId)) {
      chatRooms.get(conversationId).delete(socket.id);
      
      if (chatRooms.get(conversationId).size === 0) {
        chatRooms.delete(conversationId);
      }
    }
    
    socket.leave(conversationId);
    socket.conversationId = null;
    socket.userId = null;
    
    console.log(`User ${userId} left conversation ${conversationId}`);
  });

  socket.on("message", ({ conversationId, message }) => {
    console.log(`Message sent in conversation ${conversationId}:`, message.content);
    
    // Emit to all users in the conversation except sender
    socket.to(conversationId).emit("message", { conversationId, message });
    
    // Emit delivery confirmation to sender
    socket.emit("message_delivered", { conversationId, message });
  });

  socket.on("typing_start", ({ conversationId, userId, userName }) => {
    socket.to(conversationId).emit("typing_start", { conversationId, userId, userName });
  });

  socket.on("typing_stop", ({ conversationId, userId, userName }) => {
    socket.to(conversationId).emit("typing_stop", { conversationId, userId, userName });
  });

  // Legacy booking-based chat (for backward compatibility)
  socket.on("join_room", ({ bookingId, userId, userName }) => {
    if (!chatRooms.has(bookingId)) {
      chatRooms.set(bookingId, new Set());
    }
    
    chatRooms.get(bookingId).add(socket.id);
    socket.join(bookingId);
    
    // Store room info in socket
    socket.bookingId = bookingId;
    socket.userId = userId;
    
    console.log(`User ${userName} joined chat room ${bookingId}`);
    
    // Notify other users in the room
    socket.to(bookingId).emit("user_joined_room", { userId, userName, bookingId });
  });

  socket.on("leave_room", ({ bookingId, userId }) => {
    if (chatRooms.has(bookingId)) {
      chatRooms.get(bookingId).delete(socket.id);
      
      if (chatRooms.get(bookingId).size === 0) {
        chatRooms.delete(bookingId);
      }
    }
    
    socket.leave(bookingId);
    socket.bookingId = null;
    socket.userId = null;
    
    console.log(`User ${userId} left chat room ${bookingId}`);
  });

  // WebRTC signaling logic
  socket.on("join-room", ({ roomId, userId }) => {
    socket.join(roomId);
    socket.to(roomId).emit("user-joined", { userId });
  });

  socket.on("offer", ({ roomId, offer, userId }) => {
    socket.to(roomId).emit("offer", { offer, userId });
  });

  socket.on("answer", ({ roomId, answer, userId }) => {
    socket.to(roomId).emit("answer", { answer, userId });
  });

  socket.on("ice-candidate", ({ roomId, candidate, userId }) => {
    socket.to(roomId).emit("ice-candidate", { candidate, userId });
  });

  socket.on("leave-room", ({ roomId, userId }) => {
    socket.leave(roomId);
    socket.to(roomId).emit("user-left", { userId });
  });

  socket.on("chat-message", ({ roomId, userId, message, file, fileName }) => {
    socket.to(roomId).emit("chat-message", { userId, message, file, fileName });
  });

  // Handle disconnection
  socket.on("disconnect", () => {
    const userId = socket.userId;
    const conversationId = socket.conversationId;
    const bookingId = socket.bookingId;
    
    // Remove from user info
    userInfo.delete(socket.id);
    
    // Remove from user sockets mapping
    if (userSockets.has(userId)) {
      userSockets.get(userId).delete(socket.id);
      if (userSockets.get(userId).size === 0) {
        userSockets.delete(userId);
        // Notify other users that this user is offline
        socket.broadcast.emit("user_offline", { userId });
      }
    }
    
    // Remove from conversation room
    if (conversationId && chatRooms.has(conversationId)) {
      chatRooms.get(conversationId).delete(socket.id);
      
      if (chatRooms.get(conversationId).size === 0) {
        chatRooms.delete(conversationId);
      }
    }
    
    // Remove from booking room (legacy)
    if (bookingId && chatRooms.has(bookingId)) {
      chatRooms.get(bookingId).delete(socket.id);
      
      if (chatRooms.get(bookingId).size === 0) {
        chatRooms.delete(bookingId);
      }
    }
    
    console.log(`User ${userId} disconnected`);
  });
});

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log(error);
  }
};

// Middleware
app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static('uploads')); // Serve uploaded files

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), 'uploads');
const chatUploadsDir = path.join(uploadsDir, 'chat');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
if (!fs.existsSync(chatUploadsDir)) {
  fs.mkdirSync(chatUploadsDir);
}

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/profiles", profileRoute);
app.use("/api/packages", packageRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/images", imageRoutes);
app.use("/api/activities", activityRoute);
app.use("/api/messages", messageRoute);
app.use("/api/conversations", conversationRoute);
app.use("/api/upload", chatUploadRoute);
app.use("/api/reviews", reviewRoute);
app.use("/api/learning", learningRoute);
app.use("/api/recommend", recommendRoute);
app.use("/api/withdrawals", withdrawalRoute);

// Error handling middleware
app.use((err, req, res, next) => {
  const errorStatus = err.status || 500;
  const errorMessage = err.message || "Something went wrong!";

  return res.status(errorStatus).json({
    status: errorStatus,
    message: errorMessage,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
});

// Start server
httpServer.listen(8800, async () => {
  await connect();
  console.log("Backend server (with Socket.io and Chat functionality) is running on port 8800!");
    // Start payouts background job
    try {
      startPayoutsJob();
    } catch (e) {
      console.error('Failed to start payouts job:', e);
    }
  
  // Graceful shutdown handler
  process.on('SIGTERM', async () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    io.close(() => {
      console.log('✅ Socket.IO closed');
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  });
  
  process.on('SIGINT', async () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    io.close(() => {
      console.log('✅ Socket.IO closed');
      httpServer.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
      });
    });
  });
});
