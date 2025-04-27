import React, { useState } from 'react';
import './Home.scss';

function Home() {
  const [tutorDetails, setTutorDetails] = useState({
    name: '',
    bio: '',
    expertise: ''
  });
  const [video, setVideo] = useState(null);

  const handleDetailsChange = (e) => {
    const { name, value } = e.target;
    setTutorDetails({ ...tutorDetails, [name]: value });
  };

  const handleVideoUpload = (e) => {
    setVideo(e.target.files);
  };

  const handleSave = () => {
    alert('Details saved successfully!');
  };

  return (
    <div className="home">
      <h2>Welcome to Tutor Dashboard</h2>

      <div className="tutor-details">
        <h3>Edit Tutor Details</h3>
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={tutorDetails.name}
          onChange={handleDetailsChange}
        />
        <textarea
          name="bio"
          placeholder="Bio"
          value={tutorDetails.bio}
          onChange={handleDetailsChange}
        ></textarea>
        <input
          type="text"
          name="expertise"
          placeholder="Expertise"
          value={tutorDetails.expertise}
          onChange={handleDetailsChange}
        />
        <button onClick={handleSave}>Save Details</button>
      </div>

      <div className="video-upload">
        <h3>Add Video</h3>
        <input type="file" accept="video/*" onChange={handleVideoUpload} />
        {video && <p>Uploaded: {video.name}</p>}
      </div>
    </div>
  );
}

export default Home;
