import mongoose from "mongoose";
const { Schema } = mongoose;

const bookingSchema = new Schema({
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Package',
    required: true
  },
  educatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },
  sessions: [{
    date: {
      type: Date,
      required: true
    },
    time: {
      type: String,
      required: true
    },
    duration: {
      type: Number,
      default: 60 // minutes
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'cancelled'],
      default: 'scheduled'
    },
    notes: String
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  paymentIntent: {
    type: String,
    required: true
  },
  packageDetails: {
    title: String,
    description: String,
    rate: Number,
    sessions: Number
  },
  studentNotes: String,
  educatorNotes: String
}, {
  timestamps: true
});

// Index for efficient queries
bookingSchema.index({ educatorId: 1, status: 1 });
bookingSchema.index({ studentId: 1, status: 1 });
bookingSchema.index({ packageId: 1 });

export default mongoose.model("Booking", bookingSchema); 