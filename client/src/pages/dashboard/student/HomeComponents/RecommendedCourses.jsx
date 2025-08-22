import React, { useState, useEffect, useMemo } from 'react';
import newRequest from '../../../../utils/newRequest';

const RecommendedCourses = ({ getImageUrl, handleImageLoad, handleImageError }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookedSessions, setBookedSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetchBookedSessions();
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Clear any pending state updates
      setBookedSessions([]);
      setLoading(false);
      setError(null);
    };
  }, []);

  const fetchBookedSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get current month and year for the API call
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      const response = await newRequest.get(`/bookings/student-sessions?month=${currentMonth}&year=${currentYear}`);
      
      if (response.data.success) {
        // Transform the API data to match our component structure
        const sessions = response.data.bookings.map(booking => ({
          id: booking._id,
          date: new Date(booking.sessionDate),
          time: new Date(booking.sessionDate).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          duration: `${booking.duration || 60} minutes`,
          subject: booking.package?.title || 'Session',
          instructor: booking.tutor?.username || 'Instructor',
          instructorImg: booking.tutor?.img || null,
          package: booking.package,
          status: booking.status
        }));
        setBookedSessions(sessions);
      } else {
        setError('Failed to load sessions');
      }
    } catch (error) {
      console.error('Error fetching booked sessions:', error);
      setError('Failed to load sessions');
      setBookedSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Memoize expensive calculations
  const sortedSessions = useMemo(() => {
    return [...bookedSessions].sort((a, b) => a.date - b.date);
  }, [bookedSessions]);

  // Memoize calendar days calculation
  const calendarDays = useMemo(() => {
    const days = [];
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentDate]);

  // Get current month and year
  const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
  const currentYear = currentDate.getFullYear();

  // Check if a date has a booked session
  const hasBookedSession = (day) => {
    if (!day) return false;
    const checkDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    return bookedSessions.some(session => 
      session.date.getDate() === checkDate.getDate() &&
      session.date.getMonth() === checkDate.getMonth() &&
      session.date.getFullYear() === checkDate.getFullYear()
    );
  };

  // Check if date is today
  const isToday = (day) => {
    if (!day) return false;
    const today = new Date();
    return day === today.getDate() && 
           currentDate.getMonth() === today.getMonth() && 
           currentDate.getFullYear() === today.getFullYear();
  };

  // Navigate to previous month
  const prevMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
    setCurrentDate(newDate);
    // Fetch sessions for the new month
    setTimeout(() => fetchBookedSessions(), 100);
  };

  // Navigate to next month
  const nextMonth = () => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
    setCurrentDate(newDate);
    // Fetch sessions for the new month
    setTimeout(() => fetchBookedSessions(), 100);
  };

  if (loading) {
    return (
      <div className="recommended-courses-section">
        <div className="section-header">
          <h3>Up Next Schedules</h3>
        </div>
        <div className="loading-placeholder">Loading schedules...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="recommended-courses-section">
        <div className="section-header">
          <h3>Up Next Schedules</h3>
        </div>
        <div className="error-placeholder">
          <p>{error}</p>
          <button onClick={fetchBookedSessions} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="recommended-courses-section">
      <div className="section-header">
        <h3>Up Next Schedules</h3>
      </div>
      
      {/* Calendar Component */}
      <div className="calendar-container">
        <div className="calendar-header">
          <div className="month-selector">
            <span className="month-year">{currentMonth} {currentYear}</span>
            <span className="dropdown-arrow">▼</span>
          </div>
          <div className="calendar-nav">
            <button className="nav-btn" onClick={prevMonth}>&lt;</button>
            <button className="nav-btn" onClick={nextMonth}>&gt;</button>
          </div>
        </div>
        
        <div className="calendar-grid">
          {/* Days of week header */}
          <div className="days-header">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
              <div key={index} className="day-header">{day}</div>
            ))}
          </div>
          
          {/* Calendar days */}
          <div className="days-grid">
            {calendarDays.map((day, index) => (
              <div 
                key={index} 
                className={`calendar-day ${!day ? 'empty' : ''} ${isToday(day) ? 'today' : ''} ${hasBookedSession(day) ? 'has-session' : ''}`}
              >
                {day}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="sessions-list">
        {sortedSessions.length === 0 ? (
          <div className="no-sessions">
            <p>No upcoming sessions scheduled for {currentMonth} {currentYear}</p>
          </div>
        ) : (
          sortedSessions.map((session) => (
            <div key={session.id} className="session-item">
              <div className="session-time">
                <div className="session-date">
                  {session.date.getDate()} {session.date.toLocaleString('default', { month: 'short' }).toUpperCase()}
                </div>
                <div className="session-time-hour">{session.time}</div>
              </div>
              <div className="session-divider"></div>
              <div className="session-details">
                <div className="session-duration">{session.duration}</div>
                <div className="session-subject">{session.subject}</div>
                <div className="session-status">
                  <span className={`status-badge ${session.status}`}>
                    {session.status === 'pending' ? 'Pending' : 'Confirmed'}
                  </span>
                </div>
              </div>
              <div className="session-avatar">
                <img 
                  src={session.instructorImg ? getImageUrl(session.instructorImg) : null}
                  alt={session.instructor}
                  onLoad={handleImageLoad}
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=' + session.instructor.charAt(0);
                  }}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecommendedCourses;
