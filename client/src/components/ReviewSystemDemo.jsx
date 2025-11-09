import React, { useState } from 'react';
import ReviewModal from './ReviewModal';
import RatingStars from './RatingStars';
import LoadingSpinner from './LoadingSpinner';
import './ReviewSystemDemo.scss';

const ReviewSystemDemo = () => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);

  // Mock data for demonstration
  const mockEducator = {
    _id: 'educator123',
    username: 'Dr. Sarah Johnson',
    img: '/img/noavatar.jpg',
    subjects: ['Mathematics', 'Physics'],
    rating: 4.8,
    totalReviews: 127
  };

  const mockPackage = {
    _id: 'package123',
    title: 'Advanced Calculus Tutoring',
    description: 'Comprehensive calculus tutoring package with 10 sessions',
    price: 60,
    subjects: ['Mathematics', 'Calculus'],
    level: 'advanced',
    sessions: 10
  };

  const mockSession = {
    _id: 'session123',
    date: '2024-01-15',
    time: '10:00 AM',
    duration: 60,
    status: 'completed',
    topic: 'Derivatives and Limits'
  };

  const mockReviews = [
    {
      _id: 'review1',
      studentId: { username: 'Alex Chen', img: '/img/noavatar.jpg' },
      overallRating: 5,
      review: 'Excellent teaching! Dr. Johnson made complex calculus concepts easy to understand.',
      categories: {
        overallExperience: 5,
        teachingQuality: 5,
        communication: 5,
        punctuality: 5,
        valueForMoney: 5
      },
      createdAt: '2024-01-15T10:30:00Z'
    },
    {
      _id: 'review2',
      studentId: { username: 'Maria Garcia', img: '/img/noavatar.jpg' },
      overallRating: 4,
      review: 'Very good session. The explanations were clear and helpful.',
      categories: {
        overallExperience: 4,
        teachingQuality: 4,
        communication: 5,
        punctuality: 4,
        valueForMoney: 4
      },
      createdAt: '2024-01-14T14:20:00Z'
    },
    {
      _id: 'review3',
      studentId: { username: 'John Smith', img: '/img/noavatar.jpg' },
      overallRating: 5,
      review: 'Amazing tutor! Highly recommend for anyone struggling with calculus.',
      categories: {
        overallExperience: 5,
        teachingQuality: 5,
        communication: 4,
        punctuality: 5,
        valueForMoney: 5
      },
      createdAt: '2024-01-13T09:15:00Z'
    }
  ];

  const handleReviewSession = () => {
    setSelectedSession({
      ...mockSession,
      educator: mockEducator,
      package: mockPackage
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData) => {
    console.log('Review submitted:', reviewData);
    // In a real app, this would call the API
    alert('Review submitted successfully! Check the console for review data.');
    setShowReviewModal(false);
  };

  const calculateAverageRating = () => {
    const total = mockReviews.reduce((sum, review) => sum + review.overallRating, 0);
    return (total / mockReviews.length).toFixed(1);
  };

  return (
    <div className="review-system-demo">
      <div className="demo-header">
        <h1>🌟 Review & Rating System Demo</h1>
        <p>Complete review and rating functionality for the tutoring platform</p>
      </div>

      <div className="demo-sections">
        {/* Rating Display Demo */}
        <div className="demo-section">
          <h2>📊 Rating Display Components</h2>
          <div className="rating-showcase">
            <div className="rating-item">
              <h3>Small Rating</h3>
              <RatingStars rating={4.8} showNumber={true} size="small" showCount={true} reviewCount={127} />
            </div>
            <div className="rating-item">
              <h3>Medium Rating</h3>
              <RatingStars rating={4.2} showNumber={true} size="medium" showCount={true} reviewCount={89} />
            </div>
            <div className="rating-item">
              <h3>Large Rating</h3>
              <RatingStars rating={3.7} showNumber={true} size="large" showCount={true} reviewCount={45} />
            </div>
            <div className="rating-item">
              <h3>No Ratings</h3>
              <RatingStars rating={0} showNumber={true} size="medium" showCount={true} reviewCount={0} />
            </div>
          </div>
        </div>

        {/* Package Card Demo */}
        <div className="demo-section">
          <h2>📦 Package Card with Ratings</h2>
          <div className="package-card-demo">
            <div className="package-card">
              <div className="package-header">
                <img src={mockEducator.img} alt={mockEducator.username} className="educator-avatar" />
                <div className="package-info">
                  <h3>{mockPackage.title}</h3>
                  <p className="educator-name">{mockEducator.username}</p>
                  <RatingStars 
                    rating={parseFloat(calculateAverageRating())} 
                    showNumber={true} 
                    size="small" 
                    showCount={true} 
                    reviewCount={mockReviews.length} 
                  />
                </div>
              </div>
              <div className="package-details">
                <p className="description">{mockPackage.description}</p>
                <div className="package-meta">
                  <span className="subjects">{mockPackage.subjects.join(', ')}</span>
                  <span className="level">{mockPackage.level}</span>
                  <span className="sessions">{mockPackage.sessions} sessions</span>
                </div>
                <div className="package-price">
                  <span className="price">${mockPackage.price}</span>
                  <span className="unit">/hour</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Reviews List Demo */}
        <div className="demo-section">
          <h2>💬 Reviews Display</h2>
          <div className="reviews-list">
            {mockReviews.map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <img src={review.studentId.img} alt={review.studentId.username} className="student-avatar" />
                  <div className="review-meta">
                    <h4>{review.studentId.username}</h4>
                    <RatingStars rating={review.overallRating} showNumber={true} size="small" />
                    <span className="review-date">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="review-content">
                  <p>{review.review}</p>
                  <div className="review-categories">
                    {Object.entries(review.categories).map(([category, rating]) => (
                      <div key={category} className="category-rating">
                        <span className="category-name">{category.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <RatingStars rating={rating} showNumber={false} size="small" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Modal Demo */}
        <div className="demo-section">
          <h2>✍️ Review Submission</h2>
          <div className="review-submission-demo">
            <div className="session-card">
              <div className="session-info">
                <h3>Completed Session</h3>
                <p><strong>Date:</strong> {mockSession.date}</p>
                <p><strong>Time:</strong> {mockSession.time}</p>
                <p><strong>Duration:</strong> {mockSession.duration} minutes</p>
                <p><strong>Topic:</strong> {mockSession.topic}</p>
                <p><strong>Educator:</strong> {mockEducator.username}</p>
                <p><strong>Package:</strong> {mockPackage.title}</p>
              </div>
              <button className="review-btn" onClick={handleReviewSession}>
                Rate This Session
              </button>
            </div>
          </div>
        </div>

        {/* Loading States Demo */}
        <div className="demo-section">
          <h2>⏳ Loading States</h2>
          <div className="loading-showcase">
            <div className="loading-item">
              <h3>Loading Reviews</h3>
              <LoadingSpinner size="small" text="Loading reviews..." variant="primary" />
            </div>
            <div className="loading-item">
              <h3>Submitting Review</h3>
              <LoadingSpinner size="medium" text="Submitting your review..." variant="success" />
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedSession && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSession(null);
          }}
          educator={selectedSession.educator}
          packageData={selectedSession.package}
          sessionData={selectedSession}
          onSubmitReview={handleSubmitReview}
        />
      )}
    </div>
  );
};

export default ReviewSystemDemo;
