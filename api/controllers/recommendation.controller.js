// api/controllers/recommendation.controller.js
import aiRecommendationService from "../services/ai/aiRecommendationService.js";
import User from "../models/user.model.js";
import UserInteraction from "../models/userInteraction.model.js";
import Package from "../models/package.model.js";
import Activity from "../models/activity.model.js";
import createError from "../utils/createError.js";

// Get personalized tutor/package recommendations for students
export const getEducatorRecommendations = async (req, res, next) => {
  try {
    const studentId = req.userId;
    
    // Validate user is a student
    const user = await User.findById(studentId);
    if (!user || user.isEducator) {
      return next(createError(403, "Only students can get recommendations"));
    }
    
    const {
      topic,
      algorithm = 'hybrid',
      limit = 10,
      priceRange,
      minRating,
      minExperience,
      language,
      includeExplanation = 'true'
    } = req.query;
    
    // Prepare options
    const options = {
      limit: parseInt(limit),
      includeExplanation: includeExplanation === 'true',
      algorithm,
      filters: {
        ...(priceRange && { priceRange }),
        ...(minRating && { minRating: parseFloat(minRating) }),
        ...(minExperience && { minExperience: parseInt(minExperience) }),
        ...(language && { language })
      }
    };
    
    // Generate recommendations using AI service
    const result = await aiRecommendationService.getRecommendations(
      studentId,
      {
        query: topic,
        algorithm: algorithm,
        limit: parseInt(limit),
        ...options.filters
      }
    );
    
    const recommendations = result.recommendations;
    
    // Log the interaction
    await Activity.create({
      studentId,
      type: 'get_recommendations',
      subject: topic || 'general',
      details: {
        algorithm,
        count: recommendations.length,
        filters: options.filters
      },
      timestamp: new Date()
    });
    
    res.status(200).json({
      success: true,
      recommendedTutors: recommendations,
      algorithm: result.algorithm,
      totalCount: result.totalCount,
      source: result.source
    });
    
  } catch (error) {
    console.error('Error getting recommendations:', error);
    next(createError(500, "Failed to get recommendations"));
  }
};

// Get personalized package recommendations for dashboard
export const getDashboardRecommendations = async (req, res, next) => {
  try {
    const studentId = req.userId;
    
    // Validate user is a student
    const user = await User.findById(studentId);
    if (!user || user.isEducator) {
      return next(createError(403, "Only students can get dashboard recommendations"));
    }
    
    // Get student preferences and behavior
    const studentPreferences = await getUserPreferences(studentId);
    const studentBehavior = await getUserBehavior(studentId);
    
    // Get personalized recommendations
    const recommendations = await getPersonalizedRecommendations(
      studentId, 
      studentPreferences, 
      studentBehavior
    );
    
    // Get top subjects based on student interests
    const topSubjects = await getTopSubjects(studentPreferences, studentBehavior);
    
    // Get work plan recommendations
    const workPlan = await getWorkPlanRecommendations(studentPreferences, studentBehavior);
    
    res.status(200).json({
      success: true,
      recommendedTutors: recommendations.tutors || [],
      recommendedPackages: recommendations.packages || [],
      topSubjects: topSubjects,
      workPlan: workPlan,
      studentPreferences: studentPreferences,
      algorithm: 'personalized'
    });
    
  } catch (error) {
    console.error('Error getting dashboard recommendations:', error);
    next(createError(500, "Failed to get dashboard recommendations"));
  }
};

