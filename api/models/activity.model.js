import mongoose from "mongoose";
const { Schema } = mongoose;

const activitySchema = new Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: String, // e.g., "view_subject", "book_tutor", "search", etc.
  subject: String,
  details: Object,
  timestamp: Date
});

export default mongoose.model("Activity", activitySchema); 