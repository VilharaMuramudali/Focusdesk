import Package from "../models/package.model.js";
import User from "../models/user.model.js";
import Review from "../models/review.model.js";
import EducatorProfile from "../models/educatorProfile.model.js";
import createError from "../utils/createError.js";
import mongoose from "mongoose";

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
    
    // Calculate actual ratings from reviews
    let packagesWithRatings = await calculatePackageRatings(packages);
    // Attach educator profile info (name/fullName)
    packagesWithRatings = await attachEducatorProfilesToPackages(packagesWithRatings);
    
    console.log("Sending packages to frontend:", packagesWithRatings);
    
    res.status(200).json(packagesWithRatings);
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
    
    const { thumbnail, title, description, keywords, currency, rate, video, sessions, languages, subjects } = req.body;
    
    console.log("Received package data:", req.body);
    console.log("Received languages:", languages);
    console.log("Received subjects:", subjects);
    
    // Validate required fields
    if (!title || !description || !rate) {
      return next(createError(400, "Title, description, and rate are required"));
    }

    // Validate subjects
    if (!subjects || !Array.isArray(subjects) || subjects.length === 0) {
      return next(createError(400, "At least one subject/domain is required"));
    }

    // Validate currency if provided
    if (currency && typeof currency !== 'string') {
      return next(createError(400, "Invalid currency format"));
    }
    
    // Create new package
    const newPackage = new Package({
      educatorId: userId,
      thumbnail,
      title,
      description,
      keywords: Package.formatKeywords(keywords),
      currency: currency || "LKR",
      rate: parseFloat(rate),
      video,
      sessions: sessions || 1,
      languages: Array.isArray(languages) ? languages : [],
      subjects: Array.isArray(subjects) ? subjects : []
    });
    
    await newPackage.save();
    
    console.log("Created package:", newPackage);
    // Enrich the newly created package with educator profile data for immediate frontend use
    try {
      const profile = await EducatorProfile.findOne({ userId });
      const enriched = {
        ...newPackage.toObject(),
        educatorId: {
          _id: userId,
          name: profile?.name || undefined,
          fullName: profile?.fullName || undefined,
          img: newPackage.thumbnail || undefined
        }
      };
      return res.status(201).json({ message: "Package created successfully", package: enriched });
    } catch (err) {
      return res.status(201).json({ message: "Package created successfully", package: newPackage });
    }
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
    
    const { thumbnail, title, description, keywords, currency, rate, video, isActive, sessions, languages, subjects } = req.body;
    
    console.log("Received languages in update:", languages);
    console.log("Received subjects in update:", subjects);
    
    // Update package fields
    if (thumbnail !== undefined) packageToUpdate.thumbnail = thumbnail;
    if (title !== undefined) packageToUpdate.title = title;
    if (description !== undefined) packageToUpdate.description = description;
    
    if (keywords !== undefined) {
      packageToUpdate.keywords = Package.formatKeywords(keywords);
    }
    
    if (currency !== undefined) {
      packageToUpdate.currency = currency || "LKR";
    }
    
    if (rate !== undefined) {
      packageToUpdate.rate = parseFloat(rate);
    }
    
    // Explicitly handle languages array
    if (languages !== undefined) {
      packageToUpdate.languages = Array.isArray(languages) ? languages : [];
    }
    
    // Explicitly handle subjects array
    if (subjects !== undefined) {
      // If subjects is provided, validate it
      if (!Array.isArray(subjects)) {
        return next(createError(400, "Subjects must be an array"));
      }
      // Require at least one subject when updating
      if (subjects.length === 0) {
        return next(createError(400, "At least one subject/domain is required"));
      }
      // Update subjects if valid array with items
      packageToUpdate.subjects = subjects;
    }
    // If subjects is undefined, keep existing subjects (no change needed)
    
    if (video !== undefined) packageToUpdate.video = video;
    if (isActive !== undefined) packageToUpdate.isActive = isActive;
    if (sessions !== undefined) packageToUpdate.sessions = sessions;
    
    await packageToUpdate.save();
    
    console.log("Updated package:", packageToUpdate);
    // Enrich updated package with educator profile if available
    try {
      const profile = await EducatorProfile.findOne({ userId });
      const enriched = {
        ...packageToUpdate.toObject(),
        educatorId: {
          _id: userId,
          name: profile?.name || undefined,
          fullName: profile?.fullName || undefined,
          img: packageToUpdate.thumbnail || undefined
        }
      };
      return res.status(200).json({ message: "Package updated successfully", package: enriched });
    } catch (err) {
      return res.status(200).json({ message: "Package updated successfully", package: packageToUpdate });
    }
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
    console.log('getPackageById: Fetching package with ID:', packageId);
    
    // Validate package ID format
    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      console.log('getPackageById: Invalid package ID format:', packageId);
      return next(createError(400, "Invalid package ID format"));
    }
    
    console.log('getPackageById: Package ID is valid, searching database...');
    
    const packageData = await Package.findById(packageId)
      .populate('educatorId', 'username img bio');
    
    console.log('getPackageById: Package data found:', packageData ? 'Yes' : 'No');
    
    if (!packageData) {
      console.log('getPackageById: Package not found for ID:', packageId);
      return next(createError(404, "Package not found"));
    }
    
    console.log('getPackageById: Package found, calculating ratings...');
    
    // Calculate actual rating from reviews
    const ratingData = await Review.getPackageAverageRating(packageId);
    console.log(`getPackageById: Package ${packageId} rating data:`, ratingData);
    
    let packageWithRating = {
      ...packageData.toObject(),
      rating: ratingData.averageRating,
      totalReviews: ratingData.totalReviews,
      ratingBreakdown: ratingData.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    // Attach educator profile to single package
    try {
      const eid = packageWithRating.educatorId?._id || packageWithRating.educatorId;
      const profile = eid ? await EducatorProfile.findOne({ userId: eid }) : null;
      packageWithRating.educatorId = {
        ...packageWithRating.educatorId,
        name: profile?.name || packageWithRating.educatorId?.name,
        fullName: profile?.fullName || packageWithRating.educatorId?.fullName,
        img: packageWithRating.educatorId?.img || profile?.img
      };
      packageWithRating.educatorProfile = profile ? profile.toObject() : null;
      packageWithRating.educatorDisplayName = profile?.fullName || profile?.name || packageWithRating.educatorId?.username || 'Educator';
    } catch (err) {
      console.warn('getPackageById: could not attach educator profile', err);
    }
    
    console.log('getPackageById: Sending package with rating:', {
      _id: packageWithRating._id,
      title: packageWithRating.title,
      rating: packageWithRating.rating,
      totalReviews: packageWithRating.totalReviews
    });
    
    res.status(200).json(packageWithRating);
  } catch (error) {
    console.error("getPackageById: Error fetching package:", error);
    console.error("getPackageById: Error stack:", error.stack);
    next(createError(500, "Failed to fetch package"));
  }
};

