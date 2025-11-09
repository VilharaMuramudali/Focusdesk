import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaSearch,
  FaCalendarAlt,
  FaBook,
  FaEnvelope,
  FaCreditCard,
  FaCog,
  FaSignOutAlt,
} from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import { safeSetInterval } from "../../../utils/memoryUtils";
import "./studentDashboard.scss";

export default function StudentSidebar({ onLogout, username }) {
  const location = useLocation();
  const [pendingSessionsCount, setPendingSessionsCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    
    const fetchPendingSessions = async () => {
      if (!isMounted) return;
      
      try {
        const response = await newRequest.get('/bookings/student?status=pending');
        if (isMounted) {
          setPendingSessionsCount(response.data.length);
        }
      } catch (error) {
        console.error('Error fetching pending sessions:', error);
        // Don't update state on error to avoid UI flicker
      }
    };

    fetchPendingSessions();
    // Poll for updates every 60 seconds instead of 30 to reduce API calls
    const cleanup = safeSetInterval(fetchPendingSessions, 60000);
    
    return () => {
      isMounted = false;
      cleanup();
    };
  }, []);

  const menuItems = [
    { label: "Home (Learning Overview)", icon: <FaHome />, to: "/student-dashboard" },
    { label: "Find Tutors", icon: <FaSearch />, to: "/find-tutors" },
    { 
      label: "My Sessions", 
      icon: <FaCalendarAlt />, 
      to: "/my-sessions",
      badge: pendingSessionsCount > 0 ? pendingSessionsCount : null
    },
    { label: "My Learning", icon: <FaBook />, to: "/my-learning" },
    { label: "Messages", icon: <FaEnvelope />, to: "/messages" },
    { label: "Payments", icon: <FaCreditCard />, to: "/payments" },
    { label: "Settings", icon: <FaCog />, to: "/settings" },
  ];

  return (
    <div className="student-sidebar">
      <div className="student-sidebar-logo">FocusDesk</div>
      <div className="student-sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`student-sidebar-item${location.pathname === item.to ? " active" : ""}`}
          >
            <span className="student-sidebar-icon">{item.icon}</span>
            <span className="student-sidebar-label">{item.label}</span>
            {item.badge && (
              <span className="student-sidebar-badge">{item.badge}</span>
            )}
          </Link>
        ))}
      </div>
      <div className="student-sidebar-logout" onClick={onLogout}>
        <FaSignOutAlt className="student-sidebar-icon" />
        <span className="student-sidebar-label">Logout</span>
      </div>
    </div>
  );
} 