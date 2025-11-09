import Review from "../models/review.model.js";
import Booking from "../models/booking.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

// Submit a new review
export const submitReview = async (req, res, next) => {
  try {
    console.log('Review submission request body:', req.body);
    console.log('User ID from token:', req.userId);

    const {
      educatorId,
      packageId,
      sessionId,
      overallRating,
      review,
      categories,
      sessionDate,
      packageTitle,
      educatorName,
      bookingId,
      sessionIndex
    } = req.body;

    const studentId = req.userId;

    console.log('Extracted data:', {
      educatorId,
      packageId,
      sessionId,
      overallRating,
      studentId,
      bookingId,
      sessionIndex
    });

    // Validate required fields
    if (!educatorId || !packageId || !overallRating) {
      console.log('Missing required fields:', { educatorId, packageId, overallRating });
      return next(createError(400, "Missing required fields"));
    }

    // Validate rating range
    if (overallRating < 1 || overallRating > 5) {
      console.log('Invalid rating:', overallRating);
      return next(createError(400, "Rating must be between 1 and 5"));
    }

    // Use the provided sessionId or create one from bookingId and sessionIndex
    const finalSessionId = sessionId || `${bookingId}_session_${sessionIndex}`;

    console.log('Final session ID:', finalSessionId);

    // Validate sessionId format
    if (!finalSessionId || typeof finalSessionId !== 'string') {
      console.log('Invalid session ID format:', finalSessionId);
      return next(createError(400, "Invalid session ID format"));
    }

    // Validate bookingId format if provided
    if (bookingId && !mongoose.Types.ObjectId.isValid(bookingId)) {
      console.log('Invalid booking ID format:', bookingId);
      return next(createError(400, "Invalid booking ID format"));
    }

    // Check if review already exists for this session
    const existingReview = await Review.findOne({
      studentId,
      sessionId: finalSessionId
    });

    if (existingReview) {
      console.log('Review already exists for session:', finalSessionId);
      return next(createError(400, "Review already exists for this session"));
    }

    // Create new review
    const newReview = new Review({
      studentId,
      educatorId,
      packageId,
      sessionId: finalSessionId,
      overallRating,
      review: review || "",
      categories: categories || {
        overallExperience: 0,
        teachingQuality: 0,
        communication: 0,
        punctuality: 0,
        valueForMoney: 0
      },
      sessionDate: new Date(sessionDate),
      packageTitle,
      educatorName
    });

    console.log('Creating new review:', newReview);

    const savedReview = await newReview.save();
    console.log('Review saved successfully:', savedReview);

    // Populate user details for response
    await savedReview.populate('studentId', 'username img');

    // Test the rating calculation immediately
    const testRating = await Review.getPackageAverageRating(packageId);
    console.log('Immediate rating calculation for package', packageId, ':', testRating);

    res.status(201).json({
      success: true,
      message: "Review submitted successfully",
      data: savedReview
    });
  } catch (error) {
    if (error.name === 'DuplicateReviewError') {
      return next(createError(400, "Review already exists for this session"));
    }
    console.error('Error submitting review:', error);
    console.error('Error stack:', error.stack);
    next(error);
  }
};

// Get reviews for an educator
export const getEducatorReviews = async (req, res, next) => {
  try {
    const { educatorId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await Review.getEducatorReviews(
      educatorId,
      parseInt(limit),
      parseInt(page)
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews for a package
export const getPackageReviews = async (req, res, next) => {
  try {
    const { packageId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const result = await Review.getPackageReviews(
      packageId,
      parseInt(limit),
      parseInt(page)
    );

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get educator's average rating
export const getEducatorRating = async (req, res, next) => {
  try {
    const { educatorId } = req.params;

    const ratingData = await Review.getEducatorAverageRating(educatorId);

    res.status(200).json({
      success: true,
      data: ratingData
    });
  } catch (error) {
    next(error);
  }
};

// Get package's average rating
export const getPackageRating = async (req, res, next) => {
  try {
    const { packageId } = req.params;

    const ratingData = await Review.getPackageAverageRating(packageId);

    res.status(200).json({
      success: true,
      data: ratingData
    });
  } catch (error) {
    next(error);
  }
};

// Get a single review by ID
export const getReviewById = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId)
      .populate('studentId', 'username img')
      .populate('educatorId', 'username img')
      .populate('packageId', 'title');

    if (!review) {
      return next(createError(404, "Review not found"));
    }

    res.status(200).json({
      success: true,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Get student's reviews
export const getStudentReviews = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ studentId })
      .populate('educatorId', 'username img')
      .populate('packageId', 'title subjects')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ studentId });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update a review (only by the student who wrote it)
export const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { overallRating, review, categories } = req.body;
    const studentId = req.userId;

    const existingReview = await Review.findById(reviewId);

    if (!existingReview) {
      return next(createError(404, "Review not found"));
    }

    if (existingReview.studentId.toString() !== studentId) {
      return next(createError(403, "You can only update your own reviews"));
    }

    // Update fields
    if (overallRating !== undefined) {
      if (overallRating < 1 || overallRating > 5) {
        return next(createError(400, "Rating must be between 1 and 5"));
      }
      existingReview.overallRating = overallRating;
    }

    if (review !== undefined) {
      existingReview.review = review;
    }

    if (categories !== undefined) {
      existingReview.categories = { ...existingReview.categories, ...categories };
    }

    const updatedReview = await existingReview.save();
    await updatedReview.populate('studentId', 'username img');

    res.status(200).json({
      success: true,
      message: "Review updated successfully",
      data: updatedReview
    });
  } catch (error) {
    next(error);
  }
};

// Delete a review (only by the student who wrote it)
export const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const studentId = req.userId;

    const review = await Review.findById(reviewId);

    if (!review) {
      return next(createError(404, "Review not found"));
    }

    if (review.studentId.toString() !== studentId) {
      return next(createError(403, "You can only delete your own reviews"));
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({
      success: true,
      message: "Review deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Report a review
export const reportReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return next(createError(404, "Review not found"));
    }

    review.reported = true;
    review.reportReason = reason;

    await review.save();

    res.status(200).json({
      success: true,
      message: "Review reported successfully"
    });
  } catch (error) {
    next(error);
  }
};

// Mark review as helpful
export const markReviewHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);

    if (!review) {
      return next(createError(404, "Review not found"));
    }

    review.helpfulCount += 1;
    await review.save();

    res.status(200).json({
      success: true,
      message: "Review marked as helpful",
      data: { helpfulCount: review.helpfulCount }
    });
  } catch (error) {
    next(error);
  }
};

