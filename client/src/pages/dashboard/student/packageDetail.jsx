import React, { useState, useEffect, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar, FaArrowLeft, FaCalendarAlt, FaClock, FaUser, FaLanguage, FaVideo, FaGraduationCap, FaComments, FaPaperPlane } from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import { useChat } from '../../../context/ChatContext.jsx';
import { useNotifications } from '../../../hooks/useNotifications';
import { CurrencyContext } from '../../../context/CurrencyContext.jsx';
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
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsPage, setReviewsPage] = useState(1);
  const [reviewsTotalPages, setReviewsTotalPages] = useState(1);
  
  const { createConversation, sendMessage } = useChat();
  const { showSuccessNotification, showErrorNotification } = useNotifications();
  
  const { currency: selectedCurrency, convertCurrency, getCurrencySymbol } = useContext(CurrencyContext);

  useEffect(() => {
    const viewStartTime = new Date();
    let timeSpent = 0;
    
    const trackViewEnd = async () => {
      const viewEndTime = new Date();
      timeSpent = Math.floor((viewEndTime - viewStartTime) / 1000);
      
      if (id && timeSpent > 0) {
        try {
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
  }, [id]);

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return;
      
      try {
        setReviewsLoading(true);
        const response = await newRequest.get(`/reviews/package/${id}?page=${reviewsPage}&limit=5`);
        console.log('Package reviews response:', response.data);
        
        if (response.data.success) {
          setReviews(response.data.data.reviews || []);
          setReviewsTotalPages(response.data.data.totalPages || 1);
        }
      } catch (err) {
        console.error("Error fetching package reviews:", err);
        setReviews([]);
      } finally {
        setReviewsLoading(false);
      }
    };

    fetchReviews();

    const handleReviewSubmitted = async (evt) => {
      if (evt?.detail?.packageId === id) {
        fetchReviews();
        
        try {
          const response = await newRequest.get(`/packages/${id}`);
          if (response.data) {
            setPackageData(response.data);
          }
        } catch (err) {
          console.error("Error refreshing package data:", err);
        }
      }
    };

    window.addEventListener('package-review-submitted', handleReviewSubmitted);
    return () => window.removeEventListener('package-review-submitted', handleReviewSubmitted);
  }, [id, reviewsPage]);

  const handleBookSession = () => {
    console.log('Book session clicked');
    console.log('Package data:', packageData);
    setShowBookingForm(true);
  };

  const handleBookingSuccess = () => {
    setShowBookingForm(false);
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
      const conversation = await createConversation(
        educator._id,
        educator.fullName || educator.name || educator.username,
        'educator',
        null
      );

      await sendMessage(conversation._id, messageText.trim());
      
      setMessageText('');
      showSuccessNotification('Message sent successfully!');
      
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

  const formatPackagePrice = (pkg) => {
    if (!pkg) return 'Rs.0/hr';
    
    const packageCurrency = pkg.currency || 'LKR';
    const packageRate = pkg.rate || 0;
    
    const convertedRate = packageCurrency !== selectedCurrency
      ? convertCurrency(packageRate, packageCurrency, selectedCurrency)
      : packageRate;
    
    const symbol = getCurrencySymbol(selectedCurrency);
    
    if (packageCurrency !== selectedCurrency) {
      return `${symbol}${convertedRate.toFixed(2)}/hr`;
    }
    
    return `${symbol}${packageRate}/hr`;
  };

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
          <div className="header-content">
            <h1>{packageData.title}</h1>
            {packageData.keywords && packageData.keywords.length > 0 && (
              <div className="package-meta">
                {packageData.keywords.slice(0, 4).map((keyword, index) => (
                  <span key={index} className="keyword-badge">{keyword}</span>
                ))}
              </div>
            )}
          </div>
          <div className="header-price">
            <h2>{formatPackagePrice(packageData)}</h2>
            <button className="book-button" onClick={handleBookSession}>
              Book This Package
            </button>
          </div>
        </div>

        <div className="package-grid-layout">
          {/* Left Column - Image & Educator */}
          <div className="left-column">
            {packageData.thumbnail ? (
              <img src={packageData.thumbnail} alt={packageData.title} className="package-image" />
            ) : (
              <div className="package-image-placeholder">
                <FaUser size={50} />
              </div>
            )}

            {educator && (
              <div className="educator-card-compact">
                <h3>Educator</h3>
                <div className="educator-info">
                  {educator.img ? (
                    <img src={educator.img.startsWith('http') ? educator.img : `http://localhost:8800/${educator.img}`} alt={educator.fullName || educator.name || educator.username} className="educator-image" />
                  ) : (
                    <div className="educator-image-placeholder">
                      <FaUser />
                    </div>
                  )}
                  <div className="educator-details">
                    <h4>{educator.fullName || educator.name || educator.username}</h4>
                    <p>{educator.bio || "Experienced educator"}</p>
                  </div>
                </div>
                <div className="educator-actions-compact">
                  <Link to={`/educator/${educator._id}`} className="view-profile-link">
                    View Profile
                  </Link>
                  <button className="message-educator-btn" onClick={handleMessageEducator}>
                    <FaComments /> Message
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Main Content */}
          <div className="middle-column">
            <div className="package-description-compact">
              <p>{packageData.description}</p>
            </div>

            <div className="package-details-grid">
              <div className="detail-item">
                <FaCalendarAlt />
                <span>{packageData.sessions || 1} Session(s)</span>
              </div>
              <div className="detail-item">
                <FaClock />
                <span>~1 hour/session</span>
              </div>
              {packageData.languages && packageData.languages.length > 0 && (
                <div className="detail-item">
                  <FaLanguage />
                  <span>{packageData.languages.join(", ")}</span>
                </div>
              )}
              {packageData.video && (
                <div className="detail-item">
                  <FaVideo />
                  <a href={packageData.video} target="_blank" rel="noopener noreferrer" className="video-link">
                    Intro Video
                  </a>
                </div>
              )}
            </div>

            {/* Compact Rating Summary */}
            <div className="rating-summary-compact">
              <h3>Ratings</h3>
              <RatingDisplay 
                rating={packageData.rating || 0} 
                totalReviews={packageData.totalReviews || 0}
                ratingBreakdown={packageData.ratingBreakdown || {}}
                variant="detailed"
                className="package-rating-display"
              />
            </div>
          </div>

          {/* Right Column - Reviews */}
          <div className="right-column">
            <div className="reviews-section-compact">
              <h3>Recent Reviews</h3>
              
              {reviewsLoading ? (
                <div className="reviews-loading">Loading...</div>
              ) : reviews.length > 0 ? (
                <>
                  <div className="reviews-list-compact">
                    {reviews.slice(0, 3).map((review) => (
                      <div key={review._id} className="review-item-compact">
                        <div className="review-header-compact">
                          <div className="reviewer-info-compact">
                            {review.studentId?.img ? (
                              <img 
                                src={review.studentId.img} 
                                alt={review.studentId.username || 'User'} 
                                className="reviewer-avatar-small"
                              />
                            ) : (
                              <div className="reviewer-avatar-small placeholder">
                                <FaUser />
                              </div>
                            )}
                            <div>
                              <div className="reviewer-name-small">
                                {review.studentId?.username || 'Anonymous'}
                              </div>
                              <RatingStars rating={review.overallRating} />
                            </div>
                          </div>
                        </div>
                        {review.review && (
                          <div className="review-content-compact">
                            <p>{review.review.length > 100 ? `${review.review.substring(0, 100)}...` : review.review}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  {reviewsTotalPages > 1 && (
                    <div className="reviews-pagination-compact">
                      <button
                        onClick={() => setReviewsPage(prev => Math.max(1, prev - 1))}
                        disabled={reviewsPage === 1}
                        className="pagination-btn-small"
                      >
                        ‹
                      </button>
                      <span>{reviewsPage}/{reviewsTotalPages}</span>
                      <button
                        onClick={() => setReviewsPage(prev => Math.min(reviewsTotalPages, prev + 1))}
                        disabled={reviewsPage === reviewsTotalPages}
                        className="pagination-btn-small"
                      >
                        ›
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-reviews-message-compact">
                  <FaComments />
                  <p>No reviews yet</p>
                </div>
              )}
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
                    <img src={educator.img.startsWith('http') ? educator.img : `http://localhost:8800/${educator.img}`} alt={educator.fullName || educator.name || educator.username} />
                  ) : (
                    <FaUser />
                  )}
                </div>
                <div className="user-details">
                  <h4>{educator.fullName || educator.name || educator.username}</h4>
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
                <p>Start a conversation with {educator.fullName || educator.name || educator.username}</p>
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
