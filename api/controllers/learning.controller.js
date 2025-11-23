import Booking from '../models/booking.model.js';
import User from '../models/user.model.js';
import Package from '../models/package.model.js';
import LearningSession from '../models/learningSession.model.js';

// Get learning statistics for a student
export const getLearningStats = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Try to get data from LearningSession first
    const learningSessions = await LearningSession.find({ 
      studentId: userId,
      status: 'completed'
    });
    
    if (learningSessions.length > 0) {
      // Calculate from learning sessions
      const totalMinutes = learningSessions.reduce((sum, session) => sum + session.duration, 0);
      const totalHours = Math.round(totalMinutes / 60);
      const topicsLearned = [...new Set(learningSessions.map(s => s.topic).filter(Boolean))].length;
      const totalSessions = learningSessions.length;
      const completionRate = learningSessions.length > 0
        ? Math.round(learningSessions.reduce((sum, s) => sum + (s.completionRate || 0), 0) / learningSessions.length)
        : 0;
      
      return res.status(200).json({
        totalHours,
        topicsLearned,
        totalSessions,
        completionRate
      });
    }
    
    // Fallback to bookings if no learning sessions
    const bookings = await Booking.find({ studentId: userId });
    
    // Count completed sessions from bookings
    let totalCompletedSessions = 0;
    let totalSessionsScheduled = 0;
    let totalMinutes = 0;
    const uniqueTopics = new Set();
    
    bookings.forEach(booking => {
      if (booking.sessions && booking.sessions.length > 0) {
        booking.sessions.forEach(session => {
          totalSessionsScheduled++;
          if (session.status === 'completed') {
            totalCompletedSessions++;
            totalMinutes += session.duration || 60; // Default 60 minutes if not specified
            if (booking.packageDetails?.title) {
              uniqueTopics.add(booking.packageDetails.title);
            }
          }
        });
      }
    });

    // Calculate total hours from actual session durations
    const totalHours = Math.round(totalMinutes / 60);
    const topicsLearned = uniqueTopics.size;
    const completionRate = totalSessionsScheduled > 0 
      ? Math.round((totalCompletedSessions / totalSessionsScheduled) * 100) 
      : 0;

    res.status(200).json({
      totalHours,
      topicsLearned,
      totalSessions: totalCompletedSessions,
      completionRate
    });
  } catch (error) {
    console.error('Error fetching learning stats:', error);
    next(error);
  }
};

// Get learning activity data
export const getLearningActivity = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Get sessions from last 7 months for heatmap
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(sevenMonthsAgo.getMonth() - 7);

    const sessions = await LearningSession.find({
      studentId: userId,
      status: 'completed',
      sessionDate: { $gte: sevenMonthsAgo }
    });

    // If no learning sessions, try to get from bookings
    if (sessions.length === 0) {
      const bookings = await Booking.find({
        studentId: userId
      });

      const activityByDate = {};
      
      bookings.forEach(booking => {
        if (booking.sessions && booking.sessions.length > 0) {
          booking.sessions.forEach(session => {
            if (session.status === 'completed' && session.date) {
              const sessionDate = new Date(session.date);
              if (sessionDate >= sevenMonthsAgo) {
                const dateKey = sessionDate.toISOString().split('T')[0];
                if (!activityByDate[dateKey]) {
                  activityByDate[dateKey] = 0;
                }
                // Increment activity level (1 session = 1 level)
                activityByDate[dateKey] = Math.min(4, activityByDate[dateKey] + 1);
              }
            }
          });
        }
      });

      return res.status(200).json(activityByDate);
    }

    // Create activity map by date from learning sessions
    const activityByDate = {};
    
    sessions.forEach(session => {
      const dateKey = new Date(session.sessionDate).toISOString().split('T')[0];
      if (!activityByDate[dateKey]) {
        activityByDate[dateKey] = 0;
      }
      // Use activityLevel from session, or default to 1
      const level = session.activityLevel || 1;
      activityByDate[dateKey] = Math.min(4, activityByDate[dateKey] + level);
    });

    res.status(200).json(activityByDate);
  } catch (error) {
    console.error('Error fetching learning activity:', error);
    next(error);
  }
};

