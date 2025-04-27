import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FaStar, FaArrowLeft, FaCalendarAlt, FaClock, FaUser } from "react-icons/fa";
import newRequest from "../../utils/newRequest";
import "./packageDetail.scss";
import Footer from "../../components/footer/Footer";

function PackageDetail() {
  const { id } = useParams();
  const [packageData, setPackageData] = useState(null);
  const [educator, setEducator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchPackageData = async () => {
      try {
        setLoading(true);
        const response = await newRequest.get(`/packages/${id}`);
        setPackageData(response.data);
        
        // Fetch educator details
        if (response.data.educatorId) {
          const educatorResponse = await newRequest.get(`/users/${response.data.educatorId}`);
          setEducator(educatorResponse.data);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching package details:", err);
        setError("Failed to load package details");
        setLoading(false);
      }
    };
    
    fetchPackageData();
  }, [id]);
  
  const handleBookSession = () => {
    // Implement booking functionality
    alert("Booking functionality will be implemented here");
  };
  
  if (loading) {
    return <div className="loading-container">Loading package details...</div>;
  }
  
  if (error || !packageData) {
    return (
      <div className="error-container">
        <p>{error || "Package not found"}</p>
        <Link to="/student-dashboard" className="back-link">
          <FaArrowLeft /> Back to Dashboard
        </Link>
      </div>
    );
  }
  
  return (
    <div className="package-detail-page">
      <div className="package-detail-container">
        <div className="back-navigation">
          <Link to="/student-dashboard" className="back-link">
            <FaArrowLeft /> Back to Dashboard
          </Link>
        </div>
        
        <div className="package-header">
          <h1>{packageData.title}</h1>
          <div className="package-meta">
            {packageData.keywords && packageData.keywords.map((keyword, index) => (
              <span key={index} className="keyword-badge">{keyword}</span>
            ))}
          </div>
        </div>
        
        <div className="package-content">
          <div className="package-main">
            {packageData.thumbnail ? (
              <img src={packageData.thumbnail} alt={packageData.title} className="package-image" />
            ) : (
              <div className="package-image-placeholder">
                <FaUser size={60} />
              </div>
            )}
            
            <div className="package-description">
              <h2>About this Learning Package</h2>
              <p>{packageData.description}</p>
              
              <div className="package-details">
                <div className="detail-item">
                  <FaCalendarAlt />
                  <span>{packageData.sessions || 1} Session(s)</span>
                </div>
                <div className="detail-item">
                  <FaClock />
                  <span>Approximately 1 hour per session</span>
                </div>
              </div>
              
              {packageData.video && (
                <div className="package-video">
                  <h3>Introduction Video</h3>
                  <a href={packageData.video} target="_blank" rel="noopener noreferrer" className="video-link">
                    Watch Introduction Video
                  </a>
                </div>
              )}
            </div>
          </div>
          
          <div className="package-sidebar">
            <div className="price-card">
              <h3>${packageData.rate}/hr</h3>
              <button className="book-button" onClick={handleBookSession}>
                Book This Package
              </button>
            </div>
            
            {educator && (
              <div className="educator-card">
                <h3>About the Educator</h3>
                <div className="educator-info">
                  {educator.img ? (
                    <img src={educator.img} alt={educator.username} className="educator-image" />
                  ) : (
                    <div className="educator-image-placeholder">
                      <FaUser />
                    </div>
                  )}
                  <div>
                    <h4>{educator.username}</h4>
                    <p>{educator.bio || "Experienced educator"}</p>
                  </div>
                </div>
                <Link to={`/educator/${educator._id}`} className="view-profile-link">
                  View Full Profile
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

export default PackageDetail;
