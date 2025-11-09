import React, { useState, useEffect, useRef } from 'react';
import { FaArrowLeft, FaEllipsisV, FaPhone, FaVideo } from 'react-icons/fa';
import { useChat } from '../../context/ChatContext.jsx';
import MessageBubble from './MessageBubble';
import MessageComposer from './MessageComposer';
import OnlineStatus from './OnlineStatus';
import './ChatWindow.scss';

const ChatWindow = ({ conversation, onBack, onCall, onVideoCall }) => {
  const { 
    messages, 
    loadMessages, 
    sendMessage, 
    joinConversation, 
    leaveConversation,
    typingUsers,
    onlineUsers,
    isLoading 
  } = useChat();
  
  const [showOptions, setShowOptions] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  useEffect(() => {
    if (conversation) {
      loadMessages(conversation._id);
      joinConversation(conversation._id);
    }

    return () => {
      if (conversation) {
        leaveConversation(conversation._id);
      }
    };
  }, [conversation?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (content, messageType = 'text', file = null) => {
    if (!conversation) return;
    
    try {
      await sendMessage(conversation._id, content, messageType, file);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const isOnline = () => {
    return onlineUsers.has(conversation?.participantId);
  };

  const getTypingIndicator = () => {
    const typingUser = typingUsers.get(conversation?.participantId);
    if (typingUser) {
      return (
        <div className="typing-indicator">
          <div className="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span>{typingUser} is typing...</span>
        </div>
      );
    }
    return null;
  };

  const formatDate = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (messageDate.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const formatMessageTime = (date) => {
    const messageDate = new Date(date);
    return messageDate.toLocaleDateString('en-US', {
      weekday: 'long'
    }) + ' ' + messageDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach(message => {
      const date = formatDate(message.createdAt);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (!conversation) {
    return (
      <div className="chat-window empty">
        <div className="empty-state">
          <h3>Select a conversation to start messaging</h3>
          <p>Choose from your conversations or start a new one</p>
        </div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <div className="header-left">
          <div className="participant-info">
            <div className="participant-avatar">
              {conversation.participantName.charAt(0).toUpperCase()}
              <OnlineStatus isOnline={isOnline()} size="medium" />
            </div>
            <div className="participant-details">
              <h4>{conversation.participantName}</h4>
              <span className={`status ${isOnline() ? 'online' : 'offline'}`}>
                {isOnline() ? 'Online' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
        
        <div className="header-right">
          <button className="view-profile-btn" onClick={() => {}}>
            View Profile
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="messages-container" ref={messagesContainerRef}>
        {isLoading ? (
          <div className="loading-messages">
            <div className="spinner"></div>
            <p>Loading messages...</p>
          </div>
        ) : (
          <div className="messages-list">
            {Object.entries(messageGroups).map(([date, dateMessages]) => (
              <div key={date} className="message-group">
                <div className="date-separator">
                  <span>{date}</span>
                </div>
                {dateMessages.map((message, index) => {
                  // Check if message is from system (booking notifications, etc.)
                  const isSystemMessage = message.messageType === 'system' || 
                                         (message.content && message.content.includes('booking'));
                  
                  return (
                    <MessageBubble
                      key={message._id}
                      message={message}
                      isOwnMessage={message.senderId === currentUser._id}
                      showAvatar={index === 0 || dateMessages[index - 1]?.senderId !== message.senderId}
                      isSystemMessage={isSystemMessage}
                    />
                  );
                })}
              </div>
            ))}
            {getTypingIndicator()}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Message Composer */}
      <MessageComposer
        conversationId={conversation._id}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default ChatWindow;
