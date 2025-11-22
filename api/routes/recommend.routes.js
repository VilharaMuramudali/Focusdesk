import express from "express";
import { 
  trackSearchQuery, 
  trackPackageView, 
  trackInteraction,
  getPersonalizedRecommendations,
  getSimilarPackages,
  trainModel
} from "../controllers/recommend.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

// Track search query - saves search keywords in real-time
router.post("/track-search", verifyToken, trackSearchQuery);

// Track package view with time spent
router.post("/track-package-view", verifyToken, trackPackageView);

// Track general interaction (clicks, views, etc.)
router.post("/track", verifyToken, trackInteraction);

// ML-Powered Recommendations
// Get personalized recommendations for the current user
router.get("/personalized", verifyToken, getPersonalizedRecommendations);

// Get similar packages based on content similarity
router.get("/similar/:packageId", getSimilarPackages);

// Train/retrain the ML model (admin only - consider adding admin middleware)
router.post("/train-model", trainModel);

export default router;

