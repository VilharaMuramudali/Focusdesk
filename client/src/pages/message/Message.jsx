import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext.jsx';
import ChatWindow from '../../components/chat/ChatWindow';
import StudentSidebar from '../dashboard/student/StudentSidebar';
import EducatorSidebar from '../dashboard/educator/EducatorSidebar';
import newRequest from '../../utils/newRequest';
import './Message.scss';

const Message = () => {
  const { id } = useParams(); // conversation ID
  const navigate = useNavigate();
  const { activeConversation, setActiveConversation, conversations } = useChat();
  const [isLoading, setIsLoading] = useState(true);
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

  useEffect(() => {
    const loadConversation = async () => {
      setIsLoading(true);
      try {
        // First check if conversation is already in the chat context
        const found = conversations.find(c => String(c._id) === String(id));
        if (found) {
          setActiveConversation(found);
          setIsLoading(false);
          return;
        }

        // Otherwise fetch from API
        const response = await newRequest.get(`/conversations/${id}`);
        if (response && response.data) {
          setActiveConversation(response.data);
        }
      } catch (error) {
        console.error('Error loading conversation:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadConversation();
    }
  }, [id, conversations, setActiveConversation]);

  const handleBack = () => {
    navigate('/messages');
  };

  const handleCall = () => {
    console.log('Voice call requested');
  };

  const handleVideoCall = () => {
    console.log('Video call requested');
  };

  if (isLoading) {
    return (
      <div className="message-page">
        {currentUser?.isEducator ? (
          <EducatorSidebar tab="messages" setTab={() => {}} />
        ) : (
          <StudentSidebar onLogout={handleLogout} username={currentUser?.username} />
        )}
        <div className="message-content-wrapper">
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading conversation...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="message-page">
      {currentUser?.isEducator ? (
        <EducatorSidebar tab="messages" setTab={() => {}} />
      ) : (
        <StudentSidebar onLogout={handleLogout} username={currentUser?.username} />
      )}
      
      <div className="message-content-wrapper">
        <div className="message-container">
          <ChatWindow
            conversation={activeConversation}
            onBack={handleBack}
            onCall={handleCall}
            onVideoCall={handleVideoCall}
          />
        </div>
      </div>
    </div>
  );
};

export default Message;
