import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaTimes, FaPlus } from 'react-icons/fa';
import newRequest from '../../utils/newRequest';
import PaymentModal from './PaymentModal';
import './BookingForm.scss';

const BookingForm = ({ packageData, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionDates, setSessionDates] = useState([]);
  const [studentNotes, setStudentNotes] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [bookingData, setBookingData] = useState(null);

  useEffect(() => {
    // Initialize with default session
    setSessionDates([{
      date: '',
      time: ''
    }]);
  }, []);

  const addSession = () => {
    setSessionDates([...sessionDates, { date: '', time: '' }]);
  };

  const removeSession = (index) => {
    if (sessionDates.length > 1) {
      setSessionDates(sessionDates.filter((_, i) => i !== index));
    }
  };

  const updateSession = (index, field, value) => {
    const updated = [...sessionDates];
    updated[index][field] = value;
    setSessionDates(updated);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    console.log('Form submitted');
    console.log('Package data:', packageData);

    // Validate session dates
    const hasEmptyDates = sessionDates.some(session => !session.date || !session.time);
    if (hasEmptyDates) {
      setError('Please select dates and times for all sessions');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating booking for package:', packageData._id);
      
      // Create booking directly
      const response = await newRequest.post('/bookings', {
        packageId: packageData._id,
        sessions: sessionDates.length,
        studentNotes,
        sessionDates
      });

      console.log('Booking response:', response.data);
      setBookingData(response.data.booking);
      setShowPaymentModal(true);
      
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = packageData.rate * sessionDates.length;

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    onSuccess();
    navigate('/student-dashboard');
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  if (showPaymentModal && bookingData) {
    return (
      <PaymentModal
        amount={totalAmount}
        packageTitle={packageData.title}
        bookingId={bookingData._id}
        onPaymentSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
      />
    );
  }

  return (
    <div className="booking-form-overlay">
      <div className="booking-form-container">
        <button className="close-modal-btn" onClick={onCancel}>
          <FaTimes />
        </button>

        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-header">
            <p className="step-indicator">Step 1 of 2</p>
            <h2>Schedule your sessions</h2>
          </div>

          <div className="package-info">
            <h3>{packageData.title}</h3>
            <div className="package-meta">
              <span className="rate">
                <FaClock /> Rs.{packageData.rate}/hr
              </span>
              <span className="sessions">
                <FaCalendarAlt /> {sessionDates.length} session(s)
              </span>
            </div>
          </div>

          <div className="schedule-section">
            <h4>
              <FaCalendarAlt /> Schedule Sessions
            </h4>

            {sessionDates.map((session, index) => (
              <div key={index} className="session-row">
                <div className="session-fields">
                  <input
                    type="date"
                    value={session.date}
                    onChange={(e) => updateSession(index, 'date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    placeholder="mm/dd/yyyy"
                    required
                  />
                  <input
                    type="time"
                    value={session.time}
                    onChange={(e) => updateSession(index, 'time', e.target.value)}
                    placeholder="--:-- --"
                    required
                  />
                </div>
              </div>
            ))}

            <button type="button" onClick={addSession} className="add-session-link">
              + Add another session
            </button>
          </div>

          <div className="notes-section">
            <label>Additional Notes (Optional)</label>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Any special requirements or questions..."
              rows="4"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-footer">
            <div className="total-display">
              <span className="total-label">Total:</span>
              <span className="total-amount">Rs.{totalAmount}</span>
            </div>
            <div className="form-actions">
              <button type="button" onClick={onCancel} className="cancel-btn">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="continue-btn">
                {loading ? 'Processing...' : 'Continue to payment'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm;
