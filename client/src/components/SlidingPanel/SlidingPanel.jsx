// components/SlidingPanel/SlidingPanel.jsx
import React, { useEffect } from 'react';
import './SlidingPanel.scss';

const SlidingPanel = ({ 
  isOpen, 
  onClose, 
  children, 
  position = 'right', 
  size = 50,
  noBackdrop = false
}) => {
  // Prevent body scrolling when panel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Handle ESC key to close panel
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Handle click outside to close
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className={`sliding-panel-container ${isOpen ? 'open in' : ''}`}>
      {!noBackdrop && <div className="backdrop" onClick={handleBackdropClick}></div>}
      <div 
        className={`panel ${position}`} 
        style={{ [position === 'left' || position === 'right' ? 'width' : 'height']: `${size}%` }}
      >
        <div className="panel-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SlidingPanel;
