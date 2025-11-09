// api/services/ai/collaborativeFilter.js
import SessionHistory from "../../models/sessionHistory.model.js";
import User from "../../models/user.model.js";
import dataProcessor from "./dataProcessor.js";

class CollaborativeFilter {
  
  async recommend(studentId, topicQuery, limit = 10) {
    try {
      // Find similar students based on ratings and preferences
      const similarStudents = await this.findSimilarStudents(studentId);
      
      // Get educators that similar students rated highly
      const recommendations = await this.getEducatorsFromSimilarStudents(
        similarStudents, topicQuery, limit
      );
      
      return recommendations;
    } catch (error) {
      console.error('Collaborative filtering error:', error);
      return [];
    }
  }
  
  async findSimilarStudents(studentId) {
    try {
      // Get target student's session history
      const targetSessions = await SessionHistory.find({ 
        studentId,
        'feedback.studentRating': { $exists: true }
      });
      
      if (targetSessions.length === 0) return [];
      
      // Create rating map for target student
      const targetRatings = new Map();
      targetSessions.forEach(session => {
        targetRatings.set(
          session.educatorId.toString(),
          session.feedback.studentRating
        );
      });
      
      // Find other students who rated the same educators
      const allStudents = await SessionHistory.aggregate([
        {
          $match: {
            educatorId: { $in: Array.from(targetRatings.keys()).map(id => id) },
            studentId: { $ne: studentId },
            'feedback.studentRating': { $exists: true }
          }
        },
        {
          $group: {
            _id: '$studentId',
            ratings: {
              $push: {
                educatorId: '$educatorId',
                rating: '$feedback.studentRating'
              }
            }
          }
        }
      ]);
      
      // Calculate similarity scores
      const similarities = allStudents.map(student => ({
        studentId: student._id,
        similarity: this.calculatePearsonCorrelation(targetRatings, student.ratings)
      }))
      .filter(s => s.similarity > 0.1) // Only consider similar users
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 20); // Top 20 similar students
      
      return similarities;
    } catch (error) {
      console.error('Error finding similar students:', error);
      return [];
    }
  }
  
  calculatePearsonCorrelation(targetRatings, otherRatings) {
    const otherRatingMap = new Map();
    otherRatings.forEach(rating => {
      otherRatingMap.set(rating.educatorId.toString(), rating.rating);
    });
    
    // Find common educators
    const commonEducators = [];
    for (let [educatorId, targetRating] of targetRatings) {
      if (otherRatingMap.has(educatorId)) {
        commonEducators.push({
          target: targetRating,
          other: otherRatingMap.get(educatorId)
        });
      }
    }
    
    if (commonEducators.length < 2) return 0;
    
    // Calculate Pearson correlation
    const n = commonEducators.length;
    const sum1 = commonEducators.reduce((sum, pair) => sum + pair.target, 0);
    const sum2 = commonEducators.reduce((sum, pair) => sum + pair.other, 0);
    
    const sum1Sq = commonEducators.reduce((sum, pair) => sum + pair.target * pair.target, 0);
    const sum2Sq = commonEducators.reduce((sum, pair) => sum + pair.other * pair.other, 0);
    
    const pSum = commonEducators.reduce((sum, pair) => sum + pair.target * pair.other, 0);
    
    const numerator = pSum - (sum1 * sum2 / n);
    const denominator = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
  
  async getEducatorsFromSimilarStudents(similarStudents, topicQuery, limit) {
    try {
      const studentIds = similarStudents.map(s => s.studentId);
      
      // Get highly rated educators from similar students
      const recommendations = await SessionHistory.aggregate([
        {
          $match: {
            studentId: { $in: studentIds },
            'feedback.studentRating': { $gte: 4 },
            ...(topicQuery && {
              'sessionDetails.topic': { 
                $regex: topicQuery, 
                $options: 'i' 
              }
            })
          }
        },
        {
          $group: {
            _id: '$educatorId',
            avgRating: { $avg: '$feedback.studentRating' },
            sessionCount: { $sum: 1 },
            avgEngagement: { $avg: '$engagement.completionRate' },
            topics: { $addToSet: '$sessionDetails.topic' }
          }
        },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'educator'
          }
        },
        {
          $unwind: '$educator'
        },
        {
          $addFields: {
            score: {
              $multiply: [
                '$avgRating',
                { $ln: { $add: ['$sessionCount', 1] } },
                { $divide: [{ $add: ['$avgEngagement', 0] }, 100] }
              ]
            }
          }
        },
        {
          $sort: { score: -1 }
        },
        {
          $limit: limit
        },
        {
          $project: {
            educatorId: '$_id',
            educator: {
              _id: '$educator._id',
              username: '$educator.username',
              img: '$educator.img',
              teachingProfile: '$educator.teachingProfile'
            },
            score: 1,
            avgRating: 1,
            sessionCount: 1,
            avgEngagement: 1,
            topics: 1,
            recommendationType: { $literal: 'collaborative' }
          }
        }
      ]);
      
      return recommendations;
    } catch (error) {
      console.error('Error getting educators from similar students:', error);
      return [];
    }
  }
}

export default new CollaborativeFilter();
