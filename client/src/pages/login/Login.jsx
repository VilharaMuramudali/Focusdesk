import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaUser, FaLock, FaSignInAlt } from "react-icons/fa";
import newRequest from "../../utils/newRequest";
import "./Login.scss";

function Login() {
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Check if there's a success message from registration
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // Helper function to determine dashboard route based on user role
  const getDashboardRoute = (userData) => {
    if (userData.isEducator === true) {
      return '/educator-dashboard'; // Navigate to educator dashboard
    } else {
      return '/student-dashboard'; // Navigate to student dashboard
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await newRequest.post("/auth/login", { 
        username: formData.username, 
        password: formData.password 
      });
      
      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(res.data));
      
      // Determine appropriate dashboard based on user role
      const dashboardRoute = getDashboardRoute(res.data);
      
      setLoading(false);
      navigate(dashboardRoute); // Navigate to the correct dashboard
    } catch (err) {
      setLoading(false);
      
      if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError(err.response?.data?.message || 
                err.response?.data || 
                "Invalid username or password");
      }
      console.error("Login error:", err);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Welcome Back</h1>
          <p>Log in to access your learning journey</p>
        </div>

        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">
              <FaUser /> Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">
              <FaLock /> Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="forgot-password">
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              "Logging in..."
            ) : (
              <>
                <FaSignInAlt /> Log In
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <p>Don`t have an account? <a href="/register">Sign up</a></p>
        </div>
      </div>
    </div>
  );
}

export default Login;
