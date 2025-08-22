// api/services/ai/dataProcessor.js
import User from '../../models/user.model.js';
import SessionHistory from '../../models/sessionHistory.model.js';
import UserInteraction from '../../models/userInteraction.model.js';
import Booking from '../../models/booking.model.js';
import Review from '../../models/review.model.js';

class DataProcessor {
  
  // Extract user features for ML
  async extractUserFeatures(userId) {
    try {
      const user = await User.findById(userId);
      const sessionHistory = await SessionHistory.find({
        $or: [{ studentId: userId }, { educatorId: userId }]
      }).limit(50).sort({ createdAt: -1 });
      
      const interactions = await UserInteraction.find({ userId })
        .limit(100).sort({ createdAt: -1 });
      
      // Create feature vector
      const features = {
        userId: userId.toString(),
        
        // Basic profile features
        isEducator: user.isEducator,
        academicLevel: this.encodeAcademicLevel(user.learningPreferences?.academicLevel),
        learningStyle: this.encodeLearningStyle(user.learningPreferences?.learningStyle),
        
        // Behavioral features
        totalSessions: sessionHistory.length,
        averageRating: this.calculateAverageRating(sessionHistory, userId),
        topicPreferences: this.extractTopicPreferences(sessionHistory, interactions),
        timePreferences: this.extractTimePreferences(sessionHistory),
        
        // Engagement features
        averageEngagement: this.calculateAverageEngagement(sessionHistory),
        interactionFrequency: this.calculateInteractionFrequency(interactions),
        
        // Feature vector for similarity calculations
        featureVector: this.createFeatureVector(user, sessionHistory, interactions)
      };
      
      return features;
    } catch (error) {
      console.error('Error extracting user features:', error);
      return null;
    }
  }
  
  encodeAcademicLevel(level) {
    const mapping = { 'highschool': 1, 'university': 2, 'postgraduate': 3 };
    return mapping[level] || 2;
  }
  
  encodeLearningStyle(style) {
    const mapping = { 'visual': 1, 'auditory': 2, 'kinesthetic': 3, 'reading': 4 };
    return mapping[style] || 1;
  }
  
  calculateAverageRating(sessions, userId) {
    const ratings = sessions
      .filter(s => s.feedback && (s.studentId.toString() === userId.toString() ? 
        s.feedback.educatorRating : s.feedback.studentRating))
      .map(s => s.studentId.toString() === userId.toString() ? 
        s.feedback.educatorRating : s.feedback.studentRating);
    
    return ratings.length > 0 ? 
      ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;
  }
  
  extractTopicPreferences(sessions, interactions) {
    const topics = new Map();
    
    // From sessions
    sessions.forEach(session => {
      if (session.sessionDetails?.topic) {
        const topic = session.sessionDetails.topic.toLowerCase();
        topics.set(topic, (topics.get(topic) || 0) + 1);
      }
    });
    
    // From interactions
    interactions.forEach(interaction => {
      if (interaction.context?.searchQuery) {
        const query = interaction.context.searchQuery.toLowerCase();
        topics.set(query, (topics.get(query) || 0) + 0.5);
      }
    });
    
    return Array.from(topics.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([topic]) => topic);
  }
  
  extractTimePreferences(sessions) {
    const timeSlots = new Map();
    
    sessions.forEach(session => {
      if (session.sessionDetails?.scheduledDate) {
        const hour = new Date(session.sessionDetails.scheduledDate).getHours();
        const timeSlot = this.getTimeSlot(hour);
        timeSlots.set(timeSlot, (timeSlots.get(timeSlot) || 0) + 1);
      }
    });
    
    return Array.from(timeSlots.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([slot]) => slot);
  }
  
  getTimeSlot(hour) {
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
  
  calculateAverageEngagement(sessions) {
    const engagementScores = sessions
      .filter(s => s.engagement?.completionRate)
      .map(s => s.engagement.completionRate);
    
    return engagementScores.length > 0 ? 
      engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length : 0;
  }
  
  calculateInteractionFrequency(interactions) {
    if (interactions.length === 0) return 0;
    
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
    
    const recentInteractions = interactions.filter(
      i => new Date(i.createdAt) > thirtyDaysAgo
    );
    
    return recentInteractions.length / 30; // interactions per day
  }
  
  createFeatureVector(user, sessions, interactions) {
    // Create a numerical vector for ML algorithms
    return [
      user.isEducator ? 1 : 0,
      this.encodeAcademicLevel(user.learningPreferences?.academicLevel),
      this.encodeLearningStyle(user.learningPreferences?.learningStyle),
      sessions.length,
      this.calculateAverageRating(sessions, user._id),
      this.calculateAverageEngagement(sessions),
      this.calculateInteractionFrequency(interactions),
      user.teachingProfile?.averageRating || 0,
      user.teachingProfile?.totalSessions || 0,
      user.teachingProfile?.responseTimeHours || 24
    ];
  }
  
  // Prepare training data for ML model
  async prepareTrainingData() {
    try {
      const sessions = await SessionHistory.find({
        'feedback.studentRating': { $exists: true, $gte: 1 }
      }).populate('studentId educatorId');
      
      const trainingData = [];
      
      for (let session of sessions) {
        const studentFeatures = await this.extractUserFeatures(session.studentId._id);
        const educatorFeatures = await this.extractUserFeatures(session.educatorId._id);
        
        if (studentFeatures && educatorFeatures) {
          trainingData.push({
            studentFeatures: studentFeatures.featureVector,
            educatorFeatures: educatorFeatures.featureVector,
            rating: session.feedback.studentRating,
            topic: session.sessionDetails.topic,
            engagement: session.engagement.completionRate || 0
          });
        }
      }
      
      return trainingData;
    } catch (error) {
      console.error('Error preparing training data:', error);
      return [];
    }
  }
}

export default new DataProcessor();
