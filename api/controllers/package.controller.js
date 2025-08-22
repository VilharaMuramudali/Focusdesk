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

// Get personalized recommended packages for students
export const getRecommendedPackages = async (req, res, next) => {
  try {
    const studentId = req.userId;
    
    // If no student ID (public access), return general recommendations
    if (!studentId) {
      const packages = await Package.find({ isActive: true })
        .populate('educatorId', 'username img')
        .sort({ rating: -1, totalOrders: -1 })
        .limit(8);
      
      const transformedPackages = packages.map(pkg => ({
        _id: pkg._id,
        title: pkg.title,
        description: pkg.desc,
        tutor: {
          username: pkg.educatorId?.username || 'Unknown Tutor',
          img: pkg.educatorId?.img || '/img/noavatar.jpg'
        },
        rating: pkg.rating || 4.5,
        languages: pkg.languages || ['English'],
        image: pkg.thumbnail || '/img/course-default.jpg',
        price: pkg.rate,
        isPersonalized: false
      }));
      
      return res.status(200).json({ packages: transformedPackages });
    }
    
    // Get student preferences and behavior for personalized recommendations
    const studentPreferences = await getUserPreferences(studentId);
    const studentBehavior = await getUserBehavior(studentId);
    
    console.log('Student Preferences:', studentPreferences);
    console.log('Student Behavior:', studentBehavior);
    
    // OPTIMIZED: Build STRICT personalized query with high relevance filtering
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
        .populate('educatorId', 'username img subjects bio rating totalSessions')
        .sort({ rating: -1, totalOrders: -1 })
        .limit(30); // Get more to filter by strict scoring
      
      console.log(`Found ${personalizedPackages.length} potential personalized packages`);
    }
    
    // OPTIMIZED: Apply STRICT filtering based on personalization scores
    if (personalizedPackages.length > 0) {
      // Calculate personalization scores with higher thresholds
      const scoredPackages = personalizedPackages.map(pkg => ({
        ...pkg.toObject(),
        personalizationScore: calculatePersonalizationScore(pkg, studentPreferences, studentBehavior),
        isPersonalized: true
      }));
      
      // Sort by personalization score (highest first)
      scoredPackages.sort((a, b) => b.personalizationScore - a.personalizationScore);
      
      // STRICT FILTERING: Only keep packages with high relevance scores
      const highRelevancePackages = scoredPackages.filter(pkg => {
        // Must have a minimum score to be considered relevant
        const minScore = 30; // Increased threshold
        const hasSubjectMatch = pkg.subjects && pkg.subjects.some(subject => 
          studentPreferences.subjects.some(pref => 
            subject.toLowerCase().includes(pref.toLowerCase()) ||
            pref.toLowerCase().includes(subject.toLowerCase())
          )
        );
        
        return pkg.personalizationScore >= minScore || hasSubjectMatch;
      });
      
      console.log(`Filtered to ${highRelevancePackages.length} high-relevance packages`);
      console.log('High-relevance packages:', highRelevancePackages.map(p => ({
        title: p.title,
        subjects: p.subjects,
        score: p.personalizationScore
      })));
      
      // If we have high-relevance packages, return them
      if (highRelevancePackages.length > 0) {
        // Transform to frontend format
        const transformedPackages = highRelevancePackages.slice(0, 8).map(pkg => ({
          _id: pkg._id,
          title: pkg.title,
          description: pkg.desc,
          tutor: {
            username: pkg.educatorId?.username || 'Unknown Tutor',
            img: pkg.educatorId?.img || '/img/noavatar.jpg',
            subjects: pkg.educatorId?.subjects || [],
            rating: pkg.educatorId?.rating || 0
          },
          rating: pkg.rating || 4.5,
          languages: pkg.languages || ['English'],
          image: pkg.thumbnail || '/img/course-default.jpg',
          price: pkg.rate,
          subjects: pkg.subjects || [],
          level: pkg.level || 'beginner',
          totalOrders: pkg.totalOrders || 0,
          isPersonalized: true,
          personalizationScore: pkg.personalizationScore
        }));
        
        console.log('Returning high-relevance personalized packages:', transformedPackages.map(p => ({
          title: p.title,
          subjects: p.subjects,
          score: p.personalizationScore
        })));
        
        return res.status(200).json({ 
          packages: transformedPackages,
          isPersonalized: true,
          studentPreferences: studentPreferences.subjects,
          totalFound: highRelevancePackages.length,
          message: `Found ${transformedPackages.length} highly relevant recommendations based on your interests: ${studentPreferences.subjects.join(', ')}`
        });
      }
    }
    
    // If no high-relevance results, try broader matching with strict filtering
    console.log('No high-relevance matches found, trying broader matching with strict filtering...');
    
    let broaderQuery = { isActive: true };
    let broaderFilters = [];
    
    // Try broader subject matching with word-level matching
    if (studentPreferences.subjects && studentPreferences.subjects.length > 0) {
      const broaderSubjectQueries = [];
      
      studentPreferences.subjects.forEach(subject => {
        const cleanSubject = subject.toLowerCase().trim();
        // Split compound subjects (e.g., "Art & Design" -> ["art", "design"])
        const subjectWords = cleanSubject.split(/[\s&,]+/).filter(word => word.length > 2);
        
        subjectWords.forEach(word => {
          broaderSubjectQueries.push(
            { subjects: { $regex: word, $options: 'i' } },
            { title: { $regex: word, $options: 'i' } },
            { desc: { $regex: word, $options: 'i' } }
          );
        });
      });
      
      broaderFilters.push(...broaderSubjectQueries);
    }
    
    // Add search term matching only if terms are highly relevant
    if (studentBehavior.commonSearchTerms && studentBehavior.commonSearchTerms.length > 0) {
      const relevantSearchTerms = studentBehavior.commonSearchTerms.filter(term => {
        // Only include search terms that are related to student's subjects
        return studentPreferences.subjects.some(subject => 
          term.toLowerCase().includes(subject.toLowerCase()) ||
          subject.toLowerCase().includes(term.toLowerCase())
        );
      });
      
      relevantSearchTerms.forEach(term => {
        if (term.length > 2) {
          broaderFilters.push(
            { title: { $regex: term, $options: 'i' } },
            { desc: { $regex: term, $options: 'i' } }
          );
        }
      });
    }
    
    if (broaderFilters.length > 0) {
      broaderQuery.$or = broaderFilters;
      
      const broaderPackages = await Package.find(broaderQuery)
        .populate('educatorId', 'username img subjects bio rating totalSessions')
        .sort({ rating: -1, totalOrders: -1 })
        .limit(20);
      
      if (broaderPackages.length > 0) {
        const scoredBroaderPackages = broaderPackages.map(pkg => ({
          ...pkg.toObject(),
          personalizationScore: calculatePersonalizationScore(pkg, studentPreferences, studentBehavior),
          isPersonalized: true
        }));
        
        scoredBroaderPackages.sort((a, b) => b.personalizationScore - a.personalizationScore);
        
        // STRICT FILTERING for broader matches too
        const moderateRelevancePackages = scoredBroaderPackages.filter(pkg => {
          const minScore = 20; // Lower threshold for broader matches
          const hasSubjectMatch = pkg.subjects && pkg.subjects.some(subject => 
            studentPreferences.subjects.some(pref => 
              subject.toLowerCase().includes(pref.toLowerCase()) ||
              pref.toLowerCase().includes(subject.toLowerCase())
            )
          );
          
          return pkg.personalizationScore >= minScore || hasSubjectMatch;
        });
        
        if (moderateRelevancePackages.length > 0) {
          const transformedBroaderPackages = moderateRelevancePackages.slice(0, 8).map(pkg => ({
            _id: pkg._id,
            title: pkg.title,
            description: pkg.desc,
            tutor: {
              username: pkg.educatorId?.username || 'Unknown Tutor',
              img: pkg.educatorId?.img || '/img/noavatar.jpg',
              subjects: pkg.educatorId?.subjects || [],
              rating: pkg.educatorId?.rating || 0
            },
            rating: pkg.rating || 4.5,
            languages: pkg.languages || ['English'],
            image: pkg.thumbnail || '/img/course-default.jpg',
            price: pkg.rate,
            subjects: pkg.subjects || [],
            level: pkg.level || 'beginner',
            totalOrders: pkg.totalOrders || 0,
            isPersonalized: true,
            personalizationScore: pkg.personalizationScore
          }));
          
          console.log('Returning moderate-relevance broader matches:', transformedBroaderPackages.map(p => ({
            title: p.title,
            subjects: p.subjects,
            score: p.personalizationScore
          })));
          
          return res.status(200).json({ 
            packages: transformedBroaderPackages,
            isPersonalized: true,
            studentPreferences: studentPreferences.subjects,
            totalFound: moderateRelevancePackages.length,
            message: `Found ${transformedBroaderPackages.length} related recommendations based on broader matching`
          });
        }
      }
    }
    
    // Only as a last resort, return a limited set of general recommendations
    console.log('No relevant matches found, returning limited general recommendations...');
    
    // Get only top-rated packages as fallback
    const fallbackPackages = await Package.find({ isActive: true })
      .populate('educatorId', 'username img')
      .sort({ rating: -1, totalOrders: -1 })
      .limit(4); // Reduced limit for fallback
    
    const transformedFallbackPackages = fallbackPackages.map(pkg => ({
      _id: pkg._id,
      title: pkg.title,
      description: pkg.desc,
      tutor: {
        username: pkg.educatorId?.username || 'Unknown Tutor',
        img: pkg.educatorId?.img || '/img/noavatar.jpg'
      },
      rating: pkg.rating || 4.5,
      languages: pkg.languages || ['English'],
      image: pkg.thumbnail || '/img/course-default.jpg',
      price: pkg.rate,
      isPersonalized: false
    }));
    
    return res.status(200).json({ 
      packages: transformedFallbackPackages,
      isPersonalized: false,
      studentPreferences: studentPreferences.subjects,
      totalFound: 0,
      message: `No packages found matching your interests (${studentPreferences.subjects.join(', ')}). Showing limited general recommendations.`
    });
    
  } catch (error) {
    console.error("Error fetching recommended packages:", error);
    next(createError(500, "Failed to fetch recommended packages"));
  }
};

