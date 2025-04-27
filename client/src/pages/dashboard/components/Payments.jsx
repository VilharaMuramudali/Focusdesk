import React from 'react';
import './Payments.scss';

function Payments() {
  const mockPayments = [
    { id: 1, date: '2025-04-01', amount: '$50', status: 'Completed' },
    { id: 2, date: '2025-04-03', amount: '$75', status: 'Pending' },
  ];

  return (
    <div className="payments">
      <h2>Payments</h2>
      <table className="payments-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {mockPayments.map((payment) => (
            <tr key={payment.id}>
              <td>{payment.date}</td>
              <td>{payment.amount}</td>
              <td>{payment.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Payments;
