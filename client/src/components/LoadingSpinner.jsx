import React from 'react';
import './LoadingSpinner.scss';

const LoadingSpinner = ({ size = 'medium', text = 'Loading...', variant = 'default' }) => {
  return (
    <div className={`loading-container ${variant}`}>
      <div className={`cute-spinner ${size}`}>
        {/* Main spinning circle */}
        <div className="spinner-ring">
          <div className="spinner-dot dot-1"></div>
          <div className="spinner-dot dot-2"></div>
          <div className="spinner-dot dot-3"></div>
          <div className="spinner-dot dot-4"></div>
          <div className="spinner-dot dot-5"></div>
          <div className="spinner-dot dot-6"></div>
          <div className="spinner-dot dot-7"></div>
          <div className="spinner-dot dot-8"></div>
        </div>
        
        {/* Center bouncing ball */}
        <div className="center-ball">
          <div className="ball-bounce"></div>
        </div>
        
        {/* Floating particles */}
        <div className="particles">
          <div className="particle particle-1">✨</div>
          <div className="particle particle-2">🌟</div>
          <div className="particle particle-3">💫</div>
          <div className="particle particle-4">⭐</div>
        </div>
      </div>
      
      {text && (
        <div className="loading-text">
          <span className="text-content">{text}</span>
          <div className="text-dots">
            <span className="dot">.</span>
            <span className="dot">.</span>
            <span className="dot">.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSpinner;
