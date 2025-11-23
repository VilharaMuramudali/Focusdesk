import express from 'express';
import { getLearningStats, getLearningActivity, getLearningTrends, getLearningRecommendations } from '../controllers/learning.controller.js';
import { verifyToken } from '../middleware/jwt.js';

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Learning statistics
router.get('/stats', getLearningStats);

// Learning activity data
router.get('/activity', getLearningActivity);

// Learning trends data
router.get('/trends', getLearningTrends);

// Learning recommendations
router.get('/recommendations', getLearningRecommendations);

export default router;
