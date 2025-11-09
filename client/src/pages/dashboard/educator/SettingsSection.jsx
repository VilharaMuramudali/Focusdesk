import React, { useState, useEffect } from "react";
import { FaUser, FaLock, FaBell, FaPalette, FaGlobe, FaShieldAlt, FaGraduationCap, FaBook, FaClock, FaDollarSign } from "react-icons/fa";
import getCurrentUser from "../../../utils/getCurrentUser";
import newRequest from "../../../utils/newRequest";
import "./SettingsSection.scss";

export default function SettingsSection() {
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
    specialization: "",
    experience: "",
    hourlyRate: "",
    availability: ""
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    bookingRequests: true,
    sessionReminders: true,
    newReviews: true,
    paymentNotifications: true,
    marketingEmails: false
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showContactInfo: true,
    showReviews: true,
    allowDirectMessages: true
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
            specialization: user.specialization || "",
            experience: user.experience || "",
            hourlyRate: user.hourlyRate || "",
            availability: user.availability || ""
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
              specialization: response.data.specialization || "",
              experience: response.data.experience || "",
              hourlyRate: response.data.hourlyRate || "",
              availability: response.data.availability || ""
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

    if (!profileForm.specialization.trim()) {
      newErrors.specialization = "Specialization is required";
    }

    if (!profileForm.experience.trim()) {
      newErrors.experience = "Experience level is required";
    }

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

  const handleNotificationChange = (setting) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  const handlePrivacyChange = (setting, value) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handleInputChange = (formType, field, value) => {
    if (formType === "profile") {
      setProfileForm(prev => ({ ...prev, [field]: value }));
    } else if (formType === "password") {
      setPasswordForm(prev => ({ ...prev, [field]: value }));
    }
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  // Show loading state while user data is being loaded
  if (!currentUser) {
    return (
      <div className="ed-settings-page">
        <div className="ed-settings-container">
          <div className="ed-settings-header">
            <h2>Account Settings</h2>
            <p>Loading your profile information...</p>
          </div>
          <div className="ed-settings-content">
            <div className="ed-settings-card">
              <div className="card-header">
                <h3>Loading...</h3>
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
    <div className="ed-settings-page">
      <div className="ed-settings-container">
        <div className="ed-settings-header">
          <h2>Account Settings</h2>
          <p>Manage your profile information, security preferences, and teaching settings</p>
        </div>
        
        <div className="ed-settings-content">
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

          <div className="ed-settings-grid">
            {/* Profile Settings */}
            <div className="ed-settings-card">
              <div className="card-header">
                <h3>
                  <FaUser className="header-icon" />
                  Profile Information
                </h3>
                <p className="card-subtitle">
                  Update your personal details and teaching credentials
                </p>
              </div>
              
              <form onSubmit={handleProfileSubmit} className="ed-settings-form">
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

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="specialization">Teaching Specialization *</label>
                    <input
                      type="text"
                      id="specialization"
                      value={profileForm.specialization}
                      onChange={(e) => handleInputChange("profile", "specialization", e.target.value)}
                      className={errors.specialization ? "error" : ""}
                      placeholder="e.g., Mathematics, Science, English"
                    />
                    {errors.specialization && <span className="error-text">{errors.specialization}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="experience">Years of Experience *</label>
                    <select
                      id="experience"
                      value={profileForm.experience}
                      onChange={(e) => handleInputChange("profile", "experience", e.target.value)}
                      className={errors.experience ? "error" : ""}
                    >
                      <option value="">Select Experience</option>
                      <option value="0-1">0-1 years</option>
                      <option value="1-3">1-3 years</option>
                      <option value="3-5">3-5 years</option>
                      <option value="5-10">5-10 years</option>
                      <option value="10+">10+ years</option>
                    </select>
                    {errors.experience && <span className="error-text">{errors.experience}</span>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="hourlyRate">Default Hourly Rate (Rs.)</label>
                    <input
                      type="number"
                      id="hourlyRate"
                      value={profileForm.hourlyRate}
                      onChange={(e) => handleInputChange("profile", "hourlyRate", e.target.value)}
                      placeholder="Enter your default hourly rate"
                      min="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="availability">Availability</label>
                    <select
                      id="availability"
                      value={profileForm.availability}
                      onChange={(e) => handleInputChange("profile", "availability", e.target.value)}
                    >
                      <option value="">Select Availability</option>
                      <option value="full-time">Full Time</option>
                      <option value="part-time">Part Time</option>
                      <option value="weekends">Weekends Only</option>
                      <option value="evenings">Evenings Only</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="desc">Short Description</label>
                  <textarea
                    id="desc"
                    value={profileForm.desc}
                    onChange={(e) => handleInputChange("profile", "desc", e.target.value)}
                    rows="3"
                    placeholder="Brief description about your teaching approach..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="bio">Detailed Bio</label>
                  <textarea
                    id="bio"
                    value={profileForm.bio}
                    onChange={(e) => handleInputChange("profile", "bio", e.target.value)}
                    rows="4"
                    placeholder="Share your teaching philosophy, qualifications, and what makes you unique..."
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
                      <FaUser />
                      Update Profile
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Settings */}
            <div className="ed-settings-card">
              <div className="card-header">
                <h3>
                  <FaLock className="header-icon" />
                  Security Settings
                </h3>
                <p className="card-subtitle">
                  Change your password to keep your account secure
                </p>
              </div>
              
              <form onSubmit={handlePasswordSubmit} className="ed-settings-form">
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
                      <FaLock />
                      Change Password
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Notification Settings */}
            <div className="ed-settings-card">
              <div className="card-header">
                <h3>
                  <FaBell className="header-icon" />
                  Notification Preferences
                </h3>
                <p className="card-subtitle">
                  Choose what notifications you want to receive
                </p>
              </div>
              
              <div className="ed-settings-form">
                <div className="notification-options">
                  <div className="notification-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.bookingRequests}
                        onChange={() => handleNotificationChange('bookingRequests')}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <FaClock className="option-icon" />
                        <div>
                          <h4>Booking Requests</h4>
                          <p>Get notified when students request sessions</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="notification-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.sessionReminders}
                        onChange={() => handleNotificationChange('sessionReminders')}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <FaBook className="option-icon" />
                        <div>
                          <h4>Session Reminders</h4>
                          <p>Reminders for upcoming teaching sessions</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="notification-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.newReviews}
                        onChange={() => handleNotificationChange('newReviews')}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <FaGraduationCap className="option-icon" />
                        <div>
                          <h4>New Reviews</h4>
                          <p>When students leave reviews for your sessions</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="notification-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.paymentNotifications}
                        onChange={() => handleNotificationChange('paymentNotifications')}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <FaDollarSign className="option-icon" />
                        <div>
                          <h4>Payment Notifications</h4>
                          <p>Updates about payments and earnings</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="notification-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={notificationSettings.marketingEmails}
                        onChange={() => handleNotificationChange('marketingEmails')}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <FaGlobe className="option-icon" />
                        <div>
                          <h4>Marketing Emails</h4>
                          <p>News, tips, and platform updates</p>
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Privacy Settings */}
            <div className="ed-settings-card">
              <div className="card-header">
                <h3>
                  <FaShieldAlt className="header-icon" />
                  Privacy Settings
                </h3>
                <p className="card-subtitle">
                  Control your profile visibility and privacy
                </p>
              </div>
              
              <div className="ed-settings-form">
                <div className="privacy-options">
                  <div className="privacy-option">
                    <label htmlFor="profileVisibility">Profile Visibility</label>
                    <select
                      id="profileVisibility"
                      value={privacySettings.profileVisibility}
                      onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                    >
                      <option value="public">Public - Anyone can view</option>
                      <option value="students">Students Only</option>
                      <option value="private">Private - Invitation Only</option>
                    </select>
                  </div>

                  <div className="privacy-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={privacySettings.showContactInfo}
                        onChange={() => handlePrivacyChange('showContactInfo', !privacySettings.showContactInfo)}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <h4>Show Contact Information</h4>
                        <p>Display your email and phone to students</p>
                      </div>
                    </label>
                  </div>

                  <div className="privacy-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={privacySettings.showReviews}
                        onChange={() => handlePrivacyChange('showReviews', !privacySettings.showReviews)}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <h4>Show Reviews</h4>
                        <p>Display student reviews on your profile</p>
                      </div>
                    </label>
                  </div>

                  <div className="privacy-option">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={privacySettings.allowDirectMessages}
                        onChange={() => handlePrivacyChange('allowDirectMessages', !privacySettings.allowDirectMessages)}
                      />
                      <span className="toggle-slider"></span>
                      <div className="option-content">
                        <h4>Allow Direct Messages</h4>
                        <p>Let students send you direct messages</p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}