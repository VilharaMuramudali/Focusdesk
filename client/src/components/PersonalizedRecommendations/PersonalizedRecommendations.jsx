import React, { useState, useEffect } from 'react';
import newRequest from '../../utils/newRequest';
import './PersonalizedRecommendations.scss';

const PersonalizedRecommendations = () => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      console.log('Fetching personalized recommendations...');
      const response = await newRequest.get('/recommend/personalized?limit=5');
      console.log('Recommendations response:', response.data);

      if (response.data.success) {
        setRecommendations(response.data.data.recommendations);
        console.log('Set recommendations:', response.data.data.recommendations);
      } else {
        console.log('Response not successful:', response.data);
      }
    } catch (err) {
      console.error('Error fetching recommendations:', err);
      console.error('Error details:', err.response?.data);
      // Don't show error to user if it's just auth issue
      if (err.response?.status !== 401) {
        setError('Failed to load recommendations');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = async (packageId) => {
    // Track click interaction
    try {
      await newRequest.post('/recommend/track', {
        packageId: packageId,
        interactionType: 'click',
        recommendationSource: 'ml-personalized'
      });
    } catch (err) {
      console.error('Error tracking click:', err);
    }

    // Navigate to package detail
    window.location.href = `/packages/${packageId}`;
  };

  if (loading) {
    return (
      <div className="personalized-recommendations loading">
        <div className="loading-spinner">Loading recommendations...</div>
      </div>
    );
  }

  // Show in console for debugging
  console.log('Rendering recommendations. Count:', recommendations.length, 'Error:', error);

  if (error) {
    console.log('Not showing recommendations due to error:', error);
    // Show error for debugging
    return (
      <div className="personalized-recommendations" style={{background: '#fee', color: '#c00', padding: '1rem'}}>
        <p>⚠️ Error loading recommendations: {error}</p>
      </div>
    );
  }
  
  if (recommendations.length === 0) {
    console.log('No recommendations to display');
    // Show message for debugging
    return (
      <div className="personalized-recommendations" style={{background: '#fef3cd', padding: '1rem'}}>
        <p>ℹ️ No personalized recommendations available yet. Start browsing packages to get recommendations!</p>
      </div>
    );
  }

  return (
    <div className="personalized-recommendations">
      <h2>📚 Recommended For You</h2>
      <div className="recommendations-grid">
        {recommendations.map((rec, index) => (
          <div 
            key={rec.packageId} 
            className="recommendation-card"
            onClick={() => handlePackageClick(rec.packageId)}
          >
            {index === 0 && (
              <div className="card-badge">⭐ Top Pick</div>
            )}
            <h3>{rec.title || 'Package'}</h3>
            <p className="subject">{rec.subject || 'General'}</p>
            <div className="score-badge">
              Match: {(rec.score * 100).toFixed(0)}%
            </div>
            <button className="view-btn">View Details</button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PersonalizedRecommendations;
