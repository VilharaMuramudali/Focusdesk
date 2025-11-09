import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    educatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Package",
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    review: {
      type: String,
      maxlength: 500,
      trim: true,
    },
    categories: {
      overallExperience: {
        type: Number,
        min: 0,
        max: 5,
        required: false,
      },
      teachingQuality: {
        type: Number,
        min: 0,
        max: 5,
        required: false,
      },
      communication: {
        type: Number,
        min: 0,
        max: 5,
        required: false,
      },
      punctuality: {
        type: Number,
        min: 0,
        max: 5,
        required: false,
      },
      valueForMoney: {
        type: Number,
        min: 0,
        max: 5,
        required: false,
      },
    },
    sessionDate: {
      type: Date,
      required: true,
    },
    packageTitle: {
      type: String,
      required: true,
    },
    educatorName: {
      type: String,
      required: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    helpfulCount: {
      type: Number,
      default: 0,
    },
    reported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      enum: ['inappropriate', 'spam', 'fake', 'other'],
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
reviewSchema.index({ educatorId: 1, createdAt: -1 });
reviewSchema.index({ packageId: 1, createdAt: -1 });
reviewSchema.index({ studentId: 1, createdAt: -1 });
reviewSchema.index({ sessionId: 1 }); // Index for sessionId lookups
reviewSchema.index({ studentId: 1, sessionId: 1 }, { unique: true }); // Prevent duplicate reviews per session
reviewSchema.index({ overallRating: 1 });
reviewSchema.index({ isVerified: 1 });

// Virtual for average category rating
reviewSchema.virtual('averageCategoryRating').get(function() {
  const categories = this.categories;
  const validCategories = Object.values(categories).filter(rating => rating && rating > 0);
  
  if (validCategories.length === 0) return this.overallRating;
  
  return validCategories.reduce((sum, rating) => sum + rating, 0) / validCategories.length;
});

// Method to calculate educator's average rating
reviewSchema.statics.getEducatorAverageRating = async function(educatorId) {
  const result = await this.aggregate([
    { $match: { educatorId: new mongoose.Types.ObjectId(educatorId) } }, // Removed isVerified filter for now
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$overallRating" },
        totalReviews: { $sum: 1 },
        ratingDistribution: {
          $push: "$overallRating"
        }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };
  }

  const { averageRating, totalReviews, ratingDistribution } = result[0];
  
  // Calculate rating distribution
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDistribution.forEach(rating => {
    distribution[rating] = (distribution[rating] || 0) + 1;
  });

  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews,
    ratingDistribution: distribution
  };
};

// Method to get package average rating
reviewSchema.statics.getPackageAverageRating = async function(packageId) {
  const result = await this.aggregate([
    { $match: { packageId: new mongoose.Types.ObjectId(packageId) } }, // Removed isVerified filter for now
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$overallRating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (result.length === 0) {
    return {
      averageRating: 0,
      totalReviews: 0
    };
  }

  const { averageRating, totalReviews } = result[0];
  return {
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews
  };
};

// Method to get recent reviews for an educator
reviewSchema.statics.getEducatorReviews = async function(educatorId, limit = 10, page = 1) {
  const skip = (page - 1) * limit;
  
  const reviews = await this.find({ 
    educatorId
  })
  .populate('studentId', 'username img')
  .populate('packageId', 'title subjects')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  const total = await this.countDocuments({ 
    educatorId
  });

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// Method to get recent reviews for a package
reviewSchema.statics.getPackageReviews = async function(packageId, limit = 10, page = 1) {
  const skip = (page - 1) * limit;
  
  const reviews = await this.find({ 
    packageId
  })
  .populate('studentId', 'username img')
  .populate('educatorId', 'username img')
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(limit);

  const total = await this.countDocuments({ 
    packageId
  });

  return {
    reviews,
    total,
    page,
    totalPages: Math.ceil(total / limit)
  };
};

// Pre-save middleware to ensure only one review per session
reviewSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingReview = await this.constructor.findOne({
      studentId: this.studentId,
      sessionId: this.sessionId
    });

    if (existingReview) {
      const error = new Error('Review already exists for this session');
      error.name = 'DuplicateReviewError';
      return next(error);
    }
  }
  next();
});

// Ensure virtual fields are serialized
reviewSchema.set('toJSON', { virtuals: true });
reviewSchema.set('toObject', { virtuals: true });

export default mongoose.model("Review", reviewSchema);
