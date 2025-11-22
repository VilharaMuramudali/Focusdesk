import React, { useState, Suspense, lazy } from "react";
import EducatorSidebar from "./EducatorSidebar";
import "./educatorDashboard.scss";

// Lazy load components
const ProfileSection = lazy(() => import("./ProfileSection"));
const PackagesSection = lazy(() => import("./PackagesSection"));
const SchedulesSection = lazy(() => import("./SchedulesSection"));
const PaymentsSection = lazy(() => import("./PaymentsSection"));
const MessagesSection = lazy(() => import("./MessagesSection"));
const SettingsSection = lazy(() => import("./SettingsSection"));
const ToolsSection = lazy(() => import("./ToolsSection"));

// Fallback loading component
const LoadingFallback = () => (
  <div className="loading-spinner">Loading section...</div>
);

export default function EducatorDashboard() {
  const [tab, setTab] = useState("profile");

  // Render the appropriate component based on the selected tab
  const renderTabContent = () => {
    switch (tab) {
      case "profile":
        return <ProfileSection />;
      case "packages":
        return <PackagesSection />;
      case "schedules":
        return <SchedulesSection />;
      case "payments":
        return <PaymentsSection />;
      case "messages":
        return <MessagesSection />;
      case "settings":
        return <SettingsSection />;
      case "tools":
        return <ToolsSection />;
      default:
        return <ProfileSection />;
    }
  };

  return (
    <div className="educator-dashboard">
      <EducatorSidebar tab={tab} setTab={setTab} />
      <div className="ed-content">
        <Suspense fallback={<LoadingFallback />}>
          {renderTabContent()}
        </Suspense>
      </div>
    </div>
  );
}
