import express from "express";
import { verifyToken } from "../middleware/jwt.js";
import {
  getConversations,
  createConversation,
  getConversation,
  updateConversation,
  deleteConversation,
  markConversationAsRead
} from "../controllers/conversation.controller.js";

const router = express.Router();

// Get all conversations for the current user
router.get("/", verifyToken, getConversations);

// Create a new conversation
router.post("/", verifyToken, createConversation);

// Get a specific conversation
router.get("/:id", verifyToken, getConversation);

// Update a conversation
router.put("/:id", verifyToken, updateConversation);

// Delete a conversation (soft delete)
router.delete("/:id", verifyToken, deleteConversation);

// Mark conversation as read
router.put("/:id/read", verifyToken, markConversationAsRead);

export default router;
