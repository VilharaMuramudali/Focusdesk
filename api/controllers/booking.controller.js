import Booking from "../models/booking.model.js";
import Package from "../models/package.model.js";
import User from "../models/user.model.js";
import createError from "../utils/createError.js";

// Create booking (for students) - simplified without payment
export const createBooking = async (req, res, next) => {
  try {
    const { packageId, sessions, studentNotes, sessionDates } = req.body;
    const studentId = req.userId;

    // Validate package
    const packageData = await Package.findById(packageId);
    if (!packageData || !packageData.isActive) {
      return next(createError(404, "Package not found or inactive"));
    }

    // Validate session dates
    if (!sessionDates || sessionDates.length === 0) {
      return next(createError(400, "At least one session date is required"));
    }

    // Calculate total amount
    const totalAmount = packageData.rate * (sessions || packageData.sessions);

    // Create booking without payment processing
    const newBooking = new Booking({
      packageId,
      educatorId: packageData.educatorId,
      studentId,
      totalAmount,
      paymentStatus: 'pending', // Will be updated to 'paid' for demo
      paymentIntent: 'demo-payment-' + Date.now(), // Demo payment ID
      packageDetails: {
        title: packageData.title,
        description: packageData.description,
        rate: packageData.rate,
        sessions: sessions || packageData.sessions
      },
      studentNotes,
      sessions: sessionDates.map(date => ({
        date: new Date(date.date),
        time: date.time,
        duration: 60
      }))
    });

    await newBooking.save();

    res.status(201).json({
      message: "Booking created successfully",
      booking: newBooking
    });
  } catch (error) {
    console.error("Error creating booking:", error);
    next(createError(500, "Failed to create booking"));
  }
};

// Get bookings for educator (in schedule section)
export const getEducatorBookings = async (req, res, next) => {
  try {
    const educatorId = req.userId;
    const { status, date } = req.query;

    let query = { educatorId };
    
    if (status) {
      query.status = status;
    }

    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      
      query['sessions.date'] = {
        $gte: startDate,
        $lt: endDate
      };
    }

    const bookings = await Booking.find(query)
      .populate('studentId', 'username img email')
      .populate('packageId', 'title thumbnail')
      .sort({ 'sessions.date': 1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching educator bookings:", error);
    next(createError(500, "Failed to fetch bookings"));
  }
};

// Get bookings for student
export const getStudentBookings = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { status } = req.query;

    let query = { studentId };
    
    if (status) {
      query.status = status;
    }

    const bookings = await Booking.find(query)
      .populate('educatorId', 'username img')
      .populate('packageId', 'title thumbnail')
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    console.error("Error fetching student bookings:", error);
    next(createError(500, "Failed to fetch bookings"));
  }
};

// Update booking status (educator can confirm/cancel)
export const updateBookingStatus = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const { status, educatorNotes } = req.body;
    const educatorId = req.userId;

    const booking = await Booking.findById(bookingId);
    
    if (!booking) {
      return next(createError(404, "Booking not found"));
    }

    if (booking.educatorId.toString() !== educatorId) {
      return next(createError(403, "You can only update your own bookings"));
    }

    booking.status = status;
    if (educatorNotes) {
      booking.educatorNotes = educatorNotes;
    }

    await booking.save();

    res.status(200).json({
      message: "Booking status updated successfully",
      booking
    });
  } catch (error) {
    console.error("Error updating booking status:", error);
    next(createError(500, "Failed to update booking status"));
  }
};

// Get student sessions for calendar view
export const getStudentSessions = async (req, res, next) => {
  try {
    const studentId = req.userId;
    const { month, year } = req.query;

    let query = { studentId, status: { $in: ['confirmed', 'pending'] } };
    
    // Filter by month and year if provided
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      query['sessions.date'] = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const bookings = await Booking.find(query)
      .populate('educatorId', 'username img email')
      .populate('packageId', 'title description thumbnail')
      .sort({ 'sessions.date': 1 });

    // Transform bookings into sessions format
    const sessions = [];
    bookings.forEach(booking => {
      booking.sessions.forEach(session => {
        sessions.push({
          _id: booking._id,
          sessionDate: session.date,
          duration: session.duration || 60,
          tutor: booking.educatorId,
          package: booking.packageId,
          status: booking.status
        });
      });
    });

    res.status(200).json({
      success: true,
      bookings: sessions
    });
  } catch (error) {
    console.error("Error fetching student sessions:", error);
    next(createError(500, "Failed to fetch sessions"));
  }
};

// Get single booking details
export const getBookingById = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const userId = req.userId;

    const booking = await Booking.findById(bookingId)
      .populate('studentId', 'username img email')
      .populate('educatorId', 'username img email')
      .populate('packageId', 'title description thumbnail');

    if (!booking) {
      return next(createError(404, "Booking not found"));
    }

    // Check if user has access to this booking
    if (booking.studentId._id.toString() !== userId && 
        booking.educatorId._id.toString() !== userId) {
      return next(createError(403, "Access denied"));
    }

    res.status(200).json(booking);
  } catch (error) {
    console.error("Error fetching booking:", error);
    next(createError(500, "Failed to fetch booking"));
  }
}; 

