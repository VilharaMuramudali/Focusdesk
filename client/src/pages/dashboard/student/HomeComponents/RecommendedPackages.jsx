import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaStarHalfAlt, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import newRequest from '../../../../utils/newRequest';
import './RecommendedPackages.scss';

const RecommendedPackages = ({ getImageUrl, handleImageLoad, handleImageError }) => {
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [animating, setAnimating] = useState(false);
  const packagesPerPage = 3;

  useEffect(() => {
    fetchRecommendedPackages();
    
    const handleFocus = () => {
      fetchRecommendedPackages();
    };
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const fetchRecommendedPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await newRequest.get('/packages/recommended');
      
      if (response.data.packages && response.data.packages.length > 0) {
        setPackages(response.data.packages);
      } else {
        setPackages([]);
      }
    } catch (err) {
      console.error('Error fetching recommended packages:', err);
      setError('Failed to load recommendations');
      setPackages([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePackageClick = async (packageId) => {
    try {
      await newRequest.post('/recommend/track', {
        packageId,
        interactionType: 'click',
        recommendationSource: 'home_overview'
      });
      
      navigate(`/package/${packageId}`);
    } catch (error) {
      console.error('Error tracking package click:', error);
      navigate(`/package/${packageId}`);
    }
  };

  // Helper function to get the correct profile picture URL
  const getProfilePictureUrl = (tutor) => {
    if (!tutor) return '/img/default-avatar.png';
    
    const profilePic = tutor.profilePicture || tutor.img || tutor.avatar || tutor.picture;
    
    if (!profilePic) return '/img/default-avatar.png';
    
    // If it's already a full URL (starts with http:// or https://)
    if (profilePic.startsWith('http://') || profilePic.startsWith('https://')) {
      return profilePic;
    }
    
    // If it's a relative path, construct the full URL
    // Remove leading slash if present to avoid double slashes
    const cleanPath = profilePic.startsWith('/') ? profilePic.substring(1) : profilePic;
    
    // Use the base URL from your API configuration
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8800';
    return `${baseUrl}/${cleanPath}`;
  };

  // Helper function to get package image URL
  const getPackageImageUrl = (pkg) => {
    const image = pkg.image || pkg.thumbnail || pkg.cover;
    
    if (!image) return '/img/course-default.jpg';
    
    if (image.startsWith('http://') || image.startsWith('https://')) {
      return image;
    }
    
    const cleanPath = image.startsWith('/') ? image.substring(1) : image;
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8800';
    return `${baseUrl}/${cleanPath}`;
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`full-${i}`} className="star" />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" className="star half" />);
    }

    return stars;
  };

  const totalPages = Math.ceil(packages.length / packagesPerPage);
  const startIndex = (currentPage - 1) * packagesPerPage;
  const currentPackages = packages.slice(startIndex, startIndex + packagesPerPage);

  const handlePrevPage = () => {
    if (animating) return;
    setAnimating(true);
    setCurrentPage(prev => Math.max(1, prev - 1));
    setTimeout(() => setAnimating(false), 300);
  };

  const handleNextPage = () => {
    if (animating) return;
    setAnimating(true);
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
    setTimeout(() => setAnimating(false), 300);
  };

  if (loading) {
    return (
      <div className="recommended-packages-section">
        <div className="section-header">
          <h3>Recommended Packages For You</h3>
        </div>
        <div className="packages-container">
          <div className="loading-placeholder">
            <div className="spinner"></div>
            <p>Loading recommendations...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommended-packages-section">
        <div className="section-header">
          <h3>Recommended Packages For You</h3>
        </div>
        <div className="packages-container">
          <div className="error-placeholder">
            <p>{error}</p>
            <button onClick={fetchRecommendedPackages} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (packages.length === 0) {
    return (
      <div className="recommended-packages-section">
        <div className="section-header">
          <h3>Recommended Packages For You</h3>
        </div>
        <div className="packages-container">
          <div className="empty-state">
            <p>No recommendations available at the moment.</p>
            <p className="empty-hint">Add preferences to get personalized recommendations!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="recommended-packages-section">
      <div className="section-header">
        <h3>Recommended Packages For You</h3>
        <div className="pagination-controls">
          <button 
            className="page-arrow prev" 
            onClick={handlePrevPage}
            disabled={currentPage === 1}
          >
            <FaChevronLeft />
          </button>
          <span className="page-number">{String(currentPage).padStart(2, '0')}</span>
          <button 
            className="page-arrow next" 
            onClick={handleNextPage}
            disabled={currentPage === totalPages}
          >
            <FaChevronRight />
          </button>
        </div>
      </div>
      <div className="packages-container">
        <div className={`packages-grid ${animating ? 'animating' : ''}`}>
          {currentPackages.map((pkg) => (
            <div
              key={pkg._id}
              className="package-card"
              onClick={() => handlePackageClick(pkg._id)}
            >
              <div className="package-image">
                <img
                  src={getPackageImageUrl(pkg)}
                  alt={pkg.title}
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    e.target.src = '/img/course-default.jpg';
                    if (handleImageError) handleImageError(e);
                  }}
                />
                <div className="price-badge">
                  Rs.{pkg.price || pkg.rate || '1050'} hr
                </div>
                <div className="language-badges">
                  <span className="language-badge">English</span>
                  <span className="language-badge">Sinhala</span>
                </div>
              </div>
              <div className="package-content">
                <h4 className="package-title">{pkg.title || 'Untitled Package'}</h4>
                <p className="package-description">
                  {pkg.description || pkg.desc || 'No description available'}
                </p>
                
                <div className="package-footer">
                  <img 
                    src={getProfilePictureUrl(pkg.tutor)}
                    alt={pkg.tutor?.username || 'Tutor'}
                    className="tutor-avatar"
                    onError={(e) => {
                      console.log('Profile picture failed to load, using default');
                      e.target.src = '/img/default-avatar.png';
                    }}
                  />
                  <div className="tutor-info">
                    <span className="tutor-name">
                      {pkg.tutor?.username || pkg.tutor?.name || 'Ms. Rebbeca Peterez'}
                    </span>
                    <div className="rating-info">
                      <div className="stars">
                        {renderStars(pkg.rating || 4.8)}
                      </div>
                      <span className="rating-value">
                        {pkg.rating ? pkg.rating.toFixed(1) : '4.8'}
                      </span>
                    </div>
                  </div>
                  <button 
                    className="view-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePackageClick(pkg._id);
                    }}
                  >
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RecommendedPackages;
