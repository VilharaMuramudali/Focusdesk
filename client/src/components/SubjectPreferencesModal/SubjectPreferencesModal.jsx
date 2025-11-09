import React, { useState, useEffect } from 'react';
import newRequest from '../../utils/newRequest';
import './SubjectPreferencesModal.scss';

const SubjectPreferencesModal = ({ isOpen, onClose, onPreferencesSaved }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    subjects: [],
    learningStyle: 'visual',
    sessionDuration: '1hour',
    academicLevel: 'university',
    timePreferences: []
  });

  // Available subjects
  const availableSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science',
    'English Literature', 'History', 'Geography', 'Economics', 'Psychology',
    'Art & Design', 'Music', 'Physical Education', 'Foreign Languages',
    'Business Studies', 'Engineering', 'Medicine', 'Law', 'Architecture'
  ];

  // Learning styles with descriptions
  const learningStyles = [
    { value: 'visual', label: 'Visual', description: 'Learn best through images, diagrams, and visual aids' },
    { value: 'auditory', label: 'Auditory', description: 'Learn best through listening and verbal communication' },
    { value: 'kinesthetic', label: 'Hands-on', description: 'Learn best through physical activities and experiments' },
    { value: 'reading', label: 'Reading/Writing', description: 'Learn best through reading and writing activities' }
  ];

  // Session durations
  const sessionDurations = [
    { value: '30min', label: '30 minutes' },
    { value: '1hour', label: '1 hour' },
    { value: '2hours', label: '2 hours' }
  ];

  // Academic levels
  const academicLevels = [
    { value: 'highschool', label: 'High School' },
    { value: 'university', label: 'University' },
    { value: 'postgraduate', label: 'Postgraduate' }
  ];

  // Time preferences
  const timePreferences = [
    { value: 'morning', label: 'Morning (8 AM - 12 PM)' },
    { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)' },
    { value: 'evening', label: 'Evening (5 PM - 9 PM)' },
    { value: 'night', label: 'Night (9 PM - 12 AM)' }
  ];

  const handleSubjectToggle = (subject) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.includes(subject)
        ? prev.subjects.filter(s => s !== subject)
        : [...prev.subjects, subject]
    }));
  };

  const handleTimePreferenceToggle = (time) => {
    setFormData(prev => ({
      ...prev,
      timePreferences: prev.timePreferences.includes(time)
        ? prev.timePreferences.filter(t => t !== time)
        : [...prev.timePreferences, time]
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (step === 1 && formData.subjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    if (formData.subjects.length === 0) {
      alert('Please select at least one subject');
      return;
    }

    setLoading(true);
    try {
      const response = await newRequest.put('/users/preferences', formData);

      if (response.data.success) {
        onPreferencesSaved(response.data.data);
        onClose();
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save preferences. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="preferences-step">
      <h3>What subjects are you interested in?</h3>
      <p>Select all the subjects you'd like to learn or get help with:</p>
      
      <div className="subjects-grid">
        {availableSubjects.map(subject => (
          <div
            key={subject}
            className={`subject-card ${formData.subjects.includes(subject) ? 'selected' : ''}`}
            onClick={() => handleSubjectToggle(subject)}
          >
            <div className="subject-icon">
              {getSubjectIcon(subject)}
            </div>
            <span>{subject}</span>
          </div>
        ))}
      </div>
      
      <div className="selected-count">
        {formData.subjects.length} subject{formData.subjects.length !== 1 ? 's' : ''} selected
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="preferences-step">
      <h3>How do you prefer to learn?</h3>
      <p>Choose your preferred learning style:</p>
      
      <div className="learning-styles">
        {learningStyles.map(style => (
          <div
            key={style.value}
            className={`learning-style-card ${formData.learningStyle === style.value ? 'selected' : ''}`}
            onClick={() => handleInputChange('learningStyle', style.value)}
          >
            <div className="style-header">
              <h4>{style.label}</h4>
              <div className="radio-button">
                <div className="radio-inner"></div>
              </div>
            </div>
            <p>{style.description}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="preferences-step">
      <h3>What's your academic level?</h3>
      <p>This helps us match you with the right educators:</p>
      
      <div className="academic-levels">
        {academicLevels.map(level => (
          <div
            key={level.value}
            className={`level-card ${formData.academicLevel === level.value ? 'selected' : ''}`}
            onClick={() => handleInputChange('academicLevel', level.value)}
          >
            <h4>{level.label}</h4>
            <div className="radio-button">
              <div className="radio-inner"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="preferences-step">
      <h3>Session preferences</h3>
      <p>Tell us about your preferred session duration and timing:</p>
      
      <div className="session-preferences">
        <div className="preference-section">
          <h4>Session Duration</h4>
          <div className="duration-options">
            {sessionDurations.map(duration => (
              <div
                key={duration.value}
                className={`duration-card ${formData.sessionDuration === duration.value ? 'selected' : ''}`}
                onClick={() => handleInputChange('sessionDuration', duration.value)}
              >
                <span>{duration.label}</span>
                <div className="radio-button">
                  <div className="radio-inner"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="preference-section">
          <h4>Preferred Times</h4>
          <p>Select when you're typically available for sessions:</p>
          <div className="time-preferences">
            {timePreferences.map(time => (
              <div
                key={time.value}
                className={`time-card ${formData.timePreferences.includes(time.value) ? 'selected' : ''}`}
                onClick={() => handleTimePreferenceToggle(time.value)}
              >
                <span>{time.label}</span>
                <div className="checkbox">
                  <div className="checkmark"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

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

  const getStepTitle = () => {
    const titles = {
      1: 'Choose Subjects',
      2: 'Learning Style',
      3: 'Academic Level',
      4: 'Session Preferences'
    };
    return titles[step] || '';
  };

  if (!isOpen) return null;

  return (
    <div className="subject-preferences-modal">
      <div className="modal-overlay" onClick={onClose}></div>
      <div className="modal-content">
        <div className="modal-header">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${(step / 4) * 100}%` }}
            ></div>
          </div>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          <div className="step-indicator">
            <span className="step-number">{step}</span>
            <span className="step-title">{getStepTitle()}</span>
          </div>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
        </div>

        <div className="modal-footer">
          <div className="button-group">
            {step > 1 && (
              <button 
                className="btn-secondary" 
                onClick={handlePrevious}
                disabled={loading}
              >
                Previous
              </button>
            )}
            
            {step < 4 ? (
              <button 
                className="btn-primary" 
                onClick={handleNext}
                disabled={loading}
              >
                Next
              </button>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubjectPreferencesModal;
