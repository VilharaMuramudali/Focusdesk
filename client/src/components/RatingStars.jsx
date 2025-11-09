import React, { useState } from 'react';
import { FaStar, FaStarHalfAlt, FaRegStar } from 'react-icons/fa';
import './RatingStars.scss';

const RatingStars = ({ 
  rating = 0, 
  showNumber = true, 
  size = 'medium', 
  showCount = false, 
  reviewCount = 0,
  interactive = false,
  onRatingChange = null,
  maxRating = 5,
  showTooltip = true,
  variant = 'default',
  className = ''
}) => {
  const [hoverRating, setHoverRating] = useState(0);
  const [localRating, setLocalRating] = useState(rating);

  const handleStarClick = (starRating) => {
    if (interactive && onRatingChange) {
      setLocalRating(starRating);
      onRatingChange(starRating);
    }
  };

  const handleStarHover = (starRating) => {
    if (interactive) {
      setHoverRating(starRating);
    }
  };

  const handleStarLeave = () => {
    if (interactive) {
      setHoverRating(0);
    }
  };

  const renderStars = () => {
    const stars = [];
    const displayRating = interactive ? (hoverRating || localRating) : rating;
    const fullStars = Math.floor(displayRating);
    const hasHalfStar = displayRating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    // Full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <FaStar 
          key={`full-${i}`} 
          className={`star filled ${size} ${interactive ? 'interactive' : ''}`}
          onClick={() => handleStarClick(i + 1)}
          onMouseEnter={() => handleStarHover(i + 1)}
          onMouseLeave={handleStarLeave}
          title={showTooltip ? `${i + 1} star${i === 0 ? '' : 's'}` : ''}
        />
      );
    }

    // Half star
    if (hasHalfStar) {
      stars.push(
        <FaStarHalfAlt 
          key="half" 
          className={`star half ${size} ${interactive ? 'interactive' : ''}`}
          onClick={() => handleStarClick(fullStars + 0.5)}
          onMouseEnter={() => handleStarHover(fullStars + 0.5)}
          onMouseLeave={handleStarLeave}
          title={showTooltip ? `${fullStars + 0.5} stars` : ''}
        />
      );
    }

    // Empty stars
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <FaRegStar 
          key={`empty-${i}`} 
          className={`star empty ${size} ${interactive ? 'interactive' : ''}`}
          onClick={() => handleStarClick(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
          onMouseEnter={() => handleStarHover(fullStars + (hasHalfStar ? 1 : 0) + i + 1)}
          onMouseLeave={handleStarLeave}
          title={showTooltip ? `${fullStars + (hasHalfStar ? 1 : 0) + i + 1} star${fullStars + (hasHalfStar ? 1 : 0) + i === 0 ? '' : 's'}` : ''}
        />
      );
    }

    return stars;
  };

  const getRatingColor = () => {
    const ratingToUse = interactive ? localRating : rating;
    if (ratingToUse >= 4.5) return 'excellent';
    if (ratingToUse >= 4.0) return 'very-good';
    if (ratingToUse >= 3.5) return 'good';
    if (ratingToUse >= 3.0) return 'average';
    if (ratingToUse >= 2.0) return 'poor';
    return 'very-poor';
  };

  const getRatingText = () => {
    const ratingToUse = interactive ? localRating : rating;
    if (ratingToUse >= 4.5) return 'Excellent';
    if (ratingToUse >= 4.0) return 'Very Good';
    if (ratingToUse >= 3.5) return 'Good';
    if (ratingToUse >= 3.0) return 'Average';
    if (ratingToUse >= 2.0) return 'Poor';
    if (ratingToUse > 0) return 'Very Poor';
    return 'No ratings';
  };

  const getRatingEmoji = () => {
    const ratingToUse = interactive ? localRating : rating;
    if (ratingToUse >= 4.5) return '🌟';
    if (ratingToUse >= 4.0) return '⭐';
    if (ratingToUse >= 3.5) return '👍';
    if (ratingToUse >= 3.0) return '😐';
    if (ratingToUse >= 2.0) return '😕';
    if (ratingToUse > 0) return '😞';
    return '';
  };

  return (
    <div className={`rating-stars ${getRatingColor()} ${variant} ${className}`}>
      <div className="stars-container">
        {renderStars()}
      </div>
      
      {showNumber && (
        <div className="rating-info">
          <span className={`rating-number ${size}`}>
            {rating > 0 ? rating.toFixed(1) : 'No ratings'}
          </span>
          {showCount && reviewCount > 0 && (
            <span className="review-count">
              ({reviewCount})
            </span>
          )}
          {interactive && localRating > 0 && (
            <span className="rating-text">
              {getRatingText()} {getRatingEmoji()}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default RatingStars;
