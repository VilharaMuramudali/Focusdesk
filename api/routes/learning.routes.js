import express from 'express';
import { getLearningStats, getLearningActivity, getLearningTrends, getLearningRecommendations } from '../controllers/learning.controller.js';

const router = express.Router();

// Learning statistics
router.get('/stats', getLearningStats);

// Learning activity data
router.get('/activity', getLearningActivity);

// Learning trends data
router.get('/trends', getLearningTrends);

// Learning recommendations
router.get('/recommendations', getLearningRecommendations);

export default router;
