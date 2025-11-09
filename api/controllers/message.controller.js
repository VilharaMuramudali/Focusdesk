// controllers/message.controller.js
import Message from "../models/message.model.js";
import Conversation from "../models/conversation.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const userId = req.userId;

    // Validate conversationId
    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return next(createError(400, "Invalid conversation ID"));
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    const skip = (page - 1) * limit;

    const messages = await Message.find({ conversationId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'username img')
      .populate('receiverId', 'username img');

    // Get total count for pagination
    const totalMessages = await Message.countDocuments({ conversationId });

    // Mark messages as read for the current user
    await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    // Reset unread count in conversation
    await conversation.resetUnreadCount(userId);

    res.status(200).json({
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalMessages / limit),
        totalMessages,
        hasMore: skip + messages.length < totalMessages
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createMessage = async (req, res, next) => {
  try {
    const { conversationId, content, messageType = 'text', fileUrl, fileName, fileSize, fileType } = req.body;
    const senderId = req.userId;

    // Validate required fields
    if (!conversationId) {
      return next(createError(400, "Conversation ID is required"));
    }
    
    if (!content && messageType === 'text') {
      return next(createError(400, "Message content is required"));
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return next(createError(400, "Invalid conversation ID"));
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': senderId,
      isActive: true
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    // Get the receiver (other participant)
    const receiver = conversation.participants.find(p => p.userId.toString() !== senderId);
    if (!receiver) {
      return next(createError(400, "Invalid conversation"));
    }

    // Get sender info
    const sender = conversation.participants.find(p => p.userId.toString() === senderId);

    const newMessage = new Message({
      conversationId,
      senderId,
      receiverId: receiver.userId,
      content: content || '',
      senderName: sender.userName,
      senderType: sender.userType,
      messageType,
      fileUrl,
      fileName,
      fileSize,
      fileType
    });

    const savedMessage = await newMessage.save();

    // Populate sender and receiver info
    const populatedMessage = await Message.findById(savedMessage._id)
      .populate('senderId', 'username img')
      .populate('receiverId', 'username img');

    // Update conversation's last message and activity
    conversation.lastMessage = savedMessage._id;
    conversation.lastActivity = new Date();
    await conversation.save();

    // Increment unread count for receiver
    await conversation.incrementUnreadCount(receiver.userId);

    res.status(201).json(populatedMessage);
  } catch (err) {
    next(err);
  }
};

export const markMessagesAsRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return next(createError(400, "Invalid conversation ID"));
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    // Mark messages as read
    const updateResult = await Message.updateMany(
      {
        conversationId,
        receiverId: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    // Reset unread count
    await conversation.resetUnreadCount(userId);

    res.status(200).json({ 
      message: "Messages marked as read",
      modifiedCount: updateResult.modifiedCount
    });
  } catch (err) {
    next(err);
  }
};

export const markMessageAsDelivered = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return next(createError(400, "Invalid message ID"));
    }

    const message = await Message.findOne({
      _id: messageId,
      receiverId: userId
    });

    if (!message) {
      return next(createError(404, "Message not found"));
    }

    await message.markAsDelivered();

    res.status(200).json({ message: "Message marked as delivered" });
  } catch (err) {
    next(err);
  }
};

export const deleteMessage = async (req, res, next) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return next(createError(400, "Invalid message ID"));
    }

    const message = await Message.findOne({
      _id: messageId,
      senderId: userId
    });

    if (!message) {
      return next(createError(404, "Message not found or unauthorized"));
    }

    await Message.findByIdAndDelete(messageId);

    res.status(200).json({ message: "Message deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.userId;

    const unreadCount = await Message.countDocuments({
      receiverId: userId,
      read: false
    });

    res.status(200).json({ unreadCount });
  } catch (err) {
    next(err);
  }
};

export const searchMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { query } = req.query;
    const userId = req.userId;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({ message: "Search query must be at least 2 characters" });
    }

    if (!mongoose.Types.ObjectId.isValid(conversationId)) {
      return next(createError(400, "Invalid conversation ID"));
    }

    // Verify user is part of the conversation
    const conversation = await Conversation.findOne({
      _id: conversationId,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    const messages = await Message.find({
      conversationId,
      content: { $regex: query, $options: 'i' }
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .populate('senderId', 'username img');

    res.status(200).json({ messages });
  } catch (err) {
    next(err);
  }
};
