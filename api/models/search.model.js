import mongoose from 'mongoose';
const { Schema } = mongoose;

const searchSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query: { type: String, required: true },
  filters: { type: Schema.Types.Mixed, default: {} },
  resultsCount: { type: Number, default: 0 },
  meta: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

// Indexes for faster queries and retention
// Most queries are by userId sorted by createdAt desc
searchSchema.index({ userId: 1, createdAt: -1 });

// TTL index to automatically remove entries older than 1 year (365 days)
// Adjust expireAfterSeconds if you want a different retention period
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
searchSchema.index({ createdAt: 1 }, { expireAfterSeconds: ONE_YEAR_SECONDS });

export default mongoose.model('Search', searchSchema);
