import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar, FaArrowLeft, FaCalendarAlt, FaClock, FaUser, FaLanguage, FaVideo, FaGraduationCap, FaComments, FaPaperPlane } from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import { useChat } from '../../../context/ChatContext.jsx';
import { useNotifications } from '../../../hooks/useNotifications';
import BookingForm from "../../../components/bookingForm/BookingForm";
import RatingDisplay from "../../../components/RatingDisplay";
import "./packageDetail.scss";

function PackageDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [packageData, setPackageData] = useState(null);
  const [educator, setEducator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  
  const { createNewConversation, sendTextMessage } = useChat();
  const { showSuccessNotification, showErrorNotification } = useNotifications();

  // Track package view with time spent
  useEffect(() => {
    const viewStartTime = new Date();
    let timeSpent = 0;
    
    // Function to track view end
    const trackViewEnd = async () => {
      const viewEndTime = new Date();
      timeSpent = Math.floor((viewEndTime - viewStartTime) / 1000); // Time in seconds
      
      if (id && timeSpent > 0) {
        try {
          // Get search query from URL params or sessionStorage
          const searchQuery = new URLSearchParams(window.location.search).get('search') || 
                             sessionStorage.getItem('lastSearchQuery') || null;
          const searchKeywords = searchQuery ? 
            searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2) : [];
          
          await newRequest.post('/recommend/track-package-view', {
            packageId: id,
            timeSpent,
            viewStartTime: viewStartTime.toISOString(),
            viewEndTime: viewEndTime.toISOString(),
            searchQuery,
            searchKeywords
          });
        } catch (error) {
          console.error('Error tracking package view:', error);
        }
      }
    };
    
    // Track when component unmounts or page visibility changes
    const handleBeforeUnload = () => {
      trackViewEnd();
    };
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        trackViewEnd();
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      trackViewEnd();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [id]);

  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        setLoading(true);
        console.log('PackageDetail: Fetching package with ID:', id);
        
        const response = await newRequest.get(`/packages/${id}`);
        console.log('PackageDetail: Package response:', response.data);
        setPackageData(response.data);

        // Use populated educator data from package response
        if (response.data.educatorId) {
          console.log('PackageDetail: Educator data from package:', response.data.educatorId);
          setEducator(response.data.educatorId);
        } else {
          console.log('PackageDetail: No educatorId found in package data');
        }

        setLoading(false);
      } catch (err) {
        console.error("PackageDetail: Error fetching package details:", err);
        console.error("PackageDetail: Error response:", err.response?.data);
        console.error("PackageDetail: Error status:", err.response?.status);
        setError(`Failed to load package details: ${err.response?.data?.message || err.message}`);
        setLoading(false);
      }
    };

    fetchPackageData();

    // Listen for global review submission to refresh ratings dynamically
    const handleReviewSubmitted = (evt) => {
      if (evt?.detail?.packageId === id) {
        fetchPackageData();
      }
    };

    window.addEventListener('package-review-submitted', handleReviewSubmitted);
    return () => window.removeEventListener('package-review-submitted', handleReviewSubmitted);
  }, [id]);

  const handleBookSession = () => {
    console.log('Book session clicked');
    console.log('Package data:', packageData);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
    // You can add a success message or redirect
  };

  const handleBookingCancel = () => {
    setShowBookingForm(false);
  };

  const handleMessageEducator = () => {
    if (!educator) {
      showErrorNotification('Educator information not available');
      return;
    }
    setShowChatModal(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !educator || isSending) return;

    setIsSending(true);
    try {
      // Create conversation if it doesn't exist
      const conversation = await createNewConversation(
        educator._id,
        educator.username,
        null // No booking ID for pre-booking messages
      );

      // Send the message
      await sendTextMessage(conversation._id, messageText.trim());
      
      setMessageText('');
      showSuccessNotification('Message sent successfully!');
      
      // Close modal and navigate to messages page
      setShowChatModal(false);
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
    setMessageText('');
    setIsSending(false);
  };

  // Rating stars component
  const RatingStars = ({ rating = 0, totalReviews = 0 }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(<FaStar key={i} className="star filled" />);
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(<FaStarHalfAlt key={i} className="star half" />);
      } else {
        stars.push(<FaRegStar key={i} className="star empty" />);
      }
    }
    
    const ratingText = rating > 0 ? `(${rating.toFixed(1)})` : '(No ratings)';
    const reviewText = totalReviews > 0 ? ` ${totalReviews} reviews` : '';
    
    return <div className="rating-stars">{stars} <span className="rating-value">{ratingText}{reviewText}</span></div>;
  };

  if (loading) {
    return <div className="loading-container">Loading package details...</div>;
  }

  if (error || !packageData) {
    return (
      <div className="error-container">
        <p>{error || "Package not found"}</p>
        <Link to="/student-dashboard" className="back-link">
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="package-detail-page">
      {showBookingForm && (
        <BookingForm
          packageData={packageData}
          onSuccess={handleBookingSuccess}
          onCancel={handleBookingCancel}
        />
      )}
      <div className="package-detail-container">
        <div className="back-navigation">
          <Link to="/student-dashboard" className="back-link">
            <FaArrowLeft /> Back to Dashboard
          </Link>
        </div>

        <div className="package-header">
          <h1>{packageData.title}</h1>
          <div className="package-meta">
            {packageData.keywords && packageData.keywords.map((keyword, index) => (
              <span key={index} className="keyword-badge">{keyword}</span>
            ))}
          </div>
        </div>

        <div className="package-content">
          <div className="package-main">
            {packageData.thumbnail ? (
              <img src={packageData.thumbnail} alt={packageData.title} className="package-image" />
            ) : (
              <div className="package-image-placeholder">
                <FaUser size={60} />
              </div>
            )}

            <div className="package-description">
              <h2>About this Learning Package</h2>
              <p>{packageData.description}</p>

              <div className="package-details">
                <div className="detail-item">
                  <FaCalendarAlt />
                  <span>{packageData.sessions || 1} Session(s)</span>
                </div>
                <div className="detail-item">
                  <FaClock />
                  <span>Approximately 1 hour per session</span>
                </div>
                {packageData.languages && packageData.languages.length > 0 && (
                  <div className="detail-item">
                    <FaLanguage />
                    <span>Languages: {packageData.languages.join(", ")}</span>
                  </div>
                )}
              </div>

              {packageData.video && (
                <div className="package-video">
                  <h3><FaVideo /> Introduction Video</h3>
                  <a href={packageData.video} target="_blank" rel="noopener noreferrer" className="video-link">
                    Watch Introduction Video
                  </a>
                </div>
              )}
              
              {packageData.languages && packageData.languages.length > 0 && (
                <div className="package-languages">
                  <h3><FaLanguage /> Available Languages</h3>
                  <div className="language-tags">
                    {packageData.languages.map((language, index) => (
                      <span key={index} className="language-tag">{language}</span>
                    ))}
                  </div>
                </div>
              )}

              {/* Rating Section - Moved here from header */}
              <div className="package-rating-section">
                <h3>Package Ratings & Reviews</h3>
                <RatingDisplay 
                  rating={packageData.rating || 0} 
                  totalReviews={packageData.totalReviews || 0}
                  ratingBreakdown={packageData.ratingBreakdown || {}}
                  variant="detailed"
                  className="package-rating-display"
                />
              </div>
            </div>
          </div>

          <div className="package-sidebar">
            <div className="price-card">
              <h3>Rs.{packageData.rate}/hr</h3>
              <button className="book-button" onClick={handleBookSession}>
                Book This Package
              </button>
            </div>

            {educator && (
              <div className="educator-card">
                <h3>About the Educator</h3>
                <div className="educator-info">
                  {educator.img ? (
                    <img src={educator.img} alt={educator.username} className="educator-image" />
                  ) : (
                    <div className="educator-image-placeholder">
                      <FaUser />
                    </div>
                  )}
                  <div>
                    <h4>{educator.username}</h4>
                    <p>{educator.bio || "Experienced educator"}</p>
                  </div>
                </div>
                <div className="educator-actions">
                  <Link to={`/educator/${educator._id}`} className="view-profile-link">
                    View Full Profile
                  </Link>
                  <button className="message-educator-btn" onClick={handleMessageEducator}>
                    <FaComments />
                    Message Educator
                  </button>
                </div>
              </div>
            )}
            
            <div className="package-summary-card">
              <h3>Package Summary</h3>
              <ul className="summary-list">
                <li><strong>Rate:</strong> Rs.{packageData.rate}/hr</li>
                <li><strong>Sessions:</strong> {packageData.sessions || 1}</li>
                {packageData.languages && packageData.languages.length > 0 && (
                  <li><strong>Languages:</strong> {packageData.languages.join(", ")}</li>
                )}
                <li><strong>Sample Video:</strong> {packageData.video ? "Available" : "Not available"}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Modal */}
      {showChatModal && educator && (
        <div className="chat-modal-overlay" onClick={closeChatModal}>
          <div className="chat-modal" onClick={e => e.stopPropagation()}>
            <div className="chat-header">
              <div className="chat-user-info">
                <div className="user-avatar">
                  {educator.img ? (
                    <img src={educator.img} alt={educator.username} />
                  ) : (
                    <FaUser />
                  )}
                </div>
                <div className="user-details">
                  <h4>{educator.username}</h4>
                  <p>{packageData?.title || 'Package Inquiry'}</p>
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
                <p>Start a conversation with {educator.username}</p>
                <p className="message-hint">Ask questions about this package before booking.</p>
              </div>
            </div>
            
            <div className="chat-input">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about the package, schedule, or any questions..."
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
  );
}

export default PackageDetail;
