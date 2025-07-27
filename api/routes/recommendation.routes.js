import express from "express";
import { recommendTutors, recommendWorkPlan } from "../controllers/recommendation.controller.js";
import { verifyToken } from "../middleware/jwt.js";
const router = express.Router();

router.get("/tutors", verifyToken, recommendTutors);
router.get("/workplan", verifyToken, recommendWorkPlan);

export default router; 