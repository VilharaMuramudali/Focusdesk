import React, { useState } from 'react';
import RatingStars from './RatingStars';
import RatingDisplay from './RatingDisplay';
import ReviewModal from './ReviewModal';
import './RatingSystemDemo.scss';

const RatingSystemDemo = () => {
  const [selectedRating, setSelectedRating] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [demoRating, setDemoRating] = useState(4.2);
  const [demoReviews, setDemoReviews] = useState(15);

  const sampleRatingBreakdown = {
    5: 8,
    4: 4,
    3: 2,
    2: 1,
    1: 0
  };

  const sampleEducator = {
    _id: 'demo-educator',
    username: 'Dr. Sarah Johnson',
    img: '/img/noavatar.jpg'
  };

  const samplePackage = {
    _id: 'demo-package',
    title: 'Advanced Mathematics Package',
    description: 'Comprehensive math tutoring for advanced students'
  };

  const sampleSession = {
    _id: 'demo-session',
    date: new Date().toISOString(),
    bookingId: 'demo-booking',
    sessionIndex: 0
  };

  const handleReviewSubmit = async (reviewData) => {
    console.log('Review submitted:', reviewData);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setShowReviewModal(false);
    alert('Review submitted successfully!');
  };

  return (
    <div className="rating-system-demo">
      <div className="demo-header">
        <h1>🎯 Rating System Showcase</h1>
        <p>Comprehensive rating and review system with modern UI/UX</p>
      </div>

      <div className="demo-sections">
        {/* Interactive Rating Stars */}
        <section className="demo-section">
          <h2>⭐ Interactive Rating Stars</h2>
          <p>Click on the stars to see interactive rating functionality</p>
          
          <div className="demo-grid">
            <div className="demo-item">
              <h3>Small Size</h3>
              <RatingStars 
                rating={selectedRating}
                interactive={true}
                onRatingChange={setSelectedRating}
                size="small"
                showNumber={true}
              />
            </div>
            
            <div className="demo-item">
              <h3>Medium Size</h3>
              <RatingStars 
                rating={selectedRating}
                interactive={true}
                onRatingChange={setSelectedRating}
                size="medium"
                showNumber={true}
              />
            </div>
            
            <div className="demo-item">
              <h3>Large Size</h3>
              <RatingStars 
                rating={selectedRating}
                interactive={true}
                onRatingChange={setSelectedRating}
                size="large"
                showNumber={true}
              />
            </div>
          </div>
        </section>

        {/* Rating Display Components */}
        <section className="demo-section">
          <h2>📊 Rating Display Components</h2>
          <p>Different ways to display rating information</p>
          
          <div className="demo-grid">
            <div className="demo-item">
              <h3>Compact Display</h3>
              <RatingDisplay 
                rating={demoRating}
                totalReviews={demoReviews}
                ratingBreakdown={sampleRatingBreakdown}
                variant="compact"
                showDetails={false}
              />
            </div>
            
            <div className="demo-item">
              <h3>Detailed Display</h3>
              <RatingDisplay 
                rating={demoRating}
                totalReviews={demoReviews}
                ratingBreakdown={sampleRatingBreakdown}
                variant="detailed"
                showDetails={true}
              />
            </div>
            
            <div className="demo-item">
              <h3>Card Style</h3>
              <RatingDisplay 
                rating={demoRating}
                totalReviews={demoReviews}
                ratingBreakdown={sampleRatingBreakdown}
                variant="card"
                showDetails={true}
              />
            </div>
          </div>
        </section>

        {/* Different Rating Values */}
        <section className="demo-section">
          <h2>🌟 Rating Examples</h2>
          <p>How different rating values are displayed</p>
          
          <div className="demo-grid">
            <div className="demo-item">
              <h3>Excellent (4.8)</h3>
              <RatingDisplay 
                rating={4.8}
                totalReviews={25}
                ratingBreakdown={{5: 20, 4: 4, 3: 1, 2: 0, 1: 0}}
                variant="compact"
              />
            </div>
            
            <div className="demo-item">
              <h3>Good (3.7)</h3>
              <RatingDisplay 
                rating={3.7}
                totalReviews={12}
                ratingBreakdown={{5: 5, 4: 4, 3: 2, 2: 1, 1: 0}}
                variant="compact"
              />
            </div>
            
            <div className="demo-item">
              <h3>Average (2.9)</h3>
              <RatingDisplay 
                rating={2.9}
                totalReviews={8}
                ratingBreakdown={{5: 1, 4: 2, 3: 3, 2: 1, 1: 1}}
                variant="compact"
              />
            </div>
            
            <div className="demo-item">
              <h3>No Ratings</h3>
              <RatingDisplay 
                rating={0}
                totalReviews={0}
                ratingBreakdown={{}}
                variant="compact"
              />
            </div>
          </div>
        </section>

        {/* Review Modal Demo */}
        <section className="demo-section">
          <h2>📝 Review Modal</h2>
          <p>Interactive review submission modal</p>
          
          <div className="demo-item">
            <button 
              className="demo-button"
              onClick={() => setShowReviewModal(true)}
            >
              Open Review Modal
            </button>
          </div>
        </section>

        {/* Features Showcase */}
        <section className="demo-section">
          <h2>✨ Features</h2>
          <div className="features-grid">
            <div className="feature-item">
              <h3>🎨 Modern Design</h3>
              <p>Clean, modern UI with smooth animations and gradients</p>
            </div>
            
            <div className="feature-item">
              <h3>📱 Responsive</h3>
              <p>Fully responsive design that works on all devices</p>
            </div>
            
            <div className="feature-item">
              <h3>♿ Accessible</h3>
              <p>WCAG compliant with keyboard navigation and screen reader support</p>
            </div>
            
            <div className="feature-item">
              <h3>🌙 Dark Mode</h3>
              <p>Automatic dark mode support with system preferences</p>
            </div>
            
            <div className="feature-item">
              <h3>⚡ Performance</h3>
              <p>Optimized animations and reduced motion support</p>
            </div>
            
            <div className="feature-item">
              <h3>🎯 Interactive</h3>
              <p>Hover effects, click feedback, and real-time updates</p>
            </div>
          </div>
        </section>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          educator={sampleEducator}
          packageData={samplePackage}
          sessionData={sampleSession}
          onSubmitReview={handleReviewSubmit}
        />
      )}
    </div>
  );
};

export default RatingSystemDemo;
