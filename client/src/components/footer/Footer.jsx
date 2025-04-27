import React from "react";
import "./Footer.scss";

function Footer() {
  return (
    <div className="footer">
      <div className="container">
        <div className="top">
          <div className="item">
            <h2>Categories</h2>
            <span>Primary & Secondary Education</span>
            <span>Science, Technology, Engineering, and Math </span>
            <span>Arts, Literature & Humanities</span>
            <span>Video & Animation</span>
            <span>Psychology & Philosophy</span>
          </div>
          <div className="item">
            <h2>Higher Education</h2>
            <span>University Courses</span>
            <span>Professional Diplomas</span>
            <span>Open University / Distance Learning</span>
            <span>Thesis/Research Guidance</span>
            <span>Thesis/Research Guidance</span>
           
          </div>
          <div className="item">
            <h2>Support</h2>
            <span>Help & Support</span>
            <span>Trust & Safety</span>
            <span>Selling on Fiverr</span>
            <span>Buying on Fiverr</span>
          </div>
          <div className="item">
            <h2>Community</h2>
            <span>Customer Success Stories</span>
            <span>Community hub</span>
            <span>Forum</span>
            <span>Events</span>
            <span>Blog</span>
            <span>Influencers</span>
            <span>Affiliates</span>
            <span>Podcast</span>
            <span>Community Standards</span>
          </div>
          
        </div>
        <hr />
        <div className="bottom">
          <div className="left">
            <h2>FocusDesk</h2>
            <span>© FocusDesk.2025</span>
          </div>
          <div className="right">
            <div className="social">
              <img src="/img/twitter.png" alt="" />
              <img src="/img/facebook.png" alt="" />
              <img src="/img/linkedin.png" alt="" />
              <img src="/img/pinterest.png" alt="" />
              <img src="/img/instagram.png" alt="" />
            </div>
            <div className="link">
              <img src="/img/language.png" alt="" />
              <span>English</span>
            </div>
            <div className="link">
              <img src="/img/coin.png" alt="" />
              <span>USD</span>
            </div>
            <img src="/img/accessibility.png" alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Footer;
