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