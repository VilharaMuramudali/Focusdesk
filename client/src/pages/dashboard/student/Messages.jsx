import React from "react";

export default function Messages() {
  return (
    <div className="messages-section">
      <h2>Messages</h2>
      <p>This is the Messages section.</p>
      <style>{`
        .messages-section {
          padding: 2rem;
        }
        .messages-section h2 {
          color: #2196f3;
          margin-bottom: 0.5rem;
        }
        .messages-section p {
          color: #555;
        }
      `}</style>
    </div>
  );
} 