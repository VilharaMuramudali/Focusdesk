import React, { useState, useEffect } from "react";
import { FaCalendarAlt, FaClock, FaUser, FaCheck, FaTimes, FaEye } from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import VideoCall from '../../../components/VideoCall';
import LoadingSpinner from '../../../components/LoadingSpinner';

export default function SchedulesSection() {
  const [profile, setProfile] = useState({
    timeSlots: []
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [videoCallBooking, setVideoCallBooking] = useState(null);
  const userId = localStorage.getItem('currentUserId'); // Adjust as needed for your auth

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching educator data for all bookings");
        
        const [profileResponse, bookingsResponse] = await Promise.all([
          newRequest.get("/profiles/educator"),
          newRequest.get("/bookings/educator")
        ]);
        
        console.log("Profile response:", profileResponse.data);
        console.log("Bookings response:", bookingsResponse.data);
        
        setProfile({
          timeSlots: profileResponse.data.profile?.timeSlots || []
        });
        setBookings(bookingsResponse.data || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching data:", err);
        setLoading(false);
        // Set default values if API fails
        setProfile({ timeSlots: [] });
        setBookings([]);
      }
    };
    fetchData();
  }, []);

  // Sort bookings by creation date (latest first)
  useEffect(() => {
    const sorted = bookings.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });
    
    setFilteredBookings(sorted);
  }, [bookings]);

  const handleStatusUpdate = async (bookingId, newStatus) => {
    setUpdatingBookingId(bookingId);
    setUpdateError(null);
    try {
      console.log(`Updating booking ${bookingId} to status: ${newStatus}`);
      
      const response = await newRequest.put(`/bookings/${bookingId}/status`, { 
        status: newStatus 
      });
      
      console.log("Status update response:", response.data);
      
      // Refresh bookings
      const bookingsResponse = await newRequest.get("/bookings/educator");
      setBookings(bookingsResponse.data || []);
      
      console.log("Updated bookings:", bookingsResponse.data);
    } catch (err) {
      console.error("Error updating booking status:", err);
      setUpdateError(err.response?.data?.message || 'Failed to update booking status. Please try again.');
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

  const formatCreatedAt = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
  };



  if (loading) {
    return (
      <div className="ed-schedules">
        <div className="loading-container">
          <LoadingSpinner 
            size="large" 
            text="Loading all package requests..." 
            variant="primary" 
          />
        </div>
      </div>
    );
  }

  return (
    <div className="ed-schedules">

      <div className="bookings-section">
        <h4>All Package Requests</h4>
        
        {/* Booking Statistics */}
        <div className="booking-stats">
          <div className="stat-card">
            <div className="stat-number">{filteredBookings.length}</div>
            <div className="stat-label">Total Requests</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{filteredBookings.filter(b => b.status === 'pending').length}</div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{filteredBookings.filter(b => b.status === 'confirmed').length}</div>
            <div className="stat-label">Confirmed</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{filteredBookings.filter(b => b.status === 'completed').length}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        
        {updateError && <div className="error-message">{updateError}</div>}
        
                 {filteredBookings.length === 0 ? (
           <div className="no-bookings">
             <p>No bookings found</p>
             <p style={{ fontSize: '12px', color: '#666' }}>
               No students have booked sessions yet, or there might be an issue with the booking system.
             </p>
           </div>
        ) : (
          <div className="bookings-list">
            {filteredBookings.map((booking, index) => (
              <div key={booking._id} className="booking-card">
                {index === 0 && (
                  <div className="latest-indicator">
                    <span>Latest Request</span>
                  </div>
                )}
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
                        <small className="created-at">
                          Requested {formatCreatedAt(booking.createdAt)}
                        </small>
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
                                     {/* Start Session button for confirmed bookings */}
                   {booking.status === 'confirmed' && (
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
