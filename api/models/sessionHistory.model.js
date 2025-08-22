import mongoose from "mongoose";
const { Schema } = mongoose;

const sessionHistorySchema = new Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  educatorId: {
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
  sessionData: {
    duration: { type: Number, required: true }, // in minutes
    subject: { type: String, required: true },
    topics: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'intermediate'
    },
    scheduledDate: { type: Date, required: true },
    actualStartTime: Date,
    actualEndTime: Date,
    platform: {
      type: String,
      enum: ['zoom', 'teams', 'skype', 'google_meet', 'other'],
      default: 'zoom'
    },
    meetingLink: String,
    recordingUrl: String
  },
  performance: {
    studentRating: { type: Number, min: 1, max: 5 },
    educatorRating: { type: Number, min: 1, max: 5 },
    completionRate: { type: Number, min: 0, max: 100, default: 0 },
    engagementScore: { type: Number, min: 0, max: 100, default: 0 },
    attendanceStatus: {
      type: String,
      enum: ['attended', 'no_show', 'cancelled', 'rescheduled'],
      default: 'attended'
    }
  },
  learningOutcomes: {
    conceptsLearned: [String],
    skillsImproved: [String],
    areasOfDifficulty: [String],
    nextSteps: [String],
    overallProgress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    }
  },
  feedback: {
    studentFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      suggestions: String,
      wouldRecommend: { type: Boolean, default: true }
    },
    educatorFeedback: {
      rating: { type: Number, min: 1, max: 5 },
      comment: String,
      studentPerformance: String,
      improvementAreas: [String]
    }
  },
  metadata: {
    platform: String,
    location: {
      country: String,
      city: String,
      timezone: String
    },
    deviceInfo: {
      deviceType: {
        type: String,
        enum: ['desktop', 'tablet', 'mobile'],
        default: 'desktop'
      },
      browser: String,
      os: String
    },
    technicalIssues: [String],
    sessionQuality: {
      type: String,
      enum: ['excellent', 'good', 'fair', 'poor'],
      default: 'good'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for better query performance
sessionHistorySchema.index({ userId: 1, createdAt: -1 });
sessionHistorySchema.index({ educatorId: 1, createdAt: -1 });
sessionHistorySchema.index({ 'sessionData.subject': 1, createdAt: -1 });
sessionHistorySchema.index({ 'performance.studentRating': -1 });
sessionHistorySchema.index({ 'sessionData.scheduledDate': 1 });

// Pre-save middleware to update timestamp
sessionHistorySchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Static method to get user session history
sessionHistorySchema.statics.getUserSessionHistory = function(userId, limit = 20, skip = 0) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('educatorId', 'username email img subjects bio rating')
    .populate('bookingId', 'packageId totalAmount status')
    .exec();
};

// Static method to get user session statistics
sessionHistorySchema.statics.getUserSessionStats = function(userId) {
  return this.aggregate([
    {
      $match: { userId: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        averageRating: { $avg: '$performance.studentRating' },
        averageCompletionRate: { $avg: '$performance.completionRate' },
        totalDuration: { $sum: '$sessionData.duration' },
        subjects: { $addToSet: '$sessionData.subject' },
        platforms: { $addToSet: '$sessionData.platform' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSessions: 1,
        averageRating: 1,
        averageCompletionRate: 1,
        totalDuration: 1,
        subjects: 1,
        platforms: 1
      }
    }
  ]);
};

// Static method to get subject performance analysis
sessionHistorySchema.statics.getSubjectPerformance = function(userId) {
  return this.aggregate([
    {
      $match: { userId: mongoose.Types.ObjectId(userId) }
    },
    {
      $group: {
        _id: '$sessionData.subject',
        sessionCount: { $sum: 1 },
        averageRating: { $avg: '$performance.studentRating' },
        averageCompletionRate: { $avg: '$performance.completionRate' },
        totalDuration: { $sum: '$sessionData.duration' },
        lastSession: { $max: '$createdAt' }
      }
    },
    {
      $sort: { sessionCount: -1 }
    }
  ]);
};

// Instance method to calculate session effectiveness
sessionHistorySchema.methods.calculateEffectiveness = function() {
  const ratingWeight = 0.4;
  const completionWeight = 0.3;
  const engagementWeight = 0.3;
  
  const rating = this.performance.studentRating || 0;
  const completion = this.performance.completionRate || 0;
  const engagement = this.performance.engagementScore || 0;
  
  return (rating * ratingWeight) + (completion * completionWeight) + (engagement * engagementWeight);
};

export default mongoose.model('SessionHistory', sessionHistorySchema);
