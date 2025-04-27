import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { FaUser, FaSignOutAlt, FaBook, FaGraduationCap, FaTimes } from "react-icons/fa";
import newRequest from "../../utils/newRequest";
import "./Navbar.scss";
import SlidingPanel from "../SlidingPanel/SlidingPanel";
import Register from "../../pages/register/Register";

function Navbar() {
  const [active, setActive] = useState(false);
  const [open, setOpen] = useState(false);
  const [registerPanelOpen, setRegisterPanelOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  // Handle scroll effect for navbar
  const isActive = () => {
    window.scrollY > 0 ? setActive(true) : setActive(false);
  };

  useEffect(() => {
    window.addEventListener("scroll", isActive);
    return () => {
      window.removeEventListener("scroll", isActive);
    };
  }, []);

  // Handle user logout
  const handleLogout = async () => {
    try {
      await newRequest.post("/auth/logout");
      localStorage.removeItem("currentUser");
      navigate("/");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Get server URL for image paths
  const getServerUrl = () => {
    return import.meta.env.VITE_API_URL || "http://localhost:8800";
  };

  // Handle register button click
  const handleRegisterClick = (e) => {
    e.preventDefault();
    setRegisterPanelOpen(true);
  };

  return (
    <>
      <div className={active || pathname !== "/" ? "navbar active" : "navbar"}>
        <div className="container">
          <div className="logo">
            <Link className="link" to="/">
              <span className="text">FocusDesk</span>
            </Link>
          </div>
          
          <div className="nav-links">
            <Link to="/" className="link">
              <span>Home</span>
            </Link>
            
            <div className="dropdown-link">
              <Link to="/products" className="link">
                <span>Products</span>
              </Link>
            </div>
            
            <div className="dropdown-link">
              <Link to="/features" className="link">
                <span>Features</span>
              </Link>
            </div>
            
            <Link to="/pricing" className="link">
              <span>Pricing</span>
            </Link>
            
            <Link to="/resource" className="link">
              <span>Resource</span>
            </Link>
            
            <Link to="/company" className="link">
              <span>Company</span>
            </Link>
            {/* Dashboard link - only visible when user is logged in */}
            {currentUser && (
            <Link to={currentUser.isEducator ? "/educator-dashboard" : "/student-dashboard"} className="link dashboard-link">
            <span>Dashboard</span>
            </Link>
            )}
          </div>
          
          <div className="auth-buttons">
            {currentUser ? (
              <div className="user" onClick={() => setOpen(!open)}>
                {currentUser.img ? (
                  <img 
                    src={currentUser.img.startsWith('http') 
                      ? currentUser.img 
                      : `${getServerUrl()}/${currentUser.img}`} 
                    alt="Profile" 
                  />
                ) : (
                  <div className="avatar-placeholder">
                    <FaUser />
                  </div>
                )}
                <span>{currentUser.username}</span>
                
                {/* Dropdown menu */}
                {open && (
                  <div className="options">
                    {currentUser.isEducator ? (
                      <Link className="link" to="/educator-dashboard">
                        <FaGraduationCap /> Dashboard
                      </Link>
                    ) : (
                      <Link className="link" to="/student-dashboard">
                        <FaBook /> Dashboard
                      </Link>
                    )}
                    
                    <Link className="link" to="/orders">
                      Orders
                    </Link>
                    
                    <Link className="link" to="/messages">
                      Messages
                    </Link>
                    
                    <div className="link logout" onClick={handleLogout}>
                      <FaSignOutAlt /> Logout
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to="/login" className="login-link">Login</Link>
                <div className="register-button">
                  <button onClick={handleRegisterClick}>Register</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Sliding Panel for Registration Form */}
      <SlidingPanel 
        isOpen={registerPanelOpen} 
        onClose={() => setRegisterPanelOpen(false)}
        position="right"
        size={80}
      >
        <div className="panel-header">
          <button className="close-button" onClick={() => setRegisterPanelOpen(false)}>
            <FaTimes />
          </button>
        </div>
        <Register inPanel={true} onRegisterSuccess={() => setRegisterPanelOpen(false)} />
      </SlidingPanel>
    </>
  );
}

export default Navbar;
