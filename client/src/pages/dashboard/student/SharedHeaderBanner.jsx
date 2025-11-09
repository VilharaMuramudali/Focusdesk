import React, { useEffect, useState } from 'react';
import getCurrentUser from '../../../utils/getCurrentUser';
import newRequest from '../../../utils/newRequest';

const SharedHeaderBanner = ({ title, subtitle }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      // First, get user from localStorage
      const localUser = getCurrentUser();
      
      if (localUser) {
        // Try to get updated user data from API
        try {
          const response = await newRequest.get('/profiles/user');
          setCurrentUser(response.data.user);
        } catch (apiError) {
          console.log('API fetch failed, using localStorage data:', apiError);
          // If API fails, use localStorage data
          setCurrentUser(localUser);
        }
      } else {
        // No user in localStorage, try to get from API
        try {
          const response = await newRequest.get('/profiles/user');
          setCurrentUser(response.data.user);
        } catch (apiError) {
          console.error('No user data available:', apiError);
          // Fallback to default user
          setCurrentUser({
            username: 'Student',
            img: '/img/noavatar.jpg',
            email: 'student@example.com'
          });
        }
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      // Fallback to default user if everything fails
      setCurrentUser({
        username: 'Student',
        img: '/img/noavatar.jpg',
        email: 'student@example.com'
      });
    }
  };

  // Get server URL for image paths
  const getServerUrl = () => {
    return import.meta.env.VITE_API_URL || "http://localhost:8800";
  };

  // Get correct image URL
  const getImageUrl = (imgPath) => {
    if (!imgPath) return '/img/noavatar.jpg';
    
    // If it's already a full URL (starts with http), use it as is
    if (imgPath.startsWith('http')) {
      return imgPath;
    }
    
    // If it's a relative path, construct the full URL
    return `${getServerUrl()}/${imgPath}`;
  };

  // Handle image load
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  // Handle image error
  const handleImageError = (e) => {
    setImageLoading(false);
    setImageError(true);
    e.target.src = '/img/noavatar.jpg';
  };

  return (
    <div className="header-banner">
      <div className="banner-content">
        <div className="progress-quote">
          <h2>{title || "Welcome to FocusDesk!"}</h2>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="user-section">
          <div className="notification-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="white"/>
            </svg>
          </div>
          <div className="user-info">
            <span className="user-name">{currentUser?.username || 'Student'}</span>
          </div>
          <div className="user-avatar">
            {imageLoading && !imageError && (
              <div className="image-loading">
                <div className="loading-spinner-small"></div>
              </div>
            )}
            <img 
              src={getImageUrl(currentUser?.img)} 
              alt={currentUser?.username || 'Student'} 
              onLoad={handleImageLoad}
              onError={handleImageError}
              style={{ display: imageLoading ? 'none' : 'block' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SharedHeaderBanner;
