import React, { useState } from 'react';
import { useChat } from '../../context/ChatContext.jsx';
import ChatSidebar from '../../components/chat/ChatSidebar';
import ChatWindow from '../../components/chat/ChatWindow';
import StudentSidebar from '../dashboard/student/StudentSidebar';
import EducatorSidebar from '../dashboard/educator/EducatorSidebar';
import newRequest from '../../utils/newRequest';
import './Messages.scss';

const Messages = () => {
  const { createConversation } = useChat();
  const [activeConversation, setActiveConversation] = useState(null);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
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

  const handleNewChatSubmit = async (participantId, participantName) => {
    try {
      const newConversation = await createConversation(participantId, participantName);
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

  const handleSearch = async (term) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // This would be an API call to search for users
      // For now, we'll simulate it
      const mockResults = [
        { _id: '1', username: 'John Doe', isEducator: true },
        { _id: '2', username: 'Jane Smith', isEducator: false },
        { _id: '3', username: 'Bob Johnson', isEducator: true }
      ].filter(user => 
        user.username.toLowerCase().includes(term.toLowerCase())
      );
      
      setSearchResults(mockResults);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUserSelect = (user) => {
    setSelectedUser(user);
  };

  const handleSubmit = () => {
    if (selectedUser) {
      onSubmit(selectedUser._id, selectedUser.username);
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
              placeholder="Search for users..."
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
