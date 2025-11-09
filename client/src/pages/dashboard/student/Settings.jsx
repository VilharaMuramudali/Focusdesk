import React, { useState, useEffect } from "react";
import SharedHeaderBanner from "./SharedHeaderBanner";
import getCurrentUser from "../../../utils/getCurrentUser";
import newRequest from "../../../utils/newRequest";
import "./Settings.scss";

export default function Settings() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    username: "",
    email: "",
    country: "",
    phone: "",
    desc: "",
    bio: "",
    educationLevel: ""
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Form validation state
  const [errors, setErrors] = useState({});

  // Load current user data
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setProfileForm({
            username: user.username || "",
            email: user.email || "",
            country: user.country || "",
            phone: user.phone || "",
            desc: user.desc || "",
            bio: user.bio || "",
            educationLevel: user.educationLevel || ""
          });
        } else {
          // If no user in localStorage, try to fetch from API
          const response = await newRequest.get("/users/me");
          if (response.data) {
            setCurrentUser(response.data);
            setProfileForm({
              username: response.data.username || "",
              email: response.data.email || "",
              country: response.data.country || "",
              phone: response.data.phone || "",
              desc: response.data.desc || "",
              bio: response.data.bio || "",
              educationLevel: response.data.educationLevel || ""
            });
          }
        }
      } catch (error) {
        console.error("Error loading user data:", error);
        setMessage({ 
          type: "error", 
          text: "Failed to load user data. Please refresh the page." 
        });
      }
    };

    loadUserData();
  }, []);

  const validateProfileForm = () => {
    const newErrors = {};

    if (!profileForm.username.trim()) {
      newErrors.username = "Username is required";
    } else if (profileForm.username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    }

    if (!profileForm.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profileForm.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Country is now optional
    // if (!profileForm.country.trim()) {
    //   newErrors.country = "Country is required";
    // }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors = {};

    if (!passwordForm.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!validateProfileForm()) {
      setLoading(false);
      return;
    }

    if (!currentUser?._id) {
      setMessage({ 
        type: "error", 
        text: "User data not found. Please log in again." 
      });
      setLoading(false);
      return;
    }

    try {
      const response = await newRequest.put(`/users/${currentUser._id}`, profileForm);
      
      // Update local storage with new user data
      const updatedUser = { ...currentUser, ...response.data };
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);
      
      setMessage({ type: "success", text: "Profile updated successfully!" });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
    } catch (error) {
      console.error("Profile update error:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to update profile" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (!validatePasswordForm()) {
      setLoading(false);
      return;
    }

    try {
      await newRequest.put("/auth/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setMessage({ type: "success", text: "Password updated successfully!" });
      
      // Clear password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 5000);
    } catch (error) {
      console.error("Password update error:", error);
      setMessage({ 
        type: "error", 
        text: error.response?.data?.message || "Failed to update password" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (formType, field, value) => {
    console.log(`Input change - Form: ${formType}, Field: ${field}, Value: ${value}`);
    
    if (formType === "profile") {
      setProfileForm(prev => {
        const updated = { ...prev, [field]: value };
        console.log("Updated profile form:", updated);
        return updated;
      });
    } else if (formType === "password") {
      setPasswordForm(prev => {
        const updated = { ...prev, [field]: value };
        console.log("Updated password form:", updated);
        return updated;
      });
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Show loading state while user data is being loaded
  if (!currentUser) {
    return (
      <div className="settings-page">
        <div className="settings-container">
          <SharedHeaderBanner 
            title="Account Settings"
            subtitle="Loading your profile information..."
          />
          <div className="settings-content">
            <div className="settings-card">
              <div className="card-header">
                <h2>Loading...</h2>
              </div>
              <div style={{ textAlign: 'center', padding: '2rem' }}>
                <div className="loading-spinner"></div>
                <p>Loading your profile data...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-container">
        <SharedHeaderBanner 
          title="Account Settings"
          subtitle="Manage your profile information and security preferences"
        />
        
        <div className="settings-content">
          {/* Message Display */}
          {message.text && (
            <div className={`notification-message ${message.type}`}>
              <div className="message-content">
                <div className="message-icon">
                  {message.type === "success" ? "✓" : "✕"}
                </div>
                {message.text}
              </div>
            </div>
          )}



          <div className="settings-grid">
            {/* Profile Settings */}
            <div className="settings-card">
              <div className="card-header">
                <h2>
                  <span className="header-icon">👤</span>
                  Profile Information
                </h2>
                <p className="card-subtitle">
                  Update your personal details and contact information
                </p>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="settings-form">
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="username">Username *</label>
                    <input
                      type="text"
                      id="username"
                      value={profileForm.username}
                      onChange={(e) => handleInputChange("profile", "username", e.target.value)}
                      className={errors.username ? "error" : ""}
                      placeholder="Enter your username"
                    />
                    {errors.username && <span className="error-text">{errors.username}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      value={profileForm.email}
                      onChange={(e) => handleInputChange("profile", "email", e.target.value)}
                      className={errors.email ? "error" : ""}
                      placeholder="Enter your email"
                    />
                    {errors.email && <span className="error-text">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <input
                      type="text"
                      id="country"
                      value={profileForm.country}
                      onChange={(e) => handleInputChange("profile", "country", e.target.value)}
                      className={errors.country ? "error" : ""}
                      placeholder="Enter your country"
                    />
                    {errors.country && <span className="error-text">{errors.country}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="phone">Phone Number</label>
                    <input
                      type="tel"
                      id="phone"
                      value={profileForm.phone}
                      onChange={(e) => handleInputChange("profile", "phone", e.target.value)}
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="educationLevel">Education Level</label>
                  <select
                    id="educationLevel"
                    value={profileForm.educationLevel}
                    onChange={(e) => handleInputChange("profile", "educationLevel", e.target.value)}
                  >
                    <option value="">Select Education Level</option>
                    <option value="highschool">High School</option>
                    <option value="university">University</option>
                    <option value="postgraduate">Postgraduate</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="desc">Short Description</label>
                  <textarea
                    id="desc"
                    value={profileForm.desc}
                    onChange={(e) => handleInputChange("profile", "desc", e.target.value)}
                    rows="3"
                    placeholder="Tell us a bit about yourself..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Bio</label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => handleInputChange("profile", "bio", e.target.value)}
                    rows="4"
                    placeholder="Share more about your background and interests..."
                  />
                </div>

                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Updating Profile...
                    </>
                  ) : (
                    <>
                      <span>💾</span>
                      Update Profile
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Password Settings */}
            <div className="settings-card">
              <div className="card-header">
                <h2>
                  <span className="header-icon">🔒</span>
                  Security Settings
                </h2>
                <p className="card-subtitle">
                  Change your password to keep your account secure
                </p>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <div className="form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <input
                    type="password"
                    id="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={(e) => handleInputChange("password", "currentPassword", e.target.value)}
                    className={errors.currentPassword ? "error" : ""}
                    placeholder="Enter your current password"
                  />
                  {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">New Password *</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={passwordForm.newPassword}
                    onChange={(e) => handleInputChange("password", "newPassword", e.target.value)}
                    className={errors.newPassword ? "error" : ""}
                    placeholder="Enter your new password"
                  />
                  {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirm New Password *</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => handleInputChange("password", "confirmPassword", e.target.value)}
                    className={errors.confirmPassword ? "error" : ""}
                    placeholder="Confirm your new password"
                  />
                  {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
                </div>

                <div className="security-tips">
                  <h4>🔐 Password Security Tips:</h4>
                  <ul>
                    <li>Use at least 6 characters</li>
                    <li>Include a mix of letters, numbers, and symbols</li>
                    <li>Don't use easily guessable information</li>
                    <li>Consider using a password manager</li>
                  </ul>
                </div>

                <button type="submit" className="btn-primary btn-security" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="loading-spinner"></div>
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <span>🔐</span>
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
