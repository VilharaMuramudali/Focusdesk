import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaCheck, FaTimes, FaEye, FaComment } from 'react-icons/fa';
import newRequest from '../../../utils/newRequest';
import ReviewModal from '../../../components/ReviewModal';
import { useNotifications } from '../../../hooks/useNotifications';
import './MyBookings.scss';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedSessionForReview, setSelectedSessionForReview] = useState(null);
  
  const { showSuccessNotification, showErrorNotification } = useNotifications();

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await newRequest.get('/bookings/student');
      setBookings(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      setError('Failed to load bookings');
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const isSessionCompleted = (session) => {
    const now = new Date();
    
    // Create session start time by combining date and time
    const sessionStart = new Date(session.date);
    const [hours, minutes] = session.time.split(':');
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Calculate session end time by adding duration
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + (session.duration || 60));
    
    // Session is completed if current time is after session end time
    return now > sessionEnd;
  };

  const isBookingCompleted = (booking) => {
    return booking.status === 'completed' || 
           booking.sessions.every(session => isSessionCompleted(session));
  };

  const handleReviewSession = (session, booking, sessionIndex) => {
    setSelectedSessionForReview({
      ...session,
      _id: `${booking._id}_session_${sessionIndex}`, // Create unique session ID
      educator: booking.educatorId,
      package: booking.packageId,
      bookingId: booking._id,
      sessionIndex: sessionIndex
    });
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData) => {
    try {
      // Validate required fields
      if (!reviewData.educatorId || !reviewData.packageId || !reviewData.sessionId) {
        throw new Error('Missing required review data');
      }

      console.log('Submitting review data:', reviewData);
      const response = await newRequest.post('/reviews/submit', reviewData);
      console.log('Review submission response:', response.data);
      showSuccessNotification('Review submitted successfully!');
      
      // Refresh bookings to update review status
      const bookingsResponse = await newRequest.get('/bookings/student');
      setBookings(bookingsResponse.data);
      
      // Notify app to refresh package ratings wherever displayed
      try {
        window.dispatchEvent(new CustomEvent('package-review-submitted', { detail: { packageId: reviewData.packageId } }));
      } catch (e) {
        console.warn('Could not dispatch package-review-submitted event:', e);
      }
      
      // Force refresh package ratings (for testing)
      try {
        const refreshResponse = await newRequest.get(`/packages/${reviewData.packageId}/refresh-ratings`);
        console.log('Package ratings refreshed:', refreshResponse.data);
      } catch (refreshError) {
        console.log('Could not refresh package ratings:', refreshError);
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      console.error('Error response:', error.response?.data);
      showErrorNotification(error.response?.data?.message || 'Failed to submit review');
      throw error;
    }
  };

  if (loading) {
    return <div className="loading-container">Loading your bookings...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="my-bookings">
      <div className="bookings-header">
        <h2>My Bookings</h2>
        <p>View and manage your learning sessions</p>
      </div>

      {bookings.length === 0 ? (
        <div className="no-bookings">
          <div className="no-bookings-content">
            <FaCalendarAlt className="no-bookings-icon" />
            <h3>No bookings yet</h3>
            <p>You haven't made any bookings yet. Start by exploring available packages!</p>
          </div>
        </div>
      ) : (
        <div className="bookings-list">
          {bookings.map((booking) => (
            <div key={booking._id} className="booking-card">
              <div className="booking-header">
                <div className="educator-info">
                  <img 
                    src={booking.educatorId?.img || '/img/noavatar.jpg'} 
                    alt={booking.educatorId?.username}
                    className="educator-avatar"
                  />
                  <div>
                    <h4>{booking.packageId?.title}</h4>
                    <p>with {booking.educatorId?.username}</p>
                  </div>
                </div>
                <div className={`status-badge ${booking.status}`}>
                  {booking.status}
                </div>
              </div>

              <div className="booking-details">
                <div className="session-info">
                  <h5>Scheduled Sessions:</h5>
                  {booking.sessions.map((session, index) => (
                    <div key={index} className="session-item">
                      <FaClock />
                      <span>{formatDate(session.date)} at {formatTime(session.time)}</span>
                    </div>
                  ))}
                </div>
                
                <div className="booking-amount">
                  <strong>Total: Rs.{booking.totalAmount}</strong>
                </div>
              </div>

              {booking.studentNotes && (
                <div className="student-notes">
                  <strong>Your Notes:</strong>
                  <p>{booking.studentNotes}</p>
                </div>
              )}

              {booking.educatorNotes && (
                <div className="educator-notes">
                  <strong>Educator Notes:</strong>
                  <p>{booking.educatorNotes}</p>
                </div>
              )}

              <div className="booking-actions">
                <button
                  onClick={() => setSelectedBooking(booking)}
                  className="view-btn"
                >
                  <FaEye /> View Details
                </button>
                
                {/* Show review button for completed bookings */}
                {isBookingCompleted(booking) && (
                  <div className="review-actions">
                    {booking.sessions.map((session, index) => (
                      <button
                        key={index}
                        className="review-btn"
                        onClick={() => handleReviewSession(session, booking, index)}
                      >
                        <FaComment /> Rate Session {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="booking-modal-overlay" onClick={() => setSelectedBooking(null)}>
          <div className="booking-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Booking Details</h4>
              <button onClick={() => setSelectedBooking(null)} className="close-btn">
                <FaTimes />
              </button>
            </div>
            <div className="modal-content">
              <div className="detail-row">
                <strong>Package:</strong> {selectedBooking.packageId?.title}
              </div>
              <div className="detail-row">
                <strong>Educator:</strong> {selectedBooking.educatorId?.username}
              </div>
              <div className="detail-row">
                <strong>Status:</strong> 
                <span className={`status-badge ${selectedBooking.status}`}>
                  {selectedBooking.status}
                </span>
              </div>
              <div className="detail-row">
                <strong>Total Amount:</strong> Rs.{selectedBooking.totalAmount}
              </div>
              <div className="detail-row">
                <strong>Sessions:</strong>
                <div className="sessions-list">
                  {selectedBooking.sessions.map((session, index) => (
                    <div key={index} className="session-detail">
                      {formatDate(session.date)} at {formatTime(session.time)}
                    </div>
                  ))}
                </div>
              </div>
              {selectedBooking.studentNotes && (
                <div className="detail-row">
                  <strong>Your Notes:</strong>
                  <p>{selectedBooking.studentNotes}</p>
                </div>
              )}
              {selectedBooking.educatorNotes && (
                <div className="detail-row">
                  <strong>Educator Notes:</strong>
                  <p>{selectedBooking.educatorNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {showReviewModal && selectedSessionForReview && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setSelectedSessionForReview(null);
          }}
          educator={selectedSessionForReview.educator}
          packageData={selectedSessionForReview.package}
          sessionData={selectedSessionForReview}
          onSubmitReview={handleSubmitReview}
        />
      )}
    </div>
  );
}

export default MyBookings; 