import mongoose from "mongoose";
const { Schema } = mongoose;

const learningSessionSchema = new Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true
  },
  educatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  topic: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  duration: {
    type: Number, // in minutes
    required: true
  },
  sessionDate: {
    type: Date,
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'missed'],
    default: 'scheduled'
  },
  completionRate: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  rating: {
    type: Number,
    min: 1,
    max: 5
  },
  notes: String,
  objectives: [String],
  completedObjectives: [String],
  // Activity tracking
  activityLevel: {
    type: Number,
    min: 0,
    max: 4, // 0 = no activity, 4 = very high activity
    default: 0
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
learningSessionSchema.index({ studentId: 1, sessionDate: -1 });
learningSessionSchema.index({ studentId: 1, status: 1 });
learningSessionSchema.index({ studentId: 1, createdAt: -1 });

export default mongoose.model("LearningSession", learningSessionSchema);
