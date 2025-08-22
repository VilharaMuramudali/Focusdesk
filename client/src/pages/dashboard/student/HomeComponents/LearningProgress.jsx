import React, { useState, useEffect } from 'react';
import newRequest from '../../../../utils/newRequest';

const LearningProgress = ({ getImageUrl, handleImageLoad, handleImageError }) => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await newRequest.get('/packages/recommended');
      setPackages(response.data.packages || []);
    } catch (error) {
      console.error('Error fetching recommended packages:', error);
      // Fallback to empty array if API fails
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to render stars based on rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const stars = [];
    
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={`full-${i}`} width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 0L6.18 3.63L10 3.82L7 6.18L8.18 9.82L5 7.5L1.82 9.82L3 6.18L0 3.82L3.82 3.63L5 0Z" fill="#FBCF24"/>
        </svg>
      );
    }
    
    if (hasHalfStar) {
      stars.push(
        <svg key="half" width="10" height="9" viewBox="0 0 10 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M5 0L6.18 3.63L10 3.82L7 6.18L8.18 9.82L5 7.5L1.82 9.82L3 6.18L0 3.82L3.82 3.63L5 0Z" fill="#FBCF24" fillOpacity="0.5"/>
        </svg>
      );
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="learning-progress-section">
              <div className="section-header">
        <h3>Recommended Courses</h3>
      </div>
      <div className="courses-grid">
        <div className="loading-placeholder">Loading courses...</div>
      </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="learning-progress-section">
              <div className="section-header">
        <h3>Recommended Courses</h3>
        {/* <p>Explore courses tailored for you</p> */}
      </div>
      <div className="courses-grid">
        <div className="no-courses-message">No recommended courses available at the moment.</div>
      </div>
      </div>
    );
  }

  return (
    <div className="learning-progress-section">
      <div className="section-header">
        <h3>Recommended Courses</h3>
        {/* <p>Explore courses tailored for you</p> */}
      </div>
             <div className="courses-grid">
         {packages.map((pkg) => (
           <div key={pkg._id} className="course-card">
             {/* Header Image Section with Overlay */}
             <div className="course-image-section">
               <div className="image-background">
                 <img
                   src={getImageUrl(pkg.image)}
                   alt={pkg.title}
                   onLoad={handleImageLoad}
                   onError={handleImageError}
                 />
               </div>
               <div className="image-overlay">
                 <div className="overlay-content">
                   <h4 className="course-title-overlay">{pkg.title}</h4>
                   <p className="course-subtitle-overlay">{pkg.description}</p>
                 </div>
                 <div className="language-tags">
                   {pkg.languages && pkg.languages.map((lang, index) => (
                     <span key={index} className="lang-tag">{lang}</span>
                   ))}
                 </div>
               </div>
             </div>

             {/* Course Details Section */}
             <div className="course-details-section">
               <div className="course-header">
                 <h4 className="course-title">{pkg.title}</h4>
                 <span className="course-price">Rs.{pkg.price} hr</span>
               </div>
               <div className="instructor-section">
                 <div className="instructor-info">
                   <div className="instructor-avatar">
                     <img
                       src={getImageUrl(pkg.tutor?.img)}
                       alt={pkg.tutor?.username}
                       onLoad={handleImageLoad}
                       onError={handleImageError}
                     />
                   </div>
                   <div className="instructor-details">
                     <p className="instructor-name">{pkg.tutor?.username}</p>
                     <div className="rating-section">
                       <div className="stars">{renderStars(pkg.rating)}</div>
                       <span className="rating-value">{pkg.rating}</span>
                     </div>
                   </div>
                 </div>
                 <button className="view-button">View</button>
               </div>
             </div>
           </div>
         ))}
       </div>
    </div>
  );
};

export default LearningProgress;
