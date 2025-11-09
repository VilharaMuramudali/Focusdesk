// aiRecommendationService.js
// Node.js service to integrate with Python AI recommendation service

import axios from 'axios';
import User from '../../models/user.model.js';
import Package from '../../models/package.model.js';
import UserInteraction from '../../models/userInteraction.model.js';

// Constants for service health management
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 1000; // 1 second
const CONNECTION_TIMEOUT = 5000; // 5 seconds

class AIRecommendationService {
  constructor() {
    this.aiServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:5000';
    this.isConnected = false;
    this.lastConnectionAttempt = 0;
    this.retryCount = 0;
    this.healthCheckInterval = null;
    
    // Initialize health check
    this.startHealthCheck();
  }

  async startHealthCheck() {
    // Clear any existing interval
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Start periodic health checks
    this.healthCheckInterval = setInterval(async () => {
      await this.checkConnection();
    }, HEALTH_CHECK_INTERVAL);

    // Initial check
    await this.checkConnection();
  }

  async checkConnection() {
    try {
      const now = Date.now();
      // Prevent too frequent checks
      if (now - this.lastConnectionAttempt < RETRY_DELAY) {
        return this.isConnected;
      }
      
      this.lastConnectionAttempt = now;
      
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: CONNECTION_TIMEOUT
      });
      
      if (response.status === 200 && response.data.status === 'healthy') {
        this.isConnected = true;
        this.retryCount = 0;
        console.log('✅ ML Service connection healthy');
        return true;
      }
      
      throw new Error('Unhealthy response from ML service');
    } catch (error) {
      this.isConnected = false;
      this.retryCount++;
      
      console.warn(`⚠️ ML Service connection failed (attempt ${this.retryCount}/${MAX_RETRY_ATTEMPTS}):`, error.message);
      
      if (this.retryCount >= MAX_RETRY_ATTEMPTS) {
        console.error('❌ ML Service connection failed after maximum retry attempts');
      }
      
      return false;
    }
  }

  async getRecommendations(userId, options = {}) {
    try {
      // Validate connection with retry logic
      let retryAttempt = 0;
      while (!this.isConnected && retryAttempt < MAX_RETRY_ATTEMPTS) {
        console.log(`Attempting to connect to ML service (attempt ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS})`);
        await this.checkConnection();
        
        if (!this.isConnected) {
          retryAttempt++;
          if (retryAttempt < MAX_RETRY_ATTEMPTS) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
      
      if (!this.isConnected) {
        console.warn('AI/ML Service not available after retries, using fallback recommendations');
        return await this.getFallbackRecommendations(userId, options);
      }

      const {
        query = '',
        algorithm = 'hybrid',
        limit = 10,
        includeEducators = true,
        includePackages = true
      } = options;

      // Get recommendations from ML API service with timeout and retry logic
      let response;
      for (let attempt = 0; attempt < MAX_RETRY_ATTEMPTS; attempt++) {
        try {
          response = await axios.post(`${this.aiServiceUrl}/recommendations`, {
            user_id: userId.toString(),
            query: query,
            algorithm: algorithm,
            limit: limit,
            timestamp: Date.now() // Add timestamp for cache busting if needed
          }, {
            timeout: 30000, // 30 second timeout for ML processing
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache'
            }
          });
          
          // If successful, break the retry loop
          if (response.data && response.data.recommendations) {
            break;
          }
        } catch (error) {
          console.warn(`ML recommendation request failed (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS}):`, error.message);
          
          if (attempt === MAX_RETRY_ATTEMPTS - 1) {
            // Last attempt failed, use fallback
            console.warn('ML recommendations failed after all retries, using fallback');
            return await this.getFallbackRecommendations(userId, options);
          }
          
          // Wait before next retry
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        }
      }

      if (!response.data.success) {
        throw new Error(response.data.error || 'Failed to get AI recommendations');
      }

      const aiRecommendations = response.data.recommendations || [];

      if (aiRecommendations.length === 0) {
        console.log('⚠️ ML service returned no recommendations, using fallback');
        return await this.getFallbackRecommendations(userId, options);
      }

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
        source: 'ml_service',
        timestamp: new Date()
      };

    } catch (error) {
      console.error('AI/ML recommendation error:', error.message);
      
      // Mark as disconnected and fallback
      this.isConnected = false;
      
      // Fallback to basic recommendations
      return await this.getFallbackRecommendations(userId, options);
    }
  }

  async enhanceRecommendations(aiRecommendations, userId) {
    try {
      const enhanced = [];

      for (const rec of aiRecommendations) {
        // Get package ID from different possible formats
        const packageId = rec._id || rec.packageId || rec.package_id;
        
        if (!packageId) {
          console.warn('⚠️ Recommendation missing package ID:', rec);
          continue;
        }

        // Get package details
        const packageData = await Package.findById(packageId)
          .populate('educatorId', 'username email img subjects bio rating totalSessions teachingProfile')
          .lean();

        if (!packageData) {
          console.warn(`⚠️ Package not found for ID: ${packageId}`);
          continue;
        }

        // Get educator from populated field or find separately
        let educator = packageData.educatorId;
        
        if (!educator && packageData.educatorId) {
          educator = await User.findById(packageData.educatorId)
            .select('username email img subjects bio rating totalSessions teachingProfile')
            .lean();
        }

        // Format recommendation for frontend
        const enhancedRec = {
          _id: packageId.toString(),
          packageId: packageId.toString(),
          title: rec.title || packageData.title,
          description: rec.description || packageData.description || packageData.desc,
          rate: rec.rate || packageData.rate,
          price: rec.price || rec.rate || packageData.rate,
          score: rec.score || rec.aiScore || rec.similarity_score || rec.predicted_score || 0,
          aiScore: rec.aiScore || rec.score || rec.similarity_score || rec.predicted_score || 0,
          method: rec.method || 'hybrid',
          algorithm: rec.method || 'hybrid',
          isPersonalized: true,
          tutor: educator ? {
            username: educator.username,
            img: educator.img || '/img/noavatar.jpg',
            subjects: educator.subjects || []
          } : {
            username: 'Unknown Tutor',
            img: '/img/noavatar.jpg',
            subjects: []
          },
          rating: packageData.rating || 0,
          subjects: packageData.subjects || [],
          languages: packageData.languages || ['English'],
          image: packageData.thumbnail || '/img/course-default.jpg',
          level: packageData.level || 'beginner',
          totalOrders: packageData.totalOrders || 0
        };

        enhanced.push(enhancedRec);
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
