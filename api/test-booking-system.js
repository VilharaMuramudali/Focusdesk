import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "./models/booking.model.js";
import User from "./models/user.model.js";
import Package from "./models/package.model.js";

dotenv.config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log(error);
  }
};

const testBookingSystem = async () => {
  try {
    console.log("=== Testing Booking System ===");
    
    // 1. Check if there are any users
    const users = await User.find({});
    console.log(`Total users: ${users.length}`);
    
    const educators = users.filter(u => u.isEducator);
    const students = users.filter(u => !u.isEducator);
    console.log(`Educators: ${educators.length}, Students: ${students.length}`);
    
    // 2. Check if there are any packages
    const packages = await Package.find({});
    console.log(`Total packages: ${packages.length}`);
    
    // 3. Check if there are any bookings
    const bookings = await Booking.find({});
    console.log(`Total bookings: ${bookings.length}`);
    
    // 4. Check bookings by status
    const pendingBookings = await Booking.find({ status: 'pending' });
    const confirmedBookings = await Booking.find({ status: 'confirmed' });
    const cancelledBookings = await Booking.find({ status: 'cancelled' });
    
    console.log(`Pending bookings: ${pendingBookings.length}`);
    console.log(`Confirmed bookings: ${confirmedBookings.length}`);
    console.log(`Cancelled bookings: ${cancelledBookings.length}`);
    
    // 5. Check bookings for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayBookings = await Booking.find({
      'sessions.date': {
        $gte: today,
        $lt: tomorrow
      }
    });
    console.log(`Bookings for today (${today.toDateString()}): ${todayBookings.length}`);
    
    // 6. Show sample booking details
    if (bookings.length > 0) {
      console.log("\n=== Sample Booking Details ===");
      const sampleBooking = await Booking.findById(bookings[0]._id)
        .populate('studentId', 'username email')
        .populate('educatorId', 'username email')
        .populate('packageId', 'title rate');
      
      console.log("Sample booking:", {
        id: sampleBooking._id,
        student: sampleBooking.studentId?.username,
        educator: sampleBooking.educatorId?.username,
        package: sampleBooking.packageId?.title,
        status: sampleBooking.status,
        totalAmount: sampleBooking.totalAmount,
        sessions: sampleBooking.sessions,
        createdAt: sampleBooking.createdAt
      });
    }
    
    // 7. Check for potential issues
    console.log("\n=== Potential Issues ===");
    
    // Check for bookings without proper references
    const orphanedBookings = await Booking.find({
      $or: [
        { studentId: { $exists: false } },
        { educatorId: { $exists: false } },
        { packageId: { $exists: false } }
      ]
    });
    console.log(`Orphaned bookings (missing references): ${orphanedBookings.length}`);
    
    // Check for bookings with invalid dates
    const invalidDateBookings = await Booking.find({
      'sessions.date': { $exists: false }
    });
    console.log(`Bookings with invalid dates: ${invalidDateBookings.length}`);
    
    console.log("\n=== Test Complete ===");
    
  } catch (error) {
    console.error("Error testing booking system:", error);
  }
};

// Run the test
connect().then(() => {
  testBookingSystem().then(() => {
    process.exit(0);
  });
});
