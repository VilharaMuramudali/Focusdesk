// api/services/ai/recommendationEngine.js
import collaborativeFilter from "./collaborativeFilter.js";
import contentBasedFilter from "./contentBasedFilter.js";
import dataProcessor from "./dataProcessor.js";
import UserInteraction from "../../models/userInteraction.model.js";

class RecommendationEngine {
  
  async generateRecommendations(studentId, topicQuery, options = {}) {
    try {
      const {
        limit = 10,
        includeExplanation = true,
        algorithm = 'hybrid',
        filters = {}
      } = options;
      
      // Log the recommendation request
      await this.logRecommendationRequest(studentId, topicQuery, filters);
      
      let recommendations = [];
      
      switch (algorithm) {
        case 'collaborative':
          recommendations = await collaborativeFilter.recommend(studentId, topicQuery, limit);
          break;
        case 'content':
          recommendations = await contentBasedFilter.recommend(studentId, topicQuery, limit);
          break;
        case 'hybrid':
        default:
          recommendations = await this.hybridRecommendation(studentId, topicQuery, limit);
          break;
      }
      
      // Apply additional filters
      if (Object.keys(filters).length > 0) {
        recommendations = await this.applyFilters(recommendations, filters);
      }
      
      // Add explanations if requested
      if (includeExplanation) {
        recommendations = await this.addExplanations(recommendations, studentId, topicQuery);
      }
      
      // Add real-time availability check
      recommendations = await this.checkAvailability(recommendations);
      
      // Sort by final score
      recommendations.sort((a, b) => b.score - a.score);
      
      return recommendations.slice(0, limit);
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return await this.getEmergencyFallback(topicQuery, options.limit || 10);
    }
  }
  
  async hybridRecommendation(studentId, topicQuery, limit) {
    try {
      // Get recommendations from both algorithms
      const [collaborativeRecs, contentRecs] = await Promise.all([
        collaborativeFilter.recommend(studentId, topicQuery, Math.ceil(limit * 1.5)),
        contentBasedFilter.recommend(studentId, topicQuery, Math.ceil(limit * 1.5))
      ]);
      
      // Combine recommendations with weighted scoring
      const combinedRecs = this.combineRecommendations(
        collaborativeRecs,
        contentRecs,
        { collaborative: 0.6, content: 0.4 }
      );
      
      return combinedRecs;
    } catch (error) {
      console.error('Hybrid recommendation error:', error);
      // Fallback to content-based if collaborative fails
      return await contentBasedFilter.recommend(studentId, topicQuery, limit);
    }
  }
  
  combineRecommendations(collaborativeRecs, contentRecs, weights) {
    const scoreMap = new Map();
    const educatorMap = new Map();
    
    // Process collaborative recommendations
    collaborativeRecs.forEach((rec, index) => {
      const id = rec.educatorId.toString();
      const score = rec.score * weights.collaborative * (1 - index * 0.1); // Position penalty
      
      scoreMap.set(id, (scoreMap.get(id) || 0) + score);
      educatorMap.set(id, { ...rec, hybridComponents: { collaborative: score } });
    });
    
    // Process content-based recommendations
    contentRecs.forEach((rec, index) => {
      const id = rec.educatorId.toString();
      const score = rec.score * weights.content * (1 - index * 0.1); // Position penalty
      
      scoreMap.set(id, (scoreMap.get(id) || 0) + score);
      
      if (educatorMap.has(id)) {
        educatorMap.get(id).hybridComponents.content = score;
      } else {
        educatorMap.set(id, { ...rec, hybridComponents: { content: score } });
      }
    });
    
    // Create final recommendations
    const finalRecs = Array.from(scoreMap.entries()).map(([educatorId, score]) => {
      const rec = educatorMap.get(educatorId);
      return {
        ...rec,
        score,
        recommendationType: 'hybrid'
      };
    });
    
    return finalRecs.sort((a, b) => b.score - a.score);
  }
  
  async applyFilters(recommendations, filters) {
    try {
      let filtered = [...recommendations];
      
      // Price range filter
      if (filters.priceRange) {
        const { min, max } = this.parsePriceRange(filters.priceRange);
        filtered = filtered.filter(rec => {
          const rate = rec.educator?.teachingProfile?.hourlyRate || 0;
          return rate >= min && rate <= max;
        });
      }
      
      // Rating filter
      if (filters.minRating) {
        filtered = filtered.filter(rec => 
          (rec.educator?.teachingProfile?.averageRating || 0) >= filters.minRating
        );
      }
      
      // Experience filter
      if (filters.minExperience) {
        filtered = filtered.filter(rec => {
          const maxExp = Math.max(...(rec.educator?.teachingProfile?.expertise?.map(e => e.yearsExperience) || [0]));
          return maxExp >= filters.minExperience;
        });
      }
      
      // Language filter
      if (filters.language) {
        filtered = filtered.filter(rec => 
          rec.educator?.learningPreferences?.languages?.includes(filters.language)
        );
      }
      
      return filtered;
    } catch (error) {
      console.error('Filter application error:', error);
      return recommendations;
    }
  }
  
