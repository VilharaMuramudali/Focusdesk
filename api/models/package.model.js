import mongoose from "mongoose";
const { Schema } = mongoose;

const packageSchema = new Schema({
  educatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  thumbnail: {
    type: String,
    required: false
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  keywords: {
    type: [String],
    default: []
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  video: {
    type: String,
    required: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sessions: {
    type: Number,
    default: 1
  },
  languages: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Method to convert comma-separated keywords string to array
packageSchema.statics.formatKeywords = function(keywordsString) {
  if (!keywordsString) return [];
  return keywordsString.split(',').map(keyword => keyword.trim()).filter(Boolean);
};

export default mongoose.model("Package", packageSchema);
