// client/src/components/ai/AIRecommendations.jsx
import React, { useState, useEffect } from 'react';
import { FaRobot, FaStar, FaClock, FaUser, FaHeart } from 'react-icons/fa';
import newRequest from '../../utils/newRequest';
import './AIRecommendations.scss';

const AIRecommendations = ({ topic, filters = {}, onEducatorSelect }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [algorithm, setAlgorithm] = useState('hybrid');
  
  useEffect(() => {
    if (topic) {
      fetchRecommendations();
    }
  }, [topic, filters, algorithm]);
  
  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        topic,
        algorithm,
        limit: '8',
        includeExplanation: 'true',
        ...filters
      });
      
      const response = await newRequest.get(`/recommendations/educators?${params}`);
      
      setRecommendations(response.data.data.recommendations);
    } catch (err) {
      console.error('Failed to fetch recommendations:', err);
      setError('Failed to load AI recommendations');
    } finally {
      setLoading(false);
    }
  };
  
  const trackInteraction = async (educatorId, interactionType, rank) => {
    try {
      await newRequest.post('/recommendations/track', {
        targetEducatorId: educatorId,
        interactionType,
        recommendationRank: rank + 1,
        algorithmUsed: algorithm
      });
    } catch (err) {
      console.error('Failed to track interaction:', err);
    }
  };
  
  const handleEducatorClick = (educator, index) => {
    trackInteraction(educator.educatorId, 'click', index);
    if (onEducatorSelect) {
      onEducatorSelect(educator);
    }
  };
  
  const handleBookmark = async (educator, index) => {
    await trackInteraction(educator.educatorId, 'bookmark', index);
    // Add bookmark functionality here
  };
  
  if (loading) {
    return (
      <div className="ai-recommendations loading">
        <div className="ai-header">
          <FaRobot className="ai-icon spinning" />
          <h3>AI is finding the best educators for you...</h3>
        </div>
        <div className="loading-cards">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="recommendation-card loading-card">
              <div className="loading-shimmer"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="ai-recommendations error">
        <div className="error-message">
          <FaRobot className="ai-icon" />
          <p>{error}</p>
          <button onClick={fetchRecommendations} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="ai-recommendations">
      <div className="ai-header">
        <div className="ai-title">
          <FaRobot className="ai-icon" />
          <h3>AI-Powered Recommendations</h3>
        </div>
        
        <div className="algorithm-selector">
          <select 
            value={algorithm} 
            onChange={(e) => setAlgorithm(e.target.value)}
            className="algorithm-select"
          >
            <option value="hybrid">Smart Match (AI)</option>
            <option value="collaborative">Similar Students</option>
            <option value="content">Your Preferences</option>
          </select>
        </div>
      </div>
      
      {recommendations.length > 0 ? (
        <>
          <p className="ai-description">
            Found {recommendations.length} educators perfectly matched for "{topic}" based on your learning style and similar students' experiences.
          </p>
          
          <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
              <RecommendationCard
                key={rec.educatorId}
                recommendation={rec}
                rank={index + 1}
                onSelect={() => handleEducatorClick(rec, index)}
                onBookmark={() => handleBookmark(rec, index)}
                onTrackView={() => trackInteraction(rec.educatorId, 'view', index)}
              />
            ))}
          </div>
        </>
      ) : (
        <div className="no-recommendations">
          <FaRobot className="ai-icon" />
          <h4>No AI recommendations available</h4>
          <p>We're still learning about your preferences. Try searching with different keywords or browse educators manually.</p>
        </div>
      )}
    </div>
  );
};

const RecommendationCard = ({ recommendation, rank, onSelect, onBookmark, onTrackView }) => {
  const { educator, score, explanation, availability, recommendationType } = recommendation;
  
  useEffect(() => {
    // Track view when component mounts
    onTrackView();
  }, []);
  
  const getRecommendationBadge = () => {
    switch (recommendationType) {
      case 'collaborative': return { text: 'Popular Choice', color: '#4CAF50' };
      case 'content': return { text: 'Perfect Match', color: '#2196F3' };
      case 'hybrid': return { text: 'AI Recommended', color: '#FF9721' };
      default: return { text: 'Recommended', color: '#666' };
    }
  };
  
  const badge = getRecommendationBadge();
  const matchScore = Math.round(score * 100);
  
  return (
    <div className="recommendation-card" onClick={onSelect}>
      <div className="card-header">
        <div className="rank-badge">#{rank}</div>
        <div className="recommendation-badge" style={{ backgroundColor: badge.color }}>
          {badge.text}
        </div>
        <div className="match-score">{matchScore}% match</div>
      </div>
      
      <div className="educator-info">
        <div className="educator-avatar">
          {educator.img ? (
            <img src={educator.img} alt={educator.username} />
          ) : (
            <FaUser className="default-avatar" />
          )}
          {availability?.isOnline && <div className="online-indicator"></div>}
        </div>
        
        <div className="educator-details">
          <h4 className="educator-name">{educator.username}</h4>
          
          <div className="educator-stats">
            <div className="rating">
              <FaStar className="star-icon" />
              <span>{educator.teachingProfile?.averageRating?.toFixed(1) || 'New'}</span>
              <span className="sessions-count">
                ({educator.teachingProfile?.totalSessions || 0} sessions)
              </span>
            </div>
            
            <div className="response-time">
              <FaClock className="clock-icon" />
              <span>Responds in {availability?.responseTime || 24}h</span>
            </div>
          </div>
          
          <div className="expertise">
            {educator.teachingProfile?.expertise?.slice(0, 3).map((exp, i) => (
              <span key={i} className="expertise-tag">
                {exp.subject}
              </span>
            ))}
          </div>
        </div>
      </div>
      
      <div className="ai-explanation">
        <div className="explanation-text">
          <FaRobot className="explanation-icon" />
          <p>{explanation}</p>
        </div>
      </div>
      
      <div className="card-actions">
        <button className="view-profile-btn" onClick={onSelect}>
          View Profile
        </button>
        <button 
          className="bookmark-btn" 
          onClick={(e) => {
            e.stopPropagation();
            onBookmark();
          }}
        >
          <FaHeart />
        </button>
      </div>
    </div>
  );
};

export default AIRecommendations;
