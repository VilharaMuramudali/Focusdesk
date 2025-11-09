import React, { useState } from 'react';
import { FaCreditCard, FaLock, FaShieldAlt, FaCheck, FaTimes } from 'react-icons/fa';
import './PaymentModal.scss';

const PaymentModal = ({ amount, packageTitle, onPaymentSuccess, onCancel }) => {
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!paymentData.cardNumber || paymentData.cardNumber.length < 16) {
      newErrors.cardNumber = 'Please enter a valid 16-digit card number';
    }

    if (!paymentData.cardHolder || paymentData.cardHolder.length < 3) {
      newErrors.cardHolder = 'Please enter cardholder name';
    }

    if (!paymentData.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentData.expiryDate)) {
      newErrors.expiryDate = 'Please enter expiry date (MM/YY)';
    }

    if (!paymentData.cvv || paymentData.cvv.length < 3) {
      newErrors.cvv = 'Please enter a valid CVV';
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

    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      
      // Show success for 2 seconds then call onPaymentSuccess
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
            <p>Your booking is now confirmed and pending educator approval.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-header">
          <h3>Complete Payment</h3>
          <button type="button" onClick={onCancel} className="close-btn">
            <FaTimes />
          </button>
        </div>

        <div className="payment-summary">
          <div className="summary-item">
            <span>Package:</span>
            <span>{packageTitle}</span>
          </div>
          <div className="summary-item total">
            <span>Total Amount:</span>
            <span>Rs.{amount}</span>
          </div>
        </div>

        <div className="payment-notice">
          <FaShieldAlt />
          <p>This is a demo payment system. Use any dummy data to proceed.</p>
        </div>

        <form onSubmit={handleSubmit} className="payment-form">
          <div className="form-group">
            <label>Card Number</label>
            <div className="card-input">
              <FaCreditCard className="card-icon" />
              <input
                type="text"
                name="cardNumber"
                value={paymentData.cardNumber}
                onChange={(e) => setPaymentData(prev => ({
                  ...prev,
                  cardNumber: formatCardNumber(e.target.value)
                }))}
                placeholder="1234 5678 9012 3456"
                maxLength="19"
              />
            </div>
            {errors.cardNumber && <span className="error">{errors.cardNumber}</span>}
          </div>

          <div className="form-group">
            <label>Cardholder Name</label>
            <input
              type="text"
              name="cardHolder"
              value={paymentData.cardHolder}
              onChange={handleInputChange}
              placeholder="John Doe"
            />
            {errors.cardHolder && <span className="error">{errors.cardHolder}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Expiry Date</label>
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
              {errors.expiryDate && <span className="error">{errors.expiryDate}</span>}
            </div>

            <div className="form-group">
              <label>CVV</label>
              <input
                type="text"
                name="cvv"
                value={paymentData.cvv}
                onChange={handleInputChange}
                placeholder="123"
                maxLength="4"
              />
              {errors.cvv && <span className="error">{errors.cvv}</span>}
            </div>
          </div>

          

          <div className="security-notice">
            <FaLock />
            <span>Your payment information is secure and encrypted</span>
          </div>

          <div className="payment-actions">
            <button type="button" onClick={onCancel} className="cancel-btn">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="pay-btn">
              {loading ? 'Processing Payment...' : `Pay Rs.${amount}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;
