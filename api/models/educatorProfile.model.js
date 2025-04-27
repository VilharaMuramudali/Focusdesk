// server/models/educatorProfile.model.js
import mongoose from "mongoose";
const { Schema } = mongoose;

const educatorProfileSchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  bio: {
    type: String,
    required: false
  },
  qualifications: {
    type: String,
    required: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  available: {
    type: String,
    required: false
  },
  timeSlots: {
    type: [String],
    default: []
  },
  hourlyRate: {
    type: Number,
    required: false
  },
  languages: {
    type: [String],
    default: []
  },
  subjects: {
    type: [String],
    default: []
  },
  introVideo: {
    type: String,
    required: false
  }
}, {
  timestamps: true
});

export default mongoose.model("EducatorProfile", educatorProfileSchema);
