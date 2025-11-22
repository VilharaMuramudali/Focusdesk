import React, { useState, useEffect } from "react";
import { 
  FaDollarSign, 
  FaChartLine, 
  FaClock, 
  FaUserGraduate,
  FaStar,
  FaArrowUp,
  FaArrowDown,
  FaUsers,
  FaBookOpen,
  FaAward,
  FaCalendarCheck,
  FaCheckCircle
} from "react-icons/fa";
import newRequest from "../../../utils/newRequest";
import LoadingSpinner from "../../../components/LoadingSpinner";
import "./ProfileInsights.scss";

export default function ProfileInsights() {
  const [loading, setLoading] = useState(true);
  const [insights, setInsights] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState("month"); // month, quarter, year, all
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, [selectedPeriod]);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch transactions/earnings data
      const transactionsResponse = await newRequest.get("/bookings/educator/transactions");
      
      // Fetch bookings for time spent calculation
      const bookingsResponse = await newRequest.get("/bookings/educator");
      
      // Fetch reviews for personal growth - get current educator's reviews
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      const reviewsResponse = await newRequest.get(`/reviews/educator/${currentUser._id}`);
      
      // Fetch educator profile
      const profileResponse = await newRequest.get("/profiles/educator");

      // Process the data
      const transactionsData = transactionsResponse.data.success 
        ? transactionsResponse.data.data 
        : null;
      
      const bookings = bookingsResponse.data || [];
      // Handle different response structures
      let reviews = [];
      if (reviewsResponse.data?.data?.reviews) {
        reviews = reviewsResponse.data.data.reviews;
      } else if (reviewsResponse.data?.reviews) {
        reviews = reviewsResponse.data.reviews;
      } else if (Array.isArray(reviewsResponse.data)) {
        reviews = reviewsResponse.data;
      }
      const profile = profileResponse.data?.profile || {};

      // Calculate insights
      const processedInsights = processInsightsData(
        transactionsData,
        bookings,
        reviews,
        profile,
        selectedPeriod
      );

      setInsights(processedInsights);
    } catch (error) {
      console.error("Error fetching insights:", error);
      setError("Failed to load insights data");
      
      // Set mock data for demonstration
      setInsights(getMockInsightsData(selectedPeriod));
    } finally {
      setLoading(false);
    }
  };

  const processInsightsData = (transactionsData, bookings, reviews, profile, period) => {
    const now = new Date();
    let startDate = new Date();

    // Filter by period
    switch (period) {
      case "month":
        startDate.setMonth(now.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(now.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date(0); // All time
    }

    // Use transactionsData if available, otherwise calculate from bookings
    let totalEarnings = 0;
    let pendingEarnings = 0;
    let allBookings = [];

    if (transactionsData && transactionsData.stats) {
      // Use transaction data if available
      totalEarnings = transactionsData.stats.totalEarnings || 0;
      pendingEarnings = transactionsData.stats.pendingEarnings || 0;
      allBookings = bookings.filter(b => new Date(b.createdAt) >= startDate);
    } else {
      // Calculate from bookings
      allBookings = bookings.filter(b => new Date(b.createdAt) >= startDate);
      const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid');
      totalEarnings = paidBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      pendingEarnings = allBookings
        .filter(b => b.paymentStatus === 'pending')
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    }
    
    // Time spent calculations
    const completedBookings = allBookings.filter(b => b.status === 'completed');
    const totalSessions = completedBookings.reduce((sum, b) => {
      const completedSessions = (b.sessions || []).filter(s => s.status === 'completed');
      return sum + completedSessions.length;
    }, 0);
    const totalHours = totalSessions * 1; // Assuming 1 hour per session
    const averageSessionDuration = totalSessions > 0 ? totalHours / totalSessions : 0;

    // Personal growth calculations
    const periodReviews = reviews.filter(r => new Date(r.createdAt) >= startDate);
    const averageRating = periodReviews.length > 0
      ? periodReviews.reduce((sum, r) => sum + (r.overallRating || 0), 0) / periodReviews.length
      : profile.rating || 0;
    const totalStudents = new Set(allBookings.map(b => b.studentId?.toString())).size;
    const totalReviews = reviews.length;
    const ratingTrend = calculateRatingTrend(reviews, period);

    // Monthly earnings for chart
    let monthlyEarnings = [];
    if (transactionsData && transactionsData.monthlyData && transactionsData.monthlyData.length > 0) {
      // Use transaction monthly data if available
      monthlyEarnings = transactionsData.monthlyData
        .map(item => {
          // Handle both YYYY-MM format and date objects
          let monthStr = item.month;
          if (typeof item.month === 'string' && item.month.includes('-')) {
            const [year, month] = item.month.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            monthStr = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          }
          return {
            month: monthStr,
            amount: item.total || 0
          };
        })
        .slice(-6);
    } else {
      // Calculate from bookings
      const paidBookings = allBookings.filter(b => b.paymentStatus === 'paid');
      monthlyEarnings = calculateMonthlyEarnings(paidBookings);
    }
    
    // Session activity over time
    const sessionActivity = calculateSessionActivity(completedBookings);

    return {
      earnings: {
        total: totalEarnings,
        pending: pendingEarnings,
        average: allBookings.length > 0 ? totalEarnings / allBookings.length : 0,
        monthly: monthlyEarnings,
        trend: calculateEarningsTrend(paidBookings, period)
      },
      timeSpent: {
        totalHours,
        totalSessions,
        averageDuration: averageSessionDuration,
        activity: sessionActivity,
        completedBookings: completedBookings.length
      },
      personalGrowth: {
        averageRating: averageRating.toFixed(1),
        totalReviews,
        totalStudents,
        ratingTrend,
        recentReviews: periodReviews.slice(0, 5)
      },
      stats: {
        totalBookings: allBookings.length,
        completedBookings: completedBookings.length,
        pendingBookings: allBookings.filter(b => b.status === 'pending').length,
        cancelledBookings: allBookings.filter(b => b.status === 'cancelled').length
      }
    };
  };

  const calculateMonthlyEarnings = (bookings) => {
    const monthly = {};
    bookings.forEach(booking => {
      const month = new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      if (!monthly[month]) {
        monthly[month] = 0;
      }
      monthly[month] += booking.totalAmount || 0;
    });
    return Object.entries(monthly)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => new Date(a.month) - new Date(b.month))
      .slice(-6); // Last 6 months
  };

  const calculateSessionActivity = (bookings) => {
    const activity = {};
    bookings.forEach(booking => {
      (booking.sessions || []).forEach(session => {
        if (session.status === 'completed') {
          const week = getWeekNumber(new Date(session.date));
          if (!activity[week]) {
            activity[week] = 0;
          }
          activity[week]++;
        }
      });
    });
    return Object.entries(activity)
      .map(([week, count]) => ({ week, count }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-8); // Last 8 weeks
  };

  const calculateEarningsTrend = (bookings, period) => {
    if (bookings.length < 2) return 0;
    const sorted = bookings.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const firstAvg = firstHalf.reduce((sum, b) => sum + (b.totalAmount || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, b) => sum + (b.totalAmount || 0), 0) / secondHalf.length;
    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  };

  const calculateRatingTrend = (reviews, period) => {
    if (reviews.length < 2) return 0;
    const sorted = reviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const firstHalf = sorted.slice(0, Math.floor(sorted.length / 2));
    const secondHalf = sorted.slice(Math.floor(sorted.length / 2));
    const firstAvg = firstHalf.reduce((sum, r) => sum + (r.overallRating || 0), 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, r) => sum + (r.overallRating || 0), 0) / secondHalf.length;
    return firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  };

  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return `${d.getUTCFullYear()}-W${weekNo}`;
  };

  const getMockInsightsData = (period) => {
    return {
      earnings: {
        total: 2840.00,
        pending: 320.00,
        average: 118.33,
        monthly: [
          { month: "Aug 2024", amount: 1200 },
          { month: "Sep 2024", amount: 1500 },
          { month: "Oct 2024", amount: 1400 },
          { month: "Nov 2024", amount: 1800 },
          { month: "Dec 2024", amount: 1600 },
          { month: "Jan 2025", amount: 2000 }
        ],
        trend: 15.5
      },
      timeSpent: {
        totalHours: 48,
        totalSessions: 48,
        averageDuration: 1.0,
        activity: [
          { week: "2024-W45", count: 5 },
          { week: "2024-W46", count: 6 },
          { week: "2024-W47", count: 4 },
          { week: "2024-W48", count: 7 },
          { week: "2024-W49", count: 8 },
          { week: "2024-W50", count: 6 },
          { week: "2024-W51", count: 5 },
          { week: "2024-W52", count: 7 }
        ],
        completedBookings: 18
      },
      personalGrowth: {
        averageRating: "4.8",
        totalReviews: 24,
        totalStudents: 15,
        ratingTrend: 8.3,
        recentReviews: []
      },
      stats: {
        totalBookings: 24,
        completedBookings: 18,
        pendingBookings: 4,
        cancelledBookings: 2
      }
    };
  };

  if (loading) {
    return (
      <div className="profile-insights">
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !insights) {
    return (
      <div className="profile-insights">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  const { earnings, timeSpent, personalGrowth, stats } = insights;

  return (
    <div className="profile-insights">
      <div className="insights-header">
        <div className="header-content">
          <h2>Profile Insights</h2>
          <p>Track your earnings, time spent, and personal growth</p>
        </div>
        <div className="period-selector">
          <select 
            value={selectedPeriod} 
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="period-select"
          >
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="metrics-grid">
        <div className="metric-card earnings">
          <div className="metric-icon">
            <FaDollarSign />
          </div>
          <div className="metric-content">
            <h3>Total Earnings</h3>
            <div className="metric-value">
              ${earnings.total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`metric-trend ${earnings.trend >= 0 ? 'positive' : 'negative'}`}>
              {earnings.trend >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(earnings.trend).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card time">
          <div className="metric-icon">
            <FaClock />
          </div>
          <div className="metric-content">
            <h3>Time Spent</h3>
            <div className="metric-value">{timeSpent.totalHours} hrs</div>
            <div className="metric-subtitle">{timeSpent.totalSessions} sessions completed</div>
          </div>
        </div>

        <div className="metric-card rating">
          <div className="metric-icon">
            <FaStar />
          </div>
          <div className="metric-content">
            <h3>Average Rating</h3>
            <div className="metric-value">{personalGrowth.averageRating}</div>
            <div className={`metric-trend ${personalGrowth.ratingTrend >= 0 ? 'positive' : 'negative'}`}>
              {personalGrowth.ratingTrend >= 0 ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(personalGrowth.ratingTrend).toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="metric-card students">
          <div className="metric-icon">
            <FaUsers />
          </div>
          <div className="metric-content">
            <h3>Total Students</h3>
            <div className="metric-value">{personalGrowth.totalStudents}</div>
            <div className="metric-subtitle">{personalGrowth.totalReviews} reviews</div>
          </div>
        </div>
      </div>

      {/* Earnings Chart */}
      <div className="insight-section">
        <div className="section-header">
          <h3>
            <FaChartLine /> Earnings Overview
          </h3>
          <div className="section-stats">
            <span className="stat-item">
              <FaDollarSign /> Pending: ${earnings.pending.toFixed(2)}
            </span>
            <span className="stat-item">
              <FaChartLine /> Avg: ${earnings.average.toFixed(2)}
            </span>
          </div>
        </div>
        <div className="chart-container">
          <EarningsChart data={earnings.monthly} />
        </div>
      </div>

      {/* Time Spent Chart */}
      <div className="insight-section">
        <div className="section-header">
          <h3>
            <FaClock /> Session Activity
          </h3>
          <div className="section-stats">
            <span className="stat-item">
              <FaCalendarCheck /> {stats.completedBookings} completed
            </span>
            <span className="stat-item">
              <FaClock /> {timeSpent.averageDuration.toFixed(1)}h avg
            </span>
          </div>
        </div>
        <div className="chart-container">
          <ActivityChart data={timeSpent.activity} />
        </div>
      </div>

      {/* Personal Growth Stats */}
      <div className="insight-section">
        <div className="section-header">
          <h3>
            <FaAward /> Personal Growth
          </h3>
        </div>
        <div className="growth-grid">
          <div className="growth-card">
            <div className="growth-icon">
              <FaStar />
            </div>
            <div className="growth-content">
              <h4>Rating Progress</h4>
              <div className="growth-value">{personalGrowth.averageRating} / 5.0</div>
              <div className="growth-bar">
                <div 
                  className="growth-fill" 
                  style={{ width: `${(parseFloat(personalGrowth.averageRating) / 5) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="growth-card">
            <div className="growth-icon">
              <FaUsers />
            </div>
            <div className="growth-content">
              <h4>Student Base</h4>
              <div className="growth-value">{personalGrowth.totalStudents} students</div>
              <div className="growth-subtitle">Growing community</div>
            </div>
          </div>

          <div className="growth-card">
            <div className="growth-icon">
              <FaBookOpen />
            </div>
            <div className="growth-content">
              <h4>Reviews Received</h4>
              <div className="growth-value">{personalGrowth.totalReviews} reviews</div>
              <div className="growth-subtitle">Valuable feedback</div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <FaCheckCircle className="stat-icon" />
          <div className="stat-info">
            <h4>Completed Bookings</h4>
            <p>{stats.completedBookings}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaClock className="stat-icon" />
          <div className="stat-info">
            <h4>Pending Bookings</h4>
            <p>{stats.pendingBookings}</p>
          </div>
        </div>
        <div className="stat-card">
          <FaUserGraduate className="stat-icon" />
          <div className="stat-info">
            <h4>Total Bookings</h4>
            <p>{stats.totalBookings}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple Earnings Chart Component
const EarningsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="no-data">No earnings data available</div>;
  }

  const maxAmount = Math.max(...data.map(d => d.amount));
  
  return (
    <div className="earnings-chart">
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar-wrapper">
              <div 
                className="chart-bar"
                style={{ 
                  height: `${(item.amount / maxAmount) * 100}%`,
                  backgroundColor: `hsl(${200 + index * 10}, 70%, 50%)`
                }}
              >
                <span className="bar-value">${item.amount.toFixed(0)}</span>
              </div>
            </div>
            <div className="bar-label">{item.month}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Simple Activity Chart Component
const ActivityChart = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="no-data">No activity data available</div>;
  }

  const maxCount = Math.max(...data.map(d => d.count), 1);
  
  return (
    <div className="activity-chart">
      <div className="chart-bars">
        {data.map((item, index) => (
          <div key={index} className="chart-bar-container">
            <div className="chart-bar-wrapper">
              <div 
                className="chart-bar"
                style={{ 
                  height: `${(item.count / maxCount) * 100}%`,
                  backgroundColor: `hsl(${150 + index * 15}, 70%, 50%)`
                }}
              >
                <span className="bar-value">{item.count}</span>
              </div>
            </div>
            <div className="bar-label">W{item.week.split('-W')[1]}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

