import express from "express";
import { 
  createBooking,
  getEducatorBookings,
  getStudentBookings,
  getStudentSessions,
  updateBookingStatus,
  getBookingById
} from "../controllers/booking.controller.js";
import { verifyToken, educator } from "../middleware/jwt.js";

const router = express.Router();

// Create booking (for students)
router.post("/", verifyToken, createBooking);

// Get educator bookings (for schedule section)
router.get("/educator", verifyToken, educator, getEducatorBookings);

// Get student bookings
router.get("/student", verifyToken, getStudentBookings);

// Get student sessions for calendar view
router.get("/student-sessions", verifyToken, getStudentSessions);

// Get upcoming sessions for learning overview
router.get("/upcoming", verifyToken, (req, res) => {
  // Mock upcoming sessions data
  res.json([
    { 
      tutor: 'Dr. Silva', 
      subject: 'Advanced Calculus', 
      date: '2024-01-15', 
      time: '10:00 AM',
      duration: '60 min'
    },
    { 
      tutor: 'Ms. Perera', 
      subject: 'Organic Chemistry', 
      date: '2024-01-16', 
      time: '2:00 PM',
      duration: '90 min'
    },
    { 
      tutor: 'Mr. Fernando', 
      subject: 'Physics Lab', 
      date: '2024-01-17', 
      time: '11:00 AM',
      duration: '120 min'
    }
  ]);
});

// Get single booking
router.get("/:id", verifyToken, getBookingById);

// Update booking status (for educators)
router.put("/:id/status", verifyToken, educator, updateBookingStatus);

export default router; 