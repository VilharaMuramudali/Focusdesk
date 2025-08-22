import express from "express";
import { deleteUser, getUser, updateUser, getUserPreferences, updateUserPreferences, checkPreferencesSetup } from "../controllers/user.controller.js";
import { verifyToken } from "../middleware/jwt.js";
import User from "../models/user.model.js";

const router = express.Router();

// Get current user endpoint (must come before /:id routes to avoid conflicts)
router.get("/me", verifyToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return next(createError(404, "User not found"));
    }
    const { password, ...info } = user._doc;
    res.status(200).send(info);
  } catch (err) {
    next(createError(500, "Failed to get user data"));
  }
});

// Subject preferences endpoints (must come before /:id routes to avoid conflicts)
router.get("/preferences/check", verifyToken, checkPreferencesSetup);
router.get("/preferences", verifyToken, getUserPreferences);
router.put("/preferences", verifyToken, updateUserPreferences);

// User CRUD endpoints
router.get("/:id", getUser);
router.put("/:id", verifyToken, updateUser);
router.delete("/:id", verifyToken, deleteUser);

// Search users for chat
router.get("/search", verifyToken, async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserId = req.userId;

    if (!q || q.trim().length < 2) {
      return res.status(400).json({ 
        users: [],
        message: "Search query must be at least 2 characters" 
      });
    }

    const users = await User.find({
      _id: { $ne: currentUserId }, // Exclude current user
      $or: [
        { username: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ]
    })
    .select('username email img isEducator')
    .limit(20);

    res.status(200).json({ users });
  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({ 
      users: [],
      message: "Internal server error" 
    });
  }
});
// Learning-related endpoints
router.get("/learning-stats", verifyToken, (req, res) => {
  // Mock learning statistics - in a real app, this would fetch from database
  res.json({
    totalHours: 24.5,
    completedModules: 8,
    currentStreak: 5,
    averageScore: 87,
    weeklyGoal: 10
  });
});

router.get("/recent-activity", verifyToken, (req, res) => {
  // Mock recent activity data
  res.json([
    { type: 'session', title: 'Math Tutoring', time: '2 hours ago', score: 92 },
    { type: 'quiz', title: 'Physics Quiz', time: '1 day ago', score: 85 },
    { type: 'module', title: 'Chemistry Module 3', time: '2 days ago', progress: 75 },
    { type: 'assignment', title: 'English Essay', time: '3 days ago', score: 88 },
    { type: 'session', title: 'Biology Review', time: '4 days ago', score: 90 }
  ]);
});

router.get("/top-subjects", verifyToken, (req, res) => {
  // Mock top subjects data
  res.json(['Mathematics', 'Physics', 'Chemistry', 'English', 'Biology']);
});

export default router;
