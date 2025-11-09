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
    rate: "",
    video: "",
    sessions: 1,
    languages: [],
    rating: 4.8
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Available languages list
  const availableLanguages = [
    "English", "Sinhala", "Tamil", "Hindi", "Spanish", 
    "French", "German", "Chinese", "Japanese", "Korean"
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

  const resetForm = () => {
    setFormData({
      thumbnail: "",
      title: "",
      description: "",
      keywords: "",
      rate: "",
      video: "",
      sessions: 1,
      languages: [],
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
    setFormData({
      thumbnail: pkg.thumbnail || "",
      title: pkg.title || "",
      description: pkg.description || "",
      keywords: pkg.keywords ? pkg.keywords.join(", ") : "",
      rate: pkg.rate || "",
      video: pkg.video || "",
      sessions: pkg.sessions || 1,
      // Ensure languages is always an array
      languages: Array.isArray(pkg.languages) ? [...pkg.languages] : [],
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

    // Validate languages
    if (formData.languages.length === 0) {
      setError("Please select at least one language");
      return;
    }

    try {
      // Log data being sent to verify
      console.log("Sending package data:", {
        ...formData,
        languages: formData.languages
      });
      
      if (isEditing) {
        // Update existing package
        const response = await newRequest.put(`/packages/${currentPackageId}`, {
          ...formData,
          languages: formData.languages // Explicitly include languages array
        });
        console.log("Update response:", response.data);
        
        setPackages(packages.map(pkg => 
          pkg._id === currentPackageId ? response.data.package : pkg
        ));
        setSuccess("Package updated successfully!");
      } else {
        // Create new package
        const response = await newRequest.post("/packages", {
          ...formData,
          languages: formData.languages // Explicitly include languages array
        });
        console.log("Create response:", response.data);
        
        setPackages([response.data.package, ...packages]);
        setSuccess("Package created successfully!");
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
      setPackages(packages.filter(pkg => pkg._id !== id));
      setSuccess("Package deleted successfully!");
    } catch (err) {
      console.error("Error deleting package:", err);
      setError(err.response?.data?.message || "Failed to delete package");
    }
  };

  const renderRatingStars = (rating, totalReviews = 0) => {
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
              <div className="form-group">
                <label htmlFor="thumbnail">Thumbnail Image URL</label>
                <input
                  id="thumbnail"
                  name="thumbnail"
                  value={formData.thumbnail}
                  onChange={handleInputChange}
                  placeholder="Enter image URL"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">Package Name</label>
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
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Enter package description"
                  className="form-textarea"
                  rows="3"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="rate">Hourly Rate (Rs.)</label>
                <input
                  id="rate"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  placeholder="Enter hourly rate"
                  className="form-input"
                  type="number"
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="video">Sample Video URL</label>
                <input
                  id="video"
                  name="video"
                  value={formData.video}
                  onChange={handleInputChange}
                  placeholder="Enter YouTube or other video URL"
                  className="form-input"
                />
              </div>
              
              <div className="form-group">
                <label>Languages (select all that apply)</label>
                <div className="language-checkbox-container">
                  {availableLanguages.map(language => (
                    <div key={language} className="language-checkbox">
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
                {formData.languages.length > 0 && (
                  <div className="selected-languages">
                    <span>Selected: </span>
                    {formData.languages.map((lang, index) => (
                      <span key={lang} className="selected-language-tag">
                        {lang}{index < formData.languages.length - 1 ? ', ' : ''}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="keywords">Keywords (comma separated)</label>
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
                <img src={pkg.thumbnail || "/calculator-placeholder.jpg"} alt={pkg.title} />
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
                <div className="package-price">Rs.{pkg.rate} hr</div>
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
