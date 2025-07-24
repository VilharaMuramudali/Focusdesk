import React from "react";
import GreetingHeader from "./HomeComponents/GreetingHeader";
import PersonalitySnapshot from "./HomeComponents/PersonalitySnapshot";
import SmartLearningFeed from "./HomeComponents/SmartLearningFeed";
import ContinueLearningModule from "./HomeComponents/ContinueLearningModule";
import RecommendedStudyTimesWidget from "./HomeComponents/RecommendedStudyTimesWidget";
import UpcomingSessionsPreview from "./HomeComponents/UpcomingSessionsPreview";
import MicroMotivationQuote from "./HomeComponents/MicroMotivationQuote";

export default function HomeOverview() {
  // Sample/mock data for demonstration
  const user = {
    name: "Kavindu",
    greeting: "Ayubowan",
    icon: " 33c", // Lotus emoji
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
    { title: "Basic Econometrics", educator: "Dr. Silva", time: "20 mins", icon: " 525", tags: ["Exam-focused"], aiRecommended: true },
    { title: "Mindful Study Techniques", educator: "Ms. Perera", time: "15 mins", icon: " 9d8", tags: ["Self-paced"], aiRecommended: false },
    { title: "Creative Writing", educator: "Mr. Fernando", time: "30 mins", icon: " 4da", tags: ["Lab Required"], aiRecommended: true }
  ];
  const modules = [
    { title: "OOP Concepts", progress: 60, onResume: () => alert("Resuming OOP Concepts") },
    { title: "Geometry", progress: 80, onResume: () => alert("Resuming Geometry") },
    { title: "Chemistry", progress: 40, onResume: () => alert("Resuming Chemistry") }
  ];
  const studyTimes = [
    { slot: "9:00 – 10:00 PM", description: "Best Focus Time", icon: " 552" },
    { slot: "6:00 – 7:00 AM", description: "Morning Review", icon: " 305" }
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
    <div className="home-overview-section">
      <GreetingHeader {...user} />
      <PersonalitySnapshot traits={traits} />
      <SmartLearningFeed cards={learningFeed} />
      <ContinueLearningModule modules={modules} onResumeAll={() => alert("Resuming all modules")} />
      <RecommendedStudyTimesWidget times={studyTimes} view="daily" onToggleView={() => alert("Toggle view")} onAddToCalendar={() => alert("Add to calendar")} />
      <UpcomingSessionsPreview sessions={sessions} />
      <MicroMotivationQuote {...quote} />
    </div>
  );
} 