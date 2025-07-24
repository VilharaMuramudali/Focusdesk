import React from "react";

export default function LearningProgress() {
  return (
    <div className="learning-progress-section">
      <h2>Learning Progress</h2>
      <p>This is the Learning Progress section.</p>
      <style>{`
        .learning-progress-section {
          padding: 2rem;
        }
        .learning-progress-section h2 {
          color: #2196f3;
          margin-bottom: 0.5rem;
        }
        .learning-progress-section p {
          color: #555;
        }
      `}</style>
    </div>
  );
} 