// Get user preferences based on profile and interactions
async function getUserPreferences(studentId) {
  try {
    const user = await User.findById(studentId);
    
    // PRIORITY: Use learningPreferences from user profile first (immediate after login)
    if (user.learningPreferences && user.learningPreferences.subjects && user.learningPreferences.subjects.length > 0) {
      const profileSubjects = user.learningPreferences.subjects;
      
      // Also get price preferences from interactions if available
      const interactions = await UserInteraction.find({ userId: studentId })
        .populate('packageId')
        .sort({ timestamp: -1 })
        .limit(50);
      
      const pricePreferences = interactions
        .filter(interaction => interaction.packageId?.rate)
        .map(interaction => interaction.packageId.rate);
      
      const avgPrice = pricePreferences.length > 0 
        ? pricePreferences.reduce((a, b) => a + b, 0) / pricePreferences.length 
        : null;
      
      return {
        subjects: profileSubjects,
        preferredPrice: avgPrice,
        interactionCount: interactions.length,
        learningLevel: user.learningPreferences.academicLevel || user.educationLevel || 'beginner',
        preferredLanguages: user.languages || ['English'],
        learningStyle: user.learningPreferences.learningStyle || 'visual',
        sessionDuration: user.learningPreferences.sessionDuration || '1hour',
        timePreferences: user.learningPreferences.timePreferences || [],
        fromProfile: true // Indicates preferences came from user profile
      };
    }
    
    // FALLBACK: Extract from interactions and activities if no profile preferences
    const interactions = await UserInteraction.find({ userId: studentId })
      .populate('packageId')
      .sort({ timestamp: -1 })
      .limit(50);
    
    const activities = await Activity.find({ studentId })
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Extract subjects from user profile
    const profileSubjects = user.subjects || [];
    
    // Extract subjects from interactions
    const interactionSubjects = interactions
      .map(interaction => interaction.packageId?.subjects || [])
      .flat();
    
    // Extract subjects from activities
    const activitySubjects = activities
      .filter(activity => activity.subject && activity.subject !== 'general')
      .map(activity => activity.subject);
    
    // Combine and count subject frequencies
    const allSubjects = [...profileSubjects, ...interactionSubjects, ...activitySubjects];
    const subjectCounts = {};
    
    allSubjects.forEach(subject => {
      if (subject) {
        subjectCounts[subject] = (subjectCounts[subject] || 0) + 1;
      }
    });
    
    // Get top subjects
    const topSubjects = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([subject]) => subject);
    
    // Extract price preferences
    const pricePreferences = interactions
      .filter(interaction => interaction.packageId?.rate)
      .map(interaction => interaction.packageId.rate);
    
    const avgPrice = pricePreferences.length > 0 
      ? pricePreferences.reduce((a, b) => a + b, 0) / pricePreferences.length 
      : null;
    
    return {
      subjects: topSubjects,
      preferredPrice: avgPrice,
      interactionCount: interactions.length,
      lastActivity: activities[0]?.timestamp,
      learningLevel: user.educationLevel || 'beginner',
      preferredLanguages: user.languages || ['English'],
      fromProfile: false // Indicates preferences were inferred from behavior
    };
    
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      subjects: [],
      preferredPrice: null,
      interactionCount: 0,
      learningLevel: 'beginner',
      preferredLanguages: ['English'],
      fromProfile: false
    };
  }
}

