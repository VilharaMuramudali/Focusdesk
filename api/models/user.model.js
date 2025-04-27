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
  }
},{
  timestamps: true
});

export default mongoose.model("User", userSchema);