  parsePriceRange(priceRange) {
    switch (priceRange) {
      case 'under30': return { min: 0, max: 30 };
      case '30to40': return { min: 30, max: 40 };
      case 'over40': return { min: 40, max: 1000 };
      default: return { min: 0, max: 1000 };
    }
  }
  
  async addExplanations(recommendations, studentId, topicQuery) {
    try {
      const studentFeatures = await dataProcessor.extractUserFeatures(studentId);
      
      return recommendations.map(rec => ({
        ...rec,
        explanation: this.generateExplanation(rec, studentFeatures, topicQuery)
      }));
    } catch (error) {
      console.error('Explanation generation error:', error);
      return recommendations;
    }
  }
  
  generateExplanation(recommendation, studentFeatures, topicQuery) {
    const reasons = [];
    
    // Topic relevance
    if (topicQuery && recommendation.topicRelevance > 0.8) {
      reasons.push(`Specializes in ${topicQuery}`);
    }
    
    // High ratings
    if (recommendation.educator?.teachingProfile?.averageRating > 4.5) {
      reasons.push(`Highly rated (${recommendation.educator.teachingProfile.averageRating}⭐)`);
    }
    
    // Experience
    const maxExp = Math.max(...(recommendation.educator?.teachingProfile?.expertise?.map(e => e.yearsExperience) || [0]));
    if (maxExp > 5) {
      reasons.push(`${maxExp} years of experience`);
    }
    
    // Recommendation type
    if (recommendation.recommendationType === 'collaborative') {
      reasons.push('Recommended by similar students');
    } else if (recommendation.recommendationType === 'content') {
      reasons.push('Matches your learning preferences');
    } else if (recommendation.recommendationType === 'hybrid') {
      reasons.push('AI-optimized match');
    }
    
    // Availability
    const responseTime = recommendation.educator?.teachingProfile?.responseTimeHours || 24;
    if (responseTime <= 4) {
      reasons.push('Quick response time');
    }
    
    return reasons.length > 0 ? reasons.join(' • ') : 'Good match for your needs';
  }
  
  async checkAvailability(recommendations) {
    // In a real system, this would check actual calendar availability
    return recommendations.map(rec => ({
      ...rec,
      availability: {
        isOnline: Math.random() > 0.3, // Simulate online status
        nextAvailable: new Date(Date.now() + Math.random() * 24 * 60 * 60 * 1000),
        responseTime: rec.educator?.teachingProfile?.responseTimeHours || 24
      }
    }));
  }
  
  async logRecommendationRequest(studentId, topicQuery, filters) {
    try {
      await UserInteraction.create({
        userId: studentId,
        interactionType: 'view',
        context: {
          searchQuery: topicQuery,
          filters,
          deviceType: 'desktop', // Would be detected in real app
          sessionDuration: 0
        },
        metadata: {
          isRecommendation: true,
          algorithmUsed: 'hybrid'
        }
      });
    } catch (error) {
      console.error('Logging error:', error);
    }
  }
  
  async getEmergencyFallback(topicQuery, limit) {
    // Simple fallback for when AI fails
    try {
      return await contentBasedFilter.getFallbackRecommendations(topicQuery, limit);
    } catch (error) {
      console.error('Emergency fallback error:', error);
      return [];
    }
  }
  
  // Performance optimization methods
  async warmupRecommendations(studentId) {
    // Pre-calculate recommendations for active users
    try {
      const topTopics = ['mathematics', 'physics', 'chemistry', 'computer science'];
      
      for (let topic of topTopics) {
        const recs = await this.generateRecommendations(studentId, topic, {
          limit: 5,
          includeExplanation: false
        });
        
        // Cache results (implementation depends on your caching strategy)
        await this.cacheRecommendations(studentId, topic, recs);
      }
    } catch (error) {
      console.error('Warmup error:', error);
    }
  }
  
  async cacheRecommendations(studentId, topic, recommendations) {
    // Implementation depends on your caching solution (Redis, in-memory, etc.)
    // For now, just a placeholder
    console.log(`Caching ${recommendations.length} recommendations for student ${studentId}, topic: ${topic}`);
  }
}

export default new RecommendationEngine();
