import express from "express";
import { logActivity, getStudentActivities } from "../controllers/activity.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/", verifyToken, logActivity);
router.get("/:studentId", verifyToken, getStudentActivities);

export default router; 