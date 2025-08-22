// api/routes/recommendation.routes.js
import express from "express";
import {
  getEducatorRecommendations,
  trackRecommendationInteraction,
  getRecommendationMetrics,
  getDashboardRecommendations,
  getAIStats,
  trainAIModel,
  loadAIModel,
  getAvailableAlgorithms
} from "../controllers/recommendation.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

// Get AI-powered educator recommendations
router.get("/educators", verifyToken, getEducatorRecommendations);

// Get personalized tutor recommendations (frontend calls this)
router.get("/tutors", verifyToken, getDashboardRecommendations);

// Track user interactions with recommendations
router.post("/track", verifyToken, trackRecommendationInteraction);

// Get dashboard recommendations
router.get("/dashboard", verifyToken, getDashboardRecommendations);

// Get recommendation metrics (admin only - add admin middleware if needed)
router.get("/metrics", verifyToken, getRecommendationMetrics);

// AI Service Management Routes
router.get("/ai/stats", verifyToken, getAIStats);
router.post("/ai/train", verifyToken, trainAIModel);
router.post("/ai/load", verifyToken, loadAIModel);
router.get("/ai/algorithms", verifyToken, getAvailableAlgorithms);

export default router;
