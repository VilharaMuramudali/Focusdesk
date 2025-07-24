import React from "react";

export default function FindTutors() {
  return (
    <div className="home-overview-section">
      <h2>Home (Learning Overview)</h2>
      <p>This is the Home (Learning Overview) section.</p>
      <style>{`
        .home-overview-section {
          padding: 2rem;
        }
        .home-overview-section h2 {
          color: #2196f3;
          margin-bottom: 0.5rem;
        }
        .home-overview-section p {
          color: #555;
        }
      `}</style>
    </div>
  );
} 