import React from "react";
import {
  FaUser,
  FaBox,
  FaCalendarAlt,
  FaCreditCard,
  FaCog,
  FaTools,
  FaSignOutAlt,
} from "react-icons/fa";
import "./educatorSidebar.scss";

export default function EducatorSidebar({ tab, setTab }) {
  const handleLogout = () => {
    window.location.href = "/";
  };

  return (
    <div className="ed-sidebar">
      <div className="ed-sidebar-logo">FocusDesk</div>
      <div className="ed-sidebar-menu">
        <div
          className={`ed-sidebar-item ${tab === "profile" ? "active" : ""}`}
          onClick={() => setTab("profile")}
        >
          <FaUser className="ed-sidebar-icon" />
          <span>Profile</span>
        </div>
        <div
          className={`ed-sidebar-item ${tab === "packages" ? "active" : ""}`}
          onClick={() => setTab("packages")}
        >
          <FaBox className="ed-sidebar-icon" />
          <span>Packages</span>
        </div>
        <div
          className={`ed-sidebar-item ${tab === "schedules" ? "active" : ""}`}
          onClick={() => setTab("schedules")}
        >
          <FaCalendarAlt className="ed-sidebar-icon" />
          <span>Schedules</span>
        </div>
        <div
          className={`ed-sidebar-item ${tab === "payments" ? "active" : ""}`}
          onClick={() => setTab("payments")}
        >
          <FaCreditCard className="ed-sidebar-icon" />
          <span>Payments</span>
        </div>
        <div
          className={`ed-sidebar-item ${tab === "settings" ? "active" : ""}`}
          onClick={() => setTab("settings")}
        >
          <FaCog className="ed-sidebar-icon" />
          <span>Settings</span>
        </div>
        <div
          className={`ed-sidebar-item ${tab === "tools" ? "active" : ""}`}
          onClick={() => setTab("tools")}
        >
          <FaTools className="ed-sidebar-icon" />
          <span>Tools</span>
        </div>
      </div>
      <div className="ed-sidebar-logout" onClick={handleLogout}>
        <FaSignOutAlt className="ed-sidebar-icon" />
        <span>Logout</span>
      </div>
    </div>
  );
}
