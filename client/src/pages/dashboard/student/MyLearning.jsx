import React, { useState, useEffect } from "react";
import { FaBook, FaPlay, FaDownload, FaClock, FaStar, FaUser, FaCalendar, FaFileAlt, FaVideo, FaCertificate, FaChartLine, FaBookmark, FaArrowUp, FaBell } from "react-icons/fa";
import SharedHeaderBanner from "./SharedHeaderBanner";
import LoadingSpinner from "../../../components/LoadingSpinner";
import newRequest from "../../../utils/newRequest";
import "./MyLearning.scss";

export default function MyLearning() {
  const [loading, setLoading] = useState(true);
  const [learningStats, setLearningStats] = useState({
    totalHours: 0,
    topicsLearned: 0,
    totalSessions: 0,
    completionRate: 0
  });
  const [activityData, setActivityData] = useState([]);
  const [learningTrends, setLearningTrends] = useState({
    studyHours: [],
    topicsCompleted: [],
    growth: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    fetchLearningData();
  }, []);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      
      // Fetch learning statistics
      const statsResponse = await newRequest.get('/learning/stats');
      setLearningStats(statsResponse.data || {
        totalHours: 16,
        topicsLearned: 10,
        totalSessions: 3,
        completionRate: 97
      });

       // Fetch activity data
       const activityResponse = await newRequest.get('/learning/activity');
       setActivityData(Array.isArray(activityResponse.data) ? activityResponse.data : []);

      // Fetch learning trends
      const trendsResponse = await newRequest.get('/learning/trends');
      setLearningTrends(trendsResponse.data || {
        studyHours: [5, 8, 12, 15, 18, 16],
        topicsCompleted: [2, 4, 6, 8, 10, 12],
        growth: 25
      });

       // Fetch course recommendations
       const recommendationsResponse = await newRequest.get('/learning/recommendations');
       setRecommendations(Array.isArray(recommendationsResponse.data) ? recommendationsResponse.data : []);

      // Fetch user courses
      const coursesResponse = await newRequest.get('/bookings/student');
      setCourses(coursesResponse.data || []);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching learning data:', error);
      // Set mock data for development
      setLearningStats({
        totalHours: 16,
        topicsLearned: 10,
        totalSessions: 3,
        completionRate: 97
      });
      setActivityData(generateMockActivityData());
      setLearningTrends({
        studyHours: [5, 8, 12, 15, 18, 16],
        topicsCompleted: [2, 4, 6, 8, 10, 12],
        growth: 25
      });
      setRecommendations([
        {
          id: 1,
          title: "Machine Learning Fundamentals",
          description: "Based on your progress in Data Science",
          type: "recommended"
        },
        {
          id: 2,
          title: "React Advanced Patterns",
          description: "Recommended next step after JavaScript",
          type: "recommended"
        },
        {
          id: 3,
          title: "React Advanced Patterns",
          description: "Recommended next step after JavaScript",
          type: "recommended"
        },
        {
          id: 4,
          title: "React Advanced Patterns",
          description: "Recommended next step after JavaScript",
          type: "recommended"
        }
      ]);
      setLoading(false);
    }
  };

  const generateMockActivityData = () => {
    const months = ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'];
    const data = [];
    
    months.forEach((month, monthIndex) => {
      for (let week = 0; week < 4; week++) {
        data.push({
          month,
          week,
          activity: Math.floor(Math.random() * 5) + 1
        });
      }
    });
    
    return data;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getProgressPercentage = (course) => {
    // Calculate progress based on completed sessions
    const totalSessions = course.sessions?.length || 1;
    const completedSessions = course.sessions?.filter(session => 
      session.status === 'completed'
    ).length || 0;
    return Math.round((completedSessions / totalSessions) * 100);
  };

  const getCourseStatus = (course) => {
    const progress = getProgressPercentage(course);
    if (progress === 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'not-started';
  };

  if (loading) {
    return (
      <div className="my-learning-container">
        <SharedHeaderBanner 
          title="My Learning"
          subtitle="Track your learning progress and achievements"
        />
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="my-learning-container">
      <SharedHeaderBanner 
        title="My Learning"
        subtitle="Track your learning progress and achievements"
      />
      
      <div className="learning-dashboard">
        {/* Key Statistics Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-circle">
                <div className="circle-progress" style={{ '--progress': `${(learningStats.totalHours / 20) * 100}%` }}>
                  <span className="stat-number">{learningStats.totalHours}hrs</span>
                </div>
              </div>
              <div className="stat-info">
                <h3>Total Hours Spent</h3>
                <p>Time Spent on the Portal</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-circle">
                <div className="circle-progress" style={{ '--progress': `${(learningStats.topicsLearned / 15) * 100}%` }}>
                  <span className="stat-number">{learningStats.topicsLearned}Topics</span>
                </div>
              </div>
              <div className="stat-info">
                <h3>Topic Learned</h3>
                <p>Time Spent on the Portal</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-circle">
                <div className="circle-progress" style={{ '--progress': `${(learningStats.totalSessions / 5) * 100}%` }}>
                  <span className="stat-number">{learningStats.totalSessions}Sessions</span>
                </div>
              </div>
              <div className="stat-info">
                <h3>Total Sessions</h3>
                <p>Time Spent on the Portal</p>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-circle">
                <div className="circle-progress" style={{ '--progress': `${learningStats.completionRate}%` }}>
                  <span className="stat-number">{learningStats.completionRate}%</span>
                </div>
              </div>
              <div className="stat-info">
                <h3>Completion Rate</h3>
                <p>Time Spent on the Portal</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Activity Section */}
          <div className="activity-section">
            <div className="section-header">
              <h3>Activity</h3>
              <div className="activity-legend">
                <span>Less</span>
                <div className="legend-colors">
                  <div className="legend-color light"></div>
                  <div className="legend-color medium"></div>
                  <div className="legend-color dark"></div>
                </div>
                <span>More</span>
              </div>
            </div>
             <div className="activity-calendar">
               {Array.isArray(activityData) && activityData.length > 0 ? (
                 activityData.map((item, index) => (
                   <div 
                     key={index} 
                     className={`activity-cell activity-${item.activity || 1}`}
                     title={`${item.month || 'Month'} - Activity Level: ${item.activity || 1}`}
                   ></div>
                 ))
               ) : (
                 // Fallback: generate some default activity cells
                 Array.from({ length: 28 }, (_, index) => (
                   <div 
                     key={index} 
                     className="activity-cell activity-1"
                     title="No activity data"
                   ></div>
                 ))
               )}
             </div>
          </div>

          {/* Learning Trends Section */}
          <div className="trends-section">
            <div className="section-header">
              <h3>Learning Trends</h3>
              <div className="growth-indicator">
                <FaArrowUp />
                <span>{learningTrends.growth}% growth</span>
              </div>
            </div>
            <div className="trends-chart">
              <div className="chart-container">
                <div className="chart-lines">
                   <div className="line study-hours">
                     {Array.isArray(learningTrends.studyHours) && learningTrends.studyHours.map((value, index) => (
                       <div 
                         key={index}
                         className="line-point"
                         style={{ 
                           left: `${(index / (learningTrends.studyHours.length - 1)) * 100}%`,
                           bottom: `${(value / 28) * 100}%`
                         }}
                       ></div>
                     ))}
                   </div>
                   <div className="line topics-completed">
                     {Array.isArray(learningTrends.topicsCompleted) && learningTrends.topicsCompleted.map((value, index) => (
                       <div 
                         key={index}
                         className="line-point"
                         style={{ 
                           left: `${(index / (learningTrends.topicsCompleted.length - 1)) * 100}%`,
                           bottom: `${(value / 28) * 100}%`
                         }}
                       ></div>
                     ))}
                   </div>
                </div>
                <div className="chart-labels">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-line study-hours"></div>
                  <span>Study Hours</span>
                </div>
                <div className="legend-item">
                  <div className="legend-line topics-completed"></div>
                  <span>Topics Completed</span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Recommendations Section */}
          <div className="recommendations-section">
            <div className="section-header">
              <h3>Course Recommendations</h3>
            </div>
             <div className="recommendations-list">
               {Array.isArray(recommendations) && recommendations.map((recommendation) => (
                 <div key={recommendation.id} className="recommendation-card">
                   <div className="recommendation-icon">
                     <FaBook />
                   </div>
                   <div className="recommendation-content">
                     <h4>{recommendation.title}</h4>
                     <p>{recommendation.description}</p>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}