import React from "react";
import SharedHeaderBanner from "./SharedHeaderBanner";
import "./home.scss";

export default function MyLearning() {
  return (
    <div className="home-overview">
      <div className="container">
        <SharedHeaderBanner 
          title="My Learning"
          subtitle="Access your courses and learning materials"
        />
        <div className="content-section">
          <h2>My Learning</h2>
          <p>This is the My Learning section.</p>
        </div>
      </div>
    </div>
  );
} 