// Get recent reviews for dashboard
export const getRecentReviews = async (req, res, next) => {
  try {
    const { limit = 5 } = req.query;

    const reviews = await Review.find({ isVerified: true })
      .populate('studentId', 'username img')
      .populate('educatorId', 'username img')
      .populate('packageId', 'title subjects')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.status(200).json({
      success: true,
      data: reviews
    });
  } catch (error) {
    next(error);
  }
};

// Get reviews pending verification (admin only)
export const getPendingReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reviews = await Review.find({ isVerified: false })
      .populate('studentId', 'username img')
      .populate('educatorId', 'username img')
      .populate('packageId', 'title subjects')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Review.countDocuments({ isVerified: false });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    next(error);
  }
};

// Verify a review (admin only)
export const verifyReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { isVerified } = req.body;

    const review = await Review.findById(reviewId);

    if (!review) {
      return next(createError(404, "Review not found"));
    }

    review.isVerified = isVerified;
    await review.save();

    res.status(200).json({
      success: true,
      message: `Review ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: review
    });
  } catch (error) {
    next(error);
  }
};

// Check if a session can be reviewed
export const canReviewSession = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { sessionId } = req.params;

    // Validate sessionId format
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: "Invalid session ID format"
      });
    }

    // Check if review already exists for this session
    const existingReview = await Review.findOne({
      studentId,
      sessionId
    });

    if (existingReview) {
      return res.status(200).json({
        success: true,
        canReview: false,
        message: "Review already exists for this session"
      });
    }

    // Parse sessionId to extract bookingId and sessionIndex
    let bookingId, sessionIndex;
    if (sessionId.includes('_session_')) {
      const parts = sessionId.split('_session_');
      bookingId = parts[0];
      sessionIndex = parseInt(parts[1]);
    } else {
      // Fallback for old format
      bookingId = sessionId;
      sessionIndex = 0;
    }

    // Validate bookingId format (should be a valid ObjectId)
    if (!mongoose.Types.ObjectId.isValid(bookingId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID format"
      });
    }

    // Check if the booking belongs to the student and is completed
    const booking = await Booking.findOne({
      _id: bookingId,
      studentId: studentId
    }).populate('educatorId', 'username img')
      .populate('packageId', 'title subjects');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Find the specific session by index
    const session = booking.sessions[sessionIndex];
    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Session not found"
      });
    }

    // Check if session is completed (past the scheduled time + duration)
    const sessionStart = new Date(session.date);
    const [hours, minutes] = session.time.split(':');
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + (session.duration || 60));
    
    const now = new Date();
    const isCompleted = now > sessionEnd;

    res.status(200).json({
      success: true,
      canReview: isCompleted,
      message: isCompleted ? "Session can be reviewed" : "Session is not yet completed",
      sessionData: {
        sessionId: sessionId,
        educatorId: booking.educatorId._id,
        packageId: booking.packageId._id,
        sessionDate: session.date,
        packageTitle: booking.packageId.title,
        educatorName: booking.educatorId.username
      }
    });
  } catch (error) {
    console.error('Error in canReviewSession:', error);
    next(error);
  }
};

// Test endpoint to check review system
export const testReviewSystem = async (req, res, next) => {
  try {
    console.log('Testing review system...');
    console.log('User ID from request:', req.userId);
    
    // Check if Review model is working
    const totalReviews = await Review.countDocuments();
    console.log('Total reviews in database:', totalReviews);
    
    // Check if we can create a test review object (without saving)
    const testReview = new Review({
      studentId: req.userId || 'test-student',
      educatorId: 'test-educator',
      packageId: 'test-package',
      sessionId: 'test-session',
      overallRating: 5,
      review: 'Test review',
      sessionDate: new Date(),
      packageTitle: 'Test Package',
      educatorName: 'Test Educator',
      categories: {
        overallExperience: 5,
        teachingQuality: 5,
        communication: 5,
        punctuality: 5,
        valueForMoney: 5
      }
    });
    
    console.log('Test review object created:', testReview);
    
    // Test validation
    const validationError = testReview.validateSync();
    console.log('Validation error:', validationError);
    
    res.status(200).json({
      success: true,
      message: "Review system is working",
      totalReviews,
      userId: req.userId,
      testReview: testReview.toObject(),
      validationError: validationError ? validationError.message : null
    });
  } catch (error) {
    console.error('Error testing review system:', error);
    res.status(500).json({
      success: false,
      message: "Review system error",
      error: error.message,
      stack: error.stack
    });
  }
};
