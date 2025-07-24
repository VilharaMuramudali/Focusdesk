import React from "react";

export default function MicroMotivationQuote({ quote, author, language, onFavorite }) {
  return (
    <div className="micro-motivation-quote">
      <blockquote>{quote}</blockquote>
      <div className="quote-meta">
        <span className="quote-author">{author}</span>
        {language && <span className="quote-lang">({language})</span>}
        {onFavorite && <button className="favorite-btn" onClick={onFavorite}>★</button>}
      </div>
      <style>{`
        .micro-motivation-quote {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.07);
          padding: 1.2rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .micro-motivation-quote blockquote {
          font-size: 1.1rem;
          color: #222;
          margin: 0 0 0.7rem 0;
          font-style: italic;
        }
        .quote-meta {
          display: flex;
          align-items: center;
          gap: 0.7rem;
          color: #888;
        }
        .quote-author {
          font-weight: 600;
          color: #2196f3;
        }
        .quote-lang {
          font-size: 0.95rem;
        }
        .favorite-btn {
          background: none;
          border: none;
          color: #ffd600;
          font-size: 1.2rem;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
} 