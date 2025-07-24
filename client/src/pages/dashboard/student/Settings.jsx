import React from "react";

export default function Settings() {
  return (
    <div className="settings-section">
      <h2>Settings</h2>
      <p>This is the Settings section.</p>
      <style>{`
        .settings-section {
          padding: 2rem;
        }
        .settings-section h2 {
          color: #2196f3;
          margin-bottom: 0.5rem;
        }
        .settings-section p {
          color: #555;
        }
      `}</style>
    </div>
  );
} 