import mongoose from "mongoose";
const { Schema } = mongoose;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  img: {
    type: String,
    required: false,
  },
  imgId: {  // Store the GridFS file ID
    type: mongoose.Schema.Types.ObjectId,
    required: false,
  },
  country: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  desc: {
    type: String,
    required: false,
  },
  isEducator: {
    type: Boolean,
    default: false,
  },
  subjects: {
    type: [String],
    required: false,
  },
  bio: {
    type: String,
    required: false,
  },
  educationLevel: {
    type: String,
    required: false,
  },
  
  // AI-specific fields for students
  learningPreferences: {
    subjects: [String],
    learningStyle: { 
      type: String, 
      enum: ['visual', 'auditory', 'kinesthetic', 'reading'], 
      default: 'visual' 
    },
    sessionDuration: { 
      type: String, 
      enum: ['30min', '1hour', '2hours'], 
      default: '1hour' 
    },
    timePreferences: [String],
    academicLevel: { 
      type: String, 
      enum: ['highschool', 'university', 'postgraduate'], 
      default: 'university' 
    }
  },
  
  // AI-specific fields for educators
  teachingProfile: {
    expertise: [{
      subject: String,
      proficiencyLevel: { type: Number, min: 1, max: 10 },
      yearsExperience: Number
    }],
    teachingStyle: { 
      type: String, 
      enum: ['structured', 'flexible', 'interactive', 'theoretical', 'practical'],
      default: 'interactive'
    },
    averageRating: { type: Number, default: 0 },
    totalSessions: { type: Number, default: 0 },
    responseTimeHours: { type: Number, default: 24 }
  },
  
  // AI behavior tracking
  aiFeatures: {
    learningVector: [Number], // For ML algorithms
    lastActive: { type: Date, default: Date.now },
    interactionCount: { type: Number, default: 0 }
  }
},{
  timestamps: true
});

export default mongoose.model("User", userSchema);
