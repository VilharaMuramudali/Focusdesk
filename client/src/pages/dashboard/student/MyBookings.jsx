import React, { useState, useEffect } from 'react';
import { FaCalendarAlt, FaClock, FaUser, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import newRequest from '../../../utils/newRequest';
import './MyBookings.scss';

function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);

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
    </div>
  );
}

export default MyBookings; 