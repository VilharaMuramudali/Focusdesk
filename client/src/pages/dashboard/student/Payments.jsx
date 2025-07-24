import React from "react";

export default function Payments() {
  return (
    <div className="payments-section">
      <h2>Payments</h2>
      <p>This is the Payments section.</p>
      <style>{`
        .payments-section {
          padding: 2rem;
        }
        .payments-section h2 {
          color: #2196f3;
          margin-bottom: 0.5rem;
        }
        .payments-section p {
          color: #555;
        }
      `}</style>
    </div>
  );
} 