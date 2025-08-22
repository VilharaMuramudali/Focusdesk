// context/ChatContext.jsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';
import newRequest from '../utils/newRequest';

const ChatContext = createContext();

// Initial state
const initialState = {
  socket: null,
  conversations: [],
  activeConversation: null,
  messages: [],
  unreadCount: 0,
  onlineUsers: new Set(),
  typingUsers: new Map(),
  isLoading: false,
  error: null,
  isConnected: false
};

// Action types
const CHAT_ACTIONS = {
  SET_SOCKET: 'SET_SOCKET',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SET_ACTIVE_CONVERSATION: 'SET_ACTIVE_CONVERSATION',
  SET_MESSAGES: 'SET_MESSAGES',
  ADD_MESSAGE: 'ADD_MESSAGE',
  UPDATE_MESSAGE: 'UPDATE_MESSAGE',
  SET_UNREAD_COUNT: 'SET_UNREAD_COUNT',
  SET_ONLINE_USERS: 'SET_ONLINE_USERS',
  SET_TYPING_USERS: 'SET_TYPING_USERS',
  SET_LOADING: 'SET_LOADING',
  SET_ERROR: 'SET_ERROR',
  SET_CONNECTED: 'SET_CONNECTED',
  MARK_MESSAGES_READ: 'MARK_MESSAGES_READ',
  UPDATE_CONVERSATION: 'UPDATE_CONVERSATION',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
function chatReducer(state, action) {
  switch (action.type) {
    case CHAT_ACTIONS.SET_SOCKET:
      return { ...state, socket: action.payload };
    
    case CHAT_ACTIONS.SET_CONVERSATIONS:
      return { ...state, conversations: action.payload };
    
    case CHAT_ACTIONS.SET_ACTIVE_CONVERSATION:
      return { ...state, activeConversation: action.payload };
    
    case CHAT_ACTIONS.SET_MESSAGES:
      return { ...state, messages: action.payload };
    
    case CHAT_ACTIONS.ADD_MESSAGE:
      // Prevent duplicate messages
      const messageExists = state.messages.some(msg => msg._id === action.payload._id);
      if (messageExists) return state;
      
      const newMessages = [...state.messages, action.payload];
      return { ...state, messages: newMessages };
    
    case CHAT_ACTIONS.UPDATE_MESSAGE:
      const updatedMessages = state.messages.map(msg =>
        msg._id === action.payload._id ? { ...msg, ...action.payload } : msg
      );
      return { ...state, messages: updatedMessages };
    
    case CHAT_ACTIONS.SET_UNREAD_COUNT:
      return { ...state, unreadCount: action.payload };
    
    case CHAT_ACTIONS.SET_ONLINE_USERS:
      return { ...state, onlineUsers: new Set(action.payload) };
    
    case CHAT_ACTIONS.SET_TYPING_USERS:
      return { ...state, typingUsers: new Map(action.payload) };
    
    case CHAT_ACTIONS.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case CHAT_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload };
    
    case CHAT_ACTIONS.CLEAR_ERROR:
      return { ...state, error: null };
    
    case CHAT_ACTIONS.SET_CONNECTED:
      return { ...state, isConnected: action.payload };
    
    case CHAT_ACTIONS.MARK_MESSAGES_READ:
      const readMessages = state.messages.map(msg =>
        msg.conversationId === action.payload.conversationId && 
        msg.senderId !== action.payload.userId && 
        !msg.read
          ? { ...msg, read: true, readAt: new Date() }
          : msg
      );
      return { ...state, messages: readMessages };
    
    case CHAT_ACTIONS.UPDATE_CONVERSATION:
      const updatedConversations = state.conversations.map(conv =>
        conv._id === action.payload._id 
          ? { ...conv, ...action.payload } 
          : conv
      );
      return { ...state, conversations: updatedConversations };
    
    default:
      return state;
  }
}