// Get learning trends data
export const getLearningTrends = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Get sessions from last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const sessions = await LearningSession.find({
      studentId: userId,
      status: 'completed',
      sessionDate: { $gte: sixMonthsAgo }
    }).sort({ sessionDate: 1 });

    // If no learning sessions, try to get from bookings
    let monthlyData = {};
    const months = [];
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = date.toLocaleString('en-US', { month: 'short' });
      months.push(monthKey);
      monthlyData[monthKey] = { hours: 0, topics: new Set() };
    }

    if (sessions.length > 0) {
      // Aggregate data by month from learning sessions
      sessions.forEach(session => {
        const monthKey = new Date(session.sessionDate).toLocaleString('en-US', { month: 'short' });
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].hours += (session.duration || 60) / 60;
          if (session.topic) {
            monthlyData[monthKey].topics.add(session.topic);
          }
        }
      });
    } else {
      // Fallback to bookings
      const bookings = await Booking.find({ studentId: userId });
      
      bookings.forEach(booking => {
        if (booking.sessions && booking.sessions.length > 0) {
          booking.sessions.forEach(session => {
            if (session.status === 'completed' && session.date) {
              const sessionDate = new Date(session.date);
              if (sessionDate >= sixMonthsAgo) {
                const monthKey = sessionDate.toLocaleString('en-US', { month: 'short' });
                if (monthlyData[monthKey]) {
                  monthlyData[monthKey].hours += (session.duration || 60) / 60;
                  if (booking.packageDetails?.title) {
                    monthlyData[monthKey].topics.add(booking.packageDetails.title);
                  }
                }
              }
            }
          });
        }
      });
    }

    // Convert to arrays
    const studyHours = months.map(month => Math.round(monthlyData[month].hours));
    const topicsCompleted = months.map(month => monthlyData[month].topics.size);

    // Calculate growth (compare first and last month)
    const firstMonthHours = studyHours[0] || 1;
    const lastMonthHours = studyHours[studyHours.length - 1] || 0;
    const growth = firstMonthHours > 0 
      ? Math.round(((lastMonthHours - firstMonthHours) / firstMonthHours) * 100)
      : 0;

    res.status(200).json({
      studyHours,
      topicsCompleted,
      growth: Math.max(0, growth)
    });
  } catch (error) {
    console.error('Error fetching learning trends:', error);
    next(error);
  }
};

// Get learning recommendations
export const getLearningRecommendations = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }
    
    // Get user's completed sessions
    const completedSessions = await LearningSession.find({ 
      studentId: userId,
      status: 'completed'
    }).limit(20).sort({ sessionDate: -1 });
    
    // Get categories and topics
    const categories = [...new Set(completedSessions.map(s => s.category).filter(Boolean))];
    const topics = [...new Set(completedSessions.map(s => s.topic).filter(Boolean))];
    
    // Find related packages based on user's learning history
    let relatedPackages = [];
    
    if (categories.length > 0 || topics.length > 0) {
      const query = { isActive: true };
      const orConditions = [];
      
      if (categories.length > 0) {
        orConditions.push({ category: { $in: categories } });
      }
      
      if (topics.length > 0) {
        orConditions.push({ title: { $regex: topics.join('|'), $options: 'i' } });
      }
      
      if (orConditions.length > 0) {
        query.$or = orConditions;
      }
      
      relatedPackages = await Package.find(query)
        .populate('educatorId', 'username')
        .limit(4);
    } else {
      // If no learning history, get popular packages
      relatedPackages = await Package.find({ isActive: true })
        .populate('educatorId', 'username')
        .sort({ createdAt: -1 })
        .limit(4);
    }
    
    // Generate recommendations
    const recommendations = relatedPackages.map((pkg, index) => ({
      id: pkg._id,
      title: pkg.title,
      description: pkg.description || `Recommended based on your progress`,
      type: "recommended",
      category: pkg.category
    }));
    
    // Add default recommendations if not enough found
    if (recommendations.length < 4) {
      const defaults = [
        {
          id: 'default-1',
          title: 'Study Skills Enhancement',
          description: 'Improve your learning efficiency',
          type: 'popular'
        },
        {
          id: 'default-2',
          title: 'Time Management Techniques',
          description: 'Master your schedule',
          type: 'trending'
        },
        {
          id: 'default-3',
          title: 'Critical Thinking',
          description: 'Develop analytical skills',
          type: 'recommended'
        },
        {
          id: 'default-4',
          title: 'Effective Communication',
          description: 'Enhance your presentation skills',
          type: 'recommended'
        }
      ];
      
      recommendations.push(...defaults.slice(0, 4 - recommendations.length));
    }

    res.status(200).json(recommendations.slice(0, 4));
  } catch (error) {
    console.error('Error fetching learning recommendations:', error);
    next(error);
  }
};

// Create a learning session
export const createLearningSession = async (req, res, next) => {
  try {
    const {
      bookingId,
      educatorId,
      topic,
      category,
      duration,
      sessionDate,
      completionRate,
      activityLevel,
      notes
    } = req.body;

    const studentId = req.userId;

    const newSession = new LearningSession({
      studentId,
      bookingId,
      educatorId,
      topic,
      category,
      duration: duration || 60,
      sessionDate: sessionDate || new Date(),
      status: 'completed',
      completionRate: completionRate || 100,
      activityLevel: activityLevel || 2,
      notes
    });

    const savedSession = await newSession.save();
    res.status(201).json(savedSession);
  } catch (error) {
    next(error);
  }
};
