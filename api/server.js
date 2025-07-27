import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import userRoute from "./routes/user.route.js";
import profileRoute from "./routes/profile.routes.js";
import packageRoute from "./routes/package.routes.js";
import bookingRoute from "./routes/booking.routes.js";
import authRoute from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import imageRoutes from "./routes/image.routes.js";
import activityRoute from "./routes/activity.routes.js";
import recommendationRoute from "./routes/recommendation.routes.js";
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

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

// WebRTC signaling logic
io.on("connection", (socket) => {
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

// Routes
app.use("/api/auth", authRoute);
app.use("/api/users", userRoute);
app.use("/api/profiles", profileRoute);
app.use("/api/packages", packageRoute);
app.use("/api/bookings", bookingRoute);
app.use("/api/images", imageRoutes);
app.use("/api/activities", activityRoute);
app.use("/api/recommend", recommendationRoute);

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
httpServer.listen(8800, () => {
  connect();
  console.log("Backend server (with Socket.io) is running on port 8800!");
});
