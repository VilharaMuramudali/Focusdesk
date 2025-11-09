import React, { useState, useEffect } from "react";
import { 
  FaDollarSign, 
  FaChartLine, 
  FaCalendarAlt, 
  FaUserGraduate,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaDownload,
  FaFilter,
  FaSearch,
  FaEye,
  FaPrint
} from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import LoadingSpinner from "../../../components/LoadingSpinner";
import "./PaymentsSection.scss";

export default function PaymentsSection() {
  const [transactions, setTransactions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await newRequest.get("/bookings/educator/transactions");
      
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions");
      
      // Set mock data for demonstration
      setTransactions({
        stats: {
          totalBookings: 24,
          completedBookings: 18,
          pendingBookings: 4,
          cancelledBookings: 2,
          totalEarnings: 2840.00,
          pendingEarnings: 320.00,
          averageBookingValue: 118.33
        },
        recentTransactions: [
          {
            _id: "1",
            totalAmount: 120.00,
            status: "completed",
            paymentStatus: "paid",
            createdAt: "2024-01-15T10:30:00Z",
            studentId: {
              username: "Sarah Johnson",
              email: "sarah.j@email.com",
              img: "/img/noavatar.jpg"
            },
            packageId: {
              title: "Advanced Calculus Tutoring",
              description: "Comprehensive calculus tutoring package",
              rate: 60,
              subjects: ["Mathematics", "Calculus"]
            },
            sessions: [
              {
                date: "2024-01-15",
                time: "10:00 AM",
                duration: 60,
                status: "completed"
              }
            ]
          },
          {
            _id: "2",
            totalAmount: 180.00,
            status: "completed",
            paymentStatus: "paid",
            createdAt: "2024-01-14T14:20:00Z",
            studentId: {
              username: "Michael Chen",
              email: "michael.c@email.com",
              img: "/img/noavatar.jpg"
            },
            packageId: {
              title: "Physics Lab Assistance",
              description: "Physics laboratory session support",
              rate: 90,
              subjects: ["Physics", "Laboratory"]
            },
            sessions: [
              {
                date: "2024-01-14",
                time: "2:00 PM",
                duration: 90,
                status: "completed"
              }
            ]
          },
          {
            _id: "3",
            totalAmount: 80.00,
            status: "pending",
            paymentStatus: "pending",
            createdAt: "2024-01-13T09:15:00Z",
            studentId: {
              username: "Emma Wilson",
              email: "emma.w@email.com",
              img: "/img/noavatar.jpg"
            },
            packageId: {
              title: "Chemistry Fundamentals",
              description: "Basic chemistry concepts tutoring",
              rate: 40,
              subjects: ["Chemistry"]
            },
            sessions: [
              {
                date: "2024-01-16",
                time: "11:00 AM",
                duration: 60,
                status: "scheduled"
              }
            ]
          }
        ],
        monthlyData: [
          {
            month: "2024-01",
            total: 2840.00,
            count: 24,
            transactions: []
          },
          {
            month: "2023-12",
            total: 2150.00,
            count: 18,
            transactions: []
          },
          {
            month: "2023-11",
            total: 1890.00,
            count: 15,
            transactions: []
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <FaCheckCircle className="status-icon completed" />;
      case "pending":
        return <FaClock className="status-icon pending" />;
      case "cancelled":
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "completed";
      case "pending":
        return "pending";
      case "cancelled":
        return "cancelled";
      default:
        return "pending";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD"
    }).format(amount);
  };

  const filteredTransactions = transactions?.recentTransactions?.filter(transaction => {
    const studentName = transaction.studentId?.username?.toLowerCase() || "";
    const packageTitle = transaction.packageId?.title?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = studentName.includes(searchLower) || packageTitle.includes(searchLower);
    const matchesStatus = selectedStatus === "all" || transaction.status === selectedStatus;
    return matchesSearch && matchesStatus;
  }) || [];

  const openTransactionModal = (transaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionModal(true);
  };

  const closeTransactionModal = () => {
    setShowTransactionModal(false);
    setSelectedTransaction(null);
  };

  if (loading) {
    return (
      <div className="payments-section">
        <LoadingSpinner 
          size="large" 
          text="Loading your transaction data..." 
          variant="success"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="payments-section">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchTransactions} className="retry-btn">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="payments-section">
      {/* Header */}
      <div className="payments-header">
        <div className="header-content">
          <h1>Payments & Transactions</h1>
          <p>Track your earnings and manage your financial data</p>
        </div>
        <div className="header-actions">
          <button className="export-btn">
            <FaDownload />
            Export Data
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total-earnings">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Total Earnings</h3>
            <p className="stat-amount">{formatCurrency(transactions.stats.totalEarnings)}</p>
            <span className="stat-change positive">+12.5% from last month</span>
          </div>
        </div>

        <div className="stat-card pending-earnings">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>Pending Earnings</h3>
            <p className="stat-amount">{formatCurrency(transactions.stats.pendingEarnings)}</p>
            <span className="stat-change">{transactions.stats.pendingBookings} pending bookings</span>
          </div>
        </div>

        <div className="stat-card total-bookings">
          <div className="stat-icon">
            <FaCalendarAlt />
          </div>
          <div className="stat-content">
            <h3>Total Bookings</h3>
            <p className="stat-amount">{transactions.stats.totalBookings}</p>
            <span className="stat-change">{transactions.stats.completedBookings} completed</span>
          </div>
        </div>

        <div className="stat-card avg-booking">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>Average Booking</h3>
            <p className="stat-amount">{formatCurrency(transactions.stats.averageBookingValue)}</p>
            <span className="stat-change">per session</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by student name or package title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="filter-controls">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Period:</label>
            <select 
              value={selectedPeriod} 
              onChange={(e) => setSelectedPeriod(e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="this-month">This Month</option>
              <option value="last-month">Last Month</option>
              <option value="this-year">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="transactions-container">
        <div className="transactions-header">
          <h2>Recent Transactions</h2>
          <span className="transaction-count">
            {filteredTransactions.length} transactions
          </span>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div className="header-cell">Student</div>
            <div className="header-cell">Package</div>
            <div className="header-cell">Amount</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Date</div>
            <div className="header-cell">Actions</div>
          </div>

          <div className="table-body">
            {filteredTransactions.map((transaction) => (
              <div key={transaction._id} className="table-row">
                                 <div className="table-cell student-info">
                   <img 
                     src={transaction.studentId?.img || "/img/noavatar.jpg"} 
                     alt={transaction.studentId?.username || "Student"}
                     className="student-avatar"
                   />
                   <div className="student-details">
                     <span className="student-name">{transaction.studentId?.username || "Unknown Student"}</span>
                     <span className="student-email">{transaction.studentId?.email || "No email"}</span>
                   </div>
                 </div>
                
                                 <div className="table-cell package-info">
                   <span className="package-title">{transaction.packageId?.title || "Untitled Package"}</span>
                   <span className="package-subjects">
                     {transaction.packageId?.subjects ? transaction.packageId.subjects.join(", ") : "General"}
                   </span>
                 </div>
                
                                 <div className="table-cell amount">
                   <span className="amount-value">{formatCurrency(transaction.totalAmount || 0)}</span>
                   <span className="amount-rate">@{formatCurrency(transaction.packageId?.rate || 0)}/hr</span>
                 </div>
                
                <div className="table-cell status">
                  <div className={`status-badge ${getStatusColor(transaction.status)}`}>
                    {getStatusIcon(transaction.status)}
                    <span>{transaction.status}</span>
                  </div>
                </div>
                
                <div className="table-cell date">
                  <span className="date-value">{formatDate(transaction.createdAt)}</span>
                  <span className="time-value">{formatTime(transaction.createdAt)}</span>
                </div>
                
                <div className="table-cell actions">
                  <button 
                    className="action-btn view-btn"
                    onClick={() => openTransactionModal(transaction)}
                  >
                    <FaEye />
                  </button>
                  <button className="action-btn print-btn">
                    <FaPrint />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="no-transactions">
            <FaUserGraduate className="no-transactions-icon" />
            <h3>No transactions found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
        )}
      </div>

      {/* Transaction Details Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="modal-overlay" onClick={closeTransactionModal}>
          <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={closeTransactionModal}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="transaction-details">
                                 <div className="detail-section">
                   <h3>Student Information</h3>
                   <div className="detail-row">
                     <span className="detail-label">Name:</span>
                     <span className="detail-value">{selectedTransaction.studentId?.username || "Unknown Student"}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Email:</span>
                     <span className="detail-value">{selectedTransaction.studentId?.email || "No email"}</span>
                   </div>
                 </div>

                                 <div className="detail-section">
                   <h3>Package Information</h3>
                   <div className="detail-row">
                     <span className="detail-label">Title:</span>
                     <span className="detail-value">{selectedTransaction.packageId?.title || "Untitled Package"}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Subjects:</span>
                     <span className="detail-value">{selectedTransaction.packageId?.subjects ? selectedTransaction.packageId.subjects.join(", ") : "General"}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Rate:</span>
                     <span className="detail-value">{formatCurrency(selectedTransaction.packageId?.rate || 0)}/hr</span>
                   </div>
                 </div>

                                 <div className="detail-section">
                   <h3>Payment Information</h3>
                   <div className="detail-row">
                     <span className="detail-label">Total Amount:</span>
                     <span className="detail-value amount-highlight">{formatCurrency(selectedTransaction.totalAmount || 0)}</span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Payment Status:</span>
                     <span className={`detail-value status-${selectedTransaction.paymentStatus || 'pending'}`}>
                       {selectedTransaction.paymentStatus || 'pending'}
                     </span>
                   </div>
                   <div className="detail-row">
                     <span className="detail-label">Booking Status:</span>
                     <span className={`detail-value status-${selectedTransaction.status || 'pending'}`}>
                       {selectedTransaction.status || 'pending'}
                     </span>
                   </div>
                 </div>

                                 <div className="detail-section">
                   <h3>Session Details</h3>
                   {selectedTransaction.sessions && selectedTransaction.sessions.length > 0 ? (
                     selectedTransaction.sessions.map((session, index) => (
                       <div key={index} className="session-detail">
                         <div className="detail-row">
                           <span className="detail-label">Date:</span>
                           <span className="detail-value">{formatDate(session.date)}</span>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Time:</span>
                           <span className="detail-value">{session.time}</span>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Duration:</span>
                           <span className="detail-value">{session.duration} minutes</span>
                         </div>
                         <div className="detail-row">
                           <span className="detail-label">Status:</span>
                           <span className={`detail-value status-${session.status}`}>
                             {session.status}
                           </span>
                         </div>
                       </div>
                     ))
                   ) : (
                     <div className="session-detail">
                       <div className="detail-row">
                         <span className="detail-label">No sessions scheduled</span>
                         <span className="detail-value">-</span>
                       </div>
                     </div>
                   )}
                 </div>

                <div className="detail-section">
                  <h3>Timeline</h3>
                  <div className="detail-row">
                    <span className="detail-label">Created:</span>
                    <span className="detail-value">
                      {formatDate(selectedTransaction.createdAt)} at {formatTime(selectedTransaction.createdAt)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={closeTransactionModal}>
                Close
              </button>
              <button className="btn-primary">
                <FaPrint />
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
