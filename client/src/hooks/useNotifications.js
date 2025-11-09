import { useEffect, useCallback } from 'react';
import { toast } from 'react-hot-toast';

export const useNotifications = () => {
  const showMessageNotification = useCallback((message, senderName) => {
    toast.success(`New message from ${senderName}`, {
      duration: 4000,
      position: 'top-right',
      icon: '💬',
      style: {
        background: '#363636',
        color: '#fff',
      },
    });
  }, []);

  const showTypingNotification = useCallback((userName) => {
    toast(`${userName} is typing...`, {
      duration: 2000,
      position: 'top-right',
      icon: '⌨️',
      style: {
        background: '#363636',
        color: '#fff',
      },
    });
  }, []);

  const showConnectionNotification = useCallback((isConnected) => {
    if (isConnected) {
      toast.success('Connected to chat server', {
        duration: 3000,
        position: 'top-right',
        icon: '✅',
      });
    } else {
      toast.error('Disconnected from chat server', {
        duration: 5000,
        position: 'top-right',
        icon: '❌',
      });
    }
  }, []);

  const showFileUploadNotification = useCallback((fileName, success = true) => {
    if (success) {
      toast.success(`File "${fileName}" uploaded successfully`, {
        duration: 3000,
        position: 'top-right',
        icon: '📎',
      });
    } else {
      toast.error(`Failed to upload "${fileName}"`, {
        duration: 4000,
        position: 'top-right',
        icon: '❌',
      });
    }
  }, []);

  const showErrorNotification = useCallback((error) => {
    toast.error(error || 'An error occurred', {
      duration: 5000,
      position: 'top-right',
      icon: '❌',
    });
  }, []);

  const showSuccessNotification = useCallback((message) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-right',
      icon: '✅',
    });
  }, []);

  const showInfoNotification = useCallback((message) => {
    toast(message, {
      duration: 4000,
      position: 'top-right',
      icon: 'ℹ️',
      style: {
        background: '#363636',
        color: '#fff',
      },
    });
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Show browser notification if permission granted
  const showBrowserNotification = useCallback((title, options = {}) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        ...options
      });
    }
  }, []);

  return {
    showMessageNotification,
    showTypingNotification,
    showConnectionNotification,
    showFileUploadNotification,
    showErrorNotification,
    showSuccessNotification,
    showInfoNotification,
    showBrowserNotification
  };
};
