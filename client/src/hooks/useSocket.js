import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { toast } from 'react-hot-toast';

export const useSocket = (url = 'http://localhost:8800') => {
  const socketRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  const connect = useCallback(() => {
    if (!currentUser) return null;

    const socket = io(url, {
      auth: {
        token: localStorage.getItem('accessToken')
      },
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      
      // Join user to their personal room
      socket.emit('join', {
        userId: currentUser._id,
        userName: currentUser.username,
        userType: currentUser.isEducator ? 'educator' : 'student'
      });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to chat server');
    });

    socketRef.current = socket;
    return socket;
  }, [url, currentUser]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
  }, []);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const on = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.on(event, callback);
    }
  }, []);

  const off = useCallback((event, callback) => {
    if (socketRef.current) {
      socketRef.current.off(event, callback);
    }
  }, []);

  const joinRoom = useCallback((roomId, userId) => {
    emit('join_room', { bookingId: roomId, userId });
  }, [emit]);

  const leaveRoom = useCallback((roomId, userId) => {
    emit('leave_room', { bookingId: roomId, userId });
  }, [emit]);

  const sendMessage = useCallback((roomId, message) => {
    emit('message', { bookingId: roomId, message });
  }, [emit]);

  const startTyping = useCallback((roomId, userId, userName) => {
    emit('typing_start', { bookingId: roomId, userId, userName });
  }, [emit]);

  const stopTyping = useCallback((roomId, userId, userName) => {
    emit('typing_stop', { bookingId: roomId, userId, userName });
  }, [emit]);

  useEffect(() => {
    const socket = connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    socket: socketRef.current,
    connect,
    disconnect,
    emit,
    on,
    off,
    joinRoom,
    leaveRoom,
    sendMessage,
    startTyping,
    stopTyping,
    isConnected: socketRef.current?.connected || false
  };
};
