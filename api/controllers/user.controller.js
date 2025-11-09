import User from "../models/user.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return next(createError(404, "User not found!"));
    }

    if (req.userId !== user._id.toString()) {
      return next(createError(403, "You can delete only your account!"));
    }
    
    await User.findByIdAndDelete(req.params.id);
    res.status(200).send({ message: "User has been deleted." });
  } catch (err) {
    next(createError(500, "Failed to delete user."));
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.params.id;
    console.log('getUser: Fetching user with ID:', userId);
    
    // Validate user ID format
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      console.log('getUser: Invalid user ID format:', userId);
      return next(createError(400, "Invalid user ID format"));
    }
    
    const user = await User.findById(userId);
    console.log('getUser: User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      console.log('getUser: User not found for ID:', userId);
      return next(createError(404, "User not found!"));
    }
    
    const { password, ...info } = user._doc;
    console.log('getUser: Sending user info:', {
      _id: info._id,
      username: info.username,
      email: info.email
    });
    
    res.status(200).send(info);
  } catch (err) {
    console.error('getUser: Error fetching user:', err);
    console.error('getUser: Error stack:', err.stack);
    next(createError(500, "Failed to retrieve user."));
  }
};

export const updateUser = async (req, res, next) => {
  try {
    if (req.userId !== req.params.id) {
      return next(createError(403, "You can update only your account!"));
    }
    
    // Make a copy of req.body to avoid modifying the original
    const updateData = { ...req.body };
    
    // Don't allow direct updates to image fields through this endpoint
    delete updateData.img;
    delete updateData.imgId;
    
    // Check for email uniqueness if email is being updated
    if (updateData.email) {
      const existingUser = await User.findOne({ 
        email: updateData.email, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return next(createError(400, "Email already exists"));
      }
    }
    
    // Check for username uniqueness if username is being updated
    if (updateData.username) {
      const existingUser = await User.findOne({ 
        username: updateData.username, 
        _id: { $ne: req.params.id } 
      });
      
      if (existingUser) {
        return next(createError(400, "Username already exists"));
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true }
    );
    
    const { password, ...info } = updatedUser._doc;
    res.status(200).send(info);
  } catch (err) {
    if (err.code === 11000) {
      // Duplicate key error
      const field = Object.keys(err.keyPattern)[0];
      return next(createError(400, `${field} already exists`));
    }
    next(createError(500, "Failed to update user."));
  }
};

// Get user subject preferences
export const getUserPreferences = async (req, res, next) => {
  try {
    const userId = req.userId;
    console.log('Getting preferences for user:', userId);
    
    const user = await User.findById(userId).select('learningPreferences');
    console.log('User found:', user ? 'Yes' : 'No');
    
    if (!user) {
      return next(createError(404, "User not found"));
    }

    const preferences = user.learningPreferences || {};
    console.log('User preferences:', preferences);
    
    const response = {
      success: true,
      data: {
        subjects: preferences.subjects || [],
        learningStyle: preferences.learningStyle || 'visual',
        sessionDuration: preferences.sessionDuration || '1hour',
        academicLevel: preferences.academicLevel || 'university',
        timePreferences: preferences.timePreferences || []
      }
    };
    
    console.log('Sending response:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    next(createError(500, "Failed to get user preferences"));
  }
};

// Update user subject preferences
export const updateUserPreferences = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { subjects, learningStyle, sessionDuration, academicLevel, timePreferences } = req.body;

    // Validate required fields
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return next(createError(400, "At least one subject is required"));
    }

    // Validate learning style
    const validLearningStyles = ['visual', 'auditory', 'kinesthetic', 'reading'];
    if (learningStyle && !validLearningStyles.includes(learningStyle)) {
      return next(createError(400, "Invalid learning style"));
    }

    // Validate session duration
    const validDurations = ['30min', '1hour', '2hours'];
    if (sessionDuration && !validDurations.includes(sessionDuration)) {
      return next(createError(400, "Invalid session duration"));
    }

    // Validate academic level
    const validLevels = ['highschool', 'university', 'postgraduate'];
    if (academicLevel && !validLevels.includes(academicLevel)) {
      return next(createError(400, "Invalid academic level"));
    }

    // Update user preferences
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          'learningPreferences.subjects': subjects,
          'learningPreferences.learningStyle': learningStyle || 'visual',
          'learningPreferences.sessionDuration': sessionDuration || '1hour',
          'learningPreferences.academicLevel': academicLevel || 'university',
          'learningPreferences.timePreferences': timePreferences || [],
          'aiFeatures.lastActive': new Date(),
          'aiFeatures.interactionCount': 1
        }
      },
      { new: true }
    ).select('learningPreferences');

    if (!updatedUser) {
      return next(createError(404, "User not found"));
    }

    res.status(200).json({
      success: true,
      message: "Preferences updated successfully",
      data: {
        subjects: updatedUser.learningPreferences.subjects,
        learningStyle: updatedUser.learningPreferences.learningStyle,
        sessionDuration: updatedUser.learningPreferences.sessionDuration,
        academicLevel: updatedUser.learningPreferences.academicLevel,
        timePreferences: updatedUser.learningPreferences.timePreferences
      }
    });
  } catch (error) {
    next(createError(500, "Failed to update preferences"));
  }
};

// Check if user has completed preferences setup
export const checkPreferencesSetup = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId).select('learningPreferences isEducator');
    
    if (!user) {
      return next(createError(404, "User not found"));
    }

    // If user is educator, they don't need subject preferences
    if (user.isEducator) {
      return res.status(200).json({
        success: true,
        data: {
          hasPreferences: true,
          isEducator: true
        }
      });
    }

    // Check if student has subject preferences
    const hasPreferences = user.learningPreferences && 
                          user.learningPreferences.subjects && 
                          user.learningPreferences.subjects.length > 0;

    res.status(200).json({
      success: true,
      data: {
        hasPreferences: !!hasPreferences,
        isEducator: false,
        preferences: hasPreferences ? user.learningPreferences : null
      }
    });
  } catch (error) {
    next(createError(500, "Failed to check preferences setup"));
  }
};
