import mongoose from "mongoose";
import dotenv from "dotenv";
import Booking from "../models/booking.model.js";
import User from "../models/user.model.js";
import Package from "../models/package.model.js";

dotenv.config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log(error);
  }
};

const generateLearningData = async () => {
  try {
    console.log("=== Generating Learning Data ===");
    
    // Find a student user
    const student = await User.findOne({ isEducator: false });
    if (!student) {
      console.log("No student found. Please create a student user first.");
      return;
    }
    
    console.log(`Using student: ${student.username} (${student._id})`);
    
    // Find an educator
    const educator = await User.findOne({ isEducator: true });
    if (!educator) {
      console.log("No educator found. Please create an educator user first.");
      return;
    }
    
    console.log(`Using educator: ${educator.username} (${educator._id})`);
    
    // Find or create packages
    let packages = await Package.find({ educatorId: educator._id }).limit(3);
    
    if (packages.length === 0) {
      console.log("No packages found. Creating sample packages...");
      
      const samplePackages = [
        {
          educatorId: educator._id,
          title: "JavaScript Fundamentals",
          description: "Learn the basics of JavaScript programming",
          category: "Programming",
          rate: 50,
          sessions: 4,
          isActive: true
        },
        {
          educatorId: educator._id,
          title: "Data Science Basics",
          description: "Introduction to Data Science and Analytics",
          category: "Data Science",
          rate: 60,
          sessions: 5,
          isActive: true
        },
        {
          educatorId: educator._id,
          title: "Web Development",
          description: "Full-stack web development course",
          category: "Web Development",
          rate: 55,
          sessions: 6,
          isActive: true
        }
      ];
      
      packages = await Package.insertMany(samplePackages);
      console.log(`Created ${packages.length} sample packages`);
    }
    
    // Generate bookings with completed sessions
    console.log("\nGenerating bookings with completed sessions...");
    
    const bookingsToCreate = [];
    const now = new Date();
    
    // Create bookings spanning the last 6 months
    for (let monthOffset = 5; monthOffset >= 0; monthOffset--) {
      for (let i = 0; i < packages.length; i++) {
        const pkg = packages[i];
        const sessionsCount = Math.floor(Math.random() * 3) + 2; // 2-4 sessions
        const sessions = [];
        
        for (let j = 0; j < sessionsCount; j++) {
          const sessionDate = new Date();
          sessionDate.setMonth(now.getMonth() - monthOffset);
          sessionDate.setDate(Math.floor(Math.random() * 28) + 1);
          sessionDate.setHours(10 + Math.floor(Math.random() * 8), 0, 0, 0);
          
          sessions.push({
            date: sessionDate,
            time: `${sessionDate.getHours()}:00`,
            duration: 60,
            status: 'completed',
            notes: `Session ${j + 1} completed`
          });
        }
        
        const booking = {
          packageId: pkg._id,
          educatorId: educator._id,
          studentId: student._id,
          status: 'completed',
          sessions: sessions,
          totalAmount: pkg.rate * sessionsCount,
          paymentStatus: 'paid',
          paymentIntent: `pi_test_${Date.now()}_${i}`,
          packageDetails: {
            title: pkg.title,
            description: pkg.description,
            rate: pkg.rate,
            sessions: sessionsCount
          }
        };
        
        bookingsToCreate.push(booking);
      }
    }
    
    // Insert bookings
    const createdBookings = await Booking.insertMany(bookingsToCreate);
    console.log(`Created ${createdBookings.length} bookings with completed sessions`);
    
    // Calculate statistics
    let totalSessions = 0;
    createdBookings.forEach(booking => {
      totalSessions += booking.sessions.length;
    });
    
    console.log("\n=== Summary ===");
    console.log(`Student: ${student.username}`);
    console.log(`Total Bookings: ${createdBookings.length}`);
    console.log(`Total Completed Sessions: ${totalSessions}`);
    console.log(`Total Hours: ${totalSessions} hours`);
    console.log(`Topics Learned: ${packages.length}`);
    
    console.log("\n✅ Learning data generated successfully!");
    
  } catch (error) {
    console.error("Error generating learning data:", error);
  }
};

// Run the script
connect().then(() => {
  generateLearningData().then(() => {
    mongoose.connection.close();
    process.exit(0);
  });
});
