import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  getMessages,
  createMessage,
  markMessagesAsRead,
  markMessageAsDelivered,
  deleteMessage,
  getUnreadCount,
  searchMessages
} from "../controllers/message.controller.js";

const router = express.Router();

// Get messages for a specific conversation
router.get("/:conversationId", verifyToken, getMessages);

// Search messages in a conversation
router.get("/:conversationId/search", verifyToken, searchMessages);

// Send a new message
router.post("/", verifyToken, createMessage);

// Mark messages as read
router.put("/read/:conversationId", verifyToken, markMessagesAsRead);

// Mark a specific message as delivered
router.put("/delivered/:messageId", verifyToken, markMessageAsDelivered);

// Delete a message
router.delete("/:messageId", verifyToken, deleteMessage);

// Get unread message count
router.get("/unread/count", verifyToken, getUnreadCount);

export default router;
