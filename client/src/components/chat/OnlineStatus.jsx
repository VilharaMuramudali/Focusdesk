import React from 'react';
import { FaCircle } from 'react-icons/fa';
import './OnlineStatus.scss';

const OnlineStatus = ({ isOnline, size = 'small' }) => {
  return (
    <div className={`online-status ${size}`}>
      <FaCircle className={`status-indicator ${isOnline ? 'online' : 'offline'}`} />
    </div>
  );
};

export default OnlineStatus;