// Chat Provider Component
export function ChatProvider({ children }) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  // Initialize Socket.io connection
  useEffect(() => {
    if (!currentUser) return;

    const socket = io('http://localhost:8800', {
      auth: {
        token: localStorage.getItem('accessToken')
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      maxReconnectionAttempts: 5
    });

    dispatch({ type: CHAT_ACTIONS.SET_SOCKET, payload: socket });

    // Connection events
    socket.on('connect', () => {
      console.log('Connected to chat server');
      dispatch({ type: CHAT_ACTIONS.SET_CONNECTED, payload: true });
      dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
      
      // Join user to their personal room
      socket.emit('join', {
        userId: currentUser._id,
        userName: currentUser.username,
        userType: currentUser.isEducator ? 'educator' : 'student'
      });
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from chat server');
      dispatch({ type: CHAT_ACTIONS.SET_CONNECTED, payload: false });
    });

    socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.message });
      dispatch({ type: CHAT_ACTIONS.SET_CONNECTED, payload: false });
    });

    socket.on('reconnect', () => {
      console.log('Reconnected to chat server');
      toast.success('Connected to chat server');
    });

    // Chat events
    socket.on('message', (data) => {
      if (data.message && data.message.senderId !== currentUser._id) {
        dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: data.message });
        
        // Show notification if not in active conversation
        if (state.activeConversation?._id !== data.message.conversationId) {
          toast.success(`New message from ${data.message.senderName}`, {
            duration: 3000,
            icon: '💬',
          });
        }
        
        // Update conversation last message
        dispatch({
          type: CHAT_ACTIONS.UPDATE_CONVERSATION,
          payload: {
            _id: data.message.conversationId,
            lastMessage: data.message,
            updatedAt: new Date()
          }
        });
      }
    });

    socket.on('message_delivered', (data) => {
      dispatch({ 
        type: CHAT_ACTIONS.UPDATE_MESSAGE, 
        payload: { ...data.message, delivered: true, deliveredAt: new Date() }
      });
    });

    socket.on('typing_start', (data) => {
      if (data.userId !== currentUser._id) {
        const newTypingUsers = new Map(state.typingUsers);
        newTypingUsers.set(data.userId, data.userName);
        dispatch({ type: CHAT_ACTIONS.SET_TYPING_USERS, payload: Array.from(newTypingUsers) });
      }
    });

    socket.on('typing_stop', (data) => {
      const newTypingUsers = new Map(state.typingUsers);
      newTypingUsers.delete(data.userId);
      dispatch({ type: CHAT_ACTIONS.SET_TYPING_USERS, payload: Array.from(newTypingUsers) });
    });

    socket.on('user_online', (data) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.add(data.userId);
      dispatch({ type: CHAT_ACTIONS.SET_ONLINE_USERS, payload: Array.from(newOnlineUsers) });
    });

    socket.on('user_offline', (data) => {
      const newOnlineUsers = new Set(state.onlineUsers);
      newOnlineUsers.delete(data.userId);
      dispatch({ type: CHAT_ACTIONS.SET_ONLINE_USERS, payload: Array.from(newOnlineUsers) });
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

  // Load conversations on mount
  useEffect(() => {
    if (state.isConnected && currentUser) {
      loadConversations();
    }
  }, [state.isConnected, currentUser]);

  // API Functions
  const loadConversations = async () => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      const response = await newRequest.get('/conversations');
      dispatch({ type: CHAT_ACTIONS.SET_CONVERSATIONS, payload: response.data.conversations || [] });
    } catch (error) {
      console.error('Error loading conversations:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.response?.data?.message || error.message });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const loadMessages = async (conversationId, page = 1) => {
    try {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: true });
      const response = await newRequest.get(`/messages/${conversationId}?page=${page}`);
      
      if (page === 1) {
        dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: response.data.messages || [] });
      } else {
        dispatch({ type: CHAT_ACTIONS.SET_MESSAGES, payload: [...(response.data.messages || []), ...state.messages] });
      }
      
      // Mark messages as read
      markMessagesAsRead(conversationId);
    } catch (error) {
      console.error('Error loading messages:', error);
      dispatch({ type: CHAT_ACTIONS.SET_ERROR, payload: error.response?.data?.message || error.message });
    } finally {
      dispatch({ type: CHAT_ACTIONS.SET_LOADING, payload: false });
    }
  };

  const sendMessage = async (conversationId, content, messageType = 'text', file = null) => {
    try {
      const messageData = {
        conversationId,
        content: content || '',
        messageType
      };

      // If file is provided, upload it first
      if (file && (messageType === 'file' || messageType === 'image')) {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await newRequest.post('/upload/chat', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        
        messageData.fileUrl = uploadResponse.data.url;
        messageData.fileName = uploadResponse.data.fileName;
        messageData.fileSize = uploadResponse.data.fileSize;
        messageData.fileType = uploadResponse.data.fileType;
      }

      const response = await newRequest.post('/messages', messageData);
      
      // Add message to local state immediately
      dispatch({ type: CHAT_ACTIONS.ADD_MESSAGE, payload: response.data });
      
      // Emit message via socket for real-time delivery
      if (state.socket && state.isConnected) {
        state.socket.emit('message', {
          conversationId,
          message: response.data
        });
      }
      
      // Update conversation with last message
      dispatch({ 
        type: CHAT_ACTIONS.UPDATE_CONVERSATION, 
        payload: { 
          _id: conversationId, 
          lastMessage: response.data,
          updatedAt: new Date()
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error sending message:', error);
      
      let errorMessage = 'Failed to send message. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in again to send messages.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Conversation not found. Please try again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid message data.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const createConversation = async (receiverId, receiverName, receiverType, bookingId = null) => {
    try {
      const response = await newRequest.post('/conversations', {
        receiverId,
        receiverName,
        receiverType,
        bookingId
      });
      
      const newConversation = response.data;
      dispatch({ 
        type: CHAT_ACTIONS.SET_CONVERSATIONS, 
        payload: [newConversation, ...state.conversations] 
      });
      
      return newConversation;
    } catch (error) {
      console.error('Error creating conversation:', error);
      
      let errorMessage = 'Failed to create conversation. Please try again.';
      if (error.response?.status === 401) {
        errorMessage = 'Please log in again to create conversations.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid conversation data.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message === 'Network Error') {
        errorMessage = 'Unable to connect to server. Please check your internet connection.';
      }
      
      toast.error(errorMessage);
      throw error;
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      await newRequest.put(`/messages/read/${conversationId}`);
      dispatch({ 
        type: CHAT_ACTIONS.MARK_MESSAGES_READ, 
        payload: { conversationId, userId: currentUser._id } 
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const startTyping = (conversationId) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('typing_start', { 
        conversationId, 
        userId: currentUser._id,
        userName: currentUser.username
      });
    }
  };

  const stopTyping = (conversationId) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('typing_stop', { 
        conversationId, 
        userId: currentUser._id,
        userName: currentUser.username
      });
    }
  };

  const joinConversation = (conversationId) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('join_conversation', { conversationId, userId: currentUser._id });
    }
  };

  const leaveConversation = (conversationId) => {
    if (state.socket && state.isConnected) {
      state.socket.emit('leave_conversation', { conversationId, userId: currentUser._id });
    }
  };

  const clearError = () => {
    dispatch({ type: CHAT_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    loadConversations,
    loadMessages,
    sendMessage,
    createConversation,
    markMessagesAsRead,
    startTyping,
    stopTyping,
    joinConversation,
    leaveConversation,
    clearError,
    setActiveConversation: (conversation) => 
      dispatch({ type: CHAT_ACTIONS.SET_ACTIVE_CONVERSATION, payload: conversation })
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

// Custom hook to use chat context
export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