// Get user behavior patterns
async function getUserBehavior(studentId) {
  try {
    const interactions = await UserInteraction.find({ userId: studentId })
      .populate('packageId')
      .sort({ timestamp: -1 })
      .limit(100);
    
    const activities = await Activity.find({ studentId })
      .sort({ timestamp: -1 })
      .limit(200);
    
    // Analyze interaction patterns
    const interactionTypes = {};
    const searchPatterns = [];
    const searchKeywords = [];
    const timePatterns = [];
    const packageTimeSpent = {}; // Track time spent per package
    
    interactions.forEach(interaction => {
      interactionTypes[interaction.interactionType] = 
        (interactionTypes[interaction.interactionType] || 0) + 1;
      
      // Collect search keywords from interactions
      if (interaction.context?.searchKeywords && Array.isArray(interaction.context.searchKeywords)) {
        searchKeywords.push(...interaction.context.searchKeywords);
      }
      
      // Track time spent on packages
      if (interaction.packageId && interaction.metadata?.timeSpent) {
        const packageId = interaction.packageId._id?.toString() || interaction.packageId.toString();
        if (!packageTimeSpent[packageId]) {
          packageTimeSpent[packageId] = { totalTime: 0, count: 0, engagement: [] };
        }
        packageTimeSpent[packageId].totalTime += interaction.metadata.timeSpent || 0;
        packageTimeSpent[packageId].count += 1;
        if (interaction.metadata.engagementLevel) {
          packageTimeSpent[packageId].engagement.push(interaction.metadata.engagementLevel);
        }
      }
    });
    
    activities.forEach(activity => {
      if (activity.type === 'search') {
        const query = activity.details?.query || '';
        if (query.length > 2) {
          searchPatterns.push(query);
        }
        // Also extract keywords from search activity details
        if (activity.details?.keywords && Array.isArray(activity.details.keywords)) {
          searchKeywords.push(...activity.details.keywords);
        }
      }
      timePatterns.push(activity.timestamp);
    });
    
    // Extract common search terms from queries
    const searchTerms = searchPatterns
      .filter(term => term.length > 2)
      .map(term => term.toLowerCase());
    
    // Combine search terms and keywords
    const allSearchTerms = [...searchTerms, ...searchKeywords]
      .filter(term => term && term.length > 2)
      .map(term => term.toLowerCase().trim());
    
    const termCounts = {};
    allSearchTerms.forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });
    
    const commonSearchTerms = Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 15) // Increased to 15 for better coverage
      .map(([term]) => term);
    
    // Get top packages by time spent (high engagement)
    const topEngagedPackages = Object.entries(packageTimeSpent)
      .filter(([_, data]) => data.count > 0 && data.totalTime > 30) // At least 30 seconds total
      .sort(([_, a], [__, b]) => {
        // Sort by average time spent and engagement level
        const avgTimeA = a.totalTime / a.count;
        const avgTimeB = b.totalTime / b.count;
        const highEngagementA = a.engagement.filter(e => e === 'high').length;
        const highEngagementB = b.engagement.filter(e => e === 'high').length;
        
        if (highEngagementA !== highEngagementB) {
          return highEngagementB - highEngagementA;
        }
        return avgTimeB - avgTimeA;
      })
      .slice(0, 10)
      .map(([packageId, data]) => ({
        packageId,
        averageTime: data.totalTime / data.count,
        totalTime: data.totalTime,
        count: data.count,
        highEngagementCount: data.engagement.filter(e => e === 'high').length
      }));
    
    return {
      interactionTypes,
      commonSearchTerms,
      searchKeywords: [...new Set(searchKeywords)], // Unique keywords
      topEngagedPackages,
      totalInteractions: interactions.length,
      totalActivities: activities.length,
      lastInteraction: interactions[0]?.timestamp,
      preferredInteractionType: Object.entries(interactionTypes)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'view'
    };
    
  } catch (error) {
    console.error('Error getting user behavior:', error);
    return {
      interactionTypes: {},
      commonSearchTerms: [],
      searchKeywords: [],
      topEngagedPackages: [],
      totalInteractions: 0,
      totalActivities: 0,
      preferredInteractionType: 'view'
    };
  }
}

// Get personalized recommendations based on preferences and behavior
async function getPersonalizedRecommendations(studentId, preferences, behavior) {
  try {
    const { subjects, preferredPrice, learningLevel } = preferences;
    const { commonSearchTerms } = behavior;
    
    // Build query based on preferences
    let query = { isActive: true };
    
    // Filter by subjects if available
    if (subjects && subjects.length > 0) {
      query.$or = [
        { subjects: { $in: subjects } },
        { title: { $regex: subjects.join('|'), $options: 'i' } },
        { desc: { $regex: subjects.join('|'), $options: 'i' } }
      ];
    }
    
    // Filter by search terms if available
    if (commonSearchTerms && commonSearchTerms.length > 0) {
      const searchRegex = commonSearchTerms.join('|');
      if (query.$or) {
        query.$or.push(
          { title: { $regex: searchRegex, $options: 'i' } },
          { desc: { $regex: searchRegex, $options: 'i' } }
        );
      } else {
        query.$or = [
          { title: { $regex: searchRegex, $options: 'i' } },
          { desc: { $regex: searchRegex, $options: 'i' } }
        ];
      }
    }
    
    // Filter by price if available
    if (preferredPrice) {
      query.rate = { $lte: preferredPrice * 1.5 }; // Allow some flexibility
    }
    
    // Get packages with educator information
    const packages = await Package.find(query)
      .populate('educatorId', 'username img subjects bio rating totalSessions')
      .sort({ rating: -1, totalOrders: -1 })
      .limit(12);
    
    // Transform packages to match frontend format
    const transformedPackages = packages.map(pkg => ({
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
      // Add personalization score
      personalizationScore: calculatePersonalizationScore(pkg, preferences, behavior)
    }));
    
    // Sort by personalization score
    transformedPackages.sort((a, b) => b.personalizationScore - a.personalizationScore);
    
    // Get unique tutors from top packages
    const tutors = transformedPackages
      .slice(0, 6)
      .map(pkg => pkg.tutor)
      .filter((tutor, index, self) => 
        index === self.findIndex(t => t.username === tutor.username)
      );
    
    return {
      packages: transformedPackages.slice(0, 8),
      tutors: tutors
    };
    
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return { packages: [], tutors: [] };
  }
}

