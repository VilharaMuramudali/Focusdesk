import React from "react";
import SharedHeaderBanner from "./SharedHeaderBanner";
import "./home.scss";

export default function FindTutors() {
  return (
    <div className="home-overview">
      <div className="container">
        <SharedHeaderBanner 
          title="Find Tutors"
          subtitle="Discover qualified educators for your learning journey"
        />
        <div className="content-section">
          <h2>Find Tutors</h2>
          <p>This is the Find Tutors section.</p>
        </div>
      </div>
    </div>
  );
} 