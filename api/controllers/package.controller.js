import Package from "../models/package.model.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";

// Get all packages for an educator
export const getEducatorPackages = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Verify user is an educator
    const user = await User.findById(userId);
    if (!user || !user.isEducator) {
      return next(createError(403, "Only educators can access packages"));
    }
    
    const packages = await Package.find({ educatorId: userId }).sort({ createdAt: -1 });
    
    // Log packages to verify languages array
    console.log("Sending packages to frontend:", packages);
    
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error fetching educator packages:", error);
    next(createError(500, "Failed to fetch packages"));
  }
};

// Create a new package
export const createPackage = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Verify user is an educator
    const user = await User.findById(userId);
    if (!user || !user.isEducator) {
      return next(createError(403, "Only educators can create packages"));
    }
    
    const { thumbnail, title, description, keywords, rate, video, sessions, languages } = req.body;
    
    console.log("Received package data:", req.body);
    console.log("Received languages:", languages);
    
    // Validate required fields
    if (!title || !description || !rate) {
      return next(createError(400, "Title, description, and rate are required"));
    }
    
    // Create new package
    const newPackage = new Package({
      educatorId: userId,
      thumbnail,
      title,
      description,
      keywords: Package.formatKeywords(keywords),
      rate: parseFloat(rate),
      video,
      sessions: sessions || 1,
      languages: Array.isArray(languages) ? languages : []
    });
    
    await newPackage.save();
    
    console.log("Created package:", newPackage);
    
    res.status(201).json({
      message: "Package created successfully",
      package: newPackage
    });
  } catch (error) {
    console.error("Error creating package:", error);
    next(createError(500, "Failed to create package"));
  }
};

// Update a package
export const updatePackage = async (req, res, next) => {
  try {
    const userId = req.userId;
    const packageId = req.params.id;
    
    console.log("Update package request body:", req.body);
    
    // Find the package
    const packageToUpdate = await Package.findById(packageId);
    
    if (!packageToUpdate) {
      return next(createError(404, "Package not found"));
    }
    
    // Check if user owns the package
    if (packageToUpdate.educatorId.toString() !== userId) {
      return next(createError(403, "You can only update your own packages"));
    }
    
    const { thumbnail, title, description, keywords, rate, video, isActive, sessions, languages } = req.body;
    
    console.log("Received languages in update:", languages);
    
    // Update package fields
    if (thumbnail !== undefined) packageToUpdate.thumbnail = thumbnail;
    if (title !== undefined) packageToUpdate.title = title;
    if (description !== undefined) packageToUpdate.description = description;
    
    if (keywords !== undefined) {
      packageToUpdate.keywords = Package.formatKeywords(keywords);
    }
    
    if (rate !== undefined) {
      packageToUpdate.rate = parseFloat(rate);
    }
    
    // Explicitly handle languages array
    if (languages !== undefined) {
      packageToUpdate.languages = Array.isArray(languages) ? languages : [];
    }
    
    if (video !== undefined) packageToUpdate.video = video;
    if (isActive !== undefined) packageToUpdate.isActive = isActive;
    if (sessions !== undefined) packageToUpdate.sessions = sessions;
    
    await packageToUpdate.save();
    
    console.log("Updated package:", packageToUpdate);
    
    res.status(200).json({
      message: "Package updated successfully",
      package: packageToUpdate
    });
  } catch (error) {
    console.error("Error updating package:", error);
    next(createError(500, "Failed to update package"));
  }
};

// Delete a package
export const deletePackage = async (req, res, next) => {
  try {
    const userId = req.userId;
    const packageId = req.params.id;
    
    // Find the package
    const packageToDelete = await Package.findById(packageId);
    
    if (!packageToDelete) {
      return next(createError(404, "Package not found"));
    }
    
    // Check if user owns the package
    if (packageToDelete.educatorId.toString() !== userId) {
      return next(createError(403, "You can only delete your own packages"));
    }
    
    await Package.findByIdAndDelete(packageId);
    
    res.status(200).json({
      message: "Package deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting package:", error);
    next(createError(500, "Failed to delete package"));
  }
};

// Get a single package by ID
export const getPackageById = async (req, res, next) => {
  try {
    const packageId = req.params.id;
    
    const packageData = await Package.findById(packageId);
    
    if (!packageData) {
      return next(createError(404, "Package not found"));
    }
    
    res.status(200).json(packageData);
  } catch (error) {
    console.error("Error fetching package:", error);
    next(createError(500, "Failed to fetch package"));
  }
};

// Get all public packages (for students to browse)
export const getPublicPackages = async (req, res, next) => {
  try {
    const { keywords, minRate, maxRate } = req.query;
    const subject = req.query.subject;
    // Build query
    const query = { isActive: true };
    
    // Filter by keywords if provided
    if (keywords) {
      const keywordArray = keywords.split(',').map(k => k.trim());
      query.keywords = { $in: keywordArray };
    }
    
    // Filter by rate range if provided
    if (minRate || maxRate) {
      query.rate = {};
      if (minRate) query.rate.$gte = parseFloat(minRate);
      if (maxRate) query.rate.$lte = parseFloat(maxRate);
    }
    
    // Filter by subject if provided
    if (subject) {
      query.title = { $regex: subject, $options: 'i' };
    }
      
    const packages = await Package.find(query)
      .populate('educatorId', 'username img')
      .sort({ createdAt: -1 });
    
    res.status(200).json(packages);
  } catch (error) {
    console.error("Error fetching public packages:", error);
    next(createError(500, "Failed to fetch packages"));
  }
};
