import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { FaComments, FaPlus, FaBell } from "react-icons/fa";
import { useChat } from "../../../context/ChatContext.jsx";
import "./educatorDashboard.scss";

export default function MessagesSection() {
  const { conversations, unreadCount, isConnected, loadConversations } = useChat();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const getRecentConversations = () => {
    return conversations.slice(0, 3); // Show only 3 most recent conversations
  };

  const formatLastMessage = (message) => {
    if (!message) return 'No messages yet';
    
    const content = message.content;
    if (message.messageType === 'file') {
      return `📎 ${message.fileName || 'File'}`;
    }
    if (message.messageType === 'image') {
      return '📷 Image';
    }
    
    return content.length > 30 ? `${content.substring(0, 30)}...` : content;
  };

  const formatTime = (date) => {
    if (!date) return '';
    
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="educator-messages-section">
      <div className="messages-header">
        <div className="header-left">
          <h2>Messages</h2>
          {unreadCount > 0 && (
            <div className="unread-badge">
              <FaBell />
              <span>{unreadCount}</span>
            </div>
          )}
        </div>
        <div className="header-right">
          <Link to="/messages" className="view-all-btn">
            View All Messages
          </Link>
          <Link to="/messages" className="new-chat-btn">
            <FaPlus />
            New Chat
          </Link>
        </div>
      </div>

      <div className="connection-status">
        <div className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
          <div className="status-dot"></div>
          <span>{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
      </div>

      <div className="messages-content">
        {conversations.length === 0 ? (
          <div className="no-messages">
            <div className="no-messages-icon">
              <FaComments />
            </div>
            <h3>No conversations yet</h3>
            <p>Start chatting with your students to help them with their studies</p>
            <Link to="/messages" className="start-chat-btn">
              <FaPlus />
              Start Your First Chat
            </Link>
          </div>
        ) : (
          <div className="recent-conversations">
            <h3>Recent Conversations</h3>
            <div className="conversations-list">
              {getRecentConversations().map((conversation) => (
                <Link 
                  key={conversation._id} 
                  to={`/message/${conversation._id}`}
                  className="conversation-item"
                >
                  <div className="conversation-avatar">
                    <div className="avatar">
                      {conversation.participantName.charAt(0).toUpperCase()}
                    </div>
                    {conversation.unreadCount > 0 && (
                      <div className="unread-indicator">
                        {conversation.unreadCount}
                      </div>
                    )}
                  </div>
                  
                  <div className="conversation-content">
                    <div className="conversation-header">
                      <h4 className="participant-name">{conversation.participantName}</h4>
                      <span className="last-message-time">
                        {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
                      </span>
                    </div>
                    
                    <div className="conversation-preview">
                      <p className="last-message">
                        {formatLastMessage(conversation.lastMessage)}
                      </p>
                    </div>
                    
                    {conversation.bookingId && (
                      <div className="booking-info">
                        <span className="booking-tag">Session Related</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            
            {conversations.length > 3 && (
              <div className="view-more">
                <Link to="/messages" className="view-more-btn">
                  View All {conversations.length} Conversations
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="messages-actions">
        <div className="action-cards">
          <div className="action-card">
            <div className="action-icon">
              <FaComments />
            </div>
            <h4>Quick Chat</h4>
            <p>Start a new conversation with any student</p>
            <Link to="/messages" className="action-btn">
              Start Chat
            </Link>
          </div>
          
          <div className="action-card">
            <div className="action-icon">
              <FaBell />
            </div>
            <h4>Notifications</h4>
            <p>Manage your message notifications</p>
            <button className="action-btn">
              Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

