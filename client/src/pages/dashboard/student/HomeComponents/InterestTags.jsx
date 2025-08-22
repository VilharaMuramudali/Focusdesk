import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import newRequest from '../../../../utils/newRequest';

const InterestTags = forwardRef(({ topSubjects, refreshKey, onEditPreferences }, ref) => {
  const defaultSubjects = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'English'];
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [removingSubject, setRemovingSubject] = useState(null);

  useEffect(() => {
    fetchUserPreferences();
  }, [refreshKey]);

  const fetchUserPreferences = async () => {
    try {
      setLoading(true);
      console.log('Fetching user preferences...');
      
      const response = await newRequest.get('/users/preferences');
      console.log('Preferences response:', response.data);

      if (response.data.success && response.data.data?.subjects) {
        console.log('Setting subjects from preferences:', response.data.data.subjects);
        setSubjects(response.data.data.subjects);
      } else {
        console.log('No preferences found, using fallback subjects');
        // Fallback to topSubjects or default subjects
        setSubjects(topSubjects && topSubjects.length > 0 ? topSubjects : defaultSubjects);
      }
    } catch (error) {
      console.error('Error fetching user preferences:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load preferences';
      setError(errorMessage);
      // Fallback to topSubjects or default subjects
      setSubjects(topSubjects && topSubjects.length > 0 ? topSubjects : defaultSubjects);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (indexToRemove) => {
    const subjectToRemove = subjects[indexToRemove];
    const confirmed = window.confirm(`Are you sure you want to remove "${subjectToRemove}" from your preferences?`);
    
    if (!confirmed) {
      return;
    }
    
    try {
      setRemovingSubject(indexToRemove);
      const updatedSubjects = subjects.filter((_, index) => index !== indexToRemove);
      
      // Get current user preferences first
      const currentPrefsResponse = await newRequest.get('/users/preferences');
      let currentPrefs = {};
      
      if (currentPrefsResponse.data.success) {
        currentPrefs = currentPrefsResponse.data.data;
      }
      
      // Update preferences in backend with current values
      const response = await newRequest.put('/users/preferences', {
        subjects: updatedSubjects,
        learningStyle: currentPrefs.learningStyle || 'visual',
        sessionDuration: currentPrefs.sessionDuration || '1hour',
        academicLevel: currentPrefs.academicLevel || 'university',
        timePreferences: currentPrefs.timePreferences || []
      });

      if (response.data.success) {
        setSubjects(updatedSubjects);
        console.log('Subject removed successfully');
      }
    } catch (error) {
      console.error('Error removing subject:', error);
      alert('Failed to remove subject. Please try again.');
    } finally {
      setRemovingSubject(null);
    }
  };

  // Function to refresh preferences (can be called from parent component)
  const refreshPreferences = () => {
    fetchUserPreferences();
  };

  // Function to open edit preferences modal
  const handleEditPreferences = () => {
    if (onEditPreferences) {
      onEditPreferences();
    }
  };

  // Expose refresh function to parent component
  useImperativeHandle(ref, () => ({
    refreshPreferences
  }));

  if (loading) {
    return (
      <div className="interest-tags-section">
        <div className="section-header">
          <h3>You are Interested on</h3>
        </div>
        <div className="tags-container">
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading your preferences...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="interest-tags-section">
        <div className="section-header">
          <h3>You are Interested on</h3>
        </div>
        <div className="tags-container">
          <div className="error-state">
            <p>{error}</p>
            <button onClick={fetchUserPreferences} className="retry-btn">
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="interest-tags-section">
      <div className="section-header">
        <h3>You are Interested on</h3>
        <button className="edit-preferences-btn" onClick={handleEditPreferences}>
          <span>Edit Preferences</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2.00009 3L8.00009 3L8.00009 5L2.00009 5L2.00009 3ZM2.00009 7L14.0001 7L14.0001 9L2.00009 9L2.00009 7ZM2.00009 11L10.0001 11L10.0001 13L2.00009 13L2.00009 11ZM2.00009 15L12.0001 15L12.0001 17L2.00009 17L2.00009 15Z" fill="black"/>
          </svg>
        </button>
      </div>
      <div className="tags-container">
        {subjects.length > 0 ? (
          subjects.map((subject, index) => (
            <div key={index} className={`tag-item ${removingSubject === index ? 'removing' : ''}`}>
            <span className="tag-text">{subject}</span>
            <button 
              className="remove-tag-btn"
              onClick={() => handleRemoveTag(index)}
                disabled={removingSubject === index}
            >
                {removingSubject === index ? (
                  <div className="removing-spinner"></div>
                ) : (
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 1.5C4.85786 1.5 1.5 4.85786 1.5 9C1.5 13.1421 4.85786 16.5 9 16.5C13.1421 16.5 16.5 13.1421 16.5 9C16.5 4.85786 13.1421 1.5 9 1.5ZM12.75 11.25L11.25 12.75L9 10.5L6.75 12.75L5.25 11.25L7.5 9L5.25 6.75L6.75 5.25L9 7.5L11.25 5.25L12.75 6.75L10.5 9L12.75 11.25Z" stroke="#7CA9FF" strokeWidth="2"/>
              </svg>
                )}
            </button>
          </div>
          ))
        ) : (
          <div className="empty-state">
            <p>No preferences set yet. Set your preferences to see personalized recommendations.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default InterestTags;
