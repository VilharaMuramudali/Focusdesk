import React, { useState, useEffect, useRef } from "react";
import { FaCalendarAlt, FaClock, FaUser, FaEye } from "react-icons/fa";
import newRequest from '../../../utils/newRequest';
import './MySessions.scss';
import VideoCall from '../../../components/VideoCall';

export default function MySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const pollingRef = useRef();
  const [videoCallBooking, setVideoCallBooking] = useState(null);
  const userId = localStorage.getItem('currentUserId'); // Adjust as needed for your auth

  useEffect(() => {
    fetchSessions();
    // Poll every 10 seconds
    pollingRef.current = setInterval(fetchSessions, 10000);
    return () => clearInterval(pollingRef.current);
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await newRequest.get('/bookings/student');
      // Only show confirmed bookings
      const confirmed = response.data.filter(b => b.status === 'confirmed');
      setSessions(confirmed);
      setLoading(false);
    } catch (err) {
      setError('Failed to load sessions');
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

  const isTodayOrPast = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);
    return date <= today;
  };

  if (loading) {
    return <div className="loading-container">Loading your confirmed sessions...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="my-sessions-section">
      <h2>My Confirmed Sessions</h2>
      {sessions.length === 0 ? (
        <div className="no-sessions">
          <FaCalendarAlt className="no-sessions-icon" />
          <h3>No confirmed sessions yet</h3>
          <p>Once a tutor confirms your booking, your sessions will appear here.</p>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((booking) => (
            <div key={booking._id} className="session-card">
              <div className="session-header">
                <div className="tutor-info">
                  <img
                    src={booking.educatorId?.img || '/img/noavatar.jpg'}
                    alt={booking.educatorId?.username}
                    className="tutor-avatar"
                  />
                  <div>
                    <h4>{booking.packageId?.title}</h4>
                    <p>with {booking.educatorId?.username}</p>
                  </div>
                </div>
                <div className="session-status confirmed">Confirmed</div>
              </div>
              <div className="session-details">
                <h5>Scheduled Sessions:</h5>
                {booking.sessions.map((session, idx) => (
                  <div key={idx} className="session-item">
                    <FaClock />
                    <span>{formatDate(session.date)} at {formatTime(session.time)}</span>
                  </div>
                ))}
              </div>
              <div className="session-actions">
                {/* Start Session button for confirmed bookings at the scheduled date */}
                {booking.status === 'confirmed' && isTodayOrPast(booking.sessions[0]?.date) && (
                  <button
                    className="start-session-btn"
                    onClick={() => setVideoCallBooking(booking)}
                  >
                    Start Session
                  </button>
                )}
                <button onClick={() => setSelectedBooking(booking)} className="view-btn">
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
          <div className="booking-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>Session Details</h4>
              <button onClick={() => setSelectedBooking(null)} className="close-btn">×</button>
            </div>
            <div className="modal-content">
              <div className="detail-row">
                <strong>Package:</strong> {selectedBooking.packageId?.title}
              </div>
              <div className="detail-row">
                <strong>Tutor:</strong> {selectedBooking.educatorId?.username}
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
      {/* Video Call Modal */}
      {videoCallBooking && (
        <VideoCall
          roomId={videoCallBooking._id}
          userId={userId}
          onLeave={() => setVideoCallBooking(null)}
        />
      )}
    </div>
  );
} 