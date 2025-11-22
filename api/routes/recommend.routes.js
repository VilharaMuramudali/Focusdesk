import express from "express";
import { 
  trackSearchQuery, 
  trackPackageView, 
  trackInteraction 
} from "../controllers/recommend.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

// Track search query - saves search keywords in real-time
router.post("/track-search", verifyToken, trackSearchQuery);

// Track package view with time spent
router.post("/track-package-view", verifyToken, trackPackageView);

// Track general interaction (clicks, views, etc.)
router.post("/track", verifyToken, trackInteraction);

export default router;

