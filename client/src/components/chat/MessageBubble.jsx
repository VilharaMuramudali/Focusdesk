import React from 'react';
import { FaDownload, FaEye, FaCheck, FaCheckDouble } from 'react-icons/fa';
import './MessageBubble.scss';

const MessageBubble = ({ message, isOwnMessage, showAvatar = true, isSystemMessage = false }) => {
  const formatTime = (date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleDateString('en-US', {
      weekday: 'long'
    }) + ' ' + messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMessageContent = () => {
    switch (message.messageType) {
      case 'file':
        return (
          <div className="file-message">
            <div className="file-info">
              <div className="file-icon">📎</div>
              <div className="file-details">
                <div className="file-name">{message.fileName}</div>
                <div className="file-size">File</div>
              </div>
            </div>
            <button 
              className="download-btn"
              onClick={() => window.open(message.fileUrl, '_blank')}
            >
              <FaDownload />
            </button>
          </div>
        );
      
      case 'image':
        return (
          <div className="image-message">
            <img 
              src={message.fileUrl} 
              alt="Shared image" 
              onClick={() => window.open(message.fileUrl, '_blank')}
            />
          </div>
        );
      
      default:
        return <div className="text-content">{message.content}</div>;
    }
  };

  const renderMessageStatus = () => {
    if (!isOwnMessage) return null;

    return (
      <div className="message-status">
        {message.read ? (
          <FaCheckDouble className="status-icon read" />
        ) : message.delivered ? (
          <FaCheckDouble className="status-icon delivered" />
        ) : (
          <FaCheck className="status-icon sent" />
        )}
      </div>
    );
  };

  if (isSystemMessage) {
    return (
      <div className="message-bubble system">
        <div className="message-content">
          <div className="message-body system-message">
            <div className="system-icon">ℹ️</div>
            <div className="text-content">{message.content}</div>
          </div>
          <div className="message-footer">
            <span className="message-time">
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isOwnMessage ? 'own' : 'other'}`}>
      {!isOwnMessage && showAvatar && (
        <div className="message-avatar">
          {message.senderName?.charAt(0).toUpperCase() || 'U'}
        </div>
      )}
      
      <div className="message-content">
        {!isOwnMessage && (
          <div className="sender-name">{message.senderName}</div>
        )}
        
        <div className="message-body">
          {renderMessageContent()}
        </div>
        
        <div className="message-footer">
          <span className="message-time">
            {formatTime(message.createdAt)}
          </span>
          {renderMessageStatus()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
