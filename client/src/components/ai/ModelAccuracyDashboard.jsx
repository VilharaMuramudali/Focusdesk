import React, { useState, useEffect } from 'react';
import newRequest from '../../utils/newRequest';
import './ModelAccuracyDashboard.scss';

const ModelAccuracyDashboard = () => {
  const [accuracyData, setAccuracyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAccuracyData();
  }, []);

  const fetchAccuracyData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Try to fetch evaluation results from the AI service
      const response = await newRequest.get('/ai/evaluation-results');
      
      if (response.data.success) {
        setAccuracyData(response.data.results);
      } else {
        setError('Failed to load accuracy data');
      }
    } catch (error) {
      console.error('Error fetching accuracy data:', error);
      setError('Failed to load accuracy data');
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (score) => {
    if (score >= 0.8) return '#10B981'; // Green
    if (score >= 0.6) return '#F59E0B'; // Yellow
    if (score >= 0.4) return '#EF4444'; // Red
    return '#6B7280'; // Gray
  };

  const formatPercentage = (value) => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="accuracy-dashboard">
        <div className="dashboard-header">
          <h3>AI Model Accuracy</h3>
        </div>
        <div className="loading-placeholder">Loading accuracy metrics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="accuracy-dashboard">
        <div className="dashboard-header">
          <h3>AI Model Accuracy</h3>
        </div>
        <div className="error-placeholder">
          <p>{error}</p>
          <button onClick={fetchAccuracyData} className="retry-btn">Retry</button>
        </div>
      </div>
    );
  }

  if (!accuracyData) {
    return (
      <div className="accuracy-dashboard">
        <div className="dashboard-header">
          <h3>AI Model Accuracy</h3>
        </div>
        <div className="no-data-placeholder">
          <p>No accuracy data available. Run model evaluation first.</p>
          <button onClick={fetchAccuracyData} className="refresh-btn">Refresh</button>
        </div>
      </div>
    );
  }

  const { summary, algorithm_results } = accuracyData;

  return (
    <div className="accuracy-dashboard">
      <div className="dashboard-header">
        <h3>AI Model Accuracy</h3>
        <button onClick={fetchAccuracyData} className="refresh-btn">🔄 Refresh</button>
      </div>

      {/* Overall Accuracy Summary */}
      <div className="accuracy-summary">
        <div className="summary-card">
          <div className="summary-title">Overall Accuracy</div>
          <div 
            className="summary-value" 
            style={{ color: getAccuracyColor(summary.overall_accuracy) }}
          >
            {formatPercentage(summary.overall_accuracy)}
          </div>
          <div className="summary-label">Best Algorithm: {summary.best_algorithm}</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Precision</div>
          <div 
            className="summary-value" 
            style={{ color: getAccuracyColor(summary.best_precision) }}
          >
            {formatPercentage(summary.best_precision)}
          </div>
          <div className="summary-label">How relevant are recommendations</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">Recall</div>
          <div 
            className="summary-value" 
            style={{ color: getAccuracyColor(summary.best_recall) }}
          >
            {formatPercentage(summary.best_recall)}
          </div>
          <div className="summary-label">How many relevant items found</div>
        </div>

        <div className="summary-card">
          <div className="summary-title">NDCG</div>
          <div 
            className="summary-value" 
            style={{ color: getAccuracyColor(summary.best_ndcg) }}
          >
            {formatPercentage(summary.best_ndcg)}
          </div>
          <div className="summary-label">Ranking quality</div>
        </div>
      </div>

      {/* Algorithm Comparison */}
      <div className="algorithm-comparison">
        <h4>Algorithm Performance Comparison</h4>
        <div className="comparison-table">
          <div className="table-header">
            <div className="header-cell">Algorithm</div>
            <div className="header-cell">Precision@5</div>
            <div className="header-cell">Recall@5</div>
            <div className="header-cell">NDCG@5</div>
            <div className="header-cell">Diversity</div>
            <div className="header-cell">Coverage</div>
          </div>
          
          {Object.entries(algorithm_results).map(([algorithm, results]) => (
            <div key={algorithm} className="table-row">
              <div className="cell algorithm-name">
                <span className={`algorithm-badge ${algorithm}`}>
                  {algorithm.toUpperCase()}
                </span>
              </div>
              <div className="cell metric">
                <div className="metric-value" style={{ color: getAccuracyColor(results.avg_precision_at_5) }}>
                  {formatPercentage(results.avg_precision_at_5)}
                </div>
              </div>
              <div className="cell metric">
                <div className="metric-value" style={{ color: getAccuracyColor(results.avg_recall_at_5) }}>
                  {formatPercentage(results.avg_recall_at_5)}
                </div>
              </div>
              <div className="cell metric">
                <div className="metric-value" style={{ color: getAccuracyColor(results.avg_ndcg_at_5) }}>
                  {formatPercentage(results.avg_ndcg_at_5)}
                </div>
              </div>
              <div className="cell metric">
                <div className="metric-value" style={{ color: getAccuracyColor(results.avg_diversity) }}>
                  {formatPercentage(results.avg_diversity)}
                </div>
              </div>
              <div className="cell metric">
                <div className="metric-value" style={{ color: getAccuracyColor(results.avg_coverage) }}>
                  {formatPercentage(results.avg_coverage)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Statistics */}
      <div className="data-statistics">
        <h4>Data Statistics</h4>
        <div className="stats-grid">
          <div className="stat-item">
            <div className="stat-value">{accuracyData.total_users}</div>
            <div className="stat-label">Total Users</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{accuracyData.total_packages}</div>
            <div className="stat-label">Total Packages</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{accuracyData.total_interactions}</div>
            <div className="stat-label">Total Interactions</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{accuracyData.test_interactions}</div>
            <div className="stat-label">Test Interactions</div>
          </div>
        </div>
      </div>

      {/* Evaluation Info */}
      <div className="evaluation-info">
        <div className="info-item">
          <span className="info-label">Evaluation Date:</span>
          <span className="info-value">
            {new Date(accuracyData.evaluation_date).toLocaleDateString()}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Algorithms Evaluated:</span>
          <span className="info-value">
            {accuracyData.algorithms_evaluated.join(', ')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ModelAccuracyDashboard;
