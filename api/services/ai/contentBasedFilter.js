
// api/services/ai/contentBasedFilter.js
import User from "../../models/user.model.js";
import Package from "../../models/package.model.js";
import dataProcessor from "./dataProcessor.js";

class ContentBasedFilter {
  
  async recommend(studentId, topicQuery, limit = 10) {
    try {
      // Get student preferences
      const studentFeatures = await dataProcessor.extractUserFeatures(studentId);
      
      if (!studentFeatures) {
        return await this.getFallbackRecommendations(topicQuery, limit);
      }
      
      // Find matching educators based on content similarity
      const recommendations = await this.findContentBasedMatches(
        studentFeatures, topicQuery, limit
      );
      
      return recommendations;
    } catch (error) {
      console.error('Content-based filtering error:', error);
      return [];
    }
  }
  
  async findContentBasedMatches(studentFeatures, topicQuery, limit) {
    try {
      // Build aggregation pipeline
      const pipeline = [
        {
          $match: {
            isEducator: true,
            'teachingProfile.expertise': { $exists: true, $ne: [] }
          }
        }
      ];
      
      // Add topic matching if specified
      if (topicQuery) {
        pipeline.push({
          $match: {
            $or: [
              { 'teachingProfile.expertise.subject': { $regex: topicQuery, $options: 'i' } },
              { 'learningPreferences.subjects': { $regex: topicQuery, $options: 'i' } }
            ]
          }
        });
      }
      
      // Calculate content similarity scores
      pipeline.push(
        {
          $addFields: {
            topicRelevanceScore: await this.calculateTopicRelevance(topicQuery),
            expertiseScore: await this.calculateExpertiseScore(),
            teachingStyleMatch: await this.calculateTeachingStyleMatch(studentFeatures),
            levelCompatibility: await this.calculateLevelCompatibility(studentFeatures),
            availabilityScore: await this.calculateAvailabilityScore()
          }
        },
        {
          $addFields: {
            contentScore: {
              $add: [
                { $multiply: ['$topicRelevanceScore', 0.3] },
                { $multiply: ['$expertiseScore', 0.25] },
                { $multiply: ['$teachingStyleMatch', 0.2] },
                { $multiply: ['$levelCompatibility', 0.15] },
                { $multiply: ['$availabilityScore', 0.1] }
              ]
            }
          }
        },
        {
          $addFields: {
            finalScore: {
              $multiply: [
                '$contentScore',
                { $ifNull: ['$teachingProfile.averageRating', 3] },
                { $ln: { $add: [{ $ifNull: ['$teachingProfile.totalSessions', 0] }, 1] } }
              ]
            }
          }
        },
        {
          $sort: { finalScore: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            educatorId: '$_id',
            educator: {
              _id: '$_id',
              username: '$username',
              img: '$img',
              teachingProfile: '$teachingProfile'
            },
            score: '$finalScore',
            contentScore: '$contentScore',
            topicRelevance: '$topicRelevanceScore',
            expertise: '$expertiseScore',
            styleMatch: '$teachingStyleMatch',
            levelMatch: '$levelCompatibility',
            recommendationType: { $literal: 'content-based' }
          }
        }
      );
      
      const educators = await User.aggregate(pipeline);
      return educators;
    } catch (error) {
      console.error('Error in content-based matching:', error);
      return [];
    }
  }
  
  async calculateTopicRelevance(topicQuery) {
    if (!topicQuery) return { $literal: 0.5 };
    
    return {
      $cond: {
        if: {
          $or: [
            {
              $regexMatch: {
                input: { $toString: '$teachingProfile.expertise.subject' },
                regex: topicQuery,
                options: 'i'
              }
            },
            {
              $regexMatch: {
                input: { $toString: '$learningPreferences.subjects' },
                regex: topicQuery,
                options: 'i'
              }
            }
          ]
        },
        then: 1.0,
        else: 0.3
      }
    };
  }
  
  async calculateExpertiseScore() {
    return {
      $cond: {
        if: { $isArray: '$teachingProfile.expertise' },
        then: {
          $avg: {
            $map: {
              input: '$teachingProfile.expertise',
              as: 'exp',
              in: {
                $multiply: [
                  { $divide: ['$$exp.proficiencyLevel', 10] },
                  { $min: [{ $divide: ['$$exp.yearsExperience', 10] }, 1] }
                ]
              }
            }
          }
        },
        else: 0.1
      }
    };
  }
  
  async calculateTeachingStyleMatch(studentFeatures) {
    const preferredStyle = studentFeatures.learningStyle || 1;
    
    return {
      $switch: {
        branches: [
          {
            case: { $eq: ['$teachingProfile.teachingStyle', 'interactive'] },
            then: preferredStyle === 1 || preferredStyle === 3 ? 1.0 : 0.7
          },
          {
            case: { $eq: ['$teachingProfile.teachingStyle', 'structured'] },
            then: preferredStyle === 4 ? 1.0 : 0.8
          },
          {
            case: { $eq: ['$teachingProfile.teachingStyle', 'flexible'] },
            then: 0.9
          }
        ],
        default: 0.6
      }
    };
  }
  
  async calculateLevelCompatibility(studentFeatures) {
    const studentLevel = studentFeatures.academicLevel || 2;
    
    return {
      $cond: {
        if: { $eq: ['$learningPreferences.academicLevel', this.decodeAcademicLevel(studentLevel)] },
        then: 1.0,
        else: 0.7
      }
    };
  }
  
  async calculateAvailabilityScore() {
    return {
      $cond: {
        if: { $lte: [{ $ifNull: ['$teachingProfile.responseTimeHours', 24] }, 12] },
        then: 1.0,
        else: {
          $subtract: [
            1.0,
            {
              $divide: [
                { $subtract: [{ $ifNull: ['$teachingProfile.responseTimeHours', 24] }, 12] },
                100
              ]
            }
          ]
        }
      }
    };
  }
  
  decodeAcademicLevel(level) {
    const mapping = { 1: 'highschool', 2: 'university', 3: 'postgraduate' };
    return mapping[level] || 'university';
  }
  
  async getFallbackRecommendations(topicQuery, limit) {
    // Fallback for new users with no data
    const pipeline = [
      {
        $match: {
          isEducator: true,
          'teachingProfile.averageRating': { $gte: 4.0 }
        }
      }
    ];
    
    if (topicQuery) {
      pipeline.push({
        $match: {
          'teachingProfile.expertise.subject': { 
            $regex: topicQuery, 
            $options: 'i' 
          }
        }
      });
    }
    
    pipeline.push(
      {
        $sort: {
          'teachingProfile.averageRating': -1,
          'teachingProfile.totalSessions': -1
        }
      },
      {
        $limit: limit
      },
      {
        $project: {
          educatorId: '$_id',
          educator: {
            _id: '$_id',
            username: '$username',
            img: '$img',
            teachingProfile: '$teachingProfile'
          },
          score: '$teachingProfile.averageRating',
          recommendationType: { $literal: 'fallback' }
        }
      }
    );
    
    return await User.aggregate(pipeline);
  }
}

export default new ContentBasedFilter();
