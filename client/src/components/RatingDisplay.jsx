import React from 'react';
import { FaStar, FaChartBar, FaUsers, FaThumbsUp } from 'react-icons/fa';
import RatingStars from './RatingStars';
import './RatingDisplay.scss';

const RatingDisplay = ({ 
  rating = 0, 
  totalReviews = 0, 
  ratingBreakdown = {}, 
  showDetails = true,
  variant = 'default',
  className = ''
}) => {
  const getRatingDistribution = () => {
    const distribution = {
      5: ratingBreakdown[5] || 0,
      4: ratingBreakdown[4] || 0,
      3: ratingBreakdown[3] || 0,
      2: ratingBreakdown[2] || 0,
      1: ratingBreakdown[1] || 0
    };

    const total = Object.values(distribution).reduce((sum, count) => sum + count, 0);
    
    return Object.entries(distribution).map(([stars, count]) => ({
      stars: parseInt(stars),
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  };

  const getRatingColor = () => {
    if (rating >= 4.5) return 'excellent';
    if (rating >= 4.0) return 'very-good';
    if (rating >= 3.5) return 'good';
    if (rating >= 3.0) return 'average';
    if (rating >= 2.0) return 'poor';
    return 'very-poor';
  };

  const getRatingText = () => {
    if (rating >= 4.5) return 'Excellent';
    if (rating >= 4.0) return 'Very Good';
    if (rating >= 3.5) return 'Good';
    if (rating >= 3.0) return 'Average';
    if (rating >= 2.0) return 'Poor';
    if (rating > 0) return 'Very Poor';
    return 'No ratings yet';
  };

  const getRatingEmoji = () => {
    if (rating >= 4.5) return '🌟';
    if (rating >= 4.0) return '⭐';
    if (rating >= 3.5) return '👍';
    if (rating >= 3.0) return '😐';
    if (rating >= 2.0) return '😕';
    if (rating > 0) return '😞';
    return '';
  };

  const distribution = getRatingDistribution();

  return (
    <div className={`rating-display ${getRatingColor()} ${variant} ${className}`}>
      {/* Main Rating Section */}
      <div className="main-rating">
        <div className="rating-overview">
          <div className="rating-score">
            <span className="score-number">{rating > 0 ? rating.toFixed(1) : 'N/A'}</span>
            <RatingStars 
              rating={rating} 
              size="large" 
              showNumber={false}
              variant="detailed"
            />
          </div>
          
          <div className="rating-info">
            <div className="rating-text">
              <span className="rating-label">{getRatingText()}</span>
              <span className="rating-emoji">{getRatingEmoji()}</span>
            </div>
            
            <div className="review-stats">
              <div className="stat-item">
                <FaUsers className="stat-icon" />
                <span>{totalReviews} reviews</span>
              </div>
              
              {rating > 0 && (
                <div className="stat-item">
                  <FaThumbsUp className="stat-icon" />
                  <span>{Math.round((distribution[0]?.percentage || 0) + (distribution[1]?.percentage || 0))}% recommend</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      {showDetails && totalReviews > 0 && (
        <div className="rating-distribution">
          <div className="distribution-header">
            <FaChartBar className="chart-icon" />
            <h4>Rating Breakdown</h4>
          </div>
          
          <div className="distribution-bars">
            {distribution.map(({ stars, count, percentage }) => (
              <div key={stars} className="distribution-row">
                <div className="stars-label">
                  <span className="star-count">{stars}</span>
                  <FaStar className="star-icon" />
                </div>
                
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
                
                <div className="count-label">
                  <span className="count-number">{count}</span>
                  <span className="percentage">({percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Reviews State */}
      {totalReviews === 0 && (
        <div className="no-reviews">
          <div className="no-reviews-icon">📝</div>
          <p>No reviews yet</p>
          <span>Be the first to share your experience!</span>
        </div>
      )}
    </div>
  );
};

export default RatingDisplay;
