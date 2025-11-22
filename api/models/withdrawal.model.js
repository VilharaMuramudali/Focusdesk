import mongoose from "mongoose";

const withdrawalSchema = new mongoose.Schema({
  educatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'LKR',
    uppercase: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'rejected', 'cancelled'],
    default: 'pending',
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe', 'other'],
    required: true
  },
  bankDetails: {
    accountHolderName: String,
    accountNumber: String,
    bankName: String,
    branchName: String,
    swiftCode: String,
    iban: String
  },
  paypalEmail: String,
  stripeAccountId: String,
  rejectionReason: String,
  processedAt: Date,
  completedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes for efficient querying
withdrawalSchema.index({ educatorId: 1, createdAt: -1 });
withdrawalSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Withdrawal", withdrawalSchema);

