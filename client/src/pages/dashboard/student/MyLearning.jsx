import React, { useState, useEffect } from "react";
import { FaBook, FaArrowUp } from "react-icons/fa";
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
  const [learningTrends, setLearningTrends] = useState({
    studyHours: [],
    topicsCompleted: [],
    growth: 0
  });
  const [recommendations, setRecommendations] = useState([]);
  const [activityData, setActivityData] = useState({});

  useEffect(() => {
    fetchLearningData();
  }, []);

  const fetchLearningData = async () => {
    try {
      setLoading(true);
      
      // Fetch learning statistics
      const statsResponse = await newRequest.get('/learning/stats');
      setLearningStats(statsResponse.data || {
        totalHours: 0,
        topicsLearned: 0,
        totalSessions: 0,
        completionRate: 0
      });

      // Fetch learning trends
      const trendsResponse = await newRequest.get('/learning/trends');
      setLearningTrends(trendsResponse.data || {
        studyHours: [],
        topicsCompleted: [],
        growth: 0
      });

      // Fetch course recommendations
      const recommendationsResponse = await newRequest.get('/learning/recommendations');
      setRecommendations(recommendationsResponse.data || []);

      // Fetch activity heatmap data
      const activityResponse = await newRequest.get('/learning/activity');
      setActivityData(activityResponse.data || {});

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
          title: "Python for Data Analysis",
          description: "Build on your programming skills",
          type: "recommended"
        },
        {
          id: 4,
          title: "Advanced Mathematics",
          description: "Strengthen your foundation",
          type: "recommended"
        }
      ]);
      setLoading(false);
    }
  };

  const generateActivityGrid = () => {
    const cells = [];
    const today = new Date();
    const sevenMonthsAgo = new Date();
    sevenMonthsAgo.setMonth(today.getMonth() - 7);
    
    // Generate 28 weeks (7 months) × 7 days
    for (let week = 0; week < 28; week++) {
      for (let day = 0; day < 7; day++) {
        // Calculate the date for this cell
        const cellDate = new Date(sevenMonthsAgo);
        cellDate.setDate(sevenMonthsAgo.getDate() + (week * 7) + day);
        
        // Format date as YYYY-MM-DD to match backend data
        const dateKey = cellDate.toISOString().split('T')[0];
        
        // Get activity level from real data (0-4)
        const activityLevel = activityData[dateKey] || 0;
        
        // Format date for tooltip
        const formattedDate = cellDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        });
        
        cells.push(
          <div
            key={`${week}-${day}`}
            className={`activity-cell level-${Math.min(activityLevel, 4)}`}
            title={`${formattedDate}: ${activityLevel > 0 ? activityLevel + ' sessions' : 'No activity'}`}
          ></div>
        );
      }
    }
    
    return cells;
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
        title="My Sessions"
        subtitle="Track your learning progress and achievements"
      />
      
      <div className="learning-dashboard">
        {/* Key Statistics Cards */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-circle">
              <svg width="100" height="100">
                <circle className="circle-bg" cx="50" cy="50" r="40" />
                <circle 
                  className="circle-progress" 
                  cx="50" 
                  cy="50" 
                  r="40"
                  strokeDasharray={`${(learningStats.totalHours / 20) * 251.2}, 251.2`}
                />
              </svg>
              <div className="stat-number">{learningStats.totalHours}hrs</div>
            </div>
            <div className="stat-info">
              <h3>Total Hours Spent</h3>
              <p>Time Spent on the Portal</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-circle">
              <svg width="100" height="100">
                <circle className="circle-bg" cx="50" cy="50" r="40" />
                <circle 
                  className="circle-progress" 
                  cx="50" 
                  cy="50" 
                  r="40"
                  strokeDasharray={`${(learningStats.topicsLearned / 15) * 251.2}, 251.2`}
                />
              </svg>
              <div className="stat-number">{learningStats.topicsLearned} Topics</div>
            </div>
            <div className="stat-info">
              <h3>Topic Learned</h3>
              <p>Time Spent on the Portal</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-circle">
              <svg width="100" height="100">
                <circle className="circle-bg" cx="50" cy="50" r="40" />
                <circle 
                  className="circle-progress" 
                  cx="50" 
                  cy="50" 
                  r="40"
                  strokeDasharray={`${(learningStats.totalSessions / 5) * 251.2}, 251.2`}
                />
              </svg>
              <div className="stat-number">{learningStats.totalSessions} Sessions</div>
            </div>
            <div className="stat-info">
              <h3>Total Sessions</h3>
              <p>Time Spent on the Portal</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-circle">
              <svg width="100" height="100">
                <circle className="circle-bg" cx="50" cy="50" r="40" />
                <circle 
                  className="circle-progress" 
                  cx="50" 
                  cy="50" 
                  r="40"
                  strokeDasharray={`${(learningStats.completionRate / 100) * 251.2}, 251.2`}
                />
              </svg>
              <div className="stat-number">{learningStats.completionRate}%</div>
            </div>
            <div className="stat-info">
              <h3>Completion Rate</h3>
              <p>Time Spent on the Portal</p>
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
             <div className="activity-heatmap">
              <div className="heatmap-months">
                {(() => {
                  const months = [];
                  const today = new Date();
                  for (let i = 6; i >= 0; i--) {
                    const date = new Date();
                    date.setMonth(today.getMonth() - i);
                    const monthName = date.toLocaleString('en-US', { month: 'short' });
                    months.push(<span key={i} className="month-label">{monthName}</span>);
                  }
                  return months;
                })()}
              </div>
              <div className="heatmap-grid">
                {generateActivityGrid()}
              </div>
              <div className="heatmap-footer">
                <span className="active-time">Active time</span>
              </div>
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
              <svg viewBox="0 0 650 250" style={{width: '100%', height: '250px'}}>
                {/* Y-axis labels */}
                <text x="10" y="15" fontSize="10" fill="#999">28</text>
                <text x="10" y="65" fontSize="10" fill="#999">21</text>
                <text x="10" y="115" fontSize="10" fill="#999">14</text>
                <text x="10" y="165" fontSize="10" fill="#999">7</text>
                <text x="10" y="215" fontSize="10" fill="#999">0</text>
                
                <g transform="translate(50, 10)">
                  <svg viewBox="0 0 600 200" preserveAspectRatio="none" width="580" height="200">
                    {/* Grid lines */}
                    <line x1="0" y1="0" x2="600" y2="0" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="50" x2="600" y2="50" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="100" x2="600" y2="100" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="150" x2="600" y2="150" stroke="#e5e7eb" strokeWidth="1"/>
                    <line x1="0" y1="200" x2="600" y2="200" stroke="#e5e7eb" strokeWidth="1"/>
                    
                    {/* Study Hours Line (Blue) */}
                    <polyline
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2"
                      points={(learningTrends.studyHours || []).map((val, idx) => 
                        `${(idx / ((learningTrends.studyHours || []).length - 1)) * 600},${200 - (val / 28) * 200}`
                      ).join(' ')}
                    />
                    {(learningTrends.studyHours || []).map((val, idx) => (
                      <circle
                        key={`sh-${idx}`}
                        cx={(idx / ((learningTrends.studyHours || []).length - 1)) * 600}
                        cy={200 - (val / 28) * 200}
                        r="4"
                        fill="#3b82f6"
                      />
                    ))}
                    
                    {/* Topics Completed Line (Green) */}
                    <polyline
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2"
                      points={(learningTrends.topicsCompleted || []).map((val, idx) => 
                        `${(idx / ((learningTrends.topicsCompleted || []).length - 1)) * 600},${200 - (val / 12) * 200}`
                      ).join(' ')}
                    />
                    {(learningTrends.topicsCompleted || []).map((val, idx) => (
                      <circle
                        key={`tc-${idx}`}
                        cx={(idx / ((learningTrends.topicsCompleted || []).length - 1)) * 600}
                        cy={200 - (val / 12) * 200}
                        r="4"
                        fill="#10b981"
                      />
                    ))}
                  </svg>
                  
                  {/* X-axis labels */}
                  <text x="0" y="225" fontSize="10" fill="#999">Jan</text>
                  <text x="100" y="225" fontSize="10" fill="#999">Feb</text>
                  <text x="200" y="225" fontSize="10" fill="#999">Mar</text>
                  <text x="300" y="225" fontSize="10" fill="#999">Apr</text>
                  <text x="400" y="225" fontSize="10" fill="#999">May</text>
                  <text x="500" y="225" fontSize="10" fill="#999">Jun</text>
                </g>
              </svg>
              <div className="chart-legend">
                <div className="legend-item">
                  <div className="legend-dot" style={{background: '#3b82f6'}}></div>
                  <span>Study Hours</span>
                </div>
                <div className="legend-item">
                  <div className="legend-dot" style={{background: '#10b981'}}></div>
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
              {(recommendations || []).map((recommendation) => (
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