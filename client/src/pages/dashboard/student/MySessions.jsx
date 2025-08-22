import React, { useState, useEffect, useRef } from "react";
import { FaCalendarAlt, FaClock, FaUser, FaEye, FaStar, FaVideo, FaChalkboardTeacher, FaComments, FaCalendar, FaPlus, FaPaperPlane } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import newRequest from '../../../utils/newRequest';
import { useChat } from '../../../context/ChatContext.jsx';
import { useNotifications } from '../../../hooks/useNotifications';
import { safeSetInterval, debounce } from '../../../utils/memoryUtils';
import SharedHeaderBanner from "./SharedHeaderBanner";
import './MySessions.scss';
import VideoCall from '../../../components/VideoCall';
import "./home.scss";

export default function MySessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const pollingRef = useRef();
  const [videoCallBooking, setVideoCallBooking] = useState(null);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedEducator, setSelectedEducator] = useState(null);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const navigate = useNavigate();
  const { createNewConversation, sendTextMessage } = useChat();
  const { showSuccessNotification, showErrorNotification } = useNotifications();
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const userId = currentUser?._id || localStorage.getItem('currentUserId');
  const userName = currentUser?.username || localStorage.getItem('currentUserName') || 'Student';

  useEffect(() => {
    let isMounted = true;
    
    const fetchSessions = async () => {
      if (!isMounted) return;
      
      try {
        const response = await newRequest.get('/bookings/student');
        if (isMounted) {
          setSessions(response.data);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching sessions:', err);
        if (isMounted) {
          setError('Failed to load sessions');
          setLoading(false);
        }
      }
    };

    fetchSessions();
    
    // Use safe interval with cleanup
    const cleanup = safeSetInterval(fetchSessions, 30000);
    
    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
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

  const formatSessionTime = (session) => {
    const startTime = formatTime(session.time);
    
    // Calculate end time
    const sessionStart = new Date(session.date);
    const [hours, minutes] = session.time.split(':');
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + (session.duration || 60));
    
    const endTime = sessionEnd.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    
    return `${startTime} - ${endTime}`;
  };

  const getSessionStatus = (session) => {
    const now = new Date();
    
    // Create session start and end times
    const sessionStart = new Date(session.date);
    const [hours, minutes] = session.time.split(':');
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + (session.duration || 60));
    
    if (now < sessionStart) {
      return 'upcoming';
    } else if (now >= sessionStart && now <= sessionEnd) {
      return 'ongoing';
    } else {
      return 'completed';
    }
  };

  const getTimeRemaining = (session) => {
    const now = new Date();
    
    // Create session end time
    const sessionStart = new Date(session.date);
    const [hours, minutes] = session.time.split(':');
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    const sessionEnd = new Date(sessionStart);
    sessionEnd.setMinutes(sessionEnd.getMinutes() + (session.duration || 60));
    
    if (now > sessionEnd) {
      return null; // Session is over
    }
    
    const timeRemaining = sessionEnd - now;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hoursRemaining > 0) {
      return `${hoursRemaining}h ${minutesRemaining}m remaining`;
    } else {
      return `${minutesRemaining}m remaining`;
    }
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

  const getActiveSessions = () => {
    return sessions.filter(booking => 
      // Include both pending and confirmed bookings that have future sessions
      (booking.status === 'pending' || booking.status === 'confirmed') &&
      booking.sessions.some(session => !isSessionCompleted(session))
    );
  };

  const getCompletedSessions = () => {
    return sessions.filter(booking => 
      // Include completed bookings or bookings where all sessions are in the past
      booking.status === 'completed' || 
      booking.sessions.every(session => isSessionCompleted(session))
    );
  };

  const getPendingSessions = () => {
    return sessions.filter(booking => 
      booking.status === 'pending' &&
      booking.sessions.some(session => !isSessionCompleted(session))
    );
  };

  const getConfirmedSessions = () => {
    return sessions.filter(booking => 
      booking.status === 'confirmed' &&
      booking.sessions.some(session => !isSessionCompleted(session))
    );
  };

  const isTodayOrPast = (session) => {
    const now = new Date();
    
    // Create session start time by combining date and time
    const sessionStart = new Date(session.date);
    const [hours, minutes] = session.time.split(':');
    sessionStart.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    // Session is today or past if current time is after or equal to session start time
    return now >= sessionStart;
  };

  // Chat Functions
  const openChat = async (booking) => {
    if (!currentUser) {
      showErrorNotification('Please log in to send messages');
      return;
    }

    if (!booking.educatorId?._id) {
      showErrorNotification('Educator information not available');
      return;
    }

    const educatorData = {
      id: booking.educatorId._id,
      name: booking.educatorId.username || 'Educator',
      packageTitle: booking.packageId?.title || 'Session',
      bookingId: booking._id
    };

    setSelectedEducator(educatorData);
    setShowChatModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedEducator || isSending) return;

    setIsSending(true);
    try {
      // Create conversation if it doesn't exist
      const conversation = await createNewConversation(
        selectedEducator.id,
        selectedEducator.name,
        selectedEducator.bookingId
      );

      // Send the message
      await sendTextMessage(conversation._id, messageText.trim());
      
      setMessageText('');
      showSuccessNotification('Message sent successfully!');
      
      // Close modal and navigate to messages page
      setShowChatModal(false);
      setSelectedEducator(null);
      navigate('/messages');
      
    } catch (error) {
      console.error('Error sending message:', error);
      showErrorNotification('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const closeChatModal = () => {
    setShowChatModal(false);
    setSelectedEducator(null);
    setMessageText('');
    setIsSending(false);
  };

  if (loading) {
    return <div className="loading-container">Loading your sessions...</div>;
  }

  if (error) {
    return <div className="error-container">{error}</div>;
  }

  const activeSessions = getActiveSessions();
  const completedSessions = getCompletedSessions();

  return (
    <div className="home-overview">
      <div className="container">
        <SharedHeaderBanner 
          title="My Sessions"
          subtitle="Manage your tutoring sessions"
        />
        
        <div className="my-sessions-container">
          {/* Active Sessions Section */}
          <div className="sessions-section">
            <div className="section-header">
              <h2>Active Sessions</h2>
              <div className="section-actions">
                <button className="action-btn">
                  <FaCalendar /> View Calendar
                </button>
                <button className="action-btn">
                  <FaPlus /> Add new Session
                </button>
              </div>
            </div>
            
            {/* Pending Sessions Subsection */}
            {getPendingSessions().length > 0 && (
              <div className="subsection-header">
                <h3>Pending Confirmation ({getPendingSessions().length})</h3>
                <p>These sessions are awaiting educator confirmation</p>
              </div>
            )}
            
            {activeSessions.length === 0 ? (
              <div className="no-sessions">
                <FaCalendarAlt className="no-sessions-icon" />
                <h3>No active sessions</h3>
                <p>Your upcoming sessions will appear here.</p>
              </div>
            ) : (
              <div className="sessions-grid">
                {/* Pending Sessions */}
                {getPendingSessions().map((booking) => (
                  <div key={booking._id} className="session-card pending-session">
                    <div className="session-status">
                      <div className="status-indicator pending"></div>
                      <span>Pending Confirmation</span>
                      <div className="session-date-time">
                        {formatDate(booking.sessions[0]?.date)} | {formatSessionTime(booking.sessions[0])}
                      </div>
                    </div>
                    
                    <div className="session-content">
                      <div className="session-details">
                        <div className="subject-price-row">
                          <div className="session-subject">
                            {booking.packageId?.title}
                          </div>
                          <div className="divider"></div>
                          <div className="session-price">
                            Rs.{booking.totalAmount}
                          </div>
                        </div>
                        
                        <div className="session-type">
                          <FaVideo />
                          <span>Video Session + Whiteboard</span>
                        </div>
                        
                        <div className="instructor-info">
                          <div className="instructor-left">
                            <div className="instructor-avatar">
                              <img 
                                src={booking.educatorId?.img || '/img/noavatar.jpg'} 
                                alt={booking.educatorId?.username}
                              />
                            </div>
                            <div className="instructor-name">
                              {booking.educatorId?.username || "Educator"}
                            </div>
                          </div>
                          <div className="divider"></div>
                          <div className="pending-notice">
                            <span>Awaiting educator confirmation</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="session-actions">
                      <div className="message-icon" onClick={() => openChat(booking)}>
                        <FaComments />
                      </div>
                      <button className="chat-btn" onClick={() => openChat(booking)}>
                        <FaComments />
                      </button>
                      <button className="pending-btn" disabled>
                        Pending
                      </button>
                    </div>
                  </div>
                ))}



                {/* Confirmed Sessions */}
                {getConfirmedSessions().map((booking) => {
                  const sessionStatus = getSessionStatus(booking.sessions[0]);
                  const timeRemaining = getTimeRemaining(booking.sessions[0]);
                  
                  return (
                    <div key={booking._id} className="session-card">
                      <div className="session-status">
                        <div className={`status-indicator ${sessionStatus}`}></div>
                        <span>{sessionStatus === 'ongoing' ? 'In Progress' : 'Upcoming'}</span>
                        <div className="session-date-time">
                          {formatDate(booking.sessions[0]?.date)} | {formatSessionTime(booking.sessions[0])}
                          {timeRemaining && (
                            <div className="time-remaining">{timeRemaining}</div>
                          )}
                        </div>
                      </div>
                    
                      <div className="session-content">
                        <div className="session-details">
                          <div className="subject-price-row">
                            <div className="session-subject">
                              {booking.packageId?.title}
                            </div>
                            <div className="divider"></div>
                            <div className="session-price">
                              Rs.{booking.totalAmount}
                            </div>
                          </div>
                          
                          <div className="session-type">
                            <FaVideo />
                            <span>Video Session + Whiteboard</span>
                          </div>
                          
                          <div className="instructor-info">
                            <div className="instructor-left">
                              <div className="instructor-avatar">
                                <img 
                                  src={booking.educatorId?.img || '/img/noavatar.jpg'} 
                                  alt={booking.educatorId?.username}
                                />
                              </div>
                              <div className="instructor-name">
                                {booking.educatorId?.username || "Educator"}
                              </div>
                            </div>
                            <div className="divider"></div>
                            <div className="instructor-rating">
                              <FaStar />
                              <span>4.8 (127 reviews)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="session-actions">
                        <div className="message-icon" onClick={() => openChat(booking)}>
                          <FaComments />
                        </div>
                        <button className="chat-btn" onClick={() => openChat(booking)}>
                          <FaComments />
                        </button>
                        <button
                          className={`join-session-btn ${!isTodayOrPast(booking.sessions[0]) ? 'disabled' : ''}`}
                          onClick={isTodayOrPast(booking.sessions[0]) ? () => setVideoCallBooking(booking) : undefined}
                          disabled={!isTodayOrPast(booking.sessions[0])}
                        >
                          Join session
                        </button>
                        <button className="reschedule-btn">
                          Reschedule
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Completed Sessions Section */}
          <div className="sessions-section">
            <div className="section-header">
              <h2>Completed</h2>
            </div>
            
            {completedSessions.length === 0 ? (
              <div className="no-sessions">
                <FaCalendarAlt className="no-sessions-icon" />
                <h3>No completed sessions</h3>
                <p>Your completed sessions will appear here.</p>
              </div>
            ) : (
              <div className="sessions-grid">
                {completedSessions.map((booking) => (
                  <div key={booking._id} className="session-card completed">
                    <div className="session-status">
                      <div className="status-indicator completed"></div>
                      <span>Completed</span>
                      <div className="session-date-time">
                        {formatDate(booking.sessions[0]?.date)} | {formatSessionTime(booking.sessions[0])}
                      </div>
                    </div>
                    
                    <div className="session-content">
                      
                      <div className="session-details">
                        <div className="subject-price-row">
                          <div className="session-subject">
                            {booking.packageId?.title}
                          </div>
                          <div className="divider"></div>
                          <div className="session-price">
                            ${booking.packageId?.price || 7}/hour
                          </div>
                        </div>
                        
                        <div className="session-type">
                          <FaVideo />
                          <FaChalkboardTeacher />
                          <span>Video Session + Whiteboard</span>
                          </div>
                        
                        <div className="instructor-info">
                          <div className="instructor-left">
                            <div className="instructor-avatar">
                              <FaUser />
                            </div>
                            <div className="instructor-name">
                              {booking.educatorId?.username || "Dr. Nimesh Ekanayaka"}
                            </div>
                          </div>
                          <div className="divider"></div>
                          <div className="instructor-rating">
                            <FaStar />
                            <span>4.8 (127 reviews)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="session-actions">
                      
                      <button className="chat-btn" onClick={() => openChat(booking)}>
                        <FaComments />
                      </button>
                      <div className="message-icon" onClick={() => openChat(booking)}>
                        <FaComments />
                      </div>
                      <button className="view-notes-btn">
                        View session Notes & Materials
                      </button>
                      <button className="book-again-btn">
                        Book Again
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
                        {formatDate(session.date)} | {formatSessionTime(session)}
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

        {/* Chat Modal */}
        {showChatModal && selectedEducator && (
          <div className="chat-modal-overlay" onClick={closeChatModal}>
            <div className="chat-modal" onClick={e => e.stopPropagation()}>
              <div className="chat-header">
                <div className="chat-user-info">
                  <div className="user-avatar">
                    <FaUser />
                  </div>
                  <div className="user-details">
                    <h4>{selectedEducator.name}</h4>
                    <p>{selectedEducator.packageTitle}</p>
                    <div className="user-status">
                      <span className="status-dot online"></span>
                      <span className="status-text">Online</span>
                    </div>
                  </div>
                </div>
                <button className="close-chat-btn" onClick={closeChatModal}>
                  ×
                </button>
              </div>
              
              <div className="chat-messages">
                <div className="no-messages">
                  <FaComments />
                  <p>Start a conversation with {selectedEducator.name}</p>
                  <p className="message-hint">Send a message to begin chatting about your session.</p>
                </div>
              </div>
              
              <div className="chat-input">
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  rows="1"
                  disabled={isSending}
                />
                <button 
                  className="send-btn"
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || isSending}
                >
                  {isSending ? (
                    <div className="sending-spinner"></div>
                  ) : (
                    <FaPaperPlane />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 