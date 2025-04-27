import React, { useState } from "react";
import "./Featured.scss";
import { useNavigate } from "react-router-dom";

function Featured() {
  const [input, setInput] = useState("");
  const [category, setCategory] = useState("Web Development");
  const navigate = useNavigate();

  const handleSubmit = () => {
    navigate(`/gigs?search=${input}`);
  };

  return (
    <div className="featured">
      <div className="container">
        {/* Left section with content */}
        <div className="left">
          <div className="star-icon">✦</div>
          <h1>
            Empower Focused Learning, Inspire Teaching.<br></br> Anywhere, Anytime.
          </h1>
          <div className="search-container">
            <div className="search">
              <div className="searchInput">
                <input
                  type="text"
                  placeholder='etc: Search Your Needs'
                  onChange={(e) => setInput(e.target.value)}
                />
              </div>
              <div className="category-selector">
                <span>{category}</span>
                <span className="dropdown-arrow">▼</span>
              </div>
              <button onClick={handleSubmit} className="search-button">
                <img src="./img/search.png" alt="" />
              </button>
            </div>
          </div>
          <div className="popular">
            <span>Popular Searches:</span>
            <div className="popular-tags">
              <button>Computer Science</button>
              <button>Reserch Supervisor</button>
              <button>Software Engineer</button>
            </div>
          </div>
        </div>
        
        <div className="right">
  <div className="floating-elements">
    <div className="stats-card floating-item">
      <div className="avatar-small">
        <img src="/img/avatar-small.png" alt="" />
      </div>
      <div className="stats-content">
        <span>Customer Success</span>
        <span className="percentage">8.50%</span>
      </div>
    </div>
    <div className="categories-card floating-item-delay">
      <span>Top Categories</span>
      <div className="chart-placeholder">
        <div className="chart-bar"></div>
        <div className="chart-bar"></div>
        <div className="chart-bar"></div>
        <div className="chart-bar"></div>
      </div>
    </div>
    <div className="mission-card floating-item-long">
      <div className="avatar-group">
        <div className="avatar-circle">
          <img src="/img/A1.jpg" alt="Team member 1" />
        </div>
        <div className="avatar-circle">
          <img src="/img/A3.jpg" alt="Team member 2" />
        </div>
        <div className="avatar-circle">
          <img src="/img/A2.jpg" alt="Team member 3" />
        </div>
      </div>
      <p>We work towards <span>ensuring a life free from inequality.</span></p>
    </div>
  </div>
  <img src="/img/hero2.png" alt="" className="hero-image" />
</div>
        
      </div>
      <div className="trusted-section">
        <div className="trusted-container">
          <div className="trusted-text">Trusted By 1M+ Business</div>
          <div className="trusted-logos">
            <div className="logo">Luminous</div>
            <div className="logo">Lightbox</div>
            <div className="logo">FocalPoint</div>
            <div className="logo">Polymath</div>
            <div className="logo">Alt+Shift</div>
            <div className="logo">Nietzsche</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Featured;
