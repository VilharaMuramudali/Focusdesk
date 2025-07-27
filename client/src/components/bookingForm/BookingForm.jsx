import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaClock, FaUser, FaTimes, FaCheck } from 'react-icons/fa';
import newRequest from '../../utils/newRequest';
import './BookingForm.scss';

const BookingForm = ({ packageData, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [sessionDates, setSessionDates] = useState([]);
  const [studentNotes, setStudentNotes] = useState('');

  useEffect(() => {
    // Initialize with default session
    setSessionDates([{
      date: '',
      time: '09:00'
    }]);
  }, []);

  const addSession = () => {
    setSessionDates([...sessionDates, { date: '', time: '09:00' }]);
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
    const hasEmptyDates = sessionDates.some(session => !session.date);
    if (hasEmptyDates) {
      setError('Please select dates for all sessions');
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
      setSuccess(true);
      
      // Show success message for 2 seconds then redirect
      setTimeout(() => {
        onSuccess();
        navigate('/student-dashboard');
      }, 2000);
      
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.response?.data?.message || 'Failed to create booking');
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = packageData.rate * sessionDates.length;

  if (success) {
    return (
      <div className="booking-form-overlay">
        <div className="booking-form-modal">
          <div className="success-message">
            <FaCheck className="success-icon" />
            <h3>Booking Successful!</h3>
            <p>Your booking has been created successfully. You will be redirected to your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-form-overlay">
      <div className="booking-form-modal">
        <form onSubmit={handleSubmit} className="booking-form">
          <div className="form-header">
            <h3>Book Package: {packageData.title}</h3>
            <button type="button" onClick={onCancel} className="close-btn">
              <FaTimes />
            </button>
          </div>

          <div className="package-summary">
            <div className="summary-item">
              <FaUser />
              <span>Rate: Rs.{packageData.rate}/hr</span>
            </div>
            <div className="summary-item">
              <FaClock />
              <span>Total Sessions: {sessionDates.length}</span>
            </div>
            <div className="summary-item total">
              <strong>Total Amount: Rs.{totalAmount}</strong>
            </div>
          </div>

          <div className="session-scheduling">
            <h4><FaCalendarAlt /> Schedule Sessions</h4>
            {sessionDates.map((session, index) => (
              <div key={index} className="session-row">
                <div className="session-inputs">
                  <input
                    type="date"
                    value={session.date}
                    onChange={(e) => updateSession(index, 'date', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                  <input
                    type="time"
                    value={session.time}
                    onChange={(e) => updateSession(index, 'time', e.target.value)}
                    required
                  />
                </div>
                {sessionDates.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeSession(index)}
                    className="remove-session-btn"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
            ))}
            <button type="button" onClick={addSession} className="add-session-btn">
              + Add Another Session
            </button>
          </div>

          <div className="notes-section">
            <label>Additional Notes (Optional)</label>
            <textarea
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Any special requirements or questions..."
              rows="3"
            />
          </div>

          <div className="payment-info">
            <h4>Payment Information</h4>
            <div className="payment-notice">
              <p><strong>Demo Mode:</strong> This is a demonstration booking system.</p>
              <p>In a real application, payment would be processed here.</p>
              <p>Total to pay: <strong>Rs.{totalAmount}</strong></p>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="form-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Creating Booking...' : `Confirm Booking (Rs.${totalAmount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingForm; 