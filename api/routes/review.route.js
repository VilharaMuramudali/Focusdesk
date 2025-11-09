import express from "express";
import {
  submitReview,
  getEducatorReviews,
  getPackageReviews,
  getEducatorRating,
  getPackageRating,
  getStudentReviews,
  updateReview,
  deleteReview,
  reportReview,
  markReviewHelpful,
  getRecentReviews,
  getPendingReviews,
  verifyReview,
  canReviewSession,
  testReviewSystem,
  getReviewById
} from "../controllers/review.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

// Submit a new review (students only)
router.post("/submit", verifyToken, submitReview);

// Get reviews for an educator
router.get("/educator/:educatorId", getEducatorReviews);

// Get reviews for a package
router.get("/package/:packageId", getPackageReviews);

// Get a single review by ID
router.get("/:reviewId", getReviewById);

// Get educator's average rating
router.get("/educator/:educatorId/rating", getEducatorRating);

// Get package's average rating
router.get("/package/:packageId/rating", getPackageRating);

// Get student's reviews (authenticated)
router.get("/student", verifyToken, getStudentReviews);

// Update a review (authenticated student)
router.put("/:reviewId", verifyToken, updateReview);

// Delete a review (authenticated student)
router.delete("/:reviewId", verifyToken, deleteReview);

// Report a review (authenticated users)
router.post("/:reviewId/report", verifyToken, reportReview);

// Mark review as helpful (authenticated users)
router.post("/:reviewId/helpful", verifyToken, markReviewHelpful);

// Get recent reviews for dashboard
router.get("/recent", getRecentReviews);

// Admin routes (for review moderation)
router.get("/pending", verifyToken, getPendingReviews);
router.put("/:reviewId/verify", verifyToken, verifyReview);

// Check if a session can be reviewed
router.get("/can-review/:sessionId", verifyToken, canReviewSession);

// Test endpoint
router.get("/test", verifyToken, testReviewSystem);

export default router;