// Calculate personalization score for a package
function calculatePersonalizationScore(packageItem, preferences, behavior) {
  let score = 0;
  const packageId = packageItem._id?.toString() || packageItem._id;
  
  // Subject match (highest weight - 40%)
  if (preferences.subjects && packageItem.subjects) {
    const subjectMatches = preferences.subjects.filter(subject =>
      packageItem.subjects.some(pkgSubject => 
        pkgSubject.toLowerCase().includes(subject.toLowerCase()) ||
        subject.toLowerCase().includes(pkgSubject.toLowerCase())
      )
    );
    score += subjectMatches.length * 15; // Increased weight
  }
  
  // Search term match (30% weight - increased importance)
  if (behavior.commonSearchTerms && behavior.commonSearchTerms.length > 0) {
    const title = (packageItem.title || '').toLowerCase();
    const desc = (packageItem.desc || packageItem.description || '').toLowerCase();
    const subjects = (packageItem.subjects || []).map(s => s.toLowerCase()).join(' ');
    
    const searchMatches = behavior.commonSearchTerms.filter(term => {
      const lowerTerm = term.toLowerCase();
      return title.includes(lowerTerm) || 
             desc.includes(lowerTerm) || 
             subjects.includes(lowerTerm);
    });
    score += searchMatches.length * 8; // Increased weight
  }
  
  // Search keywords match (additional weight)
  if (behavior.searchKeywords && behavior.searchKeywords.length > 0) {
    const title = (packageItem.title || '').toLowerCase();
    const desc = (packageItem.desc || packageItem.description || '').toLowerCase();
    const subjects = (packageItem.subjects || []).map(s => s.toLowerCase()).join(' ');
    
    const keywordMatches = behavior.searchKeywords.filter(keyword => {
      const lowerKeyword = keyword.toLowerCase();
      return title.includes(lowerKeyword) || 
             desc.includes(lowerKeyword) || 
             subjects.includes(lowerKeyword);
    });
    score += keywordMatches.length * 6;
  }
  
  // Time spent / engagement boost (20% weight - NEW)
  if (behavior.topEngagedPackages && behavior.topEngagedPackages.length > 0) {
    const engagedPackage = behavior.topEngagedPackages.find(
      ep => ep.packageId === packageId
    );
    if (engagedPackage) {
      // High engagement gets significant boost
      score += 20;
      // Additional boost for multiple high-engagement views
      if (engagedPackage.highEngagementCount > 1) {
        score += engagedPackage.highEngagementCount * 5;
      }
      // Average time spent boost (max 10 points)
      if (engagedPackage.averageTime > 30) {
        score += Math.min(engagedPackage.averageTime / 10, 10);
      }
    }
  }
  
  // Price preference match (5% weight)
  if (preferences.preferredPrice && packageItem.rate) {
    const priceDiff = Math.abs(packageItem.rate - preferences.preferredPrice);
    const priceScore = Math.max(0, 10 - (priceDiff / preferences.preferredPrice) * 10);
    score += priceScore * 0.5; // Reduced weight
  }
  
  // Rating boost (3% weight)
  if (packageItem.rating) {
    score += packageItem.rating * 1; // Reduced weight
  }
  
  // Popularity boost (2% weight)
  if (packageItem.totalOrders) {
    score += Math.min(packageItem.totalOrders / 20, 5); // Reduced weight
  }
  
  return score;
}

// Get top subjects for the student
async function getTopSubjects(preferences, behavior) {
  const subjects = [...(preferences.subjects || [])];
  
  // Add subjects from search terms
  if (behavior.commonSearchTerms) {
    const searchSubjects = behavior.commonSearchTerms
      .filter(term => term.length > 3)
      .slice(0, 3);
    subjects.push(...searchSubjects);
  }
  
  // Remove duplicates and limit
  const uniqueSubjects = [...new Set(subjects)].slice(0, 5);
  
  return uniqueSubjects.length > 0 ? uniqueSubjects : ['Mathematics', 'Science', 'English'];
}

