import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FaHome,
  FaSearch,
  FaCalendarAlt,
  FaChartLine,
  FaBook,
  FaEnvelope,
  FaCreditCard,
  FaCog,
  FaSignOutAlt,
  FaClipboardList,
} from "react-icons/fa";
import "./studentDashboard.scss";

export default function StudentSidebar({ onLogout, username }) {
  const location = useLocation();
  const menuItems = [
    { label: "Home (Learning Overview)", icon: <FaHome />, to: "/student-dashboard" },
    { label: "Find Tutors", icon: <FaSearch />, to: "/find-tutors" },
    { label: "My Sessions", icon: <FaCalendarAlt />, to: "/my-sessions" },
    { label: "My Bookings", icon: <FaClipboardList />, to: "/my-bookings" },
    { label: "Learning Progress", icon: <FaChartLine />, to: "/learning-progress" },
    { label: "My Learning", icon: <FaBook />, to: "/my-learning" },
    { label: "Messages", icon: <FaEnvelope />, to: "/messages" },
    { label: "Payments", icon: <FaCreditCard />, to: "/payments" },
    { label: "Settings", icon: <FaCog />, to: "/settings" },
  ];

  return (
    <div className="student-sidebar">
      <div className="student-sidebar-logo">FocusDesk</div>
      {username && (
        <div className="student-sidebar-user">
          <span className="student-sidebar-user-label">Logged in as</span>
          <span className="student-sidebar-username">{username}</span>
        </div>
      )}
      <div className="student-sidebar-menu">
        {menuItems.map((item) => (
          <Link
            key={item.label}
            to={item.to}
            className={`student-sidebar-item${location.pathname === item.to ? " active" : ""}`}
          >
            <span className="student-sidebar-icon">{item.icon}</span>
            <span className="student-sidebar-label">{item.label}</span>
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