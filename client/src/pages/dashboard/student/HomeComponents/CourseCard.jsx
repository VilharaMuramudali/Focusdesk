import React from "react";
import { FaPlay, FaFileAlt, FaClock, FaStar, FaCalendar, FaUser, FaBookmark } from "react-icons/fa";

const CourseCard = ({ course, onContinue, onViewMaterials, onBookmark }) => {
  const getProgressPercentage = (course) => {
    const totalSessions = course.sessions?.length || 1;
    const completedSessions = course.sessions?.filter(session => 
      session.status === 'completed'
    ).length || 0;
    return Math.round((completedSessions / totalSessions) * 100);
  };

  const getCourseStatus = (course) => {
    const progress = getProgressPercentage(course);
    if (progress === 100) return 'completed';
    if (progress > 0) return 'in-progress';
    return 'not-started';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const status = getCourseStatus(course);
  const progress = getProgressPercentage(course);

  return (
    <div className="course-card">
      <div className="course-header">
        <div className="course-info">
          <h3>{course.packageId?.title || 'Course Title'}</h3>
          <p>by {course.educatorId?.fullName || course.educatorId?.name || course.educatorId?.username || 'Educator'}</p>
        </div>
        <div className={`course-status ${status}`}>
          {status === 'completed' ? 'Completed' : 
           status === 'in-progress' ? 'In Progress' : 'Not Started'}
        </div>
      </div>
      
      <div className="course-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        <span className="progress-text">{progress}% Complete</span>
      </div>
      
      <div className="course-details">
        <div className="detail-item">
          <FaClock />
          <span>{course.sessions?.length || 0} Sessions</span>
        </div>
        <div className="detail-item">
          <FaStar />
          <span>{course.packageId?.rating || 'No rating'}</span>
        </div>
        <div className="detail-item">
          <FaCalendar />
          <span>Started {formatDate(course.createdAt)}</span>
        </div>
      </div>
      
      <div className="course-actions">
        <button 
          className="action-btn primary"
          onClick={() => onContinue(course)}
        >
          <FaPlay />
          Continue Learning
        </button>
        <button 
          className="action-btn secondary"
          onClick={() => onViewMaterials(course)}
        >
          <FaFileAlt />
          Materials
        </button>
        <button 
          className="action-btn bookmark"
          onClick={() => onBookmark(course)}
        >
          <FaBookmark />
        </button>
      </div>
    </div>
  );
};

export default CourseCard;
