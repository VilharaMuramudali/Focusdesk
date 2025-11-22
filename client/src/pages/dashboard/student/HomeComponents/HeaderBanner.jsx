import React, { useEffect, useRef, useState } from 'react';
import { useNotificationContext } from '../../../../context/NotificationContext.jsx';

const HeaderBanner = ({ currentUser, getTopSubject, getImageUrl, imageLoading, imageError, handleImageLoad, handleImageError }) => {
  const { notifications, removeNotification, markAllRead } = useNotificationContext();
  const [showNotificationsPanel, setShowNotificationsPanel] = useState(false);
  const notifIconRef = useRef(null);
  const notifPanelRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifPanelRef.current && !notifPanelRef.current.contains(event.target) && notifIconRef.current && !notifIconRef.current.contains(event.target)) {
        setShowNotificationsPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="header-banner">
      <div className="banner-content">
        <div className="progress-quote">
          <h2>"You're doing great in {getTopSubject()}!"</h2>
        </div>
        <div className="user-section">
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
            <span className="user-name">{currentUser?.fullName || currentUser?.name || currentUser?.username || 'Student'}</span>
          </div>
          <div className="user-avatar">
            {imageLoading && !imageError && (
              <div className="image-loading">
                <div className="loading-spinner-small"></div>
              </div>
            )}
            <img 
              src={getImageUrl(currentUser?.img)} 
              alt={currentUser?.fullName || currentUser?.name || currentUser?.username || 'Student'} 
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

export default HeaderBanner;
