// User Behavior Service for tracking and analyzing student behavior
import User from '../models/user.model.js';
import UserInteraction from '../models/userInteraction.model.js';
import Activity from '../models/activity.model.js';
import Package from '../models/package.model.js';

class UserBehaviorService {
  
  // Track user activity
  async trackActivity(studentId, activityType, details = {}) {
    try {
      await Activity.create({
        studentId,
        type: activityType,
        subject: details.subject || 'general',
        details,
        timestamp: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error tracking activity:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Track user interaction with packages
  async trackInteraction(studentId, packageId, interactionType, metadata = {}) {
    try {
      await UserInteraction.create({
        userId: studentId,
        packageId,
        interactionType,
        metadata: {
          ...metadata,
          timestamp: new Date()
        }
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error tracking interaction:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get comprehensive user preferences
  async getUserPreferences(studentId) {
    try {
      const user = await User.findById(studentId);
      const interactions = await UserInteraction.find({ userId: studentId })
        .populate('packageId')
        .sort({ timestamp: -1 })
        .limit(100);
      
      const activities = await Activity.find({ studentId })
        .sort({ timestamp: -1 })
        .limit(200);
      
      // Extract subjects from multiple sources
      const profileSubjects = user.subjects || [];
      const interactionSubjects = interactions
        .map(interaction => interaction.packageId?.subjects || [])
        .flat();
      const activitySubjects = activities
        .filter(activity => activity.subject && activity.subject !== 'general')
        .map(activity => activity.subject);
      
      // Combine and analyze subjects
      const allSubjects = [...profileSubjects, ...interactionSubjects, ...activitySubjects];
      const subjectAnalysis = this.analyzeSubjects(allSubjects);
      
      // Analyze price preferences
      const priceAnalysis = this.analyzePricePreferences(interactions);
      
      // Analyze learning patterns
      const learningPatterns = this.analyzeLearningPatterns(activities, interactions);
      
      // Analyze search behavior
      const searchBehavior = this.analyzeSearchBehavior(activities);
      
      return {
        subjects: subjectAnalysis.topSubjects,
        subjectConfidence: subjectAnalysis.confidence,
        preferredPrice: priceAnalysis.averagePrice,
        priceRange: priceAnalysis.priceRange,
        learningLevel: learningPatterns.level,
        preferredLanguages: user.languages || ['English'],
        interactionCount: interactions.length,
        activityCount: activities.length,
        lastActivity: activities[0]?.timestamp,
        searchTerms: searchBehavior.commonTerms,
        learningStyle: learningPatterns.style,
        timePatterns: learningPatterns.timePatterns
      };
      
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return this.getDefaultPreferences();
    }
  }
  
  // Analyze subject preferences
  analyzeSubjects(subjects) {
    const subjectCounts = {};
    
    subjects.forEach(subject => {
      if (subject && subject.trim()) {
        const cleanSubject = subject.toLowerCase().trim();
        subjectCounts[cleanSubject] = (subjectCounts[cleanSubject] || 0) + 1;
      }
    });
    
    const sortedSubjects = Object.entries(subjectCounts)
      .sort(([,a], [,b]) => b - a);
    
    const topSubjects = sortedSubjects.slice(0, 5).map(([subject]) => subject);
    const confidence = sortedSubjects.length > 0 ? 
      sortedSubjects[0][1] / sortedSubjects.reduce((sum, [,count]) => sum + count, 0) : 0;
    
    return { topSubjects, confidence };
  }
  
  // Analyze price preferences
  analyzePricePreferences(interactions) {
    const prices = interactions
      .filter(interaction => interaction.packageId?.rate)
      .map(interaction => interaction.packageId.rate);
    
    if (prices.length === 0) {
      return { averagePrice: null, priceRange: null };
    }
    
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    
    return {
      averagePrice,
      priceRange: { min: minPrice, max: maxPrice },
      priceCount: prices.length
    };
  }
  
  // Analyze learning patterns
  analyzeLearningPatterns(activities, interactions) {
    // Analyze activity types
    const activityTypes = {};
    activities.forEach(activity => {
      activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
    });
    
    // Determine learning level based on interactions
    const interactionCount = interactions.length;
    let level = 'beginner';
    if (interactionCount > 20) level = 'advanced';
    else if (interactionCount > 10) level = 'intermediate';
    
    // Analyze time patterns
    const timePatterns = this.analyzeTimePatterns(activities);
    
    // Determine learning style
    const viewCount = activityTypes.view || 0;
    const bookCount = activityTypes.book || 0;
    const searchCount = activityTypes.search || 0;
    
    let style = 'explorer';
    if (bookCount > viewCount) style = 'action-oriented';
    else if (searchCount > viewCount) style = 'research-oriented';
    
    return {
      level,
      style,
      timePatterns,
      activityTypes
    };
  }
  
  // Analyze search behavior
  analyzeSearchBehavior(activities) {
    const searchActivities = activities.filter(activity => activity.type === 'search');
    const searchTerms = searchActivities
      .map(activity => activity.details?.query || '')
      .filter(term => term.length > 2)
      .map(term => term.toLowerCase());
    
    const termCounts = {};
    searchTerms.forEach(term => {
      termCounts[term] = (termCounts[term] || 0) + 1;
    });
    
    const commonTerms = Object.entries(termCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([term]) => term);
    
    return {
      commonTerms,
      searchCount: searchActivities.length,
      uniqueTerms: Object.keys(termCounts).length
    };
  }
  
  // Analyze time patterns
  analyzeTimePatterns(activities) {
    const hourCounts = {};
    
    activities.forEach(activity => {
      const hour = new Date(activity.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
    
    return {
      peakHours,
      totalActivities: activities.length
    };
  }
  
  // Get default preferences for new users
  getDefaultPreferences() {
    return {
      subjects: ['Mathematics', 'Science', 'English'],
      subjectConfidence: 0.3,
      preferredPrice: null,
      priceRange: null,
      learningLevel: 'beginner',
      preferredLanguages: ['English'],
      interactionCount: 0,
      activityCount: 0,
      searchTerms: [],
      learningStyle: 'explorer',
      timePatterns: { peakHours: [9, 14, 19], totalActivities: 0 }
    };
  }
  
  // Update user preferences based on new interactions
  async updateUserPreferences(studentId, newInteraction) {
    try {
      // Track the new interaction
      await this.trackInteraction(
        studentId, 
        newInteraction.packageId, 
        newInteraction.type, 
        newInteraction.metadata
      );
      
      // Update user's subject preferences if needed
      if (newInteraction.packageId) {
        const packageData = await Package.findById(newInteraction.packageId);
        if (packageData && packageData.subjects) {
          await this.updateUserSubjects(studentId, packageData.subjects);
        }
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user preferences:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Update user's subject preferences
  async updateUserSubjects(studentId, newSubjects) {
    try {
      const user = await User.findById(studentId);
      if (!user) return { success: false, error: 'User not found' };
      
      const currentSubjects = user.subjects || [];
      const updatedSubjects = [...new Set([...currentSubjects, ...newSubjects])];
      
      await User.findByIdAndUpdate(studentId, {
        subjects: updatedSubjects.slice(0, 10) // Limit to 10 subjects
      });
      
      return { success: true };
    } catch (error) {
      console.error('Error updating user subjects:', error);
      return { success: false, error: error.message };
    }
  }
  
  // Get personalized recommendations based on behavior
  async getPersonalizedRecommendations(studentId, limit = 8) {
    try {
      const preferences = await this.getUserPreferences(studentId);
      
      // Build query based on preferences
      let query = { isActive: true };
      
      if (preferences.subjects && preferences.subjects.length > 0) {
        query.$or = [
          { subjects: { $in: preferences.subjects } },
          { title: { $regex: preferences.subjects.join('|'), $options: 'i' } },
          { desc: { $regex: preferences.subjects.join('|'), $options: 'i' } }
        ];
      }
      
      if (preferences.searchTerms && preferences.searchTerms.length > 0) {
        const searchRegex = preferences.searchTerms.join('|');
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
      
      if (preferences.preferredPrice) {
        query.rate = { $lte: preferences.preferredPrice * 1.5 };
      }
      
      // Get packages
      const packages = await Package.find(query)
        .populate('educatorId', 'username img subjects bio rating totalSessions')
        .sort({ rating: -1, totalOrders: -1 })
        .limit(limit * 2); // Get more to filter by personalization score
      
      // Calculate personalization scores
      const scoredPackages = packages.map(pkg => ({
        ...pkg.toObject(),
        personalizationScore: this.calculatePersonalizationScore(pkg, preferences)
      }));
      
      // Sort by personalization score and return top results
      scoredPackages.sort((a, b) => b.personalizationScore - a.personalizationScore);
      
      return {
        packages: scoredPackages.slice(0, limit),
        preferences: preferences,
        totalFound: packages.length,
        isPersonalized: preferences.interactionCount > 0
      };
      
    } catch (error) {
      console.error('Error getting personalized recommendations:', error);
      return { packages: [], preferences: null, totalFound: 0, isPersonalized: false };
    }
  }
  
  // Calculate personalization score for a package
  calculatePersonalizationScore(package, preferences) {
    let score = 0;
    
    // Subject match (highest weight)
    if (preferences.subjects && package.subjects) {
      const subjectMatches = preferences.subjects.filter(subject =>
        package.subjects.some(pkgSubject => 
          pkgSubject.toLowerCase().includes(subject.toLowerCase()) ||
          subject.toLowerCase().includes(pkgSubject.toLowerCase())
        )
      );
      score += subjectMatches.length * 10;
    }
    
    // Search term match
    if (preferences.searchTerms && package.title) {
      const searchMatches = preferences.searchTerms.filter(term =>
        package.title.toLowerCase().includes(term.toLowerCase()) ||
        package.desc?.toLowerCase().includes(term.toLowerCase())
      );
      score += searchMatches.length * 5;
    }
    
    // Price preference match
    if (preferences.preferredPrice && package.rate) {
      const priceDiff = Math.abs(package.rate - preferences.preferredPrice);
      const priceScore = Math.max(0, 10 - (priceDiff / preferences.preferredPrice) * 10);
      score += priceScore;
    }
    
    // Rating boost
    if (package.rating) {
      score += package.rating * 2;
    }
    
    // Popularity boost
    if (package.totalOrders) {
      score += Math.min(package.totalOrders / 10, 5);
    }
    
    // Learning level match
    if (preferences.learningLevel === 'beginner' && package.level === 'beginner') {
      score += 3;
    } else if (preferences.learningLevel === 'advanced' && package.level === 'advanced') {
      score += 3;
    }
    
    return score;
  }
}

export default new UserBehaviorService();
