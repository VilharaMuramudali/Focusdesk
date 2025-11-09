# Dashboard Integration Guide - Real-Time Chat System

## Overview
This guide provides comprehensive examples of how to integrate the real-time chat system with existing dashboard components in the FocusDesk educational platform.

## Quick Start Integration

### 1. Basic Chat Integration in StudentDashboard

```jsx
// In StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import { useChat } from '../../context/ChatContext';
import { FaComments, FaBell } from "react-icons/fa";

function StudentDashboard() {
  const { unreadCount, isConnected, conversations } = useChat();
  
  return (
    <div className="student-dashboard">
      {/* Existing dashboard content */}
      
      {/* Chat Notification Badge */}
      <div className="chat-notification">
        {unreadCount > 0 && (
          <div className="notification-badge">
            <FaBell />
            <span>{unreadCount}</span>
          </div>
        )}
      </div>
      
      {/* Quick Chat Access */}
      <div className="quick-chat-section">
        <h3>Quick Chat</h3>
        <div className="recent-chats">
          {conversations.slice(0, 3).map(conv => (
            <div key={conv._id} className="chat-preview">
              <span>{conv.participantName}</span>
              <span>{conv.lastMessage?.content || 'No messages'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

### 2. Educator Dashboard Integration

```jsx
// In EducatorDashboard.jsx
import React from "react";
import { useChat } from '../../context/ChatContext';
import { FaComments, FaUsers } from "react-icons/fa";

