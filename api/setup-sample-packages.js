import mongoose from "mongoose";
import dotenv from "dotenv";
import Package from "./models/package.model.js";
import User from "./models/user.model.js";

dotenv.config();

const connect = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log(error);
  }
};

const createSamplePackages = async () => {
  try {
    // First, find an educator user or create one
    let educator = await User.findOne({ isEducator: true });
    
    if (!educator) {
      console.log("No educator found. Creating a sample educator...");
      educator = new User({
        username: "Dr. Shanika Wijesekara",
        email: "shanika@example.com",
        password: "password123",
        isEducator: true,
        img: "/img/noavatar.jpg"
      });
      await educator.save();
    }

    // Create sample packages
    const samplePackages = [
      {
        educatorId: educator._id,
        title: "Boolean Algebra",
        description: "Logic operations using binary values. Learn the fundamentals of digital logic and computer science.",
        keywords: ["algebra", "logic", "computer science", "mathematics"],
        rate: 1750,
        languages: ["Eng", "Sinh"],
        thumbnail: "/img/boolean-algebra.jpg",
        isActive: true
      },
      {
        educatorId: educator._id,
        title: "Advanced Calculus",
        description: "Mastering complex mathematical concepts including derivatives, integrals, and series.",
        keywords: ["calculus", "mathematics", "derivatives", "integrals"],
        rate: 1800,
        languages: ["Eng"],
        thumbnail: "/img/course-calc.jpg",
        isActive: true
      },
      {
        educatorId: educator._id,
        title: "Quantum Physics",
        description: "Exploring the mysteries of the subatomic world and quantum mechanics principles.",
        keywords: ["physics", "quantum", "mechanics", "science"],
        rate: 2000,
        languages: ["Eng", "Sinh"],
        thumbnail: "/img/course-physics.jpg",
        isActive: true
      },
      {
        educatorId: educator._id,
        title: "Organic Chemistry",
        description: "Hands-on experiments in organic compounds and chemical reactions.",
        keywords: ["chemistry", "organic", "compounds", "reactions"],
        rate: 1600,
        languages: ["Eng"],
        thumbnail: "/img/course-chemistry.jpg",
        isActive: true
      },
      {
        educatorId: educator._id,
        title: "Data Structures & Algorithms",
        description: "Learn fundamental data structures and algorithmic problem-solving techniques.",
        keywords: ["programming", "algorithms", "data structures", "computer science"],
        rate: 1900,
        languages: ["Eng"],
        thumbnail: "/img/course-programming.jpg",
        isActive: true
      },
      {
        educatorId: educator._id,
        title: "English Literature",
        description: "Explore classic and contemporary literature from around the world.",
        keywords: ["english", "literature", "reading", "writing"],
        rate: 1500,
        languages: ["Eng"],
        thumbnail: "/img/course-literature.jpg",
        isActive: true
      },
      {
        title: "Digital Art Fundamentals",
        desc: "Learn the basics of digital art, including tools, techniques, and creative processes for creating stunning digital artwork.",
        rate: 25,
        subjects: ["Art & Design", "Digital Art", "Creative Design"],
        level: "beginner",
        keywords: ["digital art", "drawing", "creative", "design", "art"],
        languages: ["English", "Sinhala"],
        isActive: true,
        rating: 4.8,
        totalOrders: 15
      },
      {
        title: "Graphic Design Mastery",
        desc: "Master graphic design principles, typography, color theory, and layout design for professional projects.",
        rate: 30,
        subjects: ["Art & Design", "Graphic Design", "Visual Design"],
        level: "intermediate",
        keywords: ["graphic design", "typography", "layout", "visual", "design"],
        languages: ["English"],
        isActive: true,
        rating: 4.9,
        totalOrders: 22
      },
      {
        title: "Web Design & UI/UX",
        desc: "Learn modern web design principles, user interface design, and user experience optimization.",
        rate: 35,
        subjects: ["Art & Design", "Web Design", "UI/UX"],
        level: "intermediate",
        keywords: ["web design", "ui", "ux", "user interface", "user experience"],
        languages: ["English", "Sinhala"],
        isActive: true,
        rating: 4.7,
        totalOrders: 18
      },
      {
        title: "Illustration Techniques",
        desc: "Explore various illustration styles and techniques for creating compelling visual narratives.",
        rate: 28,
        subjects: ["Art & Design", "Illustration", "Drawing"],
        level: "beginner",
        keywords: ["illustration", "drawing", "art", "visual storytelling"],
        languages: ["English", "Tamil"],
        isActive: true,
        rating: 4.6,
        totalOrders: 12
      },
      {
        title: "3D Modeling & Animation",
        desc: "Learn 3D modeling, texturing, and animation techniques for games, films, and digital media.",
        rate: 40,
        subjects: ["Art & Design", "3D Modeling", "Animation"],
        level: "advanced",
        keywords: ["3d modeling", "animation", "digital media", "visual effects"],
        languages: ["English"],
        isActive: true,
        rating: 4.8,
        totalOrders: 8
      },
      {
        title: "Photography & Photo Editing",
        desc: "Master photography techniques and photo editing skills for professional and artistic photography.",
        rate: 32,
        subjects: ["Art & Design", "Photography", "Photo Editing"],
        level: "intermediate",
        keywords: ["photography", "photo editing", "camera", "visual arts"],
        languages: ["English", "Sinhala"],
        isActive: true,
        rating: 4.7,
        totalOrders: 16
      },
      {
        title: "Adobe Photoshop Mastery",
        desc: "Master Adobe Photoshop for digital art, photo editing, and graphic design projects.",
        rate: 35,
        subjects: ["Art & Design", "Digital Art", "Photo Editing"],
        level: "intermediate",
        keywords: ["photoshop", "adobe", "photo editing", "digital art"],
        languages: ["English", "Sinhala"],
        isActive: true,
        rating: 4.8,
        totalOrders: 20
      },
      {
        title: "User Experience Design",
        desc: "Learn UX design principles, user research, wireframing, and prototyping for digital products.",
        rate: 38,
        subjects: ["Art & Design", "UX Design", "User Research"],
        level: "intermediate",
        keywords: ["ux design", "user experience", "wireframing", "prototyping"],
        languages: ["English"],
        isActive: true,
        rating: 4.9,
        totalOrders: 14
      }
    ];

    // Clear existing packages (optional - comment out if you want to keep existing ones)
    // await Package.deleteMany({});

    // Create new packages
    for (const packageData of samplePackages) {
      const existingPackage = await Package.findOne({ 
        title: packageData.title, 
        educatorId: packageData.educatorId 
      });
      
      if (!existingPackage) {
        const newPackage = new Package(packageData);
        await newPackage.save();
        console.log(`Created package: ${packageData.title}`);
      } else {
        console.log(`Package already exists: ${packageData.title}`);
      }
    }

    console.log("Sample packages setup completed!");
    process.exit(0);
  } catch (error) {
    console.error("Error creating sample packages:", error);
    process.exit(1);
  }
};

// Run the setup
connect().then(() => {
  createSamplePackages();
});
