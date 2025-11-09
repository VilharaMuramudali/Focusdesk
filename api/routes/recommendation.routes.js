// api/routes/recommendation.routes.js
import express from "express";
import {
  getEducatorRecommendations,
  trackRecommendationInteraction,
  trackSearch,
  trackPackageView,
  getRecommendationMetrics,
  getDashboardRecommendations,
  getAIStats,
  trainAIModel,
  loadAIModel,
  getAvailableAlgorithms,
  getEvaluationResults
} from "../controllers/recommendation.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

// Get AI-powered educator recommendations
router.get("/educators", verifyToken, getEducatorRecommendations);

// Get personalized tutor recommendations (frontend calls this)
router.get("/tutors", verifyToken, getDashboardRecommendations);

// Track user interactions with recommendations
router.post("/track", verifyToken, trackRecommendationInteraction);

// Track search queries
router.post("/track-search", verifyToken, trackSearch);

// Track package views with time spent
router.post("/track-package-view", verifyToken, trackPackageView);

// Get dashboard recommendations
router.get("/dashboard", verifyToken, getDashboardRecommendations);

// Get recommendation metrics (admin only - add admin middleware if needed)
router.get("/metrics", verifyToken, getRecommendationMetrics);

// AI Service Management Routes
router.get("/ai/stats", verifyToken, getAIStats);
router.post("/ai/train", verifyToken, trainAIModel);
router.post("/ai/load", verifyToken, loadAIModel);
router.get("/ai/algorithms", verifyToken, getAvailableAlgorithms);
router.get("/ai/evaluation-results", verifyToken, getEvaluationResults);

export default router;
