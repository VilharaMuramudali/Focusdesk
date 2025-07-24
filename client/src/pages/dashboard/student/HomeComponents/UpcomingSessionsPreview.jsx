import React from "react";

export default function UpcomingSessionsPreview({ sessions = [] }) {
  return (
    <div className="upcoming-sessions-preview">
      <h3>Upcoming Sessions</h3>
      <div className="sessions-row">
        {sessions.map((s, idx) => (
          <div className={`session-card session-type-${s.type}`} key={idx}>
            <div className="session-header">
              <img src={s.avatar} alt={s.tutor} className="session-avatar" />
              <span className="session-tutor">{s.tutor}</span>
            </div>
            <div className="session-subject">{s.subject}</div>
            <div className="session-datetime">{s.date} {s.time}</div>
            {s.countdown && <div className="session-countdown">{s.countdown}</div>}
            <div className="session-actions">
              <button onClick={s.onJoin}>Join</button>
              <button onClick={s.onReschedule}>Reschedule</button>
              <button onClick={s.onCancel}>Cancel</button>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .upcoming-sessions-preview {
          margin-bottom: 1.5rem;
        }
        .upcoming-sessions-preview h3 {
          color: #2196f3;
          margin-bottom: 0.7rem;
        }
        .sessions-row {
          display: flex;
          gap: 1rem;
          overflow-x: auto;
        }
        .session-card {
          min-width: 200px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.07);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .session-header {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .session-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          object-fit: cover;
        }
        .session-tutor {
          font-weight: 600;
          color: #222;
        }
        .session-subject {
          color: #2196f3;
          font-size: 1rem;
        }
        .session-datetime {
          color: #888;
          font-size: 0.95rem;
        }
        .session-countdown {
          background: #ffd600;
          color: #222;
          border-radius: 6px;
          padding: 0.2rem 0.7rem;
          font-size: 0.9rem;
          font-weight: 600;
        }
        .session-actions {
          display: flex;
          gap: 0.5rem;
        }
        .session-actions button {
          background: #2196f3;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.3rem 0.8rem;
          font-size: 0.9rem;
          cursor: pointer;
        }
        .session-actions button:hover {
          background: #1976d2;
        }
        .session-type-1-on-1 {
          border-left: 4px solid #2196f3;
        }
        .session-type-group {
          border-left: 4px solid #ffd600;
        }
        .session-type-peer {
          border-left: 4px solid #4caf50;
        }
        @media (max-width: 600px) {
          .session-card {
            min-width: 140px;
            padding: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
} 