import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";

dotenv.config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log(error);
  }
};

const checkActivityData = async () => {
  try {
    // Find a student
    const student = await User.findOne({ isEducator: false });
    
    if (!student) {
      console.log("No student found in database");
      return;
    }
    
    console.log(`\nChecking activity for student: ${student.username} (${student._id})\n`);
    
    // Get all bookings for this student
    const bookings = await Booking.find({ studentId: student._id });
    console.log(`Total bookings: ${bookings.length}\n`);
    
    if (bookings.length === 0) {
      console.log("No bookings found. Run: node scripts/generate-learning-data.js");
      return;
    }
    
    // Collect all session dates
    const activityByDate = {};
    let totalSessions = 0;
    
    bookings.forEach(booking => {
      console.log(`\nBooking ${booking._id}:`);
      console.log(`  Package: ${booking.packageDetails?.title || 'N/A'}`);
      console.log(`  Status: ${booking.status}`);
      console.log(`  Sessions: ${booking.sessions?.length || 0}`);
      
      if (booking.sessions && booking.sessions.length > 0) {
        booking.sessions.forEach((session, idx) => {
          console.log(`    Session ${idx + 1}:`);
          console.log(`      Date: ${session.date}`);
          console.log(`      Status: ${session.status}`);
          
          if (session.status === 'completed' && session.date) {
            const dateKey = new Date(session.date).toISOString().split('T')[0];
            if (!activityByDate[dateKey]) {
              activityByDate[dateKey] = 0;
            }
            activityByDate[dateKey]++;
            totalSessions++;
          }
        });
      }
    });
    
    console.log(`\n=== ACTIVITY SUMMARY ===`);
    console.log(`Total completed sessions: ${totalSessions}`);
    console.log(`Active dates: ${Object.keys(activityByDate).length}`);
    console.log(`\nActivity by date (what backend should return):`);
    console.log(JSON.stringify(activityByDate, null, 2));
    
    // Show date range
    const dates = Object.keys(activityByDate).sort();
    if (dates.length > 0) {
      console.log(`\nDate range: ${dates[0]} to ${dates[dates.length - 1]}`);
    }
    
  } catch (error) {
    console.error("Error:", error);
  }
};

connect().then(() => {
  checkActivityData().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});