// Helper function to get user preferences
async function getUserPreferences(studentId) {
  try {
    const User = (await import('../models/user.model.js')).default;
    const UserInteraction = (await import('../models/userInteraction.model.js')).default;
    const Activity = (await import('../models/activity.model.js')).default;
    
    const user = await User.findById(studentId);
    const interactions = await UserInteraction.find({ userId: studentId })
      .populate('packageId')
      .sort({ timestamp: -1 })
      .limit(100);
    
    const activities = await Activity.find({ studentId })
      .sort({ timestamp: -1 })
      .limit(200);
    
    // Extract subjects from multiple sources with priority
    const profileSubjects = user.subjects || [];
    const interactionSubjects = interactions
      .map(interaction => interaction.packageId?.subjects || [])
      .flat();
    const activitySubjects = activities
      .filter(activity => activity.subject && activity.subject !== 'general')
      .map(activity => activity.subject);
    
    // Combine and analyze subjects with priority weighting
    const allSubjects = [
      ...profileSubjects.map(s => ({ subject: s, weight: 3 })), // Profile subjects get highest weight
      ...interactionSubjects.map(s => ({ subject: s, weight: 2 })), // Interaction subjects get medium weight
      ...activitySubjects.map(s => ({ subject: s, weight: 1 })) // Activity subjects get lowest weight
    ];
    
    // Count subjects with their weights
    const subjectCounts = {};
    allSubjects.forEach(({ subject, weight }) => {
      if (subject && subject.trim()) {
        const cleanSubject = subject.toLowerCase().trim();
        subjectCounts[cleanSubject] = (subjectCounts[cleanSubject] || 0) + weight;
      }
    });
    
    // Get top subjects by weighted count
    const sortedSubjects = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subject]) => subject);
    
    // If no subjects found, use profile subjects or defaults
    const finalSubjects = sortedSubjects.length > 0 ? sortedSubjects : 
                         (profileSubjects.length > 0 ? profileSubjects : ['Mathematics', 'Science', 'English']);
    
    console.log('Extracted user preferences:', {
      profileSubjects,
      interactionSubjects: interactionSubjects.slice(0, 5),
      activitySubjects: activitySubjects.slice(0, 5),
      finalSubjects,
      subjectCounts
    });
    
    // Extract price preferences
    const pricePreferences = interactions
      .filter(interaction => interaction.packageId?.rate)
      .map(interaction => interaction.packageId.rate);
    
    const avgPrice = pricePreferences.length > 0 
      ? pricePreferences.reduce((a, b) => a + b, 0) / pricePreferences.length 
      : null;
    
    return {
      subjects: finalSubjects,
      preferredPrice: avgPrice,
      interactionCount: interactions.length,
      lastActivity: activities[0]?.timestamp,
      learningLevel: user.educationLevel || 'beginner',
      preferredLanguages: user.languages || ['English']
    };
    
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      subjects: ['Mathematics', 'Science', 'English'],
      preferredPrice: null,
      interactionCount: 0,
      learningLevel: 'beginner',
      preferredLanguages: ['English']
    };
  }
}

