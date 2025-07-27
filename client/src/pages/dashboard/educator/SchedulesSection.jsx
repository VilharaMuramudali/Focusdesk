import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaClock, FaUser, FaCheck, FaTimes, FaEye } from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import VideoCall from '../../../components/VideoCall';

export default function SchedulesSection() {
  const [profile, setProfile] = useState({
    timeSlots: []
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [videoCallBooking, setVideoCallBooking] = useState(null);
  const userId = localStorage.getItem('currentUserId'); // Adjust as needed for your auth

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileResponse, bookingsResponse] = await Promise.all([
          newRequest.get("/profiles/educator"),
          newRequest.get(`/bookings/educator?date=${selectedDate}`)
        ]);
        setProfile({
          timeSlots: profileResponse.data.profile.timeSlots || []
        });
        setBookings(bookingsResponse.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedDate]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingBookingId(bookingId);
    setUpdateError(null);
    try {
      await newRequest.put(`/bookings/${bookingId}/status`, { status: newStatus });
      // Refresh bookings
      const response = await newRequest.get(`/bookings/educator?date=${selectedDate}`);
      setBookings(response.data);
    } catch (err) {
      setUpdateError('Failed to update booking status. Please try again.');
      console.error("Error updating booking status:", err);
    } finally {
      setUpdatingBookingId(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
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
    return <div>Loading schedule data...</div>;
  }

  return (
    <div className="ed-schedules">
      <div className="schedule-header">
        <h3>Session Bookings</h3>
        <div className="date-selector">
          <label>Select Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
      </div>

      <div className="bookings-section">
        <h4>Bookings for {formatDate(selectedDate)}</h4>
        {updateError && <div className="error-message">{updateError}</div>}
        {bookings.length === 0 ? (
          <div className="no-bookings">
            <p>No bookings for this date</p>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div key={booking._id} className="booking-card">
                <div className="booking-header">
                  <div className="student-info">
                    <img 
                      src={booking.studentId?.img || '/img/noavatar.jpg'} 
                      alt={booking.studentId?.username}
                      className="student-avatar"
                    />
                    <div>
                      <h5>{booking.studentId?.username}</h5>
                      <p>{booking.packageId?.title}</p>
                    </div>
                  </div>
                  <div className={`status-badge ${booking.status}`}>
                    {booking.status}
                  </div>
                </div>

                <div className="booking-details">
                  <div className="session-info">
                    {booking.sessions.map((session, index) => (
                      <div key={index} className="session-item">
                        <FaClock />
                        <span>{formatTime(session.time)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="booking-amount">
                    <strong>Rs.{booking.totalAmount}</strong>
                  </div>
                </div>

                {booking.studentNotes && (
                  <div className="student-notes">
                    <strong>Student Notes:</strong>
                    <p>{booking.studentNotes}</p>
                  </div>
                )}

                <div className="booking-actions">
                  {booking.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'confirmed')}
                        className="confirm-btn"
                        disabled={updatingBookingId === booking._id}
                      >
                        {updatingBookingId === booking._id ? (
                          <span className="spinner" style={{ marginRight: 6 }}></span>
                        ) : <FaCheck style={{ marginRight: 6 }}/>} Confirm
                      </button>
                      <button
                        onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                        className="cancel-btn"
                        disabled={updatingBookingId === booking._id}
                      >
                        {updatingBookingId === booking._id ? (
                          <span className="spinner" style={{ marginRight: 6 }}></span>
                        ) : <FaTimes style={{ marginRight: 6 }}/>} Cancel
                      </button>
                    </>
                  )}
                  {/* Start Session button for confirmed bookings at the scheduled date */}
                  {booking.status === 'confirmed' && isTodayOrPast(selectedDate) && (
                    <button
                      className="start-session-btn"
                      onClick={() => setVideoCallBooking(booking)}
                    >
                      Start Session
                    </button>
                  )}
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
      </div>

      <div className="calendar-section">
        <h4>My Available Time Slots</h4>
        <div className="ed-calendar">
          {profile.timeSlots.length === 0 ? (
            <p>No time slots configured</p>
          ) : (
            profile.timeSlots.map((slot, idx) => (
              <span className="ed-calendar-slot" key={idx}>{slot}</span>
            ))
          )}
        </div>
      </div>

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
                <strong>Student:</strong> {selectedBooking.studentId?.username}
              </div>
              <div className="detail-row">
                <strong>Package:</strong> {selectedBooking.packageId?.title}
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
                  <strong>Student Notes:</strong>
                  <p>{selectedBooking.studentNotes}</p>
                </div>
              )}
              {selectedBooking.educatorNotes && (
                <div className="detail-row">
                  <strong>Your Notes:</strong>
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