function EducatorDashboard() {
  const { unreadCount, conversations, isConnected } = useChat();
  
  const studentConversations = conversations.filter(conv => 
    conv.participantType === 'student'
  );
  
  return (
    <div className="educator-dashboard">
      {/* Chat Overview Card */}
      <div className="chat-overview-card">
        <div className="card-header">
          <FaComments />
          <h3>Student Messages</h3>
          {unreadCount > 0 && (
            <span className="unread-count">{unreadCount}</span>
          )}
        </div>
        
        <div className="card-content">
          <div className="connection-status">
            <span className={`status ${isConnected ? 'online' : 'offline'}`}>
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="recent-students">
            {studentConversations.slice(0, 5).map(conv => (
              <div key={conv._id} className="student-item">
                <div className="student-avatar">
                  {conv.participantName.charAt(0)}
                </div>
                <div className="student-info">
                  <span className="name">{conv.participantName}</span>
                  <span className="last-message">
                    {conv.lastMessage?.content || 'No messages'}
                  </span>
                </div>
                {conv.unreadCount > 0 && (
                  <span className="unread">{conv.unreadCount}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Advanced Integration Examples

### 3. Session-Based Chat Integration

```jsx
// In MySessions.jsx - Integrate chat with session cards
import React from "react";
import { useChat } from '../../context/ChatContext';
import { FaComments, FaMessage } from "react-icons/fa";

function MySessions() {
  const { createConversation, conversations } = useChat();
  
  const handleStartChat = async (educatorId, educatorName, bookingId) => {
    try {
      // Check if conversation already exists
      const existingConv = conversations.find(conv => 
        conv.participantId === educatorId && conv.bookingId === bookingId
      );
      
      if (existingConv) {
        // Navigate to existing conversation
        window.location.href = `/message/${existingConv._id}`;
        return;
      }
      
      // Create new conversation
      const newConversation = await createConversation(
        educatorId, 
        educatorName, 
        bookingId
      );
      
      // Navigate to new conversation
      window.location.href = `/message/${newConversation._id}`;
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };
  
  return (
    <div className="my-sessions">
      {sessions.map(session => (
        <div key={session._id} className="session-card">
          {/* Existing session content */}
          
          {/* Chat Integration */}
          <div className="session-actions">
            <button 
              className="chat-btn"
              onClick={() => handleStartChat(
                session.educatorId, 
                session.educatorName, 
                session.bookingId
              )}
            >
              <FaMessage />
              Chat with {session.educatorName}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### 4. Booking System Chat Integration

```jsx
// In MyBookings.jsx - Add chat functionality to bookings
import React from "react";
import { useChat } from '../../context/ChatContext';
import { FaComments } from "react-icons/fa";

function MyBookings() {
  const { conversations, createConversation } = useChat();
  
  const getConversationForBooking = (bookingId) => {
    return conversations.find(conv => conv.bookingId === bookingId);
  };
  
  const handleBookingChat = async (booking) => {
    const existingConv = getConversationForBooking(booking._id);
    
    if (existingConv) {
      window.location.href = `/message/${existingConv._id}`;
      return;
    }
    
    try {
      const newConv = await createConversation(
        booking.educatorId,
        booking.educatorName,
        booking._id
      );
      window.location.href = `/message/${newConv._id}`;
    } catch (error) {
      console.error('Error creating booking chat:', error);
    }
  };
  
  return (
    <div className="my-bookings">
      {bookings.map(booking => {
        const conversation = getConversationForBooking(booking._id);
        
        return (
          <div key={booking._id} className="booking-card">
            {/* Existing booking content */}
            
            {/* Chat Status */}
            <div className="booking-chat-status">
              {conversation ? (
                <div className="chat-active">
                  <FaComments />
                  <span>Chat Active</span>
                  <button 
                    onClick={() => window.location.href = `/message/${conversation._id}`}
                  >
                    Open Chat
                  </button>
                </div>
              ) : (
                <button 
                  className="start-chat-btn"
                  onClick={() => handleBookingChat(booking)}
                >
                  <FaComments />
                  Start Chat
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

### 5. Navigation Integration

```jsx
// In StudentSidebar.jsx - Add chat navigation
import React from "react";
import { useChat } from '../../context/ChatContext';
import { FaComments, FaBell } from "react-icons/fa";

function StudentSidebar() {
  const { unreadCount } = useChat();
  
  return (
    <div className="student-sidebar">
      {/* Existing navigation items */}
      
      {/* Chat Navigation */}
      <div className="nav-item chat-nav">
        <Link to="/messages" className="nav-link">
          <div className="nav-icon">
            <FaComments />
            {unreadCount > 0 && (
              <div className="notification-badge">
                <FaBell />
                <span>{unreadCount}</span>
              </div>
            )}
          </div>
          <span>Messages</span>
        </Link>
      </div>
    </div>
  );
}
```

## Real-Time Features Integration

### 6. Live Notifications

```jsx
// In App.jsx or main layout component
import React, { useEffect } from "react";
import { useChat } from './context/ChatContext';
import { useNotifications } from './hooks/useNotifications';

function App() {
  const { socket, conversations } = useChat();
  const { showMessageNotification, showBrowserNotification } = useNotifications();
  
  useEffect(() => {
    if (!socket) return;
    
    // Listen for new messages
    socket.on('message', (data) => {
      const conversation = conversations.find(conv => 
        conv._id === data.message.conversationId
      );
      
      if (conversation) {
        // Show in-app notification
        showMessageNotification(
          data.message.content, 
          data.message.senderName
        );
        
        // Show browser notification
        showBrowserNotification(
          `New message from ${data.message.senderName}`,
          {
            body: data.message.content,
            icon: '/favicon.ico'
          }
        );
      }
    });
    
    return () => {
      socket.off('message');
    };
  }, [socket, conversations]);
  
  return (
    <div className="app">
      {/* App content */}
    </div>
  );
}
```

### 7. Typing Indicators

```jsx
// In ChatWindow.jsx - Enhanced typing indicators
import React from "react";
import { useChat } from '../../context/ChatContext';

function ChatWindow({ conversation }) {
  const { typingUsers, startTyping, stopTyping } = useChat();
  
  const handleTyping = (e) => {
    if (e.target.value.length > 0) {
      startTyping(conversation._id);
    } else {
      stopTyping(conversation._id);
    }
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
  
  return (
    <div className="chat-window">
      {/* Messages */}
      <div className="messages">
        {/* Existing messages */}
        {getTypingIndicator()}
      </div>
      
      {/* Message input */}
      <div className="message-input">
        <textarea 
          onChange={handleTyping}
          placeholder="Type a message..."
        />
      </div>
    </div>
  );
}
```

## File Upload Integration

### 8. Session Material Sharing

```jsx
// In SessionDetail.jsx - Share materials via chat
import React from "react";
import { useChat } from '../../context/ChatContext';
import { FaShare, FaFile } from "react-icons/fa";

function SessionDetail({ session }) {
  const { sendMessage } = useChat();
  
  const shareMaterial = async (material) => {
    try {
      const conversation = conversations.find(conv => 
        conv.bookingId === session.bookingId
      );
      
      if (conversation) {
        await sendMessage(
          conversation._id,
          `Sharing: ${material.title}`,
          'file',
          material.file
        );
      }
    } catch (error) {
      console.error('Error sharing material:', error);
    }
  };
  
  return (
    <div className="session-detail">
      {/* Session content */}
      
      {/* Materials section */}
      <div className="materials-section">
        <h3>Session Materials</h3>
        {materials.map(material => (
          <div key={material._id} className="material-item">
            <FaFile />
            <span>{material.title}</span>
            <button 
              onClick={() => shareMaterial(material)}
              className="share-btn"
            >
              <FaShare />
              Share via Chat
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Performance Optimization

### 9. Lazy Loading Chat Components

```jsx
// In App.jsx - Lazy load chat components
import React, { Suspense } from "react";
import { ChatProvider } from './context/ChatContext';

// Lazy load chat components
const Messages = React.lazy(() => import('./pages/messages/Messages'));
const Message = React.lazy(() => import('./pages/message/Message'));

function App() {
  return (
    <ChatProvider>
      <Suspense fallback={<div>Loading chat...</div>}>
        <Routes>
          <Route path="/messages" element={<Messages />} />
          <Route path="/message/:id" element={<Message />} />
        </Routes>
      </Suspense>
    </ChatProvider>
  );
}
```

### 10. Chat State Persistence

```jsx
// In ChatContext.js - Add persistence
import React, { useEffect } from "react";
import { useChat } from './context/ChatContext';

function ChatProvider({ children }) {
  const { conversations, setActiveConversation } = useChat();
  
  // Persist active conversation
  useEffect(() => {
    const savedConversation = localStorage.getItem('activeConversation');
    if (savedConversation) {
      const conversation = JSON.parse(savedConversation);
      setActiveConversation(conversation);
    }
  }, []);
  
  // Save conversations to localStorage
  useEffect(() => {
    localStorage.setItem('chatConversations', JSON.stringify(conversations));
  }, [conversations]);
  
  return children;
}
```

## Error Handling and Fallbacks

### 11. Connection Error Handling

```jsx
// In ChatContext.js - Enhanced error handling
import React from "react";
import { useChat } from './context/ChatContext';
import { useNotifications } from './hooks/useNotifications';

function ChatProvider({ children }) {
  const { isConnected, error } = useChat();
  const { showConnectionNotification } = useNotifications();
  
  useEffect(() => {
    if (error) {
      showConnectionNotification(false);
    }
  }, [error]);
  
  return (
    <div className="chat-provider">
      {!isConnected && (
        <div className="connection-warning">
          <p>Chat connection lost. Trying to reconnect...</p>
        </div>
      )}
      {children}
    </div>
  );
}
```

## Testing Integration

### 12. Chat Component Testing

```jsx
// In __tests__/ChatIntegration.test.js
import React from "react";
import { render, screen, fireEvent } from '@testing-library/react';
import { ChatProvider } from '../context/ChatContext';
import StudentDashboard from '../pages/dashboard/student/StudentDashboard';

test('shows unread message count', () => {
  render(
    <ChatProvider>
      <StudentDashboard />
    </ChatProvider>
  );
  
  // Mock unread count
  const unreadBadge = screen.getByText('3');
  expect(unreadBadge).toBeInTheDocument();
});

test('opens chat when clicking message button', () => {
  render(
    <ChatProvider>
      <StudentDashboard />
    </ChatProvider>
  );
  
  const chatButton = screen.getByText('Start Chat');
  fireEvent.click(chatButton);
  
  // Verify navigation
  expect(window.location.pathname).toBe('/messages');
});
```

## Deployment Considerations

### 13. Environment Configuration

```javascript
// In .env files
# Chat Configuration
REACT_APP_CHAT_SERVER_URL=http://localhost:8800
REACT_APP_CHAT_ENABLED=true
REACT_APP_MAX_FILE_SIZE=10485760
REACT_APP_ALLOWED_FILE_TYPES=image/*,.pdf,.doc,.docx,.txt,.zip,.rar

# Backend Chat Configuration
CHAT_SOCKET_PORT=8800
CHAT_MONGODB_URI=mongodb://localhost:27017/focusdesk_chat
CHAT_FILE_UPLOAD_PATH=./uploads/chat
CHAT_MAX_FILE_SIZE=10485760
```

### 14. Production Optimization

```javascript
// In webpack.config.js or vite.config.js
export default {
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          chat: ['socket.io-client', 'react-hot-toast'],
          emoji: ['emoji-picker-react'],
          fileUpload: ['react-dropzone']
        }
      }
    }
  }
};
```

## Summary

This integration guide provides comprehensive examples for:

1. **Basic Integration**: Adding chat notifications and quick access
2. **Advanced Features**: Session-based chat, file sharing, typing indicators
3. **Performance**: Lazy loading, state persistence, error handling
4. **Testing**: Component testing and integration testing
5. **Deployment**: Environment configuration and production optimization

The chat system is designed to be:
- **Modular**: Easy to integrate into existing components
- **Scalable**: Handles multiple conversations and users
- **Real-time**: Instant messaging with typing indicators
- **Secure**: JWT authentication and file validation
- **Responsive**: Works on all device sizes
- **Accessible**: Follows accessibility guidelines

For additional support or questions, refer to the main chat system documentation or contact the development team.