// Helper function to get user behavior
async function getUserBehavior(studentId) {
  try {
    const UserInteraction = (await import('../models/userInteraction.model.js')).default;
    const Activity = (await import('../models/activity.model.js')).default;
    
    const interactions = await UserInteraction.find({ userId: studentId })
      .populate('packageId')
      .sort({ timestamp: -1 })
      .limit(100);
    
    const activities = await Activity.find({ studentId })
      .sort({ timestamp: -1 })
      .limit(200);
    
    // Extract search patterns
    const searchPatterns = activities
      .filter(activity => activity.type === 'search')
      .map(activity => activity.details?.query || '');
    
    // Extract common search terms
    const searchTerms = searchPatterns
      .filter(term => term.length > 2)
      .map(term => term.toLowerCase());
    
    const termCounts = {};
    searchTerms.forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });
    
    const commonSearchTerms = Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term]) => term);
    
    return {
      commonSearchTerms,
      totalInteractions: interactions.length,
      totalActivities: activities.length,
      lastInteraction: interactions[0]?.timestamp
    };
    
  } catch (error) {
    console.error('Error getting user behavior:', error);
    return {
      commonSearchTerms: [],
      totalInteractions: 0,
      totalActivities: 0
    };
  }
}

// Helper function to calculate personalization score
function calculatePersonalizationScore(packageItem, preferences, behavior) {
  let score = 0;
  
  // SUBJECT MATCHING - HIGHEST PRIORITY (80% weight)
  if (preferences.subjects && packageItem.subjects) {
    const subjectMatches = preferences.subjects.filter(subject =>
      packageItem.subjects.some(pkgSubject => 
        pkgSubject.toLowerCase().includes(subject.toLowerCase()) ||
        subject.toLowerCase().includes(pkgSubject.toLowerCase())
      )
    );
    
    // Also check title and description for subject matches
    const titleDescMatches = preferences.subjects.filter(subject => {
      const cleanSubject = subject.toLowerCase();
      return (packageItem.title && packageItem.title.toLowerCase().includes(cleanSubject)) ||
             (packageItem.desc && packageItem.desc.toLowerCase().includes(cleanSubject));
    });
    
    const totalSubjectMatches = new Set([...subjectMatches, ...titleDescMatches]);
    score += totalSubjectMatches.size * 80; // Much higher weight for subject matching
    
    console.log(`Subject matches for ${packageItem.title}:`, Array.from(totalSubjectMatches));
  }
  
  // EXACT SUBJECT MATCH - BONUS POINTS
  if (preferences.subjects && packageItem.subjects) {
    const exactMatches = preferences.subjects.filter(subject =>
      packageItem.subjects.some(pkgSubject => 
        pkgSubject.toLowerCase() === subject.toLowerCase()
      )
    );
    score += exactMatches.length * 50; // Higher bonus for exact matches
  }
  
  // NEGATIVE SCORING for irrelevant subjects
  if (preferences.subjects && packageItem.subjects) {
    const irrelevantSubjects = ['chemistry', 'physics', 'mathematics', 'science', 'biology', 'oop', 'programming', 'computer science'];
    const hasIrrelevantSubject = packageItem.subjects.some(subject => 
      irrelevantSubjects.some(irrelevant => 
        subject.toLowerCase().includes(irrelevant) ||
        irrelevant.includes(subject.toLowerCase())
      )
    );
    
    if (hasIrrelevantSubject && !preferences.subjects.some(pref => 
      packageItem.subjects.some(subject => 
        subject.toLowerCase().includes(pref.toLowerCase()) ||
        pref.toLowerCase().includes(subject.toLowerCase())
      )
    )) {
      score -= 100; // Heavy penalty for irrelevant subjects
      console.log(`Heavy penalty for irrelevant subject in ${packageItem.title}`);
    }
  }
  
  // Search term match (15% weight) - only if highly relevant
  if (behavior.commonSearchTerms && packageItem.title) {
    const relevantSearchTerms = behavior.commonSearchTerms.filter(term => {
      // Only count search terms that are related to student's subjects
      return preferences.subjects.some(subject => 
        term.toLowerCase().includes(subject.toLowerCase()) ||
        subject.toLowerCase().includes(term.toLowerCase())
      );
    });
    
    const searchMatches = relevantSearchTerms.filter(term =>
      packageItem.title.toLowerCase().includes(term.toLowerCase()) ||
      packageItem.desc?.toLowerCase().includes(term.toLowerCase())
    );
    score += searchMatches.length * 15;
  }
  
  // Price preference match (3% weight)
  if (preferences.preferredPrice && packageItem.rate) {
    const priceDiff = Math.abs(packageItem.rate - preferences.preferredPrice);
    const priceScore = Math.max(0, 30 - (priceDiff / preferences.preferredPrice) * 30);
    score += priceScore;
  }
  
  // Rating boost (1% weight)
  if (packageItem.rating) {
    score += packageItem.rating * 3;
  }
  
  // Popularity boost (1% weight)
  if (packageItem.totalOrders) {
    score += Math.min(packageItem.totalOrders / 10, 5);
  }
  
  // Learning level match bonus
  if (preferences.learningLevel === 'beginner' && packageItem.level === 'beginner') {
    score += 10;
  } else if (preferences.learningLevel === 'advanced' && packageItem.level === 'advanced') {
    score += 10;
  }
  
  // FINAL VALIDATION: Must have at least one subject match to be considered relevant
  const hasAnySubjectMatch = preferences.subjects && packageItem.subjects && 
    preferences.subjects.some(subject =>
      packageItem.subjects.some(pkgSubject => 
        pkgSubject.toLowerCase().includes(subject.toLowerCase()) ||
        subject.toLowerCase().includes(pkgSubject.toLowerCase())
      )
    );
  
  if (!hasAnySubjectMatch) {
    score = Math.max(0, score - 50); // Reduce score if no subject match
  }
  
  console.log(`Final personalization score for ${packageItem.title}: ${score}`);
  
  return score;
}
