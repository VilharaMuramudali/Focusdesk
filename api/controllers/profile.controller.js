import User from "../models/user.model.js";
import EducatorProfile from "../models/educatorProfile.model.js";
import createError from "../utils/createError.js";
import mongoose from 'mongoose';
import fs from 'fs';

// Get educator profile
export const getEducatorProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // First, check if the user exists and is an educator
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    if (!user.isEducator) {
      return next(createError(403, 'User is not an educator'));
    }
    
    // Get the educator profile
    let profile = await EducatorProfile.findOne({ userId });
    
    // If profile doesn't exist yet, create a default one
    if (!profile) {
      profile = await EducatorProfile.create({
        userId,
        name: user.username,
        bio: user.bio || '',
        timeSlots: []
      });
    }
    
    res.status(200).json({
      user,
      profile
    });
  } catch (error) {
    console.error('Error fetching educator profile:', error);
    next(createError(500, 'Failed to get educator profile'));
  }
};

// Update educator profile
export const updateEducatorProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { 
      name, 
      bio, 
      qualifications, 
      available, 
      timeSlots,
      hourlyRate,
      languages,
      subjects,
      introVideo
    } = req.body;
    
    // Check if user exists and is an educator
    const user = await User.findById(userId);
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    if (!user.isEducator) {
      return next(createError(403, 'User is not an educator'));
    }
    
    // Find and update the educator profile
    let profile = await EducatorProfile.findOne({ userId });
    
    if (!profile) {
      // Create a new profile if it doesn't exist
      profile = await EducatorProfile.create({
        userId,
        name: name || user.username,
        bio: bio || user.bio || '',
        qualifications,
        available,
        timeSlots: timeSlots || [],
        hourlyRate,
        languages: languages || [],
        subjects: subjects || [],
        introVideo
      });
    } else {
      // Update existing profile
      profile.name = name || profile.name;
      profile.bio = bio || profile.bio;
      profile.qualifications = qualifications || profile.qualifications;
      profile.available = available || profile.available;
      profile.timeSlots = timeSlots || profile.timeSlots;
      profile.hourlyRate = hourlyRate || profile.hourlyRate;
      profile.languages = languages || profile.languages;
      profile.subjects = subjects || profile.subjects;
      profile.introVideo = introVideo || profile.introVideo;
      
      await profile.save();
    }
    
    // Also update relevant fields in the user model
    user.bio = bio || user.bio;
    user.subjects = subjects || user.subjects;
    await user.save();
    
    res.status(200).json({
      message: 'Profile updated successfully',
      profile
    });
  } catch (error) {
    console.error('Error updating educator profile:', error);
    next(createError(500, 'Failed to update educator profile'));
  }
};

// Upload profile picture
export const uploadProfilePicture = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Check if user exists
    const user = await User.findById(userId);
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    // Handle file upload
    if (!req.file) {
      return next(createError(400, 'No file uploaded'));
    }
    
    // If user already has a profile picture, delete the old one from GridFS
    if (user.imgId) {
      try {
        const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
          bucketName: 'profileImages'
        });
        
        bucket.delete(user.imgId);
      } catch (err) {
        console.log('Error deleting old profile picture:', err);
        // Continue even if delete fails
      }
    }
    
    // Get the server URL
    const serverUrl = `${req.protocol}://${req.get('host')}`;
    
    // Update user's profile picture with the file ID and URL
    user.imgId = req.file.id;
    user.img = `${serverUrl}/api/images/${req.file.id}`;
    await user.save();
    
    res.status(200).json({
      message: 'Profile picture updated successfully',
      imgUrl: user.img
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    next(createError(500, 'Failed to upload profile picture'));
  }
};


// Get user profile (for any user type)
export const getUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return next(createError(404, 'User not found'));
    }
    
    res.status(200).json({
      user
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    next(createError(500, 'Failed to get user profile'));
  }
};
