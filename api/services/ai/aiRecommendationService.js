// aiRecommendationService.js
// Node.js service to integrate with Python AI recommendation service

import axios from 'axios';
import User from '../../models/user.model.js';
import Package from '../../models/package.model.js';
import UserInteraction from '../../models/userInteraction.model.js';

class AIRecommendationService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:5000';
    this.isConnected = false;
    this.checkConnection();
  }

  async checkConnection() {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`);
      this.isConnected = response.data.status === 'healthy';
      console.log('AI Service connection status:', this.isConnected);
    } catch (error) {
      this.isConnected = false;
      console.warn('AI Service not available:', error.message);
    }
  }

  async getRecommendations(userId, options = {}) {
    try {
      if (!this.isConnected) {
        console.warn('AI Service not available, using fallback recommendations');
        return await this.getFallbackRecommendations(userId, options);
      }

      const {
        query = '',
        algorithm = 'hybrid',
        limit = 10,
        includeEducators = true,
        includePackages = true
      } = options;

      // Get recommendations from AI service
      const response = await axios.post(`${this.aiServiceUrl}/recommendations`, {
        user_id: userId,
        query: query,
        algorithm: algorithm,
        limit: limit
      });

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get AI recommendations');
      }

      const aiRecommendations = response.data.recommendations;

      // Enhance recommendations with additional data
      const enhancedRecommendations = await this.enhanceRecommendations(aiRecommendations, userId);

      // Log the recommendation request
      await this.logRecommendationRequest(userId, query, algorithm, enhancedRecommendations.length);

      return {
        success: true,
        recommendations: enhancedRecommendations,
        algorithm: algorithm,
        query: query,
        totalCount: enhancedRecommendations.length,
        source: 'ai_service',
        timestamp: new Date()
      };

    } catch (error) {
      console.error('AI recommendation error:', error);
      
      // Fallback to basic recommendations
      return await this.getFallbackRecommendations(userId, options);
    }
  }

  async enhanceRecommendations(aiRecommendations, userId) {
    try {
      const enhanced = [];

      for (const rec of aiRecommendations) {
        // Get educator details
        const educator = await User.findById(rec.educator_id)
          .select('username email img subjects bio rating totalSessions teachingProfile');

        // Get package details
        const packageData = await Package.findById(rec.package_id)
          .select('title desc price subjects level duration rating totalOrders');

        if (educator && packageData) {
          enhanced.push({
            ...rec,
            educator: {
              id: educator._id,
              username: educator.username,
              email: educator.email,
              img: educator.img,
              subjects: educator.subjects,
              bio: educator.bio,
              rating: educator.rating,
              totalSessions: educator.totalSessions,
              teachingProfile: educator.teachingProfile
            },
            package: {
              id: packageData._id,
              title: packageData.title,
              desc: packageData.desc,
              price: packageData.price,
              subjects: packageData.subjects,
              level: packageData.level,
              duration: packageData.duration,
              rating: packageData.rating,
              totalOrders: packageData.totalOrders
            },
            // Add personalized explanation
            explanation: this.generateExplanation(rec, educator, packageData)
          });
        }
      }

      return enhanced;

    } catch (error) {
      console.error('Error enhancing recommendations:', error);
      return aiRecommendations;
    }
  }

  generateExplanation(recommendation, educator, packageData) {
    const explanations = [];

    // Add recommendation type explanation
    switch (recommendation.recommendation_type) {
      case 'content_based':
        explanations.push('Based on your learning preferences');
        break;
      case 'collaborative':
        explanations.push('Recommended by similar students');
        break;
      case 'cluster_based':
        explanations.push('Popular among students like you');
        break;
      case 'hybrid':
        explanations.push('AI-optimized match');
        break;
    }

    // Add educator-specific explanations
    if (educator.rating >= 4.5) {
      explanations.push(`Highly rated educator (${educator.rating}⭐)`);
    }

    if (educator.totalSessions > 50) {
      explanations.push('Experienced educator');
    }

    // Add package-specific explanations
    if (packageData.rating >= 4.0) {
      explanations.push(`High-rated package (${packageData.rating}⭐)`);
    }

    if (packageData.totalOrders > 10) {
      explanations.push('Popular package');
    }

    // Add subject match explanation
    if (recommendation.subjects && recommendation.subjects.length > 0) {
      explanations.push(`Covers: ${recommendation.subjects.join(', ')}`);
    }

    return explanations.join(' • ') || 'Good match for your needs';
  }

  async getFallbackRecommendations(userId, options = {}) {
    try {
      const {
        query = '',
        limit = 10,
        minRating = 4.0
      } = options;

      // Get user preferences
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Build query based on user preferences and search query
      let searchQuery = {};
      
      if (query) {
        searchQuery.$or = [
          { title: { $regex: query, $options: 'i' } },
          { desc: { $regex: query, $options: 'i' } },
          { subjects: { $in: [new RegExp(query, 'i')] } }
        ];
      }

      // Add rating filter
      searchQuery.rating = { $gte: minRating };

      // Get packages
      const packages = await Package.find(searchQuery)
        .populate('educatorId', 'username email img subjects bio rating totalSessions')
        .sort({ rating: -1, totalOrders: -1 })
        .limit(limit);

      const recommendations = packages.map((packageItem, index) => ({
        package_id: packageItem._id.toString(),
        educator_id: packageItem.educatorId._id.toString(),
        educator_name: packageItem.educatorId.username,
        package_title: packageItem.title,
        subjects: packageItem.subjects,
        price: packageItem.price,
        rating: packageItem.rating,
        similarity_score: 1 - (index * 0.1), // Decreasing score based on position
        recommendation_type: 'fallback',
        explanation: `Top-rated package in ${packageItem.subjects.join(', ')}`,
        educator: {
          id: packageItem.educatorId._id,
          username: packageItem.educatorId.username,
          email: packageItem.educatorId.email,
          img: packageItem.educatorId.img,
          subjects: packageItem.educatorId.subjects,
          bio: packageItem.educatorId.bio,
          rating: packageItem.educatorId.rating,
          totalSessions: packageItem.educatorId.totalSessions
        },
        package: {
          id: packageItem._id,
          title: packageItem.title,
          desc: packageItem.desc,
          price: packageItem.price,
          subjects: packageItem.subjects,
          level: packageItem.level,
          duration: packageItem.duration,
          rating: packageItem.rating,
          totalOrders: packageItem.totalOrders
        }
      }));

      return {
        success: true,
        recommendations: recommendations,
        algorithm: 'fallback',
        query: query,
        totalCount: recommendations.length,
        source: 'fallback',
        timestamp: new Date()
      };

    } catch (error) {
      console.error('Fallback recommendation error:', error);
      return {
        success: false,
        recommendations: [],
        error: error.message,
        source: 'fallback',
        timestamp: new Date()
      };
    }
  }

  async recordInteraction(userId, packageId, interactionType) {
    try {
      // Record in local database
      await UserInteraction.create({
        userId: userId,
        packageId: packageId,
        interactionType: interactionType,
        metadata: {
          isRecommendation: true,
          source: 'ai_service'
        }
      });

      // Send to AI service if available
      if (this.isConnected) {
        try {
          await axios.post(`${this.aiServiceUrl}/interaction`, {
            user_id: userId,
            package_id: packageId,
            interaction_type: interactionType
          });
        } catch (error) {
          console.warn('Failed to send interaction to AI service:', error.message);
        }
      }

      return { success: true };

    } catch (error) {
      console.error('Error recording interaction:', error);
      return { success: false, error: error.message };
    }
  }

  async logRecommendationRequest(userId, query, algorithm, resultCount) {
    try {
      await UserInteraction.create({
        userId: userId,
        interactionType: 'view',
        context: {
          searchQuery: query,
          algorithm: algorithm,
          resultCount: resultCount
        },
        metadata: {
          isRecommendation: true,
          source: 'ai_service'
        }
      });
    } catch (error) {
      console.warn('Failed to log recommendation request:', error.message);
    }
  }

  async getAIStats() {
    try {
      if (!this.isConnected) {
        return { error: 'AI Service not available' };
      }

      const response = await axios.get(`${this.aiServiceUrl}/stats`);
      return response.data;

    } catch (error) {
      console.error('Error getting AI stats:', error);
      return { error: error.message };
    }
  }

  async trainModel() {
    try {
      if (!this.isConnected) {
        return { error: 'AI Service not available' };
      }

      const response = await axios.post(`${this.aiServiceUrl}/train`);
      return response.data;

    } catch (error) {
      console.error('Error training model:', error);
      return { error: error.message };
    }
  }

  async loadModel() {
    try {
      if (!this.isConnected) {
        return { error: 'AI Service not available' };
      }

      const response = await axios.post(`${this.aiServiceUrl}/load`);
      return response.data;

    } catch (error) {
      console.error('Error loading model:', error);
      return { error: error.message };
    }
  }

  async getAvailableAlgorithms() {
    try {
      if (!this.isConnected) {
        return {
          algorithms: [
            { name: 'fallback', description: 'Basic fallback recommendations' }
          ]
        };
      }

      const response = await axios.get(`${this.aiServiceUrl}/algorithms`);
      return response.data;

    } catch (error) {
      console.error('Error getting algorithms:', error);
      return {
        algorithms: [
          { name: 'fallback', description: 'Basic fallback recommendations' }
        ]
      };
    }
  }
}

// Export singleton instance
export default new AIRecommendationService();
