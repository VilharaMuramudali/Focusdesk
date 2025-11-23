import React, { useState, useEffect } from 'react';
import { FaStar, FaTimes, FaSmile, FaMeh, FaFrown, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import RatingStars from './RatingStars';
import './ReviewModal.scss';

const ReviewModal = ({ isOpen, onClose, educator, packageData, sessionData, onSubmitReview }) => {
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [categories, setCategories] = useState({
    overallExperience: 0,
    teachingQuality: 0,
    communication: 0,
    punctuality: 0,
    valueForMoney: 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);

  // Calculate progress and auto-compute overall rating from category averages
  useEffect(() => {
    const categoryValues = Object.values(categories);
    const filledCount = categoryValues.filter(v => v > 0).length;
    const allFilled = filledCount === categoryValues.length && categoryValues.length > 0;

    // Compute average rating from all category ratings when available
    if (filledCount > 0) {
      const average = categoryValues.reduce((sum, v) => sum + v, 0) / categoryValues.length;
      const roundedAverage = Math.round(average * 10) / 10;
      setRating(roundedAverage);
    } else {
      setRating(0);
    }

    // Progress: 50% when all categories filled, +50% when review has minimum length
    let completed = 0;
    if (allFilled) completed += 1;
    if (review.trim().length >= 10) completed += 1;
    setProgress((completed / 2) * 100);
  }, [review, categories]);

  const handleCategoryChange = (category, value) => {
    setCategories(prev => ({ ...prev, [category]: value }));
    setErrors(prev => ({ ...prev, categories: null }));
  };

  const handleReviewChange = (e) => {
    setReview(e.target.value);
    setErrors(prev => ({ ...prev, review: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Require all category ratings to be provided
    if (!Object.values(categories).every(cat => cat > 0)) {
      newErrors.categories = 'Please rate all categories';
    }

    if (!review.trim()) {
      newErrors.review = 'Please write a review';
    } else if (review.trim().length < 10) {
      newErrors.review = 'Review must be at least 10 characters long';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Validate that we have all required data
    if (!sessionData) {
      setErrors({ submit: 'Session data is missing. Please try again.' });
      return;
    }

    if (!educator || !packageData) {
      setErrors({ submit: 'Required information is missing. Please try again.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        educatorId: educator._id || educator,
        packageId: packageData._id || packageData,
        sessionId: sessionData._id,
        overallRating: rating,
        review: review.trim(),
        categories,
        sessionDate: sessionData.date,
        packageTitle: packageData.title || packageData,
        educatorName: educator.username || educator,
        bookingId: sessionData.bookingId,
        sessionIndex: sessionData.sessionIndex
      };

      console.log('Submitting review data:', reviewData);
      await onSubmitReview(reviewData);
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error submitting review:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit review. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setRating(0);
    setReview('');
    setCategories({
      overallExperience: 0,
      teachingQuality: 0,
      communication: 0,
      punctuality: 0,
      valueForMoney: 0
    });
    setErrors({});
    setProgress(0);
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
      resetForm();
    }
  };

  const getRatingEmoji = (rating) => {
    if (rating >= 4.5) return '🌟';
    if (rating >= 4.0) return '⭐';
    if (rating >= 3.5) return '👍';
    if (rating >= 3.0) return '😐';
    if (rating >= 2.0) return '😕';
    if (rating > 0) return '😞';
    return '';
  };

  const categoryLabels = {
    overallExperience: 'Overall Experience',
    teachingQuality: 'Teaching Quality',
    communication: 'Communication',
    punctuality: 'Punctuality',
    valueForMoney: 'Value for Money'
  };

  if (!isOpen) return null;

  // Don't render if required data is missing
  if (!educator || !packageData || !sessionData) {
    console.error('ReviewModal: Missing required data', { educator, packageData, sessionData });
    return null;
  }

  return (
    <div className="review-modal-overlay" onClick={handleClose}>
      <div className="review-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="header-content">
            <h2>Rate Your Session</h2>
            <p className="header-subtitle">Share your experience to help others</p>
          </div>
          <button className="close-btn" onClick={handleClose} disabled={isSubmitting}>
            <FaTimes />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="progress-container">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }}></div>
          </div>
          <span className="progress-text">{Math.round(progress)}% Complete</span>
        </div>

        <form onSubmit={handleSubmit} className="modal-content">
          {/* Overall Rating (computed) */}
          <div className="rating-section">
            <h3>Overall Rating</h3>
            <div className="star-rating-container">
              <RatingStars
                rating={rating}
                interactive={false}
                onRatingChange={() => {}}
                size="large"
                showNumber={false}
                variant="detailed"
              />
              {rating > 0 && (
                <div className="rating-feedback">
                  <span className="rating-emoji">{getRatingEmoji(rating)}</span>
                  <span className="rating-text">
                    {rating >= 4.5 ? 'Excellent' : 
                     rating >= 4.0 ? 'Very Good' : 
                     rating >= 3.5 ? 'Good' : 
                     rating >= 3.0 ? 'Average' : 
                     rating >= 2.0 ? 'Poor' : 'Very Poor'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Detailed Ratings */}
          <div className="detailed-ratings">
            <h3>Rate Different Aspects</h3>
            <p className="section-description">Rate each aspect of your experience</p>
            
            {Object.entries(categoryLabels).map(([key, label]) => (
              <div key={key} className="rating-category">
                <label>{label}</label>
                <div className="category-rating">
                  <RatingStars
                    rating={categories[key]}
                    interactive={true}
                    onRatingChange={(value) => handleCategoryChange(key, value)}
                    size="medium"
                    showNumber={false}
                    variant="minimal"
                  />
                  {categories[key] > 0 && (
                    <span className="category-emoji">{getRatingEmoji(categories[key])}</span>
                  )}
                </div>
              </div>
            ))}
            
            {errors.categories && (
              <div className="error-message">
                <FaExclamationTriangle />
                {errors.categories}
              </div>
            )}
          </div>

          {/* Written Review */}
          <div className="review-section">
            <h3>Write Your Review</h3>
            <p className="section-description">Share your experience with this educator</p>
            <div className="textarea-container">
              <textarea
                value={review}
                onChange={handleReviewChange}
                placeholder="What went well? What could be improved? Share your thoughts about the session..."
                rows={4}
                maxLength={500}
                className={errors.review ? 'error' : ''}
              />
              <div className="textarea-footer">
                <div className="character-count">
                  {review.length}/500 characters
                </div>
                {review.length >= 10 && (
                  <div className="validation-check">
                    <FaCheckCircle />
                    <span>Minimum length met</span>
                  </div>
                )}
              </div>
            </div>
            {errors.review && (
              <div className="error-message">
                <FaExclamationTriangle />
                {errors.review}
              </div>
            )}
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="error-message submit-error">
              <FaExclamationTriangle />
              {errors.submit}
            </div>
          )}
        </form>

        <div className="modal-footer">
          <button 
            className="cancel-btn" 
            onClick={handleClose}
            disabled={isSubmitting}
            type="button"
          >
            Cancel
          </button>
          <button 
            className="submit-btn" 
            onClick={handleSubmit}
            disabled={isSubmitting || progress < 100}
            type="submit"
          >
            {isSubmitting ? (
              <>
                <div className="spinner"></div>
                Submitting...
              </>
            ) : (
              <>
                <FaCheckCircle />
                Submit Review
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
