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
    searchKeywords: [String], // Extracted keywords from search
    filters: Schema.Types.Mixed,
    deviceType: { type: String, enum: ['desktop', 'mobile', 'tablet'] },
    location: String,
    sessionDuration: Number, // Total time spent viewing the package/page in seconds
    viewStartTime: Date, // When user started viewing
    viewEndTime: Date // When user stopped viewing
  },
  
  metadata: {
    isRecommendation: { type: Boolean, default: false },
    recommendationRank: Number,
    algorithmUsed: String,
    timeSpent: Number, // Time spent in seconds (for quick access)
    engagementLevel: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
  }
}, {
  timestamps: true
});

// Indexes for AI analysis
userInteractionSchema.index({ userId: 1, createdAt: -1 });
userInteractionSchema.index({ interactionType: 1, createdAt: -1 });

export default mongoose.model("UserInteraction", userInteractionSchema);
