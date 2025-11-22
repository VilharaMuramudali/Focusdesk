import React, { useEffect, useState } from "react";
import logActivity from '../../../utils/logActivity';
import newRequest from '../../../utils/newRequest';
import getCurrentUser from '../../../utils/getCurrentUser';
import HeaderBanner from './HomeComponents/HeaderBanner';
import InterestTags from './HomeComponents/InterestTags';
import RecommendedCourses from './HomeComponents/RecommendedCourses';
import RecommendedPackages from './HomeComponents/RecommendedPackages';
import './home.scss';

export default function HomeOverview({ onPreferencesUpdate, refreshKey, onEditPreferences }) {
  // User state
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Recommendations state
  const [recommendedTutors, setRecommendedTutors] = useState([]);
  const [workPlan, setWorkPlan] = useState([]);
  const [topSubjects, setTopSubjects] = useState([]);
  const [recommendedPackages, setRecommendedPackages] = useState([]);

  // Ref for InterestTags component
  const interestTagsRef = React.useRef();

  useEffect(() => {
    // Fetch current user details
    fetchCurrentUser();
    
    // Log home view
    logActivity({ type: 'view_home' });
    
    // Track user behavior for personalization
    trackUserBehavior();
    
    // Fetch personalized recommendations
    fetchPersonalizedRecommendations();
  }, []);

  // Refresh recommendations when refreshKey changes (e.g., after updating preferences)
  useEffect(() => {
    if (refreshKey) {
      fetchPersonalizedRecommendations();
    }
  }, [refreshKey]);

  // Track user behavior for better personalization
  const trackUserBehavior = async () => {
    try {
      // Track dashboard view
      await newRequest.post('/recommend/track', {
        interactionType: 'dashboard_view',
        recommendationSource: 'home_overview'
      });
    } catch (error) {
      console.error('Error tracking user behavior:', error);
    }
  };

  // Fetch personalized recommendations
  const fetchPersonalizedRecommendations = async () => {
    try {
      // Get ML-powered personalized package recommendations
      const response = await newRequest.get('/recommend/personalized?limit=10');
      if (response.data.success && response.data.data.recommendations) {
        console.log('ML Recommendations loaded:', response.data.data.recommendations.length);
        setRecommendedPackages(response.data.data.recommendations || []);
      }
      
      // Fallback defaults
      setRecommendedTutors([]);
      setTopSubjects(['Mathematics', 'Science', 'English']);
      setWorkPlan([]);
    } catch (error) {
      console.error('Error fetching personalized recommendations:', error);
      setRecommendedTutors([]);
      setTopSubjects(['Mathematics', 'Science', 'English']);
      setWorkPlan([]);
      setRecommendedPackages([]);
    }
  };

  // Reset image loading state when user changes
  useEffect(() => {
    if (currentUser) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [currentUser?.img]);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };

  // Get user's top subject for the motivational message
  const getTopSubject = () => {
    if (topSubjects && topSubjects.length > 0) {
      return topSubjects[0];
    }
    // Try to get from user's subjects
    if (currentUser?.subjects && currentUser.subjects.length > 0) {
      return currentUser.subjects[0];
    }
    return 'Mathematics'; // Default fallback
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

  // Function to refresh preferences in InterestTags
  const refreshPreferences = () => {
    if (interestTagsRef.current) {
      interestTagsRef.current.refreshPreferences();
    }
    // Notify parent component about preference update
    if (onPreferencesUpdate) {
      onPreferencesUpdate();
    }
  };

  if (loading) {
    return (
      <div className="home-overview">
        <div className="container">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading your dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-overview">
      <div className="container">
        {/* Header Banner */}
        <HeaderBanner 
          currentUser={currentUser}
          getTopSubject={getTopSubject}
          getImageUrl={getImageUrl}
          imageLoading={imageLoading}
          imageError={imageError}
          handleImageLoad={handleImageLoad}
          handleImageError={handleImageError}
        />

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div className="left-column">
            <InterestTags ref={interestTagsRef} topSubjects={topSubjects} refreshKey={refreshKey} onEditPreferences={onEditPreferences} />
            <RecommendedPackages 
              getImageUrl={getImageUrl}
              handleImageLoad={handleImageLoad}
              handleImageError={handleImageError}
            />
          </div>

          {/* Right Column */}
          <div className="right-column">
            <RecommendedCourses 
              getImageUrl={getImageUrl}
              handleImageLoad={handleImageLoad}
              handleImageError={handleImageError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
