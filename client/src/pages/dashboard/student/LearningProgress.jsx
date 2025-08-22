import React from "react";
import SharedHeaderBanner from "./SharedHeaderBanner";
import "./home.scss";

export default function LearningProgress() {
  return (
    <div className="home-overview">
      <div className="container">
        <SharedHeaderBanner 
          title="Learning Progress"
          subtitle="Track your educational journey and achievements"
        />
        <div className="content-section">
          <h2>Learning Progress</h2>
          <p>This is the Learning Progress section.</p>
        </div>
      </div>
    </div>
  );
} 