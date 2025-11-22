import React, { createContext, useContext, useEffect, useState } from 'react';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState(() => {
    try {
      const raw = localStorage.getItem('fd_notifications');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('fd_notifications', JSON.stringify(notifications));
    } catch (e) {
      // ignore
    }
  }, [notifications]);

  const addNotification = (payload) => {
    const entry = {
      id: Date.now() + Math.floor(Math.random() * 1000),
      read: false,
      timestamp: Date.now(),
      ...payload,
    };
    setNotifications((p) => [entry, ...p]);
  };

  const removeNotification = (id) => {
    setNotifications((p) => p.filter((n) => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification, markAllRead }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotificationContext = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotificationContext must be used within NotificationProvider');
  return ctx;
};

export default NotificationContext;
