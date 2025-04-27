import React, { useState, useEffect } from "react";
import newRequest from "../../../utils/newRequest";

export default function SchedulesSection() {
  const [profile, setProfile] = useState({
    timeSlots: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await newRequest.get("/profiles/educator");
        setProfile({
          timeSlots: response.data.profile.timeSlots || []
        });
        setLoading(false);
      } catch (err) {
        console.error("Error fetching profile:", err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  if (loading) {
    return <div>Loading schedule data...</div>;
  }

  return (
    <div className="ed-schedules">
      <h3>New Session Bookings</h3>
      {/* Rest of your component code */}
      <h3>My Calendar</h3>
      <div className="ed-calendar">
        <p>Available Slots:</p>
        {profile.timeSlots.map((slot, idx) => (
          <span className="ed-calendar-slot" key={idx}>{slot}</span>
        ))}
      </div>
    </div>
  );
}
