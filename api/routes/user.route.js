import express from "express";
import { deleteUser, getUser, updateUser, getUserPreferences, updateUserPreferences, checkPreferencesSetup } from "../controllers/user.controller.js";
import { recordSearch, getSearches, recordInteraction, getInteractions } from "../controllers/analytics.controller.js";
import { verifyToken } from "../middleware/jwt.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import EducatorProfile from "../models/educatorProfile.model.js";
import Review from "../models/review.model.js";

const router = express.Router();

// Multer for avatar uploads
import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/profiles/');
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'avatar-' + unique + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg','image/jpg','image/png','image/webp'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Invalid file type'), false);
  cb(null, true);
};

const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });

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

// Upload avatar for user
router.post('/:id/avatar', verifyToken, upload.single('avatar'), async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, 'You can update only your account'));
    }

    if (!req.file) return next(createError(400, 'No file uploaded'));

    const filePath = `uploads/profiles/${req.file.filename}`;

    const updated = await User.findByIdAndUpdate(req.params.id, { $set: { img: filePath } }, { new: true }).select('-password');
    if (!updated) return next(createError(404, 'User not found'));

    res.status(200).json({ success: true, img: updated.img, user: updated });
  } catch (err) {
    console.error('Avatar upload error:', err);
    next(createError(500, 'Failed to upload avatar'));
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

// Get all educators/tutors
router.get("/educators/all", verifyToken, async (req, res, next) => {
  try {
    // Find all educators
    const educators = await User.find({ isEducator: true })
      .select('-password')
      .sort({ createdAt: -1 });

    // Get profiles and ratings for each educator
    const educatorsWithProfiles = await Promise.all(
      educators.map(async (educator) => {
        // Get educator profile
        const profile = await EducatorProfile.findOne({ userId: educator._id });
        
        // Calculate average rating from reviews
        const reviews = await Review.find({ educatorId: educator._id });
        const totalReviews = reviews.length;
        const averageRating = totalReviews > 0
          ? reviews.reduce((sum, review) => sum + (review.overallRating || 0), 0) / totalReviews
          : (profile?.rating || 0);

        return {
          _id: educator._id,
          fullName: profile?.fullName || profile?.name || educator.name || educator.username,
          username: educator.username,
          email: educator.email,
          img: educator.img,
          country: educator.country || '',
          bio: profile?.bio || educator.bio || educator.desc || '',
          languages: profile?.languages || ['English', 'Sinhala'],
          subjects: profile?.subjects || educator.subjects || [],
          qualifications: profile?.qualifications || '',
          rating: averageRating,
          totalReviews: totalReviews || profile?.totalRatings || 0,
          hourlyRate: profile?.hourlyRate || 0,
          isPro: profile?.isPro || false
        };
      })
    );

    res.status(200).json({ educators: educatorsWithProfiles });
  } catch (error) {
    console.error('Error fetching educators:', error);
    next(createError(500, 'Failed to fetch educators'));
  }
});

// Analytics: record and fetch searches and interactions for a user
router.post('/:id/searches', verifyToken, recordSearch);
router.get('/:id/searches', verifyToken, getSearches);

router.post('/:id/interactions', verifyToken, recordInteraction);
router.get('/:id/interactions', verifyToken, getInteractions);

export default router;
