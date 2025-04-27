import React, { useEffect, useState } from "react";
import { FaUser, FaCalendarAlt, FaCreditCard, FaEdit, FaStar, FaClock, FaPlus, FaVideo } from "react-icons/fa";
import "./educatorDashboard.scss";

const mockProfile = {
  img: "",
  name: "Dr. Jane Doe",
  bio: "Passionate educator with 10+ years in STEM. I help students master complex topics with ease.",
  qualifications: "PhD in Physics, MSc in Mathematics",
  rating: 4.9,
  available: "Mon-Fri",
  timeSlots: ["09:00-11:00", "14:00-16:00"],
};

const mockPackages = [
  {
    id: 1,
    thumbnail: "",
    title: "Algebra Basics",
    description: "Master the fundamentals of algebra in 5 sessions.",
    keywords: "algebra, math, basics",
    rate: 25,
    video: "",
  },
];

export default function EducatorDashboard() {
  const [tab, setTab] = useState("profile");
  const [profile, setProfile] = useState(mockProfile);
  const [packages, setPackages] = useState(mockPackages);
  const [newPackage, setNewPackage] = useState({
    thumbnail: "",
    title: "",
    description: "",
    keywords: "",
    rate: "",
    video: "",
  });

  // Profile update handlers
  const handleProfileChange = (e) => setProfile({ ...profile, [e.target.name]: e.target.value });
  const handleTimeSlotChange = (idx, value) => {
    const slots = [...profile.timeSlots];
    slots[idx] = value;
    setProfile({ ...profile, timeSlots: slots });
  };

  // Package handlers
  const handlePackageChange = (e) => setNewPackage({ ...newPackage, [e.target.name]: e.target.value });
  const addPackage = (e) => {
    e.preventDefault();
    setPackages([...packages, { ...newPackage, id: Date.now() }]);
    setNewPackage({ thumbnail: "", title: "", description: "", keywords: "", rate: "", video: "" });
  };

  return (
    <div className="educator-dashboard">
      {/* Navbar */}
      <nav className="ed-navbar">
        <div className="ed-navbar-logo">FocusDesk</div>
        <ul>
          <li className={tab === "profile" ? "active" : ""} onClick={() => setTab("profile")}>Profile</li>
          <li className={tab === "schedules" ? "active" : ""} onClick={() => setTab("schedules")}>Schedules</li>
          <li className={tab === "payments" ? "active" : ""} onClick={() => setTab("payments")}>Payments</li>
        </ul>
        <div className="ed-navbar-user">
          <FaUser />
        </div>
      </nav>

      {/* Profile Tab */}
      {tab === "profile" && (
        <div className="ed-profile">
          <section className="ed-profile-main">
            <div className="ed-profile-pic">
              {profile.img ? <img src={profile.img} alt="profile" /> : <FaUser size={60} />}
              <input type="file" style={{ display: "none" }} id="profile-pic-upload" />
              <label htmlFor="profile-pic-upload" className="ed-btn small">Change</label>
            </div>
            <div className="ed-profile-info">
              <input name="name" value={profile.name} onChange={handleProfileChange} className="ed-input big" />
              <textarea name="bio" value={profile.bio} onChange={handleProfileChange} className="ed-input" rows={2} />
              <input name="qualifications" value={profile.qualifications} onChange={handleProfileChange} className="ed-input" />
              <div className="ed-profile-row">
                <span><FaStar className="star" /> {profile.rating}</span>
                <input name="available" value={profile.available} onChange={handleProfileChange} className="ed-input small" />
              </div>
              <div className="ed-profile-row">
                {profile.timeSlots.map((slot, idx) => (
                  <input
                    key={idx}
                    value={slot}
                    onChange={e => handleTimeSlotChange(idx, e.target.value)}
                    className="ed-input small"
                  />
                ))}
                <button className="ed-btn small" onClick={() => setProfile({ ...profile, timeSlots: [...profile.timeSlots, ""] })}>+ Add Slot</button>
              </div>
              <button className="ed-btn">Save Profile</button>
            </div>
          </section>

          {/* Session Packages */}
          <section className="ed-packages">
            <h3>Session Packages</h3>
            <form className="ed-package-form" onSubmit={addPackage}>
              <input name="thumbnail" value={newPackage.thumbnail} onChange={handlePackageChange} placeholder="Thumbnail URL" className="ed-input small" />
              <input name="title" value={newPackage.title} onChange={handlePackageChange} placeholder="Title" className="ed-input small" />
              <input name="description" value={newPackage.description} onChange={handlePackageChange} placeholder="Description" className="ed-input" />
              <input name="keywords" value={newPackage.keywords} onChange={handlePackageChange} placeholder="Subject Keywords" className="ed-input small" />
              <input name="rate" value={newPackage.rate} onChange={handlePackageChange} placeholder="Hourly Rate" className="ed-input small" type="number" />
              <input name="video" value={newPackage.video} onChange={handlePackageChange} placeholder="Intro Video URL" className="ed-input small" />
              <button className="ed-btn small" type="submit"><FaPlus /> Add Package</button>
            </form>
            <div className="ed-package-list">
              {packages.map(pkg => (
                <div className="ed-package-card" key={pkg.id}>
                  {pkg.thumbnail ? <img src={pkg.thumbnail} alt="thumb" /> : <FaVideo />}
                  <div>
                    <h4>{pkg.title}</h4>
                    <p>{pkg.description}</p>
                    <div className="ed-package-meta">
                      <span>{pkg.keywords}</span>
                      <span>${pkg.rate}/hr</span>
                    </div>
                    {pkg.video && <a href={pkg.video} target="_blank" rel="noopener noreferrer" className="ed-btn tiny">View Video</a>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}

      {/* Schedules Tab */}
      {tab === "schedules" && (
        <div className="ed-schedules">
          <h3>New Session Bookings</h3>
          <div className="ed-schedule-list">
            <div className="ed-schedule-card">
              <div>
                <strong>Student:</strong> John Smith<br />
                <strong>Topic:</strong> Algebra<br />
                <strong>Date:</strong> 2025-04-20<br />
                <strong>Time:</strong> 10:00 AM
              </div>
              <div>
                <button className="ed-btn tiny">Accept</button>
                <button className="ed-btn tiny">Decline</button>
              </div>
            </div>
          </div>
          <h3>Current Sessions</h3>
          <div className="ed-schedule-list">
            <div className="ed-schedule-card">
              <div>
                <strong>Student:</strong> Emma Johnson<br />
                <strong>Topic:</strong> Calculus<br />
                <strong>Date:</strong> 2025-04-21<br />
                <strong>Time:</strong> 2:00 PM
              </div>
              <div>
                <button className="ed-btn tiny">Join</button>
              </div>
            </div>
          </div>
          <h3>Session History</h3>
          <div className="ed-schedule-list">
            <div className="ed-schedule-card">
              <div>
                <strong>Student:</strong> Michael Brown<br />
                <strong>Topic:</strong> Physics<br />
                <strong>Date:</strong> 2025-04-10<br />
                <strong>Status:</strong> Completed
              </div>
              <div>
                <span className="ed-history-status">Completed</span>
              </div>
            </div>
          </div>
          <h3>My Calendar</h3>
          <div className="ed-calendar">
            <p>Available Slots:</p>
            {profile.timeSlots.map((slot, idx) => (
              <span className="ed-calendar-slot" key={idx}>{slot}</span>
            ))}
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {tab === "payments" && (
        <div className="ed-payments">
          <div className="ed-balance">
            <h3>Account Balance</h3>
            <div className="ed-balance-amount">$560.00</div>
          </div>
          <h3>Payment History</h3>
          <div className="ed-payment-list">
            <div className="ed-payment-row">
              <span>Date: 2025-04-10</span>
              <span>Amount: $40</span>
              <span>Status: Completed</span>
              <span>Session: Physics</span>
            </div>
            <div className="ed-payment-row">
              <span>Date: 2025-04-05</span>
              <span>Amount: $80</span>
              <span>Status: Completed</span>
              <span>Session: Calculus</span>
            </div>
          </div>
          <h3>Transaction Details</h3>
          <div className="ed-transaction-details">
            <p>Last Transaction: #TXN123456789</p>
            <p>Date: 2025-04-10</p>
            <p>Amount: $40</p>
            <p>Status: Completed</p>
          </div>
        </div>
      )}
    </div>
  );
}
