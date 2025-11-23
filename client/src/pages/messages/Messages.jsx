import React, { useState, useEffect } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import { useLocation } from 'react-router-dom';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import StudentSidebar from '../dashboard/student/StudentSidebar';
import EducatorSidebar from '../dashboard/educator/EducatorSidebar';
import newRequest from '../../utils/newRequest';
import useAnalytics from '../../hooks/useAnalytics';
import './Messages.scss';

const Messages = () => {
  const { createConversation, activeConversation, setActiveConversation, conversations } = useChat();
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const location = useLocation();

  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  const { recordSearch } = useAnalytics();
  
  const handleLogout = async () => {
    try {
      await newRequest.post('/auth/logout');
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      localStorage.removeItem('currentUser');
      window.location.href = '/';
    }
  };

  const handleConversationSelect = (conversation) => {
    setActiveConversation(conversation);
  };

  const handleCreateNewChat = () => {
    setShowNewChatModal(true);
  };

  const handleNewChatSubmit = async (participantId, participantName, receiverType) => {
    try {
      const newConversation = await createConversation(participantId, participantName, receiverType);
      setActiveConversation(newConversation);
      setShowNewChatModal(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleBack = () => {
    setActiveConversation(null);
  };

  // Support opening a conversation passed via navigation (state or query param)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const conversationId = params.get('conversationId') || location.state?.conversationId;
    if (!conversationId) return;

    // If conversation already loaded in context, set it
    const found = conversations.find(c => String(c._id) === String(conversationId));
    if (found) {
      setActiveConversation(found);
      return;
    }

    // Otherwise fetch from API
    (async () => {
      try {
        const newRequest = (await import('../../utils/newRequest')).default;
        const res = await newRequest.get(`/conversations/${conversationId}`);
        if (res && res.data) setActiveConversation(res.data);
      } catch (err) {
        console.error('Failed to open conversation from navigation:', err);
      }
    })();
  }, [location, conversations, setActiveConversation]);

  const handleCall = () => {
    // Implement voice call functionality
    console.log('Voice call requested');
  };

  const handleVideoCall = () => {
    // Implement video call functionality
    console.log('Video call requested');
  };

  return (
    <div className="messages-page">
      {/* Side Navigation Bar */}
      {currentUser?.isEducator ? (
        <EducatorSidebar tab="messages" setTab={() => {}} />
      ) : (
        <StudentSidebar onLogout={handleLogout} username={currentUser?.username} />
      )}
      
      <div className="messages-content-wrapper">
        <div className="messages-container">
          <ChatSidebar
            onConversationSelect={handleConversationSelect}
            onCreateNewChat={handleCreateNewChat}
          />
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
            onCall={handleCall}
            onVideoCall={handleVideoCall}
          />
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <NewChatModal
          onClose={() => setShowNewChatModal(false)}
          onSubmit={handleNewChatSubmit}
          selectedUser={selectedUser}
          setSelectedUser={setSelectedUser}
        />
      )}
    </div>
  );
};

// New Chat Modal Component
const NewChatModal = ({ onClose, onSubmit, selectedUser, setSelectedUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const handleSearch = async (term) => {
    if (!term.trim() || term.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await newRequest.get(`/users/search?q=${encodeURIComponent(term.trim())}`);
      const users = response.data.users || [];
      
      // Filter users based on current user type
      // Educators can chat with students, Students can chat with educators
      const filteredUsers = users.filter(user => {
        if (currentUser?.isEducator) {
          // Educators can only chat with students
          return !user.isEducator;
        } else {
          // Students can only chat with educators
          return user.isEducator;
        }
      });
      
      setSearchResults(filteredUsers);
      // Best-effort: record the search for analytics
      try {
        if (currentUser && currentUser._id) {
          await recordSearch({ userId: currentUser._id, query: term.trim(), filters: {}, resultsCount: filteredUsers.length });
        }
      } catch (recErr) {
        console.warn('Failed to persist chat user search:', recErr?.message || recErr);
      }
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleSubmit = () => {
    if (selectedUser) {
      const receiverType = selectedUser.isEducator ? 'educator' : 'student';
      onSubmit(selectedUser._id, selectedUser.username, receiverType);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Start New Chat</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="search-section">
            <input
              type="text"
              placeholder={currentUser?.isEducator ? "Search for students..." : "Search for educators..."}
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                handleSearch(e.target.value);
              }}
            />
          </div>
          
          <div className="search-results">
            {isSearching ? (
              <div className="loading">Searching...</div>
            ) : (
              searchResults.map(user => (
                <div
                  key={user._id}
                  className={`user-item ${selectedUser?._id === user._id ? 'selected' : ''}`}
                  onClick={() => handleUserSelect(user)}
                >
                  <div className="user-avatar">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="user-info">
                    <span className="username">{user.username}</span>
                    <span className="user-type">
                      {user.isEducator ? 'Educator' : 'Student'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="modal-footer">
          <button className="cancel-btn" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="start-chat-btn"
            onClick={handleSubmit}
            disabled={!selectedUser}
          >
            Start Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default Messages;
