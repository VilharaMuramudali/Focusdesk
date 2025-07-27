import express from "express";
import { 
  createBooking,
  getEducatorBookings,
  getStudentBookings,
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

// Get single booking
router.get("/:id", verifyToken, getBookingById);

// Update booking status (for educators)
router.put("/:id/status", verifyToken, educator, updateBookingStatus);

export default router; 