// Get work plan recommendations
async function getWorkPlanRecommendations(preferences, behavior) {
  const subjects = preferences.subjects || ['Mathematics'];
  
  return subjects.map(subject => ({
    subject,
    tasks: [
      `Complete ${subject} practice exercises`,
      `Review ${subject} concepts`,
      `Schedule tutoring session for ${subject}`,
      `Take ${subject} assessment`
    ],
    progress: Math.floor(Math.random() * 100),
    priority: 'high'
  }));
}

// Track user interaction with recommendations
export const trackRecommendationInteraction = async (req, res, next) => {
  try {
    const { packageId, interactionType, recommendationSource, timeSpent, viewStartTime, viewEndTime } = req.body;
    const userId = req.userId;
    
    // Calculate engagement level based on time spent
    let engagementLevel = 'medium';
    if (timeSpent) {
      if (timeSpent > 60) engagementLevel = 'high'; // More than 60 seconds
      else if (timeSpent < 10) engagementLevel = 'low'; // Less than 10 seconds
    }
    
    // Record interaction
    await UserInteraction.create({
      userId,
      packageId,
      interactionType,
      context: {
        viewStartTime: viewStartTime ? new Date(viewStartTime) : undefined,
        viewEndTime: viewEndTime ? new Date(viewEndTime) : undefined,
        sessionDuration: timeSpent || 0
      },
      metadata: {
        isRecommendation: true,
        source: recommendationSource || 'dashboard',
        timeSpent: timeSpent || 0,
        engagementLevel
      },
      timestamp: new Date()
    });
    
    // Log activity
    await Activity.create({
      studentId: userId,
      type: 'recommendation_interaction',
      subject: 'recommendation',
      details: {
        packageId,
        interactionType,
        source: recommendationSource,
        timeSpent: timeSpent || 0
      },
      timestamp: new Date()
    });
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error);
    next(createError(500, "Failed to track interaction"));
  }
};

// Track search query with keywords extraction
export const trackSearch = async (req, res, next) => {
  try {
    const { searchQuery, filters } = req.body;
    const userId = req.userId;
    
    if (!searchQuery || searchQuery.trim().length === 0) {
      return next(createError(400, "Search query is required"));
    }
    
    // Extract keywords from search query
    const keywords = extractKeywords(searchQuery);
    
    // Record search interaction
    await UserInteraction.create({
      userId,
      interactionType: 'view',
      context: {
        searchQuery: searchQuery.trim(),
        searchKeywords: keywords,
        filters: filters || {}
      },
      metadata: {
        isRecommendation: false
      },
      timestamp: new Date()
    });
    
    // Log activity
    await Activity.create({
      studentId: userId,
      type: 'search',
      subject: 'search',
      details: {
        query: searchQuery.trim(),
        keywords: keywords,
        filters: filters || {}
      },
      timestamp: new Date()
    });
    
    res.status(200).json({ success: true, keywords });
    
  } catch (error) {
    console.error('Error tracking search:', error);
    next(createError(500, "Failed to track search"));
  }
};

// Track package view with time spent
export const trackPackageView = async (req, res, next) => {
  try {
    const { packageId, timeSpent, viewStartTime, viewEndTime, searchQuery, searchKeywords } = req.body;
    const userId = req.userId;
    
    if (!packageId) {
      return next(createError(400, "Package ID is required"));
    }
    
    // Calculate engagement level based on time spent
    let engagementLevel = 'medium';
    if (timeSpent) {
      if (timeSpent > 60) engagementLevel = 'high'; // More than 60 seconds
      else if (timeSpent < 10) engagementLevel = 'low'; // Less than 10 seconds
    }
    
    // Record interaction
    await UserInteraction.create({
      userId,
      packageId,
      interactionType: 'view',
      context: {
        searchQuery: searchQuery || null,
        searchKeywords: searchKeywords || [],
        viewStartTime: viewStartTime ? new Date(viewStartTime) : undefined,
        viewEndTime: viewEndTime ? new Date(viewEndTime) : undefined,
        sessionDuration: timeSpent || 0
      },
      metadata: {
        isRecommendation: false,
        timeSpent: timeSpent || 0,
        engagementLevel
      },
      timestamp: new Date()
    });
    
    // Log activity
    await Activity.create({
      studentId: userId,
      type: 'view_package',
      subject: 'package',
      details: {
        packageId,
        timeSpent: timeSpent || 0,
        engagementLevel,
        searchQuery: searchQuery || null
      },
      timestamp: new Date()
    });
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error tracking package view:', error);
    next(createError(500, "Failed to track package view"));
  }
};

