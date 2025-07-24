import React from "react";

export default function MySessions() {
  return (
    <div className="my-sessions-section">
      <h2>My Sessions</h2>
      <p>This is the My Sessions section.</p>
      <style>{`
        .my-sessions-section {
          padding: 2rem;
        }
        .my-sessions-section h2 {
          color: #2196f3;
          margin-bottom: 0.5rem;
        }
        .my-sessions-section p {
          color: #555;
        }
      `}</style>
    </div>
  );
} 