// Force refresh package ratings (for testing)
export const refreshPackageRatings = async (req, res, next) => {
  try {
    const packageId = req.params.id;
    
    console.log('Refreshing ratings for package:', packageId);
    
    // Get all reviews for this package
    const reviews = await Review.find({ packageId });
    console.log(`Found ${reviews.length} reviews for package ${packageId}:`, reviews);
    
    // Calculate rating manually
    const ratingData = await Review.getPackageAverageRating(packageId);
    console.log(`Calculated rating for package ${packageId}:`, ratingData);
    
    // Also test the aggregation pipeline manually
    const manualAggregation = await Review.aggregate([
      { $match: { packageId: new mongoose.Types.ObjectId(packageId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$overallRating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);
    
    console.log('Manual aggregation result:', manualAggregation);
    
    res.status(200).json({
      success: true,
      packageId,
      reviews: reviews.length,
      rating: ratingData.averageRating,
      totalReviews: ratingData.totalReviews,
      manualAggregation: manualAggregation[0] || null
    });
  } catch (error) {
    console.error("Error refreshing package ratings:", error);
    console.error("Error stack:", error.stack);
    next(createError(500, "Failed to refresh package ratings"));
  }
};

// Helper function to calculate ratings for packages
const calculatePackageRatings = async (packages) => {
  console.log(`calculatePackageRatings: Processing ${packages.length} packages`);
  
  const packagesWithRatings = await Promise.all(
    packages.map(async (pkg) => {
      try {
        console.log(`calculatePackageRatings: Processing package ${pkg._id} - ${pkg.title}`);
        const ratingData = await Review.getPackageAverageRating(pkg._id);
        console.log(`Package ${pkg._id} rating data:`, ratingData);
        
        const result = {
          ...pkg.toObject(),
          rating: ratingData.averageRating,
          totalReviews: ratingData.totalReviews,
          ratingBreakdown: ratingData.ratingBreakdown || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
        
        console.log(`Package ${pkg._id} final result:`, {
          _id: result._id,
          title: result.title,
          rating: result.rating,
          totalReviews: result.totalReviews
        });
        
        return result;
      } catch (error) {
        console.error(`Error calculating rating for package ${pkg._id}:`, error);
        console.error(`Error stack:`, error.stack);
        
        const result = {
          ...pkg.toObject(),
          rating: 0,
          totalReviews: 0
        };
        
        console.log(`Package ${pkg._id} fallback result:`, {
          _id: result._id,
          title: result.title,
          rating: result.rating,
          totalReviews: result.totalReviews
        });
        
        return result;
      }
    })
  );
  
  console.log(`calculatePackageRatings: Completed processing ${packagesWithRatings.length} packages`);
  return packagesWithRatings;
};

// Attach educator profile data (name/fullName/etc.) to package objects
const attachEducatorProfilesToPackages = async (packages) => {
  try {
    // Collect unique educator IDs
    const ids = [...new Set(packages.map(p => {
      try {
        if (p.educatorId && p.educatorId._id) return p.educatorId._id.toString();
        if (p.educatorId) return p.educatorId.toString();
        return null;
      } catch (e) {
        return null;
      }
    }).filter(Boolean))];

    if (ids.length === 0) return packages;

    const profiles = await EducatorProfile.find({ userId: { $in: ids } }).select('userId name fullName bio hourlyRate img subjects');
    const profileMap = {};
    profiles.forEach(pr => { profileMap[pr.userId.toString()] = pr; });

    return packages.map(p => {
      const eid = (p.educatorId && p.educatorId._id) ? p.educatorId._id.toString() : (p.educatorId ? p.educatorId.toString() : null);
      const profile = eid ? profileMap[eid] : null;

      // Ensure educatorId is an object with username/img and add name/fullName
      const originalEducator = (p.educatorId && typeof p.educatorId === 'object') ? { ...p.educatorId } : { _id: eid };

      const enrichedEducator = {
        ...originalEducator,
        _id: eid,
        img: originalEducator.img || (profile ? profile.img : undefined),
        name: profile?.name || originalEducator.name,
        fullName: profile?.fullName || originalEducator.fullName
      };

      return {
        ...p,
        educatorId: enrichedEducator,
        educatorProfile: profile ? profile.toObject() : null,
        educatorDisplayName: profile?.fullName || profile?.name || originalEducator.username || 'Educator'
      };
    });
  } catch (error) {
    console.error('attachEducatorProfilesToPackages: Error attaching profiles', error);
    return packages;
  }
};

// Get all public packages (for students to browse)
export const getPublicPackages = async (req, res, next) => {
  try {
    console.log('getPublicPackages: Starting to fetch packages...');
    
    const { keywords, minRate, maxRate, educatorId } = req.query;
    const subject = req.query.subject;
    // Build query
    const query = { isActive: true };
    
    // Filter by educatorId if provided
    if (educatorId && mongoose.Types.ObjectId.isValid(educatorId)) {
      query.educatorId = new mongoose.Types.ObjectId(educatorId);
    }
    
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
    
    console.log('getPublicPackages: Query:', query);
      
    const packages = await Package.find(query)
      .populate('educatorId', 'username img')
      .sort({ createdAt: -1 });
    
    console.log(`getPublicPackages: Found ${packages.length} packages`);
    
    // Calculate actual ratings from reviews
    let packagesWithRatings = await calculatePackageRatings(packages);
    packagesWithRatings = await attachEducatorProfilesToPackages(packagesWithRatings);

    console.log('getPublicPackages: Packages with ratings calculated, sending response');
    res.status(200).json(packagesWithRatings);
  } catch (error) {
    console.error("Error fetching public packages:", error);
    console.error("Error stack:", error.stack);
    next(createError(500, "Failed to fetch packages"));
  }
};

// Get personalized recommended packages for students
export const getRecommendedPackages = async (req, res, next) => {
  try {
    const studentId = req.userId;
    
    // If no student ID (public access), return general recommendations
    if (!studentId) {
      const packages = await Package.find({ isActive: true })
        .populate('educatorId', 'username img')
        .sort({ createdAt: -1 })
        .limit(8);
      
      // Calculate actual ratings from reviews
      let packagesWithRatings = await calculatePackageRatings(packages);
      packagesWithRatings = await attachEducatorProfilesToPackages(packagesWithRatings);

      const transformedPackages = packagesWithRatings.map(pkg => ({
        _id: pkg._id,
        title: pkg.title,
        description: pkg.description,
        tutor: {
          username: pkg.educatorId?.username || 'Unknown Tutor',
          img: pkg.educatorId?.img || '/img/noavatar.jpg',
          name: pkg.educatorId?.name || pkg.educatorProfile?.name || undefined,
          fullName: pkg.educatorId?.fullName || pkg.educatorProfile?.fullName || undefined
        },
        rating: pkg.rating || 0,
        totalReviews: pkg.totalReviews || 0,
        languages: pkg.languages || ['English'],
        image: pkg.thumbnail || '/img/course-default.jpg',
        price: pkg.rate,
        isPersonalized: false
      }));
      
      return res.status(200).json({ packages: transformedPackages });
    }

    // Get student preferences for basic personalized recommendations
    const studentPreferences = await getUserPreferences(studentId);
    
    console.log('Student Preferences:', studentPreferences);
    let personalizedQuery = { isActive: true };
    let hasPersonalizedFilters = false;
    
    // STRICT SUBJECT MATCHING - Only return highly relevant packages
    if (studentPreferences.subjects && studentPreferences.subjects.length > 0) {
      const subjectQueries = [];
      
      studentPreferences.subjects.forEach(subject => {
        const cleanSubject = subject.toLowerCase().trim();
        
        // Create multiple matching patterns for better coverage
        const subjectPatterns = [
          cleanSubject,
          cleanSubject.replace(/\s+/g, '\\s*'), // Handle spaces
          cleanSubject.split(' ')[0], // First word
          cleanSubject.split(' ').slice(-1)[0] // Last word
        ];
        
        subjectPatterns.forEach(pattern => {
          if (pattern.length > 2) {
            subjectQueries.push(
              { subjects: { $regex: pattern, $options: 'i' } },
              { title: { $regex: pattern, $options: 'i' } },
              { desc: { $regex: pattern, $options: 'i' } },
              { keywords: { $regex: pattern, $options: 'i' } }
            );
          }
        });
      });
      
      personalizedQuery.$or = subjectQueries;
      hasPersonalizedFilters = true;
      
      console.log('Strict subject-based query:', JSON.stringify(personalizedQuery, null, 2));
    }
    
    // Get personalized packages first
    let personalizedPackages = [];
    if (hasPersonalizedFilters) {
      personalizedPackages = await Package.find(personalizedQuery)
        .populate('educatorId', 'username img subjects bio totalSessions')
        .sort({ createdAt: -1 })
        .limit(30); // Get more to filter by strict scoring
      
      console.log(`Found ${personalizedPackages.length} potential personalized packages`);
    }
    
    // Get personalized packages based on subjects
    if (personalizedPackages.length > 0) {
      // Calculate actual ratings from reviews
      let packagesWithRatings = await calculatePackageRatings(personalizedPackages);
      packagesWithRatings = await attachEducatorProfilesToPackages(packagesWithRatings);
      
      // Transform to frontend format
      const transformedPackages = packagesWithRatings.slice(0, 8).map(pkg => ({
        _id: pkg._id,
        title: pkg.title,
        description: pkg.description,
        tutor: {
          username: pkg.educatorId?.username || 'Unknown Tutor',
          img: pkg.educatorId?.img || '/img/noavatar.jpg',
          name: pkg.educatorId?.name || pkg.educatorProfile?.name || undefined,
          fullName: pkg.educatorId?.fullName || pkg.educatorProfile?.fullName || undefined,
          subjects: pkg.educatorId?.subjects || []
        },
        rating: pkg.rating || 0,
        totalReviews: pkg.totalReviews || 0,
        languages: pkg.languages || ['English'],
        image: pkg.thumbnail || '/img/course-default.jpg',
        price: pkg.rate,
        subjects: pkg.subjects || [],
        level: pkg.level || 'beginner',
        totalOrders: pkg.totalOrders || 0,
        isPersonalized: true
      }));
      
      return res.status(200).json({ 
        packages: transformedPackages,
        isPersonalized: true,
        studentPreferences: studentPreferences.subjects,
        totalFound: personalizedPackages.length,
        message: `Found ${transformedPackages.length} recommendations based on your interests: ${studentPreferences.subjects.join(', ')}`
      });
    }
    
    // If no personalized results, try broader subject matching
    if (studentPreferences.subjects && studentPreferences.subjects.length > 0) {
      const broaderSubjectQueries = [];
      
      studentPreferences.subjects.forEach(subject => {
        const cleanSubject = subject.toLowerCase().trim();
        const subjectWords = cleanSubject.split(/[\s&,]+/).filter(word => word.length > 2);
        
        subjectWords.forEach(word => {
          broaderSubjectQueries.push(
            { subjects: { $regex: word, $options: 'i' } },
            { title: { $regex: word, $options: 'i' } },
            { desc: { $regex: word, $options: 'i' } }
          );
        });
      });
      
      if (broaderSubjectQueries.length > 0) {
        const broaderQuery = { isActive: true, $or: broaderSubjectQueries };
        const broaderPackages = await Package.find(broaderQuery)
          .populate('educatorId', 'username img subjects')
          .sort({ rating: -1, totalOrders: -1 })
          .limit(8);
        
        if (broaderPackages.length > 0) {
          let packagesWithRatings = await calculatePackageRatings(broaderPackages);
          packagesWithRatings = await attachEducatorProfilesToPackages(packagesWithRatings);
          const transformedPackages = packagesWithRatings.map(pkg => ({
            _id: pkg._id,
            title: pkg.title,
            description: pkg.desc,
            tutor: {
              username: pkg.educatorId?.username || 'Unknown Tutor',
              img: pkg.educatorId?.img || '/img/noavatar.jpg',
              name: pkg.educatorId?.name || pkg.educatorProfile?.name || undefined,
              fullName: pkg.educatorId?.fullName || pkg.educatorProfile?.fullName || undefined,
              subjects: pkg.educatorId?.subjects || []
            },
            rating: pkg.rating || 0,
            totalReviews: pkg.totalReviews || 0,
            languages: pkg.languages || ['English'],
            image: pkg.thumbnail || '/img/course-default.jpg',
            price: pkg.rate,
            subjects: pkg.subjects || [],
            level: pkg.level || 'beginner',
            totalOrders: pkg.totalOrders || 0,
            isPersonalized: true
          }));
          
          return res.status(200).json({ 
            packages: transformedPackages,
            isPersonalized: true,
            studentPreferences: studentPreferences.subjects,
            totalFound: broaderPackages.length,
            message: `Found ${transformedPackages.length} related recommendations based on broader matching`
          });
        }
      }
    }
    
    // Fallback: return top-rated packages
    const fallbackPackages = await Package.find({ isActive: true })
      .populate('educatorId', 'username img')
      .sort({ rating: -1, totalOrders: -1 })
      .limit(8);
    
    let packagesWithRatings = await calculatePackageRatings(fallbackPackages);
    packagesWithRatings = await attachEducatorProfilesToPackages(packagesWithRatings);
    const transformedPackages = packagesWithRatings.map(pkg => ({
      _id: pkg._id,
      title: pkg.title,
      description: pkg.desc,
      tutor: {
        username: pkg.educatorId?.username || 'Unknown Tutor',
        img: pkg.educatorId?.img || '/img/noavatar.jpg',
        name: pkg.educatorId?.name || pkg.educatorProfile?.name || undefined,
        fullName: pkg.educatorId?.fullName || pkg.educatorProfile?.fullName || undefined
      },
      rating: pkg.rating || 0,
      totalReviews: pkg.totalReviews || 0,
      languages: pkg.languages || ['English'],
      image: pkg.thumbnail || '/img/course-default.jpg',
      price: pkg.rate,
      subjects: pkg.subjects || [],
      isPersonalized: false
    }));
    
    return res.status(200).json({ 
      packages: transformedPackages,
      isPersonalized: false
    });
    
  } catch (error) {
    console.error("Error fetching recommended packages:", error);
    next(createError(500, "Failed to fetch recommended packages"));
  }
};

// Helper function to get user preferences (simplified without ML)
async function getUserPreferences(studentId) {
  try {
    const User = (await import('../models/user.model.js')).default;
    const Activity = (await import('../models/activity.model.js')).default;
    
    const user = await User.findById(studentId);
    const activities = await Activity.find({ studentId })
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Extract subjects from profile and activities
    const profileSubjects = user.subjects || [];
    const activitySubjects = activities
      .filter(activity => activity.subject && activity.subject !== 'general')
      .map(activity => activity.subject);
    
    // Combine subjects and get unique ones
    const allSubjects = [...profileSubjects, ...activitySubjects];
    const subjectCounts = {};
    allSubjects.forEach(subject => {
      if (subject && subject.trim()) {
        const cleanSubject = subject.toLowerCase().trim();
        subjectCounts[cleanSubject] = (subjectCounts[cleanSubject] || 0) + 1;
      }
    });
    
    // Get top subjects
    const sortedSubjects = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subject]) => subject);
    
    // Use top subjects or fallback to profile subjects or defaults
    const finalSubjects = sortedSubjects.length > 0 ? sortedSubjects : 
                         (profileSubjects.length > 0 ? profileSubjects : ['Mathematics', 'Science', 'English']);
    
    return {
      subjects: finalSubjects,
      learningLevel: user.educationLevel || 'beginner',
      preferredLanguages: user.languages || ['English']
    };
    
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      subjects: ['Mathematics', 'Science', 'English'],
      learningLevel: 'beginner',
      preferredLanguages: ['English']
    };
  }
}
