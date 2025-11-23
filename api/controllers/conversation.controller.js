// controllers/conversation.controller.js
import mongoose from "mongoose";
import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";

export const getConversations = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const conversations = await Conversation.find({
      'participants.userId': userId,
      isActive: true
    })
      .populate('lastMessage')
      .sort({ lastActivity: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Format conversations for frontend
    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => 
        p.userId.toString() !== userId.toString()
      );
      
      return {
        _id: conv._id,
        participantId: otherParticipant?.userId,
        participantName: otherParticipant?.userName,
        participantType: otherParticipant?.userType,
        lastMessage: conv.lastMessage,
        unreadCount: conv.getUnreadCount(userId),
        bookingId: conv.bookingId,
        isActive: conv.isActive,
        updatedAt: conv.lastActivity || conv.updatedAt,
        createdAt: conv.createdAt
      };
    });

    const totalConversations = await Conversation.countDocuments({
      'participants.userId': userId,
      isActive: true
    });

    res.status(200).json({
      conversations: formattedConversations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalConversations / limit),
        totalConversations,
        hasMore: skip + conversations.length < totalConversations
      }
    });
  } catch (err) {
    next(err);
  }
};

export const createConversation = async (req, res, next) => {
  try {
    const { receiverId, receiverName, receiverType, bookingId } = req.body;
    const senderId = req.userId;

    console.log('Creating conversation:', { senderId, receiverId, receiverName, receiverType, bookingId });

    if (!receiverId) {
      return next(createError(400, "Receiver ID is required"));
    }

    // Validate receiverId format
    if (!mongoose.Types.ObjectId.isValid(receiverId)) {
      return next(createError(400, "Invalid receiver ID format"));
    }

    // Get sender info
    const sender = await User.findById(senderId);
    if (!sender) {
      return next(createError(404, "Sender not found"));
    }

    // Get receiver info
    const receiver = await User.findById(receiverId);
    if (!receiver) {
      return next(createError(404, "Receiver not found"));
    }

    // Prevent users from messaging themselves
    if (senderId.toString() === receiverId.toString()) {
      return next(createError(400, "Cannot create conversation with yourself"));
    }

    const senderType = sender.isEducator ? 'educator' : 'student';
    const actualReceiverType = receiver.isEducator ? 'educator' : 'student';

    // Use the static method to find or create conversation
    const conversation = await Conversation.findOrCreateConversation(
      senderId,
      sender.username,
      senderType,
      receiverId,
      receiverName || receiver.username,
      receiverType || actualReceiverType,
      bookingId || null
    );

    console.log('Conversation created/found:', conversation._id);

    // Format response for frontend
    const formattedConversation = {
      _id: conversation._id,
      participantId: receiverId,
      participantName: receiverName || receiver.username,
      participantType: receiverType || actualReceiverType,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.getUnreadCount(senderId),
      bookingId: conversation.bookingId,
      isActive: conversation.isActive,
      updatedAt: conversation.lastActivity || conversation.updatedAt,
      createdAt: conversation.createdAt,
      participants: conversation.participants
    };

    // Always return 200 for success (whether new or existing conversation)
    res.status(200).json(formattedConversation);
  } catch (err) {
    console.error('Error in createConversation:', err);
    next(err);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findOne({
      _id: id,
      'participants.userId': userId,
      isActive: true
    })
      .populate('lastMessage');

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    // Get other participant info
    const otherParticipant = conversation.participants.find(p => 
      p.userId.toString() !== userId.toString()
    );

    const formattedConversation = {
      _id: conversation._id,
      participantId: otherParticipant?.userId,
      participantName: otherParticipant?.userName,
      participantType: otherParticipant?.userType,
      lastMessage: conversation.lastMessage,
      unreadCount: conversation.getUnreadCount(userId),
      bookingId: conversation.bookingId,
      isActive: conversation.isActive,
      updatedAt: conversation.lastActivity || conversation.updatedAt,
      createdAt: conversation.createdAt
    };

    res.status(200).json(formattedConversation);
  } catch (err) {
    next(err);
  }
};

export const updateConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { isActive } = req.body;

    const conversation = await Conversation.findOne({
      _id: id,
      'participants.userId': userId
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    if (isActive !== undefined) {
      conversation.isActive = isActive;
    }
    
    conversation.lastActivity = new Date();
    await conversation.save();

    res.status(200).json({ message: "Conversation updated successfully" });
  } catch (err) {
    next(err);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findOne({
      _id: id,
      'participants.userId': userId
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    // Soft delete - mark as inactive
    conversation.isActive = false;
    conversation.lastActivity = new Date();
    await conversation.save();

    res.status(200).json({ message: "Conversation deleted successfully" });
  } catch (err) {
    next(err);
  }
};

export const markConversationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const conversation = await Conversation.findOne({
      _id: id,
      'participants.userId': userId,
      isActive: true
    });

    if (!conversation) {
      return next(createError(404, "Conversation not found"));
    }

    // Reset unread count
    await conversation.resetUnreadCount(userId);

    // Mark all messages as read
    await Message.updateMany(
      {
        conversationId: id,
        receiverId: userId,
        read: false
      },
      {
        read: true,
        readAt: new Date()
      }
    );

    res.status(200).json({ message: "Conversation marked as read" });
  } catch (err) {
    next(err);
  }
};
