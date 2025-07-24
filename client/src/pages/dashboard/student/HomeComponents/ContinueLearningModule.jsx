import React from "react";

export default function ContinueLearningModule({ modules = [], onResumeAll }) {
  return (
    <div className="continue-learning-module">
      <h3>Continue Learning</h3>
      <div className="modules-list">
        {modules.slice(0, 5).map((mod, idx) => (
          <div className="module-item" key={idx}>
            <span className="module-title">{mod.title}</span>
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${mod.progress}%` }}></div>
            </div>
            <button className="resume-btn" onClick={mod.onResume}>Resume</button>
          </div>
        ))}
      </div>
      {onResumeAll && (
        <button className="resume-all-btn" onClick={onResumeAll}>Resume All</button>
      )}
      <style>{`
        .continue-learning-module {
          background: #fff;
          border-radius: 10px;
          box-shadow: 0 2px 8px rgba(33,150,243,0.07);
          padding: 1.2rem 1.5rem;
          margin-bottom: 1.5rem;
        }
        .continue-learning-module h3 {
          color: #2196f3;
          margin-bottom: 1rem;
        }
        .modules-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .module-item {
          display: flex;
          align-items: center;
          gap: 1rem;
        }
        .module-title {
          flex: 1;
          font-size: 1rem;
          color: #444;
        }
        .progress-bar-bg {
          width: 120px;
          height: 10px;
          background: #e3f2fd;
          border-radius: 6px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          background: #ffd600;
          border-radius: 6px 0 0 6px;
          transition: width 0.5s;
        }
        .resume-btn {
          background: #2196f3;
          color: #fff;
          border: none;
          border-radius: 6px;
          padding: 0.4rem 1rem;
          font-size: 0.95rem;
          cursor: pointer;
        }
        .resume-btn:hover {
          background: #1976d2;
        }
        .resume-all-btn {
          display: none;
        }
        @media (max-width: 600px) {
          .resume-all-btn {
            display: block;
            position: sticky;
            bottom: 0;
            width: 100%;
            background: #ffd600;
            color: #222;
            font-weight: 600;
            border: none;
            border-radius: 0 0 10px 10px;
            padding: 1rem;
            margin-top: 1rem;
            z-index: 10;
          }
        }
      `}</style>
    </div>
  );
} 