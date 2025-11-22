import React, { useState } from 'react';
import { FaCreditCard, FaLock, FaTimes, FaCheck } from 'react-icons/fa';
import './PaymentModal.scss';
import { useNotificationContext } from '../../context/NotificationContext.jsx';
import newRequest from '../../utils/newRequest';

const PaymentModal = ({ amount, packageTitle, bookingId, onPaymentSuccess, onCancel }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    firstName: '',
    lastName: '',
    country: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const { addNotification } = useNotificationContext();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!paymentData.cardNumber || paymentData.cardNumber.replace(/\s/g, '').length < 16) {
      newErrors.cardNumber = 'Please enter a valid card number';
    }

    if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Invalid expiry date';
    }

    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      newErrors.cvv = 'Invalid CVV';
    }

    if (!paymentData.firstName) {
      newErrors.firstName = 'First name required';
    }

    if (!paymentData.lastName) {
      newErrors.lastName = 'Last name required';
    }

    if (!paymentData.country) {
      newErrors.country = 'Country required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      setLoading(false);
      setSuccess(true);
      try {
        // mark booking paid on server (demo / webhook simulation)
        if (bookingId) {
          await newRequest.put(`/bookings/${bookingId}/paid`);
        }

        // record a client-side notification so it appears in the header panel
        addNotification({
          type: 'payment',
          title: 'Transaction successful',
          message: `Payment of Rs.${amount} completed`,
          meta: { amount, packageTitle }
        });
      } catch (e) {
        console.error('Error marking booking paid or adding notification', e);
      }

      setTimeout(() => {
        onPaymentSuccess();
      }, 2000);
    }, 2000);
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (success) {
    return (
      <div className="payment-modal-overlay">
        <div className="payment-modal">
          <div className="success-message">
            <FaCheck className="success-icon" />
            <h3>Payment Successful!</h3>
            <p>Your payment of Rs.{amount} has been processed successfully.</p>
            <p>Your booking is now confirmed.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-wrapper">
        <div className="payment-modal-content">
          {/* Left Section - Payment Form */}
          <div className="payment-form-section">
            <div className="payment-header">
              <div>
                <p className="step-indicator">Step 2 of 2</p>
                <h2>Enter payment info to complete booking</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="payment-form">
              <div className="payment-method-header">
                <label>Your payment method</label>
                <div className="card-brands">
                  <img src="https://upload.wikimedia.org/wikipedia/commons/0/04/Visa.svg" alt="Visa" />
                  <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" />
                </div>
              </div>

              <div className="payment-method-selector">
                <FaCreditCard />
                <span>Credit/Debit</span>
              </div>

              <div className="form-group">
                <input
                  type="text"
                  name="cardNumber"
                  value={paymentData.cardNumber}
                  onChange={(e) => setPaymentData(prev => ({
                    ...prev,
                    cardNumber: formatCardNumber(e.target.value)
                  }))}
                  placeholder="Card number"
                  maxLength="19"
                />
                {errors.cardNumber && <span className="error-text">{errors.cardNumber}</span>}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="expiryDate"
                    value={paymentData.expiryDate}
                    onChange={(e) => setPaymentData(prev => ({
                      ...prev,
                      expiryDate: formatExpiryDate(e.target.value)
                    }))}
                    placeholder="MM/YY"
                    maxLength="5"
                  />
                  {errors.expiryDate && <span className="error-text">{errors.expiryDate}</span>}
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="cvv"
                    value={paymentData.cvv}
                    onChange={handleInputChange}
                    placeholder="CVV"
                    maxLength="4"
                  />
                  {errors.cvv && <span className="error-text">{errors.cvv}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="firstName"
                    value={paymentData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                  />
                  {errors.firstName && <span className="error-text">{errors.firstName}</span>}
                </div>

                <div className="form-group">
                  <input
                    type="text"
                    name="lastName"
                    value={paymentData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                  />
                  {errors.lastName && <span className="error-text">{errors.lastName}</span>}
                </div>
              </div>

              <div className="form-group">
                <select
                  name="country"
                  value={paymentData.country}
                  onChange={handleInputChange}
                >
                  <option value="">Country/Region</option>
                  <option value="LK">Sri Lanka</option>
                  <option value="IN">India</option>
                  <option value="US">United States</option>
                  <option value="UK">United Kingdom</option>
                  <option value="AU">Australia</option>
                </select>
                {errors.country && <span className="error-text">{errors.country}</span>}
              </div>

              <div className="form-group">
                <input
                  type="tel"
                  name="phone"
                  value={paymentData.phone}
                  onChange={handleInputChange}
                  placeholder="Phone number (optional)"
                />
              </div>

              <div className="form-actions">
                <button type="submit" disabled={loading} className="agree-pay-btn">
                  {loading ? 'Processing...' : 'Agree and pay'}
                </button>
                <button type="button" onClick={onCancel} className="back-btn">
                  Back
                </button>
              </div>

              <div className="secure-notice">
                <FaLock />
                <span>Secure transaction</span>
              </div>

              <p className="payment-terms">
                By clicking `Agree and pay`, you agree: After booking, you will be charged Rs.{amount}. 
                Your booking will be confirmed immediately. Cancel before the session starts to avoid charges.
              </p>
            </form>
          </div>

          {/* Right Section - Booking Summary */}
          <div className="booking-summary-section">
            <button className="close-modal-btn" onClick={onCancel}>
              <FaTimes />
            </button>
            
            <h3>Your booking</h3>
            
            <div className="booking-info">
              <div className="package-badge">
                <span className="initials">CM</span>
              </div>
              <div className="package-details">
                <h4>{packageTitle}</h4>
                <span className="instant-badge">Instant booking</span>
              </div>
            </div>

            <div className="session-details">
              <p className="section-label">Sessions</p>
              <p className="session-info">1 session(s) × Rs.{amount}/hr</p>
            </div>

            <div className="price-breakdown">
              <div className="subtotal">
                <span>Subtotal</span>
                <span>Rs.{amount}/session</span>
              </div>
            </div>

            <div className="total-due">
              <div className="due-indicator">●</div>
              <div className="due-content">
                <div className="due-header">
                  <span className="due-label">DUE NOW</span>
                  <span className="due-amount">Rs.{amount}</span>
                </div>
                <p className="due-subtext">Payment upon booking</p>
              </div>
            </div>

            <div className="booking-terms">
              <h4>Booking terms</h4>
              <div className="term-item">
                <FaCheck className="check-icon" />
                <span>Instant confirmation upon payment</span>
              </div>
              <div className="term-item">
                <FaCheck className="check-icon" />
                <span>Cancel before session starts to avoid charges</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
