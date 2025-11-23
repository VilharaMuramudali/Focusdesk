import React, { useEffect, useState, useContext, useRef } from 'react';
import { FaGlobe, FaChevronDown } from 'react-icons/fa';
import getCurrentUser from '../../../utils/getCurrentUser';
import newRequest from '../../../utils/newRequest';
import { CurrencyContext } from '../../../context/CurrencyContext.jsx';
import { useNotificationContext } from '../../../context/NotificationContext.jsx';

const SharedHeaderBanner = ({ title, subtitle }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const currencyDropdownRef = useRef(null);
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const notifIconRef = useRef(null);
  const notifPanelRef = useRef(null);
  
  // Currency context
  const { currency, setCurrency, SUPPORTED_CURRENCIES, loading: currencyLoading } = useContext(CurrencyContext);
  const { notifications, removeNotification, markAllRead } = useNotificationContext();

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Listen for profile updates from other components (e.g., Settings avatar upload)
  useEffect(() => {
    const handler = (e) => {
      if (e?.detail) {
        setCurrentUser(e.detail);
      } else {
        // fallback: refetch
        fetchCurrentUser();
      }
    };
    window.addEventListener('userProfileUpdated', handler);
    return () => window.removeEventListener('userProfileUpdated', handler);
  }, []);

  // Close currency dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target)) {
        setShowCurrencyDropdown(false);
      }
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target) && notifIconRef.current && !notifIconRef.current.contains(event.target)) {
        setShowNotificationsPanel(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
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
          {/* Currency Selector */}
          <div className="currency-selector-container" ref={currencyDropdownRef}>
            <button 
              className="currency-selector-btn"
              onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              title="Select Currency"
              disabled={currencyLoading}
            >
              <FaGlobe className="currency-icon" />
              <span className="currency-code">
                {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || currency}
              </span>
              <FaChevronDown className={`dropdown-icon ${showCurrencyDropdown ? 'open' : ''}`} />
            </button>
            {showCurrencyDropdown && (
              <div className="currency-dropdown">
                <div className="currency-dropdown-header">
                  <span>Select Currency</span>
                </div>
                <div className="currency-options">
                  {SUPPORTED_CURRENCIES.map((curr) => (
                    <div
                      key={curr.code}
                      className={`currency-option ${currency === curr.code ? 'active' : ''}`}
                      onClick={() => {
                        setCurrency(curr.code);
                        setShowCurrencyDropdown(false);
                      }}
                    >
                      <span className="currency-symbol">{curr.symbol}</span>
                      <span className="currency-code">{curr.code}</span>
                      <span className="currency-name">{curr.name}</span>
                      {currency === curr.code && <span className="check-icon">✓</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="notification-icon" ref={notifIconRef} onClick={() => setShowNotificationsPanel((s) => !s)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C13.1 22 14 21.1 14 20H10C10 21.1 10.9 22 12 22ZM18 16V11C18 7.93 16.37 5.36 13.5 4.68V4C13.5 3.17 12.83 2.5 12 2.5C11.17 2.5 10.5 3.17 10.5 4V4.68C7.64 5.36 6 7.92 6 11V16L4 18V19H20V18L18 16ZM16 17H8V11C8 8.52 9.51 6.5 12 6.5C14.49 6.5 16 8.52 16 11V17Z" fill="white"/>
            </svg>
          </div>
          {showNotificationsPanel && (
            <div className="notifications-panel" ref={notifPanelRef}>
              <div className="notifications-header">
                <strong>Notifications</strong>
                <div className="notifications-actions">
                  <button className="mark-read-btn" onClick={() => { markAllRead(); }}>Mark all read</button>
                </div>
              </div>
              <div className="notifications-list">
                {notifications.length === 0 ? (
                  <div className="no-notifs">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                      <div className="notif-main">
                        <div className="notif-title">{n.title}</div>
                        <div className="notif-time">{new Date(n.timestamp).toLocaleString()}</div>
                      </div>
                      <div className="notif-body">{n.message}</div>
                      <button className="remove-notif" onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}>✕</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
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