// Helper function to extract keywords from search query
function extractKeywords(searchQuery) {
  if (!searchQuery || typeof searchQuery !== 'string') return [];
  
  // Remove common stop words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may', 'might', 'must', 'can'];
  
  // Split into words and filter
  const words = searchQuery.toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .map(word => word.trim())
    .filter(word => word.length > 0);
  
  // Remove duplicates and return
  return [...new Set(words)];
}

// Get recommendation metrics (for analytics)
export const getRecommendationMetrics = async (req, res, next) => {
  try {
    const studentId = req.userId;
    
    const interactions = await UserInteraction.find({ 
      userId: studentId,
      'metadata.isRecommendation': true 
    }).populate('packageId');
    
    const activities = await Activity.find({ 
          studentId,
      type: { $in: ['get_recommendations', 'recommendation_interaction'] }
    });
    
    const metrics = {
      totalRecommendationInteractions: interactions.length,
      totalRecommendationActivities: activities.length,
      interactionTypes: {},
      topInteractedPackages: [],
      recommendationEffectiveness: 0
    };
    
    // Calculate interaction types
    interactions.forEach(interaction => {
      metrics.interactionTypes[interaction.interactionType] = 
        (metrics.interactionTypes[interaction.interactionType] || 0) + 1;
    });
    
    // Calculate top interacted packages
    const packageInteractions = {};
    interactions.forEach(interaction => {
      if (interaction.packageId) {
        const packageId = interaction.packageId._id.toString();
        packageInteractions[packageId] = (packageInteractions[packageId] || 0) + 1;
      }
    });
    
    metrics.topInteractedPackages = Object.entries(packageInteractions)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([packageId, count]) => ({ packageId, count }));
    
    // Calculate effectiveness (bookings / views)
    const views = metrics.interactionTypes.view || 0;
    const bookings = metrics.interactionTypes.book || 0;
    metrics.recommendationEffectiveness = views > 0 ? (bookings / views) * 100 : 0;
    
    res.status(200).json({
      success: true,
      metrics
    });
    
  } catch (error) {
    console.error('Error getting recommendation metrics:', error);
    next(createError(500, "Failed to get metrics"));
  }
};

// AI Service Management Functions
export const getAIStats = async (req, res, next) => {
  try {
    const stats = await aiRecommendationService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    next(createError(500, "Failed to get AI stats"));
  }
};

export const trainAIModel = async (req, res, next) => {
  try {
    const result = await aiRecommendationService.trainModel();
    res.status(200).json(result);
  } catch (error) {
    next(createError(500, "Failed to train AI model"));
  }
};

export const loadAIModel = async (req, res, next) => {
  try {
    const result = await aiRecommendationService.loadModel();
    res.status(200).json(result);
  } catch (error) {
    next(createError(500, "Failed to load AI model"));
  }
};

export const getAvailableAlgorithms = async (req, res, next) => {
  try {
    const algorithms = await aiRecommendationService.getAlgorithms();
    res.status(200).json(algorithms);
  } catch (error) {
    next(createError(500, "Failed to get algorithms"));
  }
};

export const getEvaluationResults = async (req, res, next) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    
    // Path to evaluation results file
    const evaluationFile = path.join(process.cwd(), 'api', 'python-ai', 'models', 'evaluation_results.json');
    
    if (!fs.existsSync(evaluationFile)) {
      return res.status(404).json({
        success: false,
        message: 'Evaluation results not found. Run model evaluation first.'
      });
    }
    
    // Read and parse evaluation results
    const evaluationData = fs.readFileSync(evaluationFile, 'utf8');
    const results = JSON.parse(evaluationData);
    
    res.status(200).json({
      success: true,
      results: results
    });
    
  } catch (error) {
    console.error('Error getting evaluation results:', error);
    next(createError(500, "Failed to get evaluation results"));
  }
};
