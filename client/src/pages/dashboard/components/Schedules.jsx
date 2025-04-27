import React from 'react';
import './Schedules.scss';

function Schedules() {
  const mockSchedules = [
    { id: 1, date: '2025-04-07', time: '10:00 AM', student: 'John Doe', topic: 'Algebra Basics' },
    { id: 2, date: '2025-04-08', time: '2:00 PM', student: 'Jane Smith', topic: 'Physics Concepts' },
  ];

  return (
    <div className="schedules">
      <h2>My Schedules</h2>
      <ul className="schedule-list">
        {mockSchedules.map((schedule) => (
          <li key={schedule.id} className="schedule-item">
            <p><strong>Date:</strong> {schedule.date}</p>
            <p><strong>Time:</strong> {schedule.time}</p>
            <p><strong>Student:</strong> {schedule.student}</p>
            <p><strong>Topic:</strong> {schedule.topic}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Schedules;
