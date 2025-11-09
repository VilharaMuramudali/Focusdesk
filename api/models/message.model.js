// models/message.model.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 1000
    },
    senderName: {
      type: String,
      required: true
    },
    senderType: {
      type: String,
      enum: ['student', 'educator'],
      required: true
    },
    read: {
      type: Boolean,
      default: false,
      index: true
    },
    readAt: {
      type: Date,
      default: null
    },
    delivered: {
      type: Boolean,
      default: false
    },
    deliveredAt: {
      type: Date,
      default: null
    },
    messageType: {
      type: String,
      enum: ['text', 'file', 'image'],
      default: 'text'
    },
    fileUrl: {
      type: String,
      default: null
    },
    fileName: {
      type: String,
      default: null
    },
    fileSize: {
      type: Number,
      default: null
    },
    fileType: {
      type: String,
      default: null
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for efficient querying
MessageSchema.index({ conversationId: 1, createdAt: -1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ receiverId: 1, read: 1 });
MessageSchema.index({ conversationId: 1, read: 1 });

// Virtual for formatted time
MessageSchema.virtual('formattedTime').get(function() {
  return this.createdAt.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
});

// Method to mark as delivered
MessageSchema.methods.markAsDelivered = async function() {
  this.delivered = true;
  this.deliveredAt = new Date();
  return await this.save();
};

// Method to mark as read
MessageSchema.methods.markAsRead = async function() {
  this.read = true;
  this.readAt = new Date();
  return await this.save();
};

export default mongoose.model("Message", MessageSchema);
