// api/models/userInteraction.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const userInteractionSchema = new Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  targetId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  packageId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Package' 
  },
  
  interactionType: {
    type: String,
    enum: ['view', 'click', 'bookmark', 'share', 'message', 'book', 'cancel'],
    required: true
  },
  
  context: {
    searchQuery: String,
    filters: Schema.Types.Mixed,
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    location: String,
    sessionDuration: Number
  },
  
  metadata: {
    isRecommendation: { type: Boolean, default: false },
    recommendationRank: Number,
    algorithmUsed: String
  }
}, {
  timestamps: true
});

// Indexes for AI analysis
userInteractionSchema.index({ userId: 1, createdAt: -1 });
userInteractionSchema.index({ interactionType: 1, createdAt: -1 });

export default mongoose.model("UserInteraction", userInteractionSchema);
