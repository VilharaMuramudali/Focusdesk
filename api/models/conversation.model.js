// models/conversation.model.js
import mongoose from "mongoose";

const ConversationSchema = new mongoose.Schema(
  {
    participants: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        userName: {
          type: String,
          required: true
        },
        userType: {
          type: String,
          enum: ['student', 'educator'],
          required: true
        }
      }
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Message'
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map()
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      default: null
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for efficient querying
ConversationSchema.index({ 'participants.userId': 1 });
ConversationSchema.index({ bookingId: 1 });
ConversationSchema.index({ lastActivity: -1 });
ConversationSchema.index({ isActive: 1 });

// Virtual for getting the other participant
ConversationSchema.virtual('otherParticipant').get(function() {
  if (this.currentUserId) {
    return this.participants.find(p => p.userId.toString() !== this.currentUserId.toString());
  }
  return null;
});

// Method to get unread count for a specific user
ConversationSchema.methods.getUnreadCount = function(userId) {
  return this.unreadCount.get(userId.toString()) || 0;
};

// Method to increment unread count for a specific user
ConversationSchema.methods.incrementUnreadCount = async function(userId) {
  const currentCount = this.getUnreadCount(userId);
  this.unreadCount.set(userId.toString(), currentCount + 1);
  return await this.save();
};

// Method to reset unread count for a specific user
ConversationSchema.methods.resetUnreadCount = async function(userId) {
  this.unreadCount.set(userId.toString(), 0);
  return await this.save();
};

// Static method to find or create conversation between two users
ConversationSchema.statics.findOrCreateConversation = async function(user1Id, user1Name, user1Type, user2Id, user2Name, user2Type, bookingId = null) {
  // Normalize user IDs to ensure they're ObjectIds
  const user1ObjectId = typeof user1Id === 'string' ? new mongoose.Types.ObjectId(user1Id) : user1Id;
  const user2ObjectId = typeof user2Id === 'string' ? new mongoose.Types.ObjectId(user2Id) : user2Id;

  // Check if conversation already exists (try multiple queries to handle race conditions)
  let existingConversation = await this.findOne({
    'participants.userId': { $all: [user1ObjectId, user2ObjectId] },
    participants: { $size: 2 },
    isActive: true
  });

  if (existingConversation) {
    return existingConversation;
  }

  // Try to create new conversation with error handling for race conditions
  try {
    const newConversation = new this({
      participants: [
        {
          userId: user1ObjectId,
          userName: user1Name,
          userType: user1Type
        },
        {
          userId: user2ObjectId,
          userName: user2Name,
          userType: user2Type
        }
      ],
      bookingId: bookingId || null,
      lastActivity: new Date()
    });

    const savedConversation = await newConversation.save();
    return savedConversation;
  } catch (error) {
    // If duplicate key error or other error, try to find existing conversation again
    if (error.code === 11000 || error.name === 'MongoServerError') {
      // Race condition: conversation was created by another request
      existingConversation = await this.findOne({
        'participants.userId': { $all: [user1ObjectId, user2ObjectId] },
        participants: { $size: 2 },
        isActive: true
      });

      if (existingConversation) {
        return existingConversation;
      }
    }
    
    // Re-throw if we couldn't find an existing conversation
    throw error;
  }
};

export default mongoose.model("Conversation", ConversationSchema);
