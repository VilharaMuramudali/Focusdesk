import React, { useEffect, useState } from "react";
import { useNavigate } from 'react-router-dom';
import { useChat } from '../../context/ChatContext.jsx';
import { useParams, Link } from "react-router-dom";
import { FaStar, FaStarHalfAlt, FaRegStar, FaArrowLeft, FaUser, FaGraduationCap, FaLanguage, FaVideo } from "react-icons/fa";
import newRequest from "../../utils/newRequest";
import "./educatorProfile.scss";

const RatingStars = ({ rating = 0 }) => {
  const stars = [];
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  for (let i = 1; i <= 5; i++) {
    if (i <= fullStars) stars.push(<FaStar key={i} className="star filled" />);
    else if (i === fullStars + 1 && hasHalfStar) stars.push(<FaStarHalfAlt key={i} className="star half" />);
    else stars.push(<FaRegStar key={i} className="star empty" />);
  }
  return <div className="rating-stars">{stars} <span className="rating-value">({rating})</span></div>;
};

function EducatorProfile() {
  const { educatorId } = useParams();
  const [educator, setEducator] = useState(null);
  const [profile, setProfile] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { createConversation } = useChat();

  useEffect(() => {
    async function fetchEducatorData() {
      setLoading(true);
      try {
        // Fetch user basic info
        const userRes = await newRequest.get(`/users/${educatorId}`);
        setEducator(userRes.data);

        // Fetch educator profile details
        const profileRes = await newRequest.get(`/educatorProfiles/user/${educatorId}`);
        setProfile(profileRes.data);

        // Fetch all packages by educator
        const packagesRes = await newRequest.get(`/packages?educatorId=${educatorId}`);
        setPackages(packagesRes.data);

      } catch (err) {
        console.error('Failed to fetch educator data:', err);
        setEducator(null);
        // Surface backend message when available to help debugging
        setError(err?.response?.data?.message || err.message || 'Failed to load educator');
      }
      setLoading(false);
    }
    fetchEducatorData();
  }, [educatorId]);

  if (loading) return <div className="loading-container">Loading profile...</div>;
  if (!educator) return (
    <div className="error-container">
      <p>{error ? `Error: ${error}` : 'Educator not found.'}</p>
      <p style={{color: '#64748b', fontSize: '0.95rem'}}>Try refreshing the page or check the console for details.</p>
      <Link to="/student-dashboard" className="back-link"><FaArrowLeft /> Back to Dashboard</Link>
    </div>
  );

  return (
    <div className="educator-profile-page">
      <div className="back-navigation">
        <Link to="/student-dashboard" className="back-link"><FaArrowLeft /> Back to Dashboard</Link>
      </div>
      <div className="profile-header">
        <div className="profile-image-section">
          {educator.img ? (
            <img src={educator.img} alt={profile?.fullName || profile?.name || educator.username} className="profile-image" />
          ) : (
            <div className="profile-image-placeholder"><FaUser size={80} /></div>
          )}
        </div>
        <div className="profile-info-section">
          <h1>{profile?.fullName || profile?.name || educator.username}</h1>
          <RatingStars rating={profile?.rating || 0} />
          <p className="profile-bio">{profile?.bio || educator.bio || "No bio provided."}</p>
          <div className="profile-actions">
            <button className="message-btn" onClick={async () => {
              if (!educator) return;
              try {
                const conversation = await createConversation(
                  educator._id,
                  educator.fullName || educator.name || educator.username,
                  'educator',
                );
                // Navigate to messages and open conversation
                navigate(`/messages?conversationId=${conversation._id}`);
              } catch (err) {
                console.error('Failed to open conversation:', err);
              }
            }}>
              Message
            </button>
          </div>
          {profile?.qualifications && (
            <div className="profile-qualifications">
              <FaGraduationCap /> <span>{profile.qualifications}</span>
            </div>
          )}
          {profile?.languages && profile.languages.length > 0 && (
            <div className="profile-languages">
              <FaLanguage /> <span>Languages: {profile.languages.join(", ")}</span>
            </div>
          )}
          {profile?.introVideo && (
            <div className="profile-video">
              <FaVideo /> <a href={profile.introVideo} target="_blank" rel="noopener noreferrer">Watch Introduction Video</a>
            </div>
          )}
        </div>
      </div>

      <div className="profile-details">
        <h2>Subjects</h2>
        <div className="subjects-list">
          {(profile?.subjects || educator.subjects || []).map((subject, idx) => (
            <span className="subject-badge" key={idx}>{subject}</span>
          ))}
        </div>
        <h2>Available Packages</h2>
        <div className="packages-list">
          {packages.length === 0 && <p>No packages available.</p>}
          {packages.map(pkg => (
            <div className="package-card" key={pkg._id}>
              <div className="package-title">{pkg.title}</div>
              <div className="package-meta">
                <span>Rate: Rs.{pkg.rate}/hr</span>
                <span>Sessions: {pkg.sessions}</span>
                <span>Languages: {(pkg.languages || []).join(", ")}</span>
              </div>
              <div className="package-description">{pkg.description.slice(0, 120)}...</div>
              <Link to={`/package/${pkg._id}`} className="view-package-link">View Details</Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default EducatorProfile;
