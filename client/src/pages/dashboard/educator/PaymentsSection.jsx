import React from "react";

export default function PaymentsSection() {
  return (
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
  );
}
