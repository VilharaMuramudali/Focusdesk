import React, { useState, useEffect, useContext } from "react";
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
  FaPrint,
  FaBook,
  FaGraduationCap,
  FaCreditCard,
  FaReceipt,
  FaStar
} from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import { CurrencyContext } from "../../../context/CurrencyContext.jsx";
import LoadingSpinner from "../../../components/LoadingSpinner";
import "./Payments.scss";

export default function Payments() {
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
      
      const response = await newRequest.get("/bookings/student/transactions");
      
      if (response.data.success) {
        setTransactions(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
      setError("Failed to load transactions");
      
      // Set mock data for demonstration
      setTransactions({
        stats: {
          totalPurchases: 12,
          completedPurchases: 10,
          pendingPurchases: 1,
          cancelledPurchases: 1,
          totalSpent: 1240.00,
          pendingPayments: 80.00,
          averagePurchaseValue: 103.33
        },
        recentTransactions: [
          {
            _id: "1",
            totalAmount: 120.00,
            status: "completed",
            paymentStatus: "paid",
            createdAt: "2024-01-15T10:30:00Z",
            educatorId: {
              username: "Dr. Sarah Johnson",
              email: "sarah.j@email.com",
              img: "/img/noavatar.jpg",
              subjects: ["Mathematics", "Calculus"],
              rating: 4.8
            },
            packageId: {
              title: "Advanced Calculus Tutoring",
              description: "Comprehensive calculus tutoring package with 10 sessions",
              rate: 60,
              subjects: ["Mathematics", "Calculus"],
              level: "advanced",
              sessions: 10
            },
            sessions: [
              {
                date: "2024-01-15",
                time: "10:00 AM",
                duration: 60,
                status: "completed",
                topic: "Derivatives and Limits"
              },
              {
                date: "2024-01-17",
                time: "2:00 PM",
                duration: 60,
                status: "completed",
                topic: "Integration Techniques"
              }
            ]
          },
          {
            _id: "2",
            totalAmount: 180.00,
            status: "completed",
            paymentStatus: "paid",
            createdAt: "2024-01-10T14:20:00Z",
            educatorId: {
              username: "Prof. Michael Chen",
              email: "michael.c@email.com",
              img: "/img/noavatar.jpg",
              subjects: ["Physics", "Engineering"],
              rating: 4.9
            },
            packageId: {
              title: "Physics Fundamentals",
              description: "Complete physics course covering mechanics and thermodynamics",
              rate: 90,
              subjects: ["Physics", "Mechanics"],
              level: "intermediate",
              sessions: 8
            },
            sessions: [
              {
                date: "2024-01-10",
                time: "3:00 PM",
                duration: 90,
                status: "completed",
                topic: "Newton's Laws"
              }
            ]
          },
          {
            _id: "3",
            totalAmount: 80.00,
            status: "pending",
            paymentStatus: "pending",
            createdAt: "2024-01-20T09:15:00Z",
            educatorId: {
              username: "Ms. Emily Davis",
              email: "emily.d@email.com",
              img: "/img/noavatar.jpg",
              subjects: ["English", "Literature"],
              rating: 4.7
            },
            packageId: {
              title: "Essay Writing Workshop",
              description: "Improve your academic writing skills",
              rate: 40,
              subjects: ["English", "Writing"],
              level: "beginner",
              sessions: 4
            },
            sessions: [
              {
                date: "2024-01-22",
                time: "11:00 AM",
                duration: 60,
                status: "scheduled",
                topic: "Essay Structure"
              }
            ]
          }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const { convertCurrency, getCurrencySymbol } = useContext(CurrencyContext);

  // Force display currency to LKR for student Payments view as requested
  const DISPLAY_CURRENCY = 'LKR';

  const localeForCurrency = (code) => {
    switch (code) {
      case 'INR': return 'en-IN';
      case 'LKR': return 'en-LK';
      case 'EUR': return 'de-DE';
      case 'GBP': return 'en-GB';
      case 'JPY': return 'ja-JP';
      case 'CNY': return 'zh-CN';
      default: return 'en-US';
    }
  };

  const formatCurrency = (amount, fromCurrency = 'USD') => {
    const baseAmount = amount || 0;
    let converted = baseAmount;
    try {
      converted = convertCurrency(baseAmount, fromCurrency, DISPLAY_CURRENCY);
    } catch (err) {
      converted = baseAmount;
    }

    const locale = localeForCurrency(DISPLAY_CURRENCY);
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: DISPLAY_CURRENCY,
        maximumFractionDigits: 2
      }).format(converted);
    } catch (err) {
      const symbol = getCurrencySymbol(DISPLAY_CURRENCY) || DISPLAY_CURRENCY;
      return `${symbol}${converted.toFixed(2)}`;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FaCheckCircle className="status-icon completed" />;
      case 'pending':
        return <FaClock className="status-icon pending" />;
      case 'cancelled':
        return <FaTimesCircle className="status-icon cancelled" />;
      default:
        return <FaClock className="status-icon pending" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'completed';
      case 'pending':
        return 'pending';
      case 'cancelled':
        return 'cancelled';
      default:
        return 'pending';
    }
  };

  const filteredTransactions = transactions?.recentTransactions?.filter(transaction => {
    const educatorName = (transaction.educatorId?.fullName || transaction.educatorId?.name || transaction.educatorId?.username || "").toLowerCase();
    const packageTitle = transaction.packageId?.title?.toLowerCase() || "";
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = educatorName.includes(searchLower) || packageTitle.includes(searchLower);
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
      <div className="student-payments-section">
        <LoadingSpinner 
          size="large" 
          text="Loading your purchase history..." 
          variant="primary"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-payments-section">
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
    <div className="student-payments-section">
      {/* Header */}
      <div className="payments-header">
        <div className="header-content">
          <h1>My Purchases & Payments</h1>
          <p>Track your learning investments and payment history</p>
        </div>
        <div className="header-actions">
          <button className="export-btn">
            <FaDownload />
            Export History
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card total-spent">
          <div className="stat-icon">
            <FaDollarSign />
          </div>
          <div className="stat-content">
            <h3>Total Spent</h3>
            <p className="stat-amount">{formatCurrency(transactions.stats.totalSpent)}</p>
            <span className="stat-change">on {transactions.stats.totalPurchases} packages</span>
          </div>
        </div>

        <div className="stat-card pending-payments">
          <div className="stat-icon">
            <FaClock />
          </div>
          <div className="stat-content">
            <h3>Pending Payments</h3>
            <p className="stat-amount">{formatCurrency(transactions.stats.pendingPayments)}</p>
            <span className="stat-change">{transactions.stats.pendingPurchases} pending purchases</span>
          </div>
        </div>

        <div className="stat-card total-purchases">
          <div className="stat-icon">
            <FaBook />
          </div>
          <div className="stat-content">
            <h3>Total Purchases</h3>
            <p className="stat-amount">{transactions.stats.totalPurchases}</p>
            <span className="stat-change">{transactions.stats.completedPurchases} completed</span>
          </div>
        </div>

        <div className="stat-card avg-purchase">
          <div className="stat-icon">
            <FaChartLine />
          </div>
          <div className="stat-content">
            <h3>Average Purchase</h3>
            <p className="stat-amount">{formatCurrency(transactions.stats.averagePurchaseValue)}</p>
            <span className="stat-change">per package</span>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="filters-section">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by educator name or package title..."
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
          <h2>Purchase History</h2>
          <span className="transaction-count">
            {filteredTransactions.length} purchases
          </span>
        </div>

        <div className="transactions-table">
          <div className="table-header">
            <div className="header-cell">Educator</div>
            <div className="header-cell">Package</div>
            <div className="header-cell">Amount</div>
            <div className="header-cell">Status</div>
            <div className="header-cell">Date</div>
            <div className="header-cell">Actions</div>
          </div>

          <div className="table-body">
            {filteredTransactions.map((transaction) => (
              <div key={transaction._id} className="table-row">
                <div className="table-cell educator-info">
                  <img 
                    src={transaction.educatorId?.img || "/img/noavatar.jpg"} 
                    alt={transaction.educatorId?.fullName || transaction.educatorId?.name || transaction.educatorId?.username || "Educator"}
                    className="educator-avatar"
                  />
                  <div className="educator-details">
                    <span className="educator-name">{transaction.educatorId?.fullName || transaction.educatorId?.name || transaction.educatorId?.username || "Unknown Educator"}</span>
                    <span className="educator-subjects">
                      {transaction.educatorId?.subjects?.join(", ") || "No subjects"}
                    </span>
                    <div className="educator-rating">
                      <FaStar className="star-icon" />
                      <span>{transaction.educatorId?.rating || "N/A"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="table-cell package-info">
                  <div className="package-title">{transaction.packageId?.title || "Unknown Package"}</div>
                  <div className="package-details">
                    <span className="package-level">{transaction.packageId?.level || "N/A"}</span>
                    <span className="package-sessions">{transaction.packageId?.sessions || 0} sessions</span>
                  </div>
                  <div className="package-subjects">
                    {transaction.packageId?.subjects?.join(", ") || "No subjects"}
                  </div>
                </div>
                
                <div className="table-cell amount">
                  <div className="amount-value">{formatCurrency(transaction.totalAmount || 0)}</div>
                  <div className="payment-status">
                    <span className={`status-badge ${transaction.paymentStatus || 'pending'}`}>
                      {transaction.paymentStatus || 'pending'}
                    </span>
                  </div>
                </div>
                
                <div className="table-cell status">
                  <div className="status-container">
                    {getStatusIcon(transaction.status)}
                    <span className={`status-text ${getStatusColor(transaction.status)}`}>
                      {transaction.status || 'pending'}
                    </span>
                  </div>
                </div>
                
                <div className="table-cell date">
                  {formatDate(transaction.createdAt)}
                </div>
                
                <div className="table-cell actions">
                  <button 
                    className="view-btn"
                    onClick={() => openTransactionModal(transaction)}
                  >
                    <FaEye />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {showTransactionModal && selectedTransaction && (
        <div className="modal-overlay" onClick={closeTransactionModal}>
          <div className="transaction-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Purchase Details</h2>
              <button className="close-btn" onClick={closeTransactionModal}>
                ×
              </button>
            </div>
            
            <div className="modal-content">
              <div className="detail-section">
                <h3>Package Information</h3>
                <div className="detail-row">
                  <span className="detail-label">Package Title:</span>
                  <span className="detail-value">{selectedTransaction.packageId?.title || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Description:</span>
                  <span className="detail-value">{selectedTransaction.packageId?.description || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Level:</span>
                  <span className="detail-value">{selectedTransaction.packageId?.level || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Subjects:</span>
                  <span className="detail-value">
                    {selectedTransaction.packageId?.subjects?.join(", ") || 'N/A'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Sessions:</span>
                  <span className="detail-value">{selectedTransaction.packageId?.sessions || 0}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Educator Information</h3>
                <div className="educator-detail">
                  <img 
                    src={selectedTransaction.educatorId?.img || "/img/noavatar.jpg"} 
                    alt={selectedTransaction.educatorId?.fullName || selectedTransaction.educatorId?.name || selectedTransaction.educatorId?.username || "Educator"}
                    className="educator-avatar-large"
                  />
                  <div className="educator-info-detail">
                    <h4>{selectedTransaction.educatorId?.fullName || selectedTransaction.educatorId?.name || selectedTransaction.educatorId?.username || 'Unknown Educator'}</h4>
                    <p>{selectedTransaction.educatorId?.email || 'No email'}</p>
                    <div className="educator-rating-detail">
                      <FaStar className="star-icon" />
                      <span>{selectedTransaction.educatorId?.rating || 'N/A'}</span>
                    </div>
                    <p className="educator-subjects-detail">
                      {selectedTransaction.educatorId?.subjects?.join(", ") || 'No subjects'}
                    </p>
                  </div>
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
                  <span className="detail-label">Purchase Status:</span>
                  <span className={`detail-value status-${selectedTransaction.status || 'pending'}`}>
                    {selectedTransaction.status || 'pending'}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Purchase Date:</span>
                  <span className="detail-value">{formatDate(selectedTransaction.createdAt)}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3>Session Details</h3>
                {selectedTransaction.sessions && selectedTransaction.sessions.length > 0 ? (
                  <div className="sessions-list">
                    {selectedTransaction.sessions.map((session, index) => (
                      <div key={index} className="session-item">
                        <div className="session-header">
                          <span className="session-number">Session {index + 1}</span>
                          <span className={`session-status ${session.status}`}>
                            {session.status}
                          </span>
                        </div>
                        <div className="session-details">
                          <p><strong>Date:</strong> {session.date}</p>
                          <p><strong>Time:</strong> {session.time}</p>
                          <p><strong>Duration:</strong> {session.duration} minutes</p>
                          {session.topic && <p><strong>Topic:</strong> {session.topic}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No session details available</p>
                )}
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="print-btn" onClick={() => window.print()}>
                <FaPrint />
                Print Receipt
              </button>
              <button className="close-modal-btn" onClick={closeTransactionModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 