import React from 'react';
import PropTypes from 'prop-types';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ message = "Loading...", size = "medium" }) => {
  return (
    <div className={`loading-spinner-container ${size}`}>
      <div className="loading-spinner">
        <div className="spinner"></div>
      </div>
      {message && (
        <p className="loading-message">{message}</p>
      )}
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default LoadingSpinner;
