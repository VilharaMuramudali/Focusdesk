import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SubjectInterests.scss';

const SubjectInterests = ({ onPreferencesUpdate }) => {
  const [preferences, setPreferences] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/users/preferences', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPreferences(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
      setError('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  };

  const getSubjectIcon = (subject) => {
    const icons = {
      'Mathematics': '📐',
      'Physics': '⚡',
      'Chemistry': '🧪',
      'Biology': '🧬',
      'Computer Science': '💻',
      'English Literature': '📚',
      'History': '🏛️',
      'Geography': '🌍',
      'Economics': '💰',
      'Psychology': '🧠',
      'Art & Design': '🎨',
      'Music': '🎵',
      'Physical Education': '⚽',
      'Foreign Languages': '🌐',
      'Business Studies': '💼',
      'Engineering': '⚙️',
      'Medicine': '🏥',
      'Law': '⚖️',
      'Architecture': '🏗️'
    };
    return icons[subject] || '📖';
  };

  const getLearningStyleLabel = (style) => {
    const labels = {
      'visual': 'Visual Learner',
      'auditory': 'Auditory Learner',
      'kinesthetic': 'Hands-on Learner',
      'reading': 'Reading/Writing Learner'
    };
    return labels[style] || style;
  };

  const getAcademicLevelLabel = (level) => {
    const labels = {
      'highschool': 'High School',
      'university': 'University',
      'postgraduate': 'Postgraduate'
    };
    return labels[level] || level;
  };

  const getSessionDurationLabel = (duration) => {
    const labels = {
      '30min': '30 minutes',
      '1hour': '1 hour',
      '2hours': '2 hours'
    };
    return labels[duration] || duration;
  };

  const getTimePreferenceLabel = (time) => {
    const labels = {
      'morning': 'Morning (8 AM - 12 PM)',
      'afternoon': 'Afternoon (12 PM - 5 PM)',
      'evening': 'Evening (5 PM - 9 PM)',
      'night': 'Night (9 PM - 12 AM)'
    };
    return labels[time] || time;
  };

  if (loading) {
    return (
      <div className="subject-interests">
        <div className="interests-header">
          <h3>You are Interested in</h3>
        </div>
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your interests...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="subject-interests">
        <div className="interests-header">
          <h3>You are Interested in</h3>
        </div>
        <div className="error-state">
          <p>Failed to load preferences</p>
          <button onClick={fetchPreferences} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!preferences || !preferences.subjects || preferences.subjects.length === 0) {
    return (
      <div className="subject-interests">
        <div className="interests-header">
          <h3>You are Interested in</h3>
        </div>
        <div className="empty-state">
          <div className="empty-icon">🎯</div>
          <p>No subjects selected yet</p>
          <small>Complete your preferences to get personalized recommendations</small>
        </div>
      </div>
    );
  }

  return (
    <div className="subject-interests">
      <div className="interests-header">
        <h3>You are Interested in</h3>
        <div className="preferences-badge">
          <span className="badge-icon">⚙️</span>
          <span>Preferences Set</span>
        </div>
      </div>

      <div className="interests-content">
        {/* Subjects */}
        <div className="interests-section">
          <h4>Subjects ({preferences.subjects.length})</h4>
          <div className="subjects-grid">
            {preferences.subjects.map(subject => (
              <div key={subject} className="subject-tag">
                <span className="subject-icon">{getSubjectIcon(subject)}</span>
                <span className="subject-name">{subject}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Preferences */}
        <div className="interests-section">
          <h4>Learning Preferences</h4>
          <div className="preferences-grid">
            <div className="preference-item">
              <div className="preference-label">
                <span className="label-icon">🎓</span>
                <span>Learning Style</span>
              </div>
              <div className="preference-value">
                {getLearningStyleLabel(preferences.learningStyle)}
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-label">
                <span className="label-icon">📚</span>
                <span>Academic Level</span>
              </div>
              <div className="preference-value">
                {getAcademicLevelLabel(preferences.academicLevel)}
              </div>
            </div>

            <div className="preference-item">
              <div className="preference-label">
                <span className="label-icon">⏱️</span>
                <span>Session Duration</span>
              </div>
              <div className="preference-value">
                {getSessionDurationLabel(preferences.sessionDuration)}
              </div>
            </div>
          </div>
        </div>

        {/* Time Preferences */}
        {preferences.timePreferences && preferences.timePreferences.length > 0 && (
          <div className="interests-section">
            <h4>Preferred Times</h4>
            <div className="time-preferences">
              {preferences.timePreferences.map(time => (
                <div key={time} className="time-tag">
                  <span className="time-icon">🕐</span>
                  <span>{getTimePreferenceLabel(time)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Recommendations Note */}
        <div className="ai-note">
          <div className="ai-icon">🤖</div>
          <div className="ai-content">
            <h5>AI-Powered Recommendations</h5>
            <p>Based on your preferences, we'll suggest the best educators and learning materials for you.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectInterests;
