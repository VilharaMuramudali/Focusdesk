import React, { useState, useEffect } from "react";
import { FaChartLine, FaTrophy, FaCalendar, FaBook, FaStar, FaClock } from "react-icons/fa";
import newRequest from "../../../../utils/newRequest";

const LearningProgress = () => {
  const [progressData, setProgressData] = useState({
    totalCourses: 0,
    completedCourses: 0,
    inProgressCourses: 0,
    totalHours: 0,
    averageRating: 0,
    streak: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      
      // Fetch user's learning progress
      const response = await newRequest.get('/progress/student');
      const data = response.data;
      
      setProgressData({
        totalCourses: data.totalCourses || 0,
        completedCourses: data.completedCourses || 0,
        inProgressCourses: data.inProgressCourses || 0,
        totalHours: data.totalHours || 0,
        averageRating: data.averageRating || 0,
        streak: data.streak || 0
      });

      setRecentActivity(data.recentActivity || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setLoading(false);
    }
  };

  const getOverallProgress = () => {
    if (progressData.totalCourses === 0) return 0;
    return Math.round((progressData.completedCourses / progressData.totalCourses) * 100);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="learning-progress">
        <div className="loading-placeholder">
          <div className="spinner"></div>
          <p>Loading progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="learning-progress">
      <div className="progress-header">
        <h3>Learning Progress</h3>
        <div className="overall-progress">
          <div className="progress-circle">
            <div className="circle-progress">
              <span className="progress-percentage">{getOverallProgress()}%</span>
            </div>
          </div>
        </div>
      </div>

      <div className="progress-stats">
        <div className="stat-item">
          <div className="stat-icon">
            <FaBook />
          </div>
          <div className="stat-info">
            <span className="stat-number">{progressData.totalCourses}</span>
            <span className="stat-label">Total Courses</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <FaTrophy />
          </div>
          <div className="stat-info">
            <span className="stat-number">{progressData.completedCourses}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-info">
            <span className="stat-number">{progressData.totalHours}h</span>
            <span className="stat-label">Total Hours</span>
          </div>
        </div>

        <div className="stat-item">
          <div className="stat-icon">
            <FaStar />
          </div>
          <div className="stat-info">
            <span className="stat-number">{progressData.averageRating.toFixed(1)}</span>
            <span className="stat-label">Avg Rating</span>
          </div>
        </div>
      </div>

      <div className="recent-activity">
        <h4>Recent Activity</h4>
        <div className="activity-list">
          {recentActivity.length > 0 ? (
            recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <div className="activity-icon">
                  <FaCalendar />
                </div>
                <div className="activity-info">
                  <span className="activity-title">{activity.title}</span>
                  <span className="activity-date">{formatDate(activity.date)}</span>
                </div>
                <div className="activity-status">
                  {activity.status === 'completed' ? (
                    <FaTrophy className="completed" />
                  ) : (
                    <FaBook className="in-progress" />
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="no-activity">
              <p>No recent activity</p>
            </div>
          )}
        </div>
      </div>

      <div className="progress-achievements">
        <h4>Achievements</h4>
        <div className="achievements-grid">
          <div className={`achievement ${progressData.completedCourses >= 1 ? 'unlocked' : 'locked'}`}>
            <FaTrophy />
            <span>First Course</span>
          </div>
          <div className={`achievement ${progressData.completedCourses >= 5 ? 'unlocked' : 'locked'}`}>
            <FaTrophy />
            <span>5 Courses</span>
          </div>
          <div className={`achievement ${progressData.streak >= 7 ? 'unlocked' : 'locked'}`}>
            <FaTrophy />
            <span>7 Day Streak</span>
          </div>
          <div className={`achievement ${progressData.totalHours >= 50 ? 'unlocked' : 'locked'}`}>
            <FaTrophy />
            <span>50 Hours</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LearningProgress;