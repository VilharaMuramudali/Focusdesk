import React from "react";

export default function GreetingHeader({ name, greeting, icon, timeOfDay }) {
  return (
    <div className="greeting-header">
      <span className="greeting-icon" role="img" aria-label="icon">{icon}</span>
      <span className="greeting-text">
        {greeting}, <span className="greeting-name">{name}</span>!
        {timeOfDay && <span className="greeting-time"> ({timeOfDay})</span>}
      </span>
      <style>{`
        .greeting-header {
          display: flex;
          align-items: center;
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 1.5rem;
        }
        .greeting-icon {
          font-size: 2.2rem;
          margin-right: 0.7rem;
        }
        .greeting-text {
          color: #222;
        }
        .greeting-name {
          color: #2196f3;
          font-weight: 700;
        }
        .greeting-time {
          font-size: 1.1rem;
          color: #888;
          margin-left: 0.5rem;
        }
        @media (max-width: 600px) {
          .greeting-header {
            font-size: 1.2rem;
          }
          .greeting-icon {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
} 