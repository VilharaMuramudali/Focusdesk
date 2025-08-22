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
      preferredLanguages: user.languages || ['English']
    };
    
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return {
      subjects: [],
      preferredPrice: null,
      interactionCount: 0,
      learningLevel: 'beginner',
      preferredLanguages: ['English']
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
    const timePatterns = [];
    
    interactions.forEach(interaction => {
      interactionTypes[interaction.interactionType] = 
        (interactionTypes[interaction.interactionType] || 0) + 1;
    });
    
    activities.forEach(activity => {
      if (activity.type === 'search') {
        searchPatterns.push(activity.details?.query || '');
      }
      timePatterns.push(activity.timestamp);
    });
    
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
      interactionTypes,
      commonSearchTerms,
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
  
  // Subject match (highest weight)
  if (preferences.subjects && packageItem.subjects) {
    const subjectMatches = preferences.subjects.filter(subject =>
      packageItem.subjects.some(pkgSubject => 
        pkgSubject.toLowerCase().includes(subject.toLowerCase()) ||
        subject.toLowerCase().includes(pkgSubject.toLowerCase())
      )
    );
    score += subjectMatches.length * 10;
  }
  
  // Search term match
  if (behavior.commonSearchTerms && packageItem.title) {
    const searchMatches = behavior.commonSearchTerms.filter(term =>
      packageItem.title.toLowerCase().includes(term.toLowerCase()) ||
      packageItem.desc?.toLowerCase().includes(term.toLowerCase())
    );
    score += searchMatches.length * 5;
  }
  
  // Price preference match
  if (preferences.preferredPrice && packageItem.price) {
    const priceDiff = Math.abs(packageItem.price - preferences.preferredPrice);
    const priceScore = Math.max(0, 10 - (priceDiff / preferences.preferredPrice) * 10);
    score += priceScore;
  }
  
  // Rating boost
  if (packageItem.rating) {
    score += packageItem.rating * 2;
  }
  
  // Popularity boost
  if (packageItem.totalOrders) {
    score += Math.min(packageItem.totalOrders / 10, 5);
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
    const { packageId, interactionType, recommendationSource } = req.body;
    const userId = req.userId;
    
    // Record interaction
    await UserInteraction.create({
      userId,
      packageId,
      interactionType,
      metadata: {
        isRecommendation: true,
        source: recommendationSource || 'dashboard'
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
        source: recommendationSource
      },
      timestamp: new Date()
    });
    
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Error tracking recommendation interaction:', error);
    next(createError(500, "Failed to track interaction"));
  }
};

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
