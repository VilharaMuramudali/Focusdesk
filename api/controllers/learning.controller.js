import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import Package from '../models/package.model.js';
import SessionHistory from '../models/sessionHistory.model.js';
import UserInteraction from '../models/userInteraction.model.js';

// Get learning statistics for a student
export const getLearningStats = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get total hours spent
    const sessions = await SessionHistory.find({ 
      studentId: userId,
      status: 'completed'
    });
    
    const totalHours = sessions.reduce((total, session) => {
      return total + (session.duration || 1); // Assuming 1 hour per session if duration not specified
    }, 0);

    // Get topics learned
    const uniqueTopics = new Set();
    sessions.forEach(session => {
      if (session.sessionDetails?.topic) {
        uniqueTopics.add(session.sessionDetails.topic);
      }
    });

    // Get total sessions
    const totalSessions = sessions.length;

    // Calculate completion rate
    const totalBookings = await Booking.countDocuments({ studentId: userId });
    const completedBookings = await Booking.countDocuments({ 
      studentId: userId, 
      status: 'completed' 
    });
    const completionRate = totalBookings > 0 ? Math.round((completedBookings / totalBookings) * 100) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalHours,
        topicsLearned: uniqueTopics.size,
        totalSessions,
        completionRate
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get learning activity data
export const getLearningActivity = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Generate activity data for the last 6 months
    const activityData = [];
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    
    for (let monthIndex = 0; monthIndex < months.length; monthIndex++) {
      for (let week = 0; week < 4; week++) {
        // Get activity level based on sessions in that period
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - (6 - monthIndex));
        startDate.setDate(week * 7 + 1);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 6);
        
        const sessionCount = await SessionHistory.countDocuments({
          studentId: userId,
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        });
        
        // Convert session count to activity level (1-5)
        const activityLevel = Math.min(5, Math.max(1, Math.ceil(sessionCount / 2)));
        
        activityData.push({
          month: months[monthIndex],
          week,
          activity: activityLevel
        });
      }
    }

    res.status(200).json({
      success: true,
      data: activityData
    });
  } catch (error) {
    next(error);
  }
};

// Get learning trends data
export const getLearningTrends = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Generate trends data for the last 6 months
    const studyHours = [];
    const topicsCompleted = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    
    for (let i = 0; i < 6; i++) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - (6 - i));
      startDate.setDate(1);
      
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      
      // Get study hours for this month
      const sessions = await SessionHistory.find({
        studentId: userId,
        status: 'completed',
        createdAt: {
          $gte: startDate,
          $lte: endDate
        }
      });
      
      const hours = sessions.reduce((total, session) => {
        return total + (session.duration || 1);
      }, 0);
      
      studyHours.push(hours);
      
      // Get topics completed for this month
      const uniqueTopics = new Set();
      sessions.forEach(session => {
        if (session.sessionDetails?.topic) {
          uniqueTopics.add(session.sessionDetails.topic);
        }
      });
      
      topicsCompleted.push(uniqueTopics.size);
    }
    
    // Calculate growth percentage
    const currentMonth = studyHours[studyHours.length - 1];
    const previousMonth = studyHours[studyHours.length - 2] || 1;
    const growth = Math.round(((currentMonth - previousMonth) / previousMonth) * 100);

    res.status(200).json({
      success: true,
      data: {
        studyHours,
        topicsCompleted,
        growth: Math.max(0, growth)
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get learning recommendations
export const getLearningRecommendations = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    // Get user's learning history
    const userSessions = await SessionHistory.find({ 
      studentId: userId,
      status: 'completed'
    }).populate('educatorId', 'subjects');
    
    // Get user's subject preferences
    const user = await User.findById(userId);
    const userSubjects = user?.subjects || [];
    
    // Get completed topics
    const completedTopics = new Set();
    userSessions.forEach(session => {
      if (session.sessionDetails?.topic) {
        completedTopics.add(session.sessionDetails.topic);
      }
    });
    
    // Find related packages based on user's subjects and completed topics
    const relatedPackages = await Package.find({
      $or: [
        { subjects: { $in: userSubjects } },
        { title: { $regex: Array.from(completedTopics).join('|'), $options: 'i' } }
      ],
      isActive: true
    })
    .populate('educatorId', 'username subjects')
    .limit(4);
    
    // Generate recommendations
    const recommendations = relatedPackages.map((pkg, index) => ({
      id: pkg._id,
      title: pkg.title,
      description: index === 0 
        ? "Based on your progress in Data Science"
        : "Recommended next step after JavaScript",
      type: "recommended",
      packageId: pkg._id,
      educatorId: pkg.educatorId._id,
      educatorName: pkg.educatorId.username
    }));
    
    // If no related packages found, provide default recommendations
    if (recommendations.length === 0) {
      const defaultRecommendations = [
        {
          id: 'default-1',
          title: "Machine Learning Fundamentals",
          description: "Based on your progress in Data Science",
          type: "recommended"
        },
        {
          id: 'default-2',
          title: "React Advanced Patterns",
          description: "Recommended next step after JavaScript",
          type: "recommended"
        },
        {
          id: 'default-3',
          title: "React Advanced Patterns",
          description: "Recommended next step after JavaScript",
          type: "recommended"
        },
        {
          id: 'default-4',
          title: "React Advanced Patterns",
          description: "Recommended next step after JavaScript",
          type: "recommended"
        }
      ];
      
      return res.status(200).json({
        success: true,
        data: defaultRecommendations
      });
    }

    res.status(200).json({
      success: true,
      data: recommendations
    });
  } catch (error) {
    next(error);
  }
};
