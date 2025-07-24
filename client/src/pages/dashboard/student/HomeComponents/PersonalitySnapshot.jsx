import React from "react";

export default function PersonalitySnapshot({ traits = [] }) {
  return (
    <div className="personality-snapshot">
      <h3>Personality Snapshot</h3>
      <div className="traits-list">
        {traits.map(trait => (
          <div className="trait-bar" key={trait.name} title={trait.description}>
            <span className="trait-name">{trait.name}</span>
            <div className="bar-bg">
              <div className="bar-fill" style={{ width: `${trait.value}%` }}></div>
            </div>
            <span className="trait-value">{trait.value}</span>
          </div>
        ))}
      </div>
      <a href="#" className="update-personality">Update Personality</a>
      <style>{`
        .personality-snapshot {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.07);
          padding: 1.2rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .personality-snapshot h3 {
          margin-bottom: 1rem;
          color: #2196f3;
        }
        .traits-list {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .trait-bar {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .trait-name {
          width: 90px;
          font-size: 0.95rem;
          color: #444;
        }
        .bar-bg {
          flex: 1;
          background: #e3f2fd;
          border-radius: 6px;
          height: 12px;
          overflow: hidden;
        }
        .bar-fill {
          background: #2196f3;
          height: 100%;
          border-radius: 6px 0 0 6px;
          transition: width 0.5s;
        }
        .trait-value {
          width: 32px;
          text-align: right;
          font-size: 0.95rem;
          color: #2196f3;
        }
        .update-personality {
          display: inline-block;
          margin-top: 1rem;
          color: #2196f3;
          font-size: 0.95rem;
          text-decoration: underline;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
} 