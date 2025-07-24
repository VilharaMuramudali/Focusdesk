import React from "react";

export default function SmartLearningFeed({ cards = [] }) {
  return (
    <div className="smart-learning-feed">
      <h3>Smart Learning Feed</h3>
      <div className="feed-scroll">
        {cards.map((card, idx) => (
          <div className="feed-card" key={idx}>
            <div className="feed-title">{card.title}</div>
            <div className="feed-educator">{card.educator}</div>
            <div className="feed-meta">
              <span className="feed-time">⏱️ {card.time}</span>
              <span className="feed-icon">{card.icon}</span>
              {card.aiRecommended && <span className="ai-badge">AI</span>}
            </div>
            <div className="feed-tags">
              {card.tags && card.tags.map((tag, i) => (
                <span className="feed-tag" key={i}>{tag}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .smart-learning-feed {
          margin-bottom: 1.5rem;
        }
        .smart-learning-feed h3 {
          color: #2196f3;
          margin-bottom: 0.7rem;
        }
        .feed-scroll {
          display: flex;
          overflow-x: auto;
          gap: 1rem;
          padding-bottom: 0.5rem;
        }
        .feed-card {
          min-width: 220px;
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.07);
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }
        .feed-title {
          font-weight: 600;
          color: #222;
        }
        .feed-educator {
          font-size: 0.95rem;
          color: #888;
        }
        .feed-meta {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          font-size: 0.95rem;
        }
        .ai-badge {
          background: #e3f2fd;
          color: #2196f3;
          border-radius: 6px;
          padding: 0 0.4rem;
          font-size: 0.8rem;
          margin-left: 0.3rem;
        }
        .feed-tags {
          display: flex;
          gap: 0.4rem;
          flex-wrap: wrap;
        }
        .feed-tag {
          background: #f5f7fa;
          color: #2196f3;
          border-radius: 6px;
          padding: 0.2rem 0.6rem;
          font-size: 0.85rem;
        }
        @media (max-width: 600px) {
          .feed-card {
            min-width: 160px;
            padding: 0.7rem;
          }
        }
      `}</style>
    </div>
  );
} 