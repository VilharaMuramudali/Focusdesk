import React, { useState, useEffect, useRef } from "react";
import { FaUser, FaPlus, FaTimes, FaSearch } from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import "./ProfileSection.scss";

// Timezone data with city, country and GMT offset
const timezoneOptions = [
  { value: "Europe/Berlin", label: "Berlin, Germany (GMT+1:00)" },
  { value: "Europe/Belgrade", label: "Belgrade, Serbia (GMT+1:00)" },
  { value: "America/Belize", label: "Belize City, Belize (GMT-6:00)" },
  { value: "Europe/Malta", label: "Birżebbuġa, Malta (GMT+1:00)" },
  { value: "Asia/Bishkek", label: "Bishkek, Kyrgyzstan (GMT+6:00)" },
  { value: "Africa/Bissau", label: "Bissau, Guinea-Bissau (GMT+0:00)" },
  { value: "America/Bogota", label: "Bogotá, Colombia (GMT-5:00)" },
  { value: "America/Boise", label: "Boise, Idaho, United States (GMT-7:00)" },
  // Add more timezone options as needed
];

export default function ProfileSection() {
  const [profile, setProfile] = useState({
    name: "",
    bio: "",
    qualifications: "",
    rating: 0,
    available: "",
    timeSlots: [],
    img: "",
    email: "",
    phone: "",
    timezone: "",
    subjects: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [file, setFile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showTimezoneDropdown, setShowTimezoneDropdown] = useState(false);
  const [timezoneSearch, setTimezoneSearch] = useState("");
  const [filteredTimezones, setFilteredTimezones] = useState(timezoneOptions);
  const [newSubject, setNewSubject] = useState("");
  const [showSubjectInput, setShowSubjectInput] = useState(false);
  
  const fileInputRef = useRef(null);
  const timezoneDropdownRef = useRef(null);
  const subjectInputRef = useRef(null);

  // Fetch profile data on component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await newRequest.get("/profiles/educator");
        setProfile({
          name: response.data.profile.name || "",
          bio: response.data.profile.bio || "",
          qualifications: response.data.profile.qualifications || "",
          rating: response.data.profile.rating || 0,
          available: response.data.profile.available || "",
          timeSlots: response.data.profile.timeSlots || [],
          img: response.data.user.img || "",
          email: response.data.user.email || "",
          phone: response.data.profile.phone || "",
          timezone: response.data.profile.timezone || "Europe/Berlin",
          subjects: response.data.profile.subjects || []
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setError("Failed to load profile data");
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Close timezone dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (timezoneDropdownRef.current && !timezoneDropdownRef.current.contains(event.target)) {
        setShowTimezoneDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Filter timezones based on search input
  useEffect(() => {
    if (timezoneSearch) {
      const filtered = timezoneOptions.filter(tz => 
        tz.label.toLowerCase().includes(timezoneSearch.toLowerCase())
      );
      setFilteredTimezones(filtered);
    } else {
      setFilteredTimezones(timezoneOptions);
    }
  }, [timezoneSearch]);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
      setShowUploadModal(true);
    }
  };

  const handleTimezoneSelect = (timezone) => {
    setProfile({
      ...profile,
      timezone: timezone.value
    });
    setShowTimezoneDropdown(false);
    setTimezoneSearch("");
  };

  const handleAddSubject = () => {
    if (newSubject.trim()) {
      setProfile({
        ...profile,
        subjects: [...profile.subjects, newSubject.trim()]
      });
      setNewSubject("");
      setShowSubjectInput(false);
    }
  };

  const handleRemoveSubject = (index) => {
    const updatedSubjects = [...profile.subjects];
    updatedSubjects.splice(index, 1);
    setProfile({
      ...profile,
      subjects: updatedSubjects
    });
  };

  const handleProfileSubmit = async () => {
    setError(null);
    setSuccess(null);
    
    try {
      await newRequest.put("/profiles/educator", {
        name: profile.name,
        bio: profile.bio,
        qualifications: profile.qualifications,
        phone: profile.phone,
        timezone: profile.timezone,
        subjects: profile.subjects
      });
      
      setSuccess("Profile updated successfully!");
      setEditMode(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.message || "Failed to update profile");
    }
  };

  const handleImageUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("profileImage", file);
  
    try {
      const response = await newRequest.post("/profiles/upload-picture", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
  
      setProfile((prev) => ({
        ...prev,
        img: response.data.imgUrl
      }));
  
      setSuccess("Profile picture updated successfully!");
      setFile(null);
      setShowUploadModal(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to upload image");
      setShowUploadModal(false);
    }
  };
  
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const getSelectedTimezoneLabel = () => {
    const found = timezoneOptions.find(tz => tz.value === profile.timezone);
    return found ? found.label : "Select timezone";
  };

  if (loading) {
    return <div className="profile-container"><div className="profile-loading">Loading profile...</div></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-section">
        <h2 className="profile-title">My profile</h2>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        
        <div className="profile-header">
          <div className="profile-avatar-container" onClick={triggerFileInput}>
            <div className="profile-avatar">
              {profile.img ? (
                <img src={profile.img} alt="" />
              ) : (
                <div className="profile-avatar-placeholder">
                  <FaUser />
                </div>
              )}
            </div>
            <div className="profile-avatar-badge">
              <span className="checkmark">✓</span>
            </div>
            <input 
              type="file" 
              ref={fileInputRef}
              style={{ display: "none" }} 
              onChange={handleFileChange}
              accept="image/*"
            />
          </div>
          
          <div className="profile-header-info">
            <h3 className="profile-name">{profile.name}</h3>
            <p className="profile-bio">{profile.bio}</p>
          </div>
        </div>
        
        <div className="profile-form">
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                value={profile.name}
                onChange={handleProfileChange}
                className="profile-input"
                placeholder="Name"
                disabled={!editMode}
              />
            </div>
            
            <div className="profile-form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                value={profile.email}
                onChange={handleProfileChange}
                className="profile-input"
                placeholder="Your Email Address"
                disabled={true}
              />
            </div>
        </div>
          
          
          <div className="profile-form-row">
            <div className="profile-form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                name="bio"
                value={profile.bio}
                onChange={handleProfileChange}
                className="profile-input"
                rows={2}
                placeholder="add your personal description"
                disabled={!editMode}
              />
            </div>

            
              <div className="profile-form-group">
                <label htmlFor="qualifications">Qualifications</label>
                <textarea
                  id="qualifications"
                  name="qualifications"
                  value={profile.qualifications}
                  onChange={handleProfileChange}
                  className="profile-input"
                  rows={2}
                  placeholder="Add your qualifications and certifications"
                  disabled={!editMode}
                />
              </div>
            
            
            
          </div>
          

          <div className="profile-form-row">
            <div className="profile-form-group">
              <label htmlFor="phone">Phone</label>
              <input
                id="phone"
                name="phone"
                type="text"
                value={profile.phone}
                onChange={handleProfileChange}
                className="profile-input"
                placeholder="phone number"
                disabled={!editMode}
              />
            </div>
            <div className="profile-form-group">
              <label htmlFor="timezone">Time Zone</label>
              <div className="timezone-select-container" ref={timezoneDropdownRef}>
                <div 
                  className={`timezone-select-input ${!editMode ? 'disabled' : ''}`}
                  onClick={() => editMode && setShowTimezoneDropdown(!showTimezoneDropdown)}
                >
                  {getSelectedTimezoneLabel()}
                </div>
              
                
                {showTimezoneDropdown && (
                  <div className="timezone-dropdown">
                    <div className="timezone-search">
                      <input
                        type="text"
                        placeholder="Search..."
                        value={timezoneSearch}
                        onChange={(e) => setTimezoneSearch(e.target.value)}
                        autoFocus
                      />
                      <FaSearch className="search-icon" />
                    </div>
                    <div className="timezone-options">
                      {filteredTimezones.map((timezone) => (
                        <div
                          key={timezone.value}
                          className={`timezone-option ${timezone.value === profile.timezone ? 'selected' : ''}`}
                          onClick={() => handleTimezoneSelect(timezone)}
                        >
                          {timezone.label}
                        </div>
                      ))}
                      {filteredTimezones.length === 0 && (
                        <div className="no-results">No timezones found</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="profile-form-row">
              <div className="profile-form-group">
                <label>Subjects</label>
                <div className="profile-subjects">
                  {profile.subjects.length > 0 ? (
                    profile.subjects.map((subject, idx) => (
                      <div key={idx} className="profile-subject-tag">
                        {subject}
                        {editMode && (
                          <button 
                            className="profile-subject-remove" 
                            onClick={() => handleRemoveSubject(idx)}
                            type="button"
                          >
                            <FaTimes />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-subjects">No subjects added</div>
                  )}
                  
                  {editMode && !showSubjectInput && (
                    <button 
                      className="profile-subject-add" 
                      onClick={() => setShowSubjectInput(true)}
                      type="button"
                    >
                      <FaPlus />
                    </button>
                  )}
                  
                  {editMode && showSubjectInput && (
                    <div className="subject-input-container">
                      <input
                        ref={subjectInputRef}
                        type="text"
                        value={newSubject}
                        onChange={(e) => setNewSubject(e.target.value)}
                        className="subject-input"
                        placeholder="Add subject..."
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') handleAddSubject();
                        }}
                      />
                      <button 
                        className="subject-input-add" 
                        onClick={handleAddSubject}
                      >
                        Add
                      </button>
                      <button 
                        className="subject-input-cancel" 
                        onClick={() => {
                          setShowSubjectInput(false);
                          setNewSubject("");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
            </div>
          
          </div>
          <div className="profile-form-actions">
            {!editMode ? (
              <button 
                className="profile-btn edit-btn" 
                onClick={() => setEditMode(true)}
                type="button"
              >
                Edit
              </button>
            ) : (
              <>
                <button 
                  className="profile-btn cancel-btn" 
                  onClick={() => setEditMode(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button 
                  className="profile-btn save-btn" 
                  onClick={handleProfileSubmit}
                  type="button"
                >
                  Save
                </button>
              </>
            )}
          </div>
        </div>

        {/* Image Upload Modal */}
        {showUploadModal && (
          <div className="upload-modal-overlay">
            <div className="upload-modal">
              <h3>Upload Profile Picture</h3>
              <div className="upload-preview">
                {file && <img src={URL.createObjectURL(file)} alt="Preview" />}
              </div>
              <div className="upload-actions">
                <button 
                  className="profile-btn cancel-btn" 
                  onClick={() => {
                    setShowUploadModal(false);
                    setFile(null);
                  }}
                >
                  Cancel
                </button>
                <button 
                  className="profile-btn save-btn" 
                  onClick={handleImageUpload}
                >
                  Upload
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
