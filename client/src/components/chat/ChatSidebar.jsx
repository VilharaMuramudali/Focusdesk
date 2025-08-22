import React, { useState, useEffect } from 'react';
import { FaSearch, FaPlus, FaCircle, FaEllipsisV } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext.jsx';
import OnlineStatus from './OnlineStatus';
import './ChatSidebar.scss';

const ChatSidebar = ({ onConversationSelect, onCreateNewChat }) => {
  const { 
    conversations, 
    activeConversation, 
    onlineUsers, 
    isLoading, 
    loadConversations 
  } = useChat();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredConversations, setFilteredConversations] = useState([]);

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    const filtered = conversations.filter(conv =>
      conv.participantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      conv.lastMessage?.content?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredConversations(filtered);
  }, [conversations, searchTerm]);

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

  const getUnreadCount = (conversation) => {
    return conversation.unreadCount || 0;
  };

  const handleConversationClick = (conversation) => {
    onConversationSelect(conversation);
  };

  const isOnline = (userId) => {
    return onlineUsers.has(userId);
  };

  if (isLoading) {
    return (
      <div className="chat-sidebar">
        <div className="sidebar-header">
          <h3>Messages</h3>
          <button className="new-chat-btn" onClick={onCreateNewChat}>
            <FaPlus />
          </button>
        </div>
        <div className="search-container">
          <div className="search-input">
            <FaSearch />
            <input 
              type="text" 
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="conversations-list">
          <div className="loading-spinner">Loading conversations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-sidebar">
      <div className="sidebar-header">
        <h3>Messages</h3>
        <button className="new-chat-btn" onClick={onCreateNewChat}>
          <FaPlus />
        </button>
      </div>
      
      <div className="search-container">
        <div className="search-input">
          <FaSearch />
          <input 
            type="text" 
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="conversations-list">
        {filteredConversations.length === 0 ? (
          <div className="no-conversations">
            <p>No conversations found</p>
            <button onClick={onCreateNewChat}>Start a new chat</button>
          </div>
        ) : (
          filteredConversations.map((conversation) => (
            <div
              key={conversation._id}
              className={`conversation-item ${activeConversation?._id === conversation._id ? 'active' : ''}`}
              onClick={() => handleConversationClick(conversation)}
            >
              <div className="conversation-avatar">
                <div className="avatar">
                  {conversation.participantName.charAt(0).toUpperCase()}
                </div>
                <OnlineStatus isOnline={isOnline(conversation.participantId)} />
              </div>
              
              <div className="conversation-content">
                <div className="conversation-header">
                  <h4 className="participant-name">{conversation.participantName}</h4>
                  <div className="conversation-meta">
                    <span className="last-message-time">
                      {formatTime(conversation.lastMessage?.createdAt || conversation.updatedAt)}
                    </span>
                    <button className="more-options">
                      <FaEllipsisV />
                    </button>
                  </div>
                </div>
                
                <div className="conversation-preview">
                  <p className="last-message">
                    {formatLastMessage(conversation.lastMessage)}
                  </p>
                  {getUnreadCount(conversation) > 0 && (
                    <div className="unread-badge">
                      {getUnreadCount(conversation)}
                    </div>
                  )}
                </div>
                
                {conversation.bookingId && (
                  <div className="booking-info">
                    <span className="booking-tag">Session Related</span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatSidebar;
