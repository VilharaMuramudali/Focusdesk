import React from "react";

export default function RecommendedStudyTimesWidget({ times = [], view = 'daily', onToggleView, onAddToCalendar }) {
  return (
    <div className="recommended-study-times-widget">
      <h3>Recommended Study Times</h3>
      <div className="times-list">
        {times.map((t, idx) => (
          <div className="time-slot" key={idx}>
            <span className="time-icon" role="img" aria-label="icon">{t.icon}</span>
            <span className="time-slot-label">{t.slot}</span>
            <span className="time-desc">{t.description}</span>
          </div>
        ))}
      </div>
      <div className="study-times-actions">
        <button className="toggle-view-btn" onClick={onToggleView}>
          {view === 'daily' ? 'Weekly View' : 'Daily View'}
        </button>
        <button className="add-calendar-btn" onClick={onAddToCalendar}>Add to Calendar</button>
      </div>
      <style>{`
        .recommended-study-times-widget {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.07);
          padding: 1.2rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .recommended-study-times-widget h3 {
          color: #2196f3;
          margin-bottom: 1rem;
        }
        .times-list {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
        }
        .time-slot {
          display: flex;
          align-items: center;
          gap: 0.7rem;
        }
        .time-icon {
          font-size: 1.3rem;
          animation: flicker 1.5s infinite alternate;
        }
        @keyframes flicker {
          0% { opacity: 1; }
          100% { opacity: 0.7; }
        }
        .time-slot-label {
          font-weight: 600;
          color: #222;
        }
        .time-desc {
          color: #888;
          font-size: 0.95rem;
        }
        .study-times-actions {
          margin-top: 1rem;
          display: flex;
          gap: 1rem;
        }
        .toggle-view-btn, .add-calendar-btn {
          background: #2196f3;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.4rem 1rem;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .toggle-view-btn:hover, .add-calendar-btn:hover {
          background: #1976d2;
        }
      `}</style>
    </div>
  );
} 