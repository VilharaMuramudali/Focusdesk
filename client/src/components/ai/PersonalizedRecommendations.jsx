import React, { useState, useEffect } from 'react';
import { FaStar, FaUser, FaBook, FaSearch, FaLightbulb, FaChartLine } from 'react-icons/fa';
import newRequest from '../../utils/newRequest';
import LoadingSpinner from '../LoadingSpinner';
import './PersonalizedRecommendations.scss';

const PersonalizedRecommendations = ({ studentId }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showExplanation, setShowExplanation] = useState(false);

  useEffect(() => {
    fetchPersonalizedRecommendations();
  }, [studentId]);

  const fetchPersonalizedRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await newRequest.get('/packages/recommended');
      
      if (response.data.packages) {
        setRecommendations(response.data.packages);
        setPreferences(response.data.studentPreferences);
      }
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      setError('Failed to load personalized recommendations');
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = async (packageId) => {
    try {
      // Track the interaction
      await newRequest.post('/recommend/track', {
        packageId,
        interactionType: 'view',
        metadata: {
          source: 'personalized_recommendations',
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const getPersonalizationExplanation = (packageItem) => {
    const explanations = [];
    
    if (packageItem.isPersonalized) {
      if (preferences && packageItem.subjects) {
        const matchingSubjects = preferences.filter(subject =>
          packageItem.subjects.some(pkgSubject =>
            pkgSubject.toLowerCase().includes(subject.toLowerCase())
          )
        );
        if (matchingSubjects.length > 0) {
          explanations.push(`Matches your interest in ${matchingSubjects.join(', ')}`);
        }
      }
      
      if (packageItem.personalizationScore > 50) {
        explanations.push('Highly personalized for your learning style');
      } else if (packageItem.personalizationScore > 30) {
        explanations.push('Good match based on your preferences');
      }
    }
    
    if (packageItem.rating >= 4.5) {
      explanations.push(`Highly rated (${packageItem.rating}⭐)`);
    }
    
    if (packageItem.totalOrders > 10) {
      explanations.push('Popular among students');
    }
    
    return explanations.length > 0 ? explanations.join(' • ') : 'Recommended for you';
  };

  const getRecommendationIcon = (packageItem) => {
    if (packageItem.isPersonalized) {
      return <FaLightbulb className="recommendation-icon personalized" />;
    }
    return <FaStar className="recommendation-icon" />;
  };

  if (loading) {
    return (
      <div className="personalized-recommendations">
        <div className="recommendations-header">
          <h3>Personalized Recommendations</h3>
        </div>
        <LoadingSpinner 
          size="medium" 
          text="Analyzing your preferences..." 
          variant="purple"
        />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="personalized-recommendations">
        <div className="recommendations-header">
          <h3>Personalized Recommendations</h3>
          <div className="error-message">
            <span>{error}</span>
            <button onClick={fetchPersonalizedRecommendations} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="personalized-recommendations">
      <div className="recommendations-header">
        <div className="header-content">
          <h3>
            <FaLightbulb className="header-icon" />
            Personalized Recommendations
          </h3>
          {preferences && preferences.length > 0 && (
            <div className="preferences-summary">
              <span>Based on your interests: {preferences.join(', ')}</span>
            </div>
          )}
        </div>
        <button 
          className="explanation-toggle"
          onClick={() => setShowExplanation(!showExplanation)}
        >
          {showExplanation ? 'Hide' : 'Show'} AI Insights
        </button>
      </div>

      {showExplanation && (
        <div className="ai-insights">
          <div className="insight-item">
            <FaSearch className="insight-icon" />
            <div className="insight-content">
              <h4>Learning Pattern Analysis</h4>
              <p>Our AI analyzes your search history, interactions, and preferences to provide relevant recommendations.</p>
            </div>
          </div>
          <div className="insight-item">
            <FaChartLine className="insight-icon" />
            <div className="insight-content">
              <h4>Personalization Score</h4>
              <p>Each recommendation has a personalization score based on subject match, price preferences, and learning level.</p>
            </div>
          </div>
        </div>
      )}

      <div className="recommendations-grid">
        {recommendations.length > 0 ? (
          recommendations.map((packageItem) => (
            <div 
              key={packageItem._id} 
              className={`recommendation-card ${packageItem.isPersonalized ? 'personalized' : ''}`}
              onClick={() => handlePackageClick(packageItem._id)}
            >
              <div className="card-header">
                {getRecommendationIcon(packageItem)}
                <div className="package-info">
                  <h4>{packageItem.title}</h4>
                  <p className="package-description">{packageItem.description}</p>
                </div>
              </div>
              
              <div className="card-content">
                <div className="tutor-info">
                  <FaUser className="tutor-icon" />
                  <span>{packageItem.tutor.username}</span>
                  {packageItem.rating > 0 && (
                    <div className="tutor-rating">
                      <FaStar className="star-icon" />
                      <span>{packageItem.rating.toFixed(1)}</span>
                      {packageItem.totalReviews > 0 && (
                        <span className="review-count">({packageItem.totalReviews})</span>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="package-details">
                  <div className="subjects">
                    <FaBook className="subject-icon" />
                    <span>{packageItem.subjects?.join(', ') || 'General'}</span>
                  </div>
                  <div className="price">
                    <span className="price-amount">Rs.{packageItem.price}</span>
                    <span className="price-unit">/hr</span>
                  </div>
                </div>
                
                {packageItem.isPersonalized && (
                  <div className="personalization-info">
                    <div className="personalization-score">
                      <span>Match Score: {Math.round(packageItem.personalizationScore || 0)}%</span>
                    </div>
                    <p className="personalization-explanation">
                      {getPersonalizationExplanation(packageItem)}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="card-actions">
                <button className="view-details-btn">View Details</button>
                <button className="book-now-btn">Book Now</button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-recommendations">
            <FaLightbulb className="no-rec-icon" />
            <h4>No Personalized Recommendations Yet</h4>
            <p>Start exploring packages and interacting with content to get personalized recommendations.</p>
            <button onClick={() => window.location.href = '/find-tutors'} className="explore-btn">
              Explore Packages
            </button>
          </div>
        )}
      </div>

      {recommendations.length > 0 && (
        <div className="recommendations-footer">
          <p>
            <FaLightbulb className="footer-icon" />
            Recommendations improve as you interact with more content
          </p>
        </div>
      )}
    </div>
  );
};

export default PersonalizedRecommendations;