// Get educator transactions and earnings
export const getEducatorTransactions = async (req, res, next) => {
  try {
    const educatorId = req.userId;
    
    // Get all bookings for this educator
    const bookings = await Booking.find({ educatorId })
      .populate('studentId', 'username email img')
      .populate('packageId', 'title description rate subjects')
      .sort({ createdAt: -1 });
    
    // Calculate earnings using Payouts (half/full payouts recorded)
    const Payout = await import('../models/payout.model.js');
    const payouts = await Payout.default.find({ educatorId, status: 'completed' });
    const totalEarnings = payouts.reduce((s, p) => s + (p.amount || 0), 0);

    // pending earnings: bookings paid but with sessions not fully paid
    let pendingEarnings = 0;
    for (const booking of bookings) {
      if (booking.paymentStatus === 'paid') {
        const perSessionAmount = (booking.totalAmount || 0) / Math.max(1, (booking.sessions ? booking.sessions.length : 1));
        for (const session of booking.sessions || []) {
          const fullPaid = session.payout && session.payout.fullPaid;
          const halfPaid = session.payout && session.payout.halfPaid;
          if (!fullPaid) {
            pendingEarnings += fullPaid ? 0 : (halfPaid ? (perSessionAmount - (session.payout.halfAmount || 0)) : perSessionAmount);
          }
        }
      }
    }
    
    // Group transactions by month
    const monthlyTransactions = {};
    bookings.forEach(booking => {
      const month = new Date(booking.createdAt).toISOString().slice(0, 7); // YYYY-MM
      if (!monthlyTransactions[month]) {
        monthlyTransactions[month] = {
          month,
          total: 0,
          count: 0,
          transactions: []
        };
      }
      monthlyTransactions[month].total += booking.totalAmount;
      monthlyTransactions[month].count += 1;
      monthlyTransactions[month].transactions.push(booking);
    });
    
    // Convert to array and sort by month
    const monthlyData = Object.values(monthlyTransactions)
      .sort((a, b) => b.month.localeCompare(a.month));
    
    // Get recent transactions (last 10)
    const recentTransactions = bookings.slice(0, 10);
    
    // Get transaction statistics
    const stats = {
      totalBookings: bookings.length,
      completedBookings: bookings.filter(b => b.status === 'completed').length,
      pendingBookings: bookings.filter(b => b.status === 'pending').length,
      cancelledBookings: bookings.filter(b => b.status === 'cancelled').length,
      totalEarnings,
      pendingEarnings,
      averageBookingValue: bookings.length > 0 ? totalEarnings / bookings.length : 0
    };
    
    res.status(200).json({
      success: true,
      data: {
        stats,
        recentTransactions,
        monthlyData,
        totalBookings: bookings.length
      }
    });
    
  } catch (error) {
    console.error('Error getting educator transactions:', error);
    next(createError(500, "Failed to get transactions"));
  }
}; 

export const getStudentTransactions = async (req, res, next) => {
  try {
    const studentId = req.userId; // Get current user ID from JWT

    // Find all bookings for this student
    const bookings = await Booking.find({ studentId })
      .populate('educatorId', 'username email img subjects rating')
      .populate('packageId', 'title description rate subjects level sessions')
      .sort({ createdAt: -1 })
      .lean();

    if (!bookings || bookings.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          stats: {
            totalPurchases: 0,
            completedPurchases: 0,
            pendingPurchases: 0,
            cancelledPurchases: 0,
            totalSpent: 0,
            pendingPayments: 0,
            averagePurchaseValue: 0
          },
          recentTransactions: []
        }
      });
    }

    // Calculate statistics
    const totalPurchases = bookings.length;
    const completedPurchases = bookings.filter(b => b.status === 'completed').length;
    const pendingPurchases = bookings.filter(b => b.status === 'pending').length;
    const cancelledPurchases = bookings.filter(b => b.status === 'cancelled').length;
    
    const totalSpent = bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const pendingPayments = bookings
      .filter(b => b.paymentStatus === 'pending')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const averagePurchaseValue = totalPurchases > 0 ? totalSpent / totalPurchases : 0;

    // Transform bookings to transaction format
    const recentTransactions = bookings.map(booking => ({
      _id: booking._id,
      totalAmount: booking.totalAmount || 0,
      status: booking.status || 'pending',
      paymentStatus: booking.paymentStatus || 'pending',
      createdAt: booking.createdAt,
      educatorId: booking.educatorId,
      packageId: booking.packageId,
      sessions: booking.sessions || []
    }));

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalPurchases,
          completedPurchases,
          pendingPurchases,
          cancelledPurchases,
          totalSpent,
          pendingPayments,
          averagePurchaseValue
        },
        recentTransactions
      }
    });

  } catch (error) {
    console.error('Error fetching student transactions:', error);
    next(createError(500, "Failed to fetch student transactions"));
  }
}; 

// Mark a booking as paid (demo / webhook target)
export const markBookingPaid = async (req, res, next) => {
  try {
    const bookingId = req.params.id;
    const booking = await Booking.findById(bookingId);
    if (!booking) return next(createError(404, 'Booking not found'));

    booking.paymentStatus = 'paid';
    await booking.save();

    res.status(200).json({ success: true, message: 'Booking marked as paid', booking });
  } catch (err) {
    console.error('Error marking booking paid:', err);
    next(createError(500, 'Failed to mark booking as paid'));
  }
};