import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.scss';

function Navbar() {
  return (
    <nav className="tutor-navbar">
      <div className="navbar-container">
        <h1 className="logo">Tutor Dashboard</h1>
        <ul className="nav-links">
          <li><Link to="/tutor-dashboard/home">Home</Link></li>
          <li><Link to="/tutor-dashboard/schedules">My Schedules</Link></li>
          <li><Link to="/tutor-dashboard/payments">Payments</Link></li>
          <li><Link to="/tutor-dashboard/notifications">Notifications</Link></li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
