import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaUser,FaEnvelope,FaLock,FaGraduationCap,FaGlobe,FaChalkboardTeacher,FaTimes,} from "react-icons/fa";
import newRequest from "../../utils/newRequest";
import "./Register.scss";

function Register({ inPanel = false, onClose, onRegisterSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    country: "",
    isEducator: false,
    bio: "",
    subjects: [],
    educationLevel: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setUser((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const validateForm = () => {
    if (
      !user.username ||
      !user.email ||
      !user.password ||
      !user.country ||
      !user.educationLevel
    ) {
      setError("Please fill in all required fields");
      return false;
    }

    if (user.password !== user.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }

    if (user.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) return;

    setLoading(true);

    try {
      // No profile image logic here
      const userData = {
        username: user.username,
        email: user.email,
        password: user.password,
        country: user.country,
        isEducator: user.isEducator,
        bio: user.bio || "",
        subjects: user.subjects,
        educationLevel: user.educationLevel,
      };

      await newRequest.post("/auth/register", userData);

      setLoading(false);

      if (inPanel && onRegisterSuccess) {
        onRegisterSuccess();
      } else {
        navigate("/login", {
          state: { message: "Registration successful! Please log in." },
        });
      }
    } catch (err) {
      setLoading(false);
      console.error("Registration error:", err);

      if (!err.response) {
        setError("Network error. Please check your connection.");
      } else {
        setError(
          err.response?.data?.message ||
            err.response?.data ||
            "Failed to create user. Please try again."
        );
      }
    }
  };

  const registerContainerClass = inPanel
    ? "register-container in-panel"
    : "register-container";

  return (
    <div className={registerContainerClass}>
      <div className="register-card">
        <div className="register-header">
          <h1>Create an account</h1>
          <p>It`s Free and Easy</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="username">
                User Name <span className="required">*</span>
              </label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="abc"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                Email <span className="required">*</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="abc@abc.com"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password <span className="required">*</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="**********"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password <span className="required">*</span>
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="**********"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="country">
                Country <span className="required">*</span>
              </label>
              <input
                id="country"
                name="country"
                type="text"
                placeholder="Select your country"
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="educationLevel">
                Educational level <span className="required">*</span>
              </label>
              <select
                id="educationLevel"
                name="educationLevel"
                onChange={handleChange}
                required
              >
                <option value="" disabled selected>
                  Your Educational level
                </option>
                <option value="high_school">High School</option>
                <option value="bachelors">Bachelor`s Degree</option>
                <option value="masters">Master`s Degree</option>
                <option value="phd">PhD</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* Profile picture upload section removed */}

          <div className="role-selection">
            <div className="role-option">
              <input
                type="radio"
                id="student"
                name="role"
                value="student"
                checked={!user.isEducator}
                onChange={() =>
                  setUser((prev) => ({ ...prev, isEducator: false }))
                }
              />
              <label htmlFor="student">
                <div className="avatar-group">
                  <img
                    src="https://randomuser.me/api/portraits/men/32.jpg"
                    alt="Student"
                  />
                  <img
                    src="https://randomuser.me/api/portraits/women/44.jpg"
                    alt="Student"
                  />
                  <img
                    src="https://randomuser.me/api/portraits/men/59.jpg"
                    alt="Student"
                  />
                </div>
                <span>I`m a Student</span>
              </label>
            </div>

            <div className="role-option">
              <input
                type="radio"
                id="educator"
                name="role"
                value="educator"
                checked={user.isEducator}
                onChange={() =>
                  setUser((prev) => ({ ...prev, isEducator: true }))
                }
              />
              <label htmlFor="educator">
                <div className="avatar-group">
                  <img
                    src="https://randomuser.me/api/portraits/women/68.jpg"
                    alt="Educator"
                  />
                  <img
                    src="https://randomuser.me/api/portraits/men/75.jpg"
                    alt="Educator"
                  />
                  <img
                    src="https://randomuser.me/api/portraits/women/89.jpg"
                    alt="Educator"
                  />
                </div>
                <span>I`m a Educator</span>
              </label>
            </div>
          </div>

          <button type="submit" className="create-account-btn">
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div className="login-link">
            <p>
              Already have an account? <a href="/login">Sign in</a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Register;
