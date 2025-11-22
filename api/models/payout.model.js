import mongoose from 'mongoose';

const payoutSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true, index: true },
  educatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionIndex: { type: Number, required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'LKR' },
  status: { type: String, enum: ['pending', 'processing', 'completed', 'failed'], default: 'completed' },
  method: { type: String, enum: ['internal', 'stripe', 'bank_transfer', 'manual'], default: 'internal' },
  processedAt: Date,
  meta: Object
}, {
  timestamps: true
});

export default mongoose.model('Payout', payoutSchema);
