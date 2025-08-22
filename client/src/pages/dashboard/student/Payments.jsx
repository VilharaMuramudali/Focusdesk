import React from "react";
import SharedHeaderBanner from "./SharedHeaderBanner";
import "./home.scss";

export default function Payments() {
  return (
    <div className="home-overview">
      <div className="container">
        <SharedHeaderBanner 
          title="Payments"
          subtitle="Manage your payment history and transactions"
        />
        <div className="content-section">
          <h2>Payments</h2>
          <p>This is the Payments section.</p>
        </div>
      </div>
    </div>
  );
} 