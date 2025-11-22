import React, { useState, useEffect } from "react";
import { FaStar, FaStarHalfAlt, FaRegStar, FaPlus, FaEdit, FaTrash, FaCheck } from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import { SkeletonPackageGrid } from "../../../components/skeleton/Skeleton";
import "./PackagesSection.scss";

export default function PackagesSection() {
  const [packages, setPackages] = useState([]);
  const [showPackageForm, setShowPackageForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPackageId, setCurrentPackageId] = useState(null);
  const [formData, setFormData] = useState({
    thumbnail: "",
    title: "",
    description: "",
    keywords: "",
    currency: "",
    rate: "",
    video: "",
    sessions: 1,
    languages: [],
    subjects: [],
    rating: 4.8
  });
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Available languages list
  const availableLanguages = [
    "English", "Sinhala", "Tamil", "Hindi", "Spanish", 
    "French", "German", "Chinese", "Japanese", "Korean"
  ];

  // Available subjects with icons
  const availableSubjects = [
    { name: 'Mathematics', icon: '📐' },
    { name: 'Physics', icon: '⚡' },
    { name: 'Chemistry', icon: '🧪' },
    { name: 'Biology', icon: '🧬' },
    { name: 'Computer Science', icon: '💻' },
    { name: 'English Literature', icon: '📚' },
    { name: 'History', icon: '🏛️' },
    { name: 'Geography', icon: '🌍' },
    { name: 'Economics', icon: '💰' },
    { name: 'Psychology', icon: '🧠' },
    { name: 'Art & Design', icon: '🎨' },
    { name: 'Music', icon: '🎵' },
    { name: 'Physical Education', icon: '⚽' },
    { name: 'Foreign Languages', icon: '🌐' },
    { name: 'Business Studies', icon: '💼' },
    { name: 'Engineering', icon: '⚙️' },
    { name: 'Medicine', icon: '🏥' }
  ];

  // Available currency options
  const currencyOptions = [
    { code: "LKR", symbol: "Rs.", name: "Sri Lankan Rupee" },
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "INR", symbol: "₹", name: "Indian Rupee" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
    { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
    { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
    { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" }
  ];

  useEffect(() => {
    fetchPackages();

    // Listen for review submissions to refresh displayed package ratings
    const handleReviewSubmitted = () => {
      fetchPackages();
    };
    window.addEventListener('package-review-submitted', handleReviewSubmitted);

    return () => {
      window.removeEventListener('package-review-submitted', handleReviewSubmitted);
    };
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      console.log("Fetching educator packages...");
      const response = await newRequest.get("/packages/educator");
      console.log("Fetched packages:", response.data);
      
      // Ensure each package has a languages array
      const packagesWithLanguages = response.data.map(pkg => ({
        ...pkg,
        languages: Array.isArray(pkg.languages) ? pkg.languages : []
      }));
      
      console.log("Packages with languages:", packagesWithLanguages);
      setPackages(packagesWithLanguages);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching packages:", err);
      console.error("Error response:", err.response?.data);
      setError(`Failed to load packages: ${err.response?.data?.message || err.message}`);
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle language selection with checkboxes
  const handleLanguageToggle = (language) => {
    setFormData(prevData => {
      const currentLanguages = [...prevData.languages];
      
      if (currentLanguages.includes(language)) {
        // Remove language if already selected
        return {
          ...prevData,
          languages: currentLanguages.filter(lang => lang !== language)
        };
      } else {
        // Add language if not selected
        return {
          ...prevData,
          languages: [...currentLanguages, language]
        };
      }
    });
  };

  // Handle subject selection
  const handleSubjectToggle = (subjectName) => {
    setFormData(prevData => {
      const currentSubjects = [...prevData.subjects];
      
      if (currentSubjects.includes(subjectName)) {
        // Prevent removing the last subject
        if (currentSubjects.length <= 1) {
          setError("At least one subject must be selected");
          return prevData; // Don't update state
        }
        // Remove subject if already selected
        return {
          ...prevData,
          subjects: currentSubjects.filter(subj => subj !== subjectName)
        };
      } else {
        // Add subject if not selected
        return {
          ...prevData,
          subjects: [...currentSubjects, subjectName]
        };
      }
    });
  };

  const resetForm = () => {
    setFormData({
      thumbnail: "",
      title: "",
      description: "",
      keywords: "",
      currency: "",
      rate: "",
      video: "",
      sessions: 1,
      languages: [],
      subjects: [],
      rating: 4.8
    });
    setIsEditing(false);
    setCurrentPackageId(null);
  };

  const openPackageForm = () => {
    resetForm();
    setShowPackageForm(true);
  };

  const closePackageForm = () => {
    setShowPackageForm(false);
    resetForm();
  };

  const handleEditPackage = (pkg) => {
    console.log("Package languages for editing:", pkg.languages);
    console.log("Package subjects for editing:", pkg.subjects);
    setFormData({
      thumbnail: pkg.thumbnail || "",
      title: pkg.title || "",
      description: pkg.description || "",
      keywords: pkg.keywords ? pkg.keywords.join(", ") : "",
      currency: pkg.currency || "LKR",
      rate: pkg.rate || "",
      video: pkg.video || "",
      sessions: pkg.sessions || 1,
      // Ensure languages is always an array
      languages: Array.isArray(pkg.languages) ? [...pkg.languages] : [],
      // Ensure subjects is always an array
      subjects: Array.isArray(pkg.subjects) ? [...pkg.subjects] : [],
      rating: pkg.rating || 4.8
    });
    setIsEditing(true);
    setCurrentPackageId(pkg._id);
    setShowPackageForm(true);
  };

  const submitPackageForm = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate currency
    if (!formData.currency || formData.currency.trim() === "") {
      setError("Please select a currency before entering the amount");
      return;
    }

    // Validate rate (handle number or string values)
    const rawRate = formData.rate === undefined || formData.rate === null ? '' : formData.rate;
    const rateStr = typeof rawRate === 'string' ? rawRate : String(rawRate);
    const rateNum = Number(rateStr);
    if (rateStr.trim() === '' || isNaN(rateNum) || rateNum <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    // Validate languages
    if (formData.languages.length === 0) {
      setError("Please select at least one language");
      return;
    }

    // Validate subjects - ensure it's an array with at least one item
    if (!Array.isArray(formData.subjects) || formData.subjects.length === 0) {
      setError("Please select at least one subject/domain");
      return;
    }

    try {
      // Prepare data to send - ensure all fields are properly formatted
      const packageData = {
        thumbnail: formData.thumbnail || "",
        title: formData.title || "",
        description: formData.description || "",
        keywords: formData.keywords || "",
        currency: formData.currency || "LKR",
        rate: parseFloat(rateNum) || 0,
        video: formData.video || "",
        sessions: parseInt(formData.sessions) || 1,
        languages: formData.languages, // Already validated as array with items
        subjects: formData.subjects // Already validated as array with items
      };

      // Log data being sent to verify
      console.log("Sending package data:", packageData);

      if (isEditing) {
        // Update existing package on server
        const response = await newRequest.put(`/packages/${currentPackageId}`, packageData);
        console.log("Update response:", response.data);
        setSuccess("Package updated successfully!");
        // Re-fetch packages to ensure server-normalized fields (ratings, keywords, etc.) are shown
        await fetchPackages();
      } else {
        // Create new package on server
        const response = await newRequest.post("/packages", packageData);
        console.log("Create response:", response.data);
        setSuccess("Package created successfully!");
        // Re-fetch packages to include the newly created package
        await fetchPackages();
      }
      closePackageForm();
    } catch (err) {
      console.error("Error saving package:", err);
      setError(err.response?.data?.message || "Failed to save package");
    }
  };

  const deletePackage = async (id) => {
    if (!window.confirm("Are you sure you want to delete this package?")) return;

    try {
      await newRequest.delete(`/packages/${id}`);
      setPackages(prev => prev.filter(pkg => pkg._id !== id));
      setSuccess("Package deleted successfully!");
    } catch (err) {
      console.error("Error deleting package:", err);
      setError(err.response?.data?.message || "Failed to delete package");
    }
  };

  const renderRatingStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={`star-${i}`} className="star-icon filled" />);
    }
    
    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half-star" className="star-icon half" />);
    }
    
    // Add empty stars to complete 5 stars
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} className="star-icon empty" />);
    }
    
    return stars;
  };

  if (loading) {
    return (
      <div className="packages-container">
        <div className="profile-header">
          <h2>My Packages</h2>
          <button className="create-package-btn" disabled>
            Create Package
          </button>
        </div>
        <SkeletonPackageGrid />
      </div>
    );
  }

  return (
    <div className="packages-container">
      <div className="profile-header">
        <h2>My Packages</h2>
        <button 
          className="create-package-btn"
          onClick={openPackageForm}
        >
          Create Package
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {showPackageForm && (
        <div className="package-form-modal">
          <div className="package-form-content">
            <h3>{isEditing ? "Edit Package" : "Create New Package"}</h3>
            <form className="package-form" onSubmit={submitPackageForm}>
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="title">Package Name *</label>
                  <input
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter package name"
                    className="form-input"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="thumbnail">Thumbnail (upload JPG/PNG) or paste URL</label>
                  <div className="thumbnail-input-row">
                    <input
                      id="thumbnail"
                      name="thumbnail"
                      value={formData.thumbnail}
                      onChange={handleInputChange}
                      placeholder="Image URL"
                      className="form-input"
                    />
                    <label className="file-upload-btn">
                      {uploadingThumbnail ? 'Uploading…' : 'Upload'}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                          const file = e.target.files && e.target.files[0];
                          if (!file) return;
                          setUploadingThumbnail(true);
                          try {
                            const data = new FormData();
                            data.append('file', file);

                            // upload to server upload endpoint (chat upload uses disk storage)
                            // Let axios/browser set multipart boundaries automatically
                            const res = await newRequest.post('/upload/chat', data);

                            if (res?.data?.url) {
                              setFormData(prev => ({ ...prev, thumbnail: res.data.url }));
                            } else {
                              setError('Upload failed: invalid server response');
                            }
                          } catch (uploadErr) {
                            console.error('Thumbnail upload error:', uploadErr);
                            setError(uploadErr.response?.data?.message || uploadErr.message || 'Upload failed');
                          } finally {
                            setUploadingThumbnail(false);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description *</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of your package"
                  className="form-textarea"
                  rows="2"
                  required
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="currency">Currency *</label>
                  <select
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleInputChange}
                    className="form-select"
                    required
                  >
                    <option value="">Select</option>
                    {currencyOptions.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="rate">
                    Hourly Rate {formData.currency && `(${currencyOptions.find(c => c.code === formData.currency)?.symbol || ''})`} *
                  </label>
                  <div className="rate-input-container">
                    {formData.currency && (
                      <span className="currency-prefix">
                        {currencyOptions.find(c => c.code === formData.currency)?.symbol || ''}
                      </span>
                    )}
                    <input
                      id="rate"
                      name="rate"
                      value={formData.rate}
                      onChange={handleInputChange}
                      placeholder={formData.currency ? "0.00" : "Select currency"}
                      className={`form-input ${formData.currency ? 'with-currency' : ''}`}
                      type="number"
                      min="0"
                      step="0.01"
                      required
                      disabled={!formData.currency}
                    />
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="video">Sample Video URL (Optional)</label>
                <input
                  id="video"
                  name="video"
                  value={formData.video}
                  onChange={handleInputChange}
                  placeholder="YouTube or video URL"
                  className="form-input"
                />
              </div>
              
              <div className="form-row-2">
                <div className="form-group">
                  <label>Subjects/Domains *</label>
                  <div className="subjects-grid-compact">
                    {availableSubjects.map(subject => (
                      <div
                        key={subject.name}
                        className={`subject-card-compact ${formData.subjects.includes(subject.name) ? 'selected' : ''}`}
                        onClick={() => handleSubjectToggle(subject.name)}
                        title={subject.name}
                      >
                        <span className="subject-icon-small">{subject.icon}</span>
                        <span className="subject-name-small">{subject.name}</span>
                      </div>
                    ))}
                  </div>
                  {formData.subjects.length === 0 && (
                    <span className="field-hint error">Select at least one</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Languages *</label>
                  <div className="language-checkbox-container-compact">
                    {availableLanguages.map(language => (
                      <div key={language} className="language-checkbox-compact">
                        <label className={formData.languages.includes(language) ? "selected" : ""}>
                          <input
                            type="checkbox"
                            checked={formData.languages.includes(language)}
                            onChange={() => handleLanguageToggle(language)}
                          />
                          <span className="checkbox-custom">
                            {formData.languages.includes(language) && <FaCheck className="check-icon" />}
                          </span>
                          {language}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="keywords">Keywords (Optional)</label>
                <input
                  id="keywords"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="e.g. math, algebra, calculus"
                  className="form-input"
                />
              </div>

              <div className="form-actions">
                <button type="button" onClick={closePackageForm} className="cancel-btn">
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {isEditing ? "Update Package" : <><FaPlus /> Add Package</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="packages-grid">
        {packages.length > 0 ? (
          packages.map(pkg => (
            <div className="package-card" key={pkg._id}>
              <div className="package-thumbnail">
                <img
                  src={pkg.thumbnail || "/calculator-placeholder.jpg"}
                  alt={pkg.title}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/img/noavatar.jpg'; }}
                />
              </div>
              <div className="package-rating">
                {renderRatingStars(pkg.rating || 0, pkg.totalReviews || 0)}
                <span className="rating-value">
                  {pkg.rating > 0 ? pkg.rating.toFixed(1) : 'No ratings'}
                  {pkg.totalReviews > 0 && ` (${pkg.totalReviews} reviews)`}
                </span>
              </div>
              <h3 className="package-title">{pkg.title}</h3>
              <p className="package-description">{pkg.description}</p>
              
              {pkg.video && (
                <div className="package-video-info">
                  <span className="video-badge">Sample Video Available</span>
                </div>
              )}
              
              {pkg.languages && pkg.languages.length > 0 && (
                <div className="package-languages">
                  <h4 className="languages-title">Languages:</h4>
                  <div className="language-tags">
                    {pkg.languages.map((lang, index) => (
                      <span key={index} className="language-tag">{lang}</span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="package-footer">
                <div className="package-price">
                  {(() => {
                    const currencySymbol = pkg.currency 
                      ? currencyOptions.find(c => c.code === pkg.currency)?.symbol || pkg.currency
                      : 'Rs.';
                    return `${currencySymbol}${pkg.rate} hr`;
                  })()}
                </div>
                <div className="package-actions">
                  <button 
                    className="edit-btn" 
                    onClick={() => handleEditPackage(pkg)}
                    title="Edit package"
                  >
                    <FaEdit />
                  </button>
                  <button 
                    className="delete-btn" 
                    onClick={() => deletePackage(pkg._id)}
                    title="Delete package"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p className="no-packages">No packages created yet. Create your first package!</p>
        )}
      </div>
    </div>
  );
}
