import express from 'express';
import { 
  getEducatorProfile, 
  updateEducatorProfile, 
  uploadProfilePicture,
  getUserProfile
} from '../controllers/profile.controller.js';
import { verifyToken, educator } from '../middleware/jwt.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Get educator profile - requires authentication and educator role
router.get('/educator', verifyToken, educator, getEducatorProfile);

// Update educator profile - requires authentication and educator role
router.put('/educator', verifyToken, educator, updateEducatorProfile);

// Upload profile picture - requires authentication
router.post('/upload-picture', verifyToken, upload.single('profileImage'), uploadProfilePicture);

// Get user profile (for any user type)
router.get('/user', verifyToken, getUserProfile);

export default router;
