import React from 'react';
import './Notifications.scss';

function Notifications() {
  const mockNotifications = [
    { id: 1, message: 'Your session with John Doe is scheduled for 2025-04-07 at 10:00 AM.' },
    { id: 2, message: 'Payment of $75 is pending for your session with Jane Smith.' },
  ];

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      <ul className="notification-list">
        {mockNotifications.map((notification) => (
          <li key={notification.id} className="notification-item">
            <p>{notification.message}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Notifications;
