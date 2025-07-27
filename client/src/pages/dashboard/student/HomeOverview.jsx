import React, { useEffect, useState } from "react";
import GreetingHeader from "./HomeComponents/GreetingHeader";
import PersonalitySnapshot from "./HomeComponents/PersonalitySnapshot";
import SmartLearningFeed from "./HomeComponents/SmartLearningFeed";
import ContinueLearningModule from "./HomeComponents/ContinueLearningModule";
import RecommendedStudyTimesWidget from "./HomeComponents/RecommendedStudyTimesWidget";
import UpcomingSessionsPreview from "./HomeComponents/UpcomingSessionsPreview";
import MicroMotivationQuote from "./HomeComponents/MicroMotivationQuote";
import logActivity from '../../../utils/logActivity';
import newRequest from '../../../utils/newRequest';
import { Link, useNavigate } from "react-router-dom";

export default function HomeOverview() {
  // Recommendations state
  const [recommendedTutors, setRecommendedTutors] = useState([]);
  const [workPlan, setWorkPlan] = useState([]);
  const [topSubjects, setTopSubjects] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    // Log home view
    logActivity({ type: 'view_home' });
    // Fetch recommendations
    newRequest.get('/recommend/tutors').then(res => {
      setRecommendedTutors(res.data.recommendedTutors || []);
      setTopSubjects(res.data.topSubjects || []);
    });
    newRequest.get('/recommend/workplan').then(res => {
      setWorkPlan(res.data.plan || []);
    });
  }, []);

  // Sample/mock data for demonstration
  const user = {
    name: "Kavindu",
    greeting: "Ayubowan",
    icon: "🪷",
    timeOfDay: "Good Morning"
  };
  
  const traits = [
    { name: "Openness", value: 80, description: "Curious, creative, open to new experiences." },
    { name: "Conscientiousness", value: 65, description: "Organized, dependable, self-disciplined." },
    { name: "Extraversion", value: 40, description: "Outgoing, energetic, sociable." },
    { name: "Agreeableness", value: 90, description: "Compassionate, cooperative, friendly." },
    { name: "Neuroticism", value: 30, description: "Sensitive, nervous, prone to stress." }
  ];
  
  const learningFeed = [
    { title: "Basic Econometrics", educator: "Dr. Silva", time: "20 mins", icon: "📊", tags: ["Exam-focused"], aiRecommended: true },
    { title: "Mindful Study Techniques", educator: "Ms. Perera", time: "15 mins", icon: "🧘", tags: ["Self-paced"], aiRecommended: false },
    { title: "Creative Writing", educator: "Mr. Fernando", time: "30 mins", icon: "✍️", tags: ["Lab Required"], aiRecommended: true }
  ];
  
  const modules = [
    { title: "OOP Concepts", progress: 60, onResume: () => alert("Resuming OOP Concepts") },
    { title: "Geometry", progress: 80, onResume: () => alert("Resuming Geometry") },
    { title: "Chemistry", progress: 40, onResume: () => alert("Resuming Chemistry") }
  ];
  
  const studyTimes = [
    { slot: "9:00 – 10:00 PM", description: "Best Focus Time", icon: "🌙" },
    { slot: "6:00 – 7:00 AM", description: "Morning Review", icon: "🌅" }
  ];
  
  const sessions = [
    { tutor: "Ms. Nimal", avatar: "https://randomuser.me/api/portraits/women/44.jpg", subject: "Math", date: "2024-06-01", time: "10:00 AM", type: "1-on-1", onJoin: () => alert("Joining Math"), onReschedule: () => alert("Reschedule Math"), onCancel: () => alert("Cancel Math"), countdown: "in 2h" },
    { tutor: "Mr. Kumar", avatar: "https://randomuser.me/api/portraits/men/32.jpg", subject: "Physics", date: "2024-06-02", time: "2:00 PM", type: "group", onJoin: () => alert("Joining Physics"), onReschedule: () => alert("Reschedule Physics"), onCancel: () => alert("Cancel Physics"), countdown: null }
  ];
  
  const quote = {
    quote: "Small steps every day lead to big results.",
    author: "FocusDesk Wisdom",
    language: "English",
    onFavorite: () => alert("Favorited!")
  };

  return (
    <div className="home-overview">
      <div className="container">
        {/* Recommendations Section */}
        <section className="recommendations">
          <div className="section-header">
            <h2>Personalized for You</h2>
          </div>
          
          {topSubjects.length > 0 && (
            <div className="insight-card">
              <div className="insight-label">Your Focus Areas</div>
              <div className="subject-tags">
                {topSubjects.map((subject, index) => (
                  <span key={index} className="subject-tag">{subject}</span>
                ))}
              </div>
            </div>
          )}
          
          {recommendedTutors.length > 0 && (
            <div className="tutors-grid" role="region" aria-label="Recommended Tutors">
              {recommendedTutors.map(tutor => (
                <article
                  className="tutor-card"
                  key={tutor._id}
                  tabIndex={0}
                  role="button"
                  aria-label={`View profile for ${tutor.username}`}
                  onClick={() => navigate(`/educator-profile/${tutor._id}`)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/educator-profile/${tutor._id}`);
                    }
                  }}
                >
                  <div className="tutor-header">
                    <div className="tutor-avatar-container">
                      <img
                        src={tutor.img || '/img/noavatar.jpg'}
                        alt={tutor.username ? `Profile of ${tutor.username}` : 'Educator profile'}
                        className="tutor-avatar"
                        loading="lazy"
                        onError={(e) => {
                          e.target.src = '/img/noavatar.jpg';
                        }}
                      />
                      <div className="avatar-status-indicator"></div>
                    </div>
                    <div className="tutor-info">
                      <h3 className="tutor-name">{tutor.username}</h3>
                      <div className="tutor-expertise">
                        {(tutor.expertise || []).slice(0, 2).join(' • ')}
                      </div>
                    </div>
                  </div>
                  
                  <p className="tutor-bio">
                    {tutor.bio ? tutor.bio.slice(0, 80) + (tutor.bio.length > 80 ? '...' : '') : 'Experienced educator ready to help you succeed.'}
                  </p>
                  
                  <div className="tutor-actions">
                    <Link
                      to={`/educator-profile/${tutor._id}`}
                      className="btn btn-outline"
                      tabIndex={0}
                      aria-label={`View full profile for ${tutor.username}`}
                      onClick={e => e.stopPropagation()}
                    >
                      View Profile
                    </Link>
                    <Link
                      to={`/educator-profile/${tutor._id}#packages`}
                      className="btn btn-primary"
                      tabIndex={0}
                      aria-label={`View packages for ${tutor.username}`}
                      onClick={e => e.stopPropagation()}
                    >
                      View Packages
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          )}
          
          {workPlan.length > 0 && (
            <div className="work-plan-card">
              <div className="insight-label">Suggested Study Plan</div>
              <div className="plan-items">
                {workPlan.map(item => (
                  <div key={item.subject} className="plan-item">
                    <span className="subject">{item.subject}</span>
                    <span className="frequency">{item.sessionsPerWeek} sessions/week</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <GreetingHeader {...user} />
        <PersonalitySnapshot traits={traits} />
        <SmartLearningFeed cards={learningFeed} />
        <ContinueLearningModule modules={modules} onResumeAll={() => alert("Resuming all modules")} />
        <RecommendedStudyTimesWidget times={studyTimes} view="daily" onToggleView={() => alert("Toggle view")} onAddToCalendar={() => alert("Add to calendar")} />
        <UpcomingSessionsPreview sessions={sessions} />
        <MicroMotivationQuote {...quote} />
      </div>
    </div>
  );
}
