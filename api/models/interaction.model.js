import mongoose from 'mongoose';
const { Schema } = mongoose;

const interactionSchema = new Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, default: 'general' }, // e.g. 'search', 'chat', 'recommendation'
  input: { type: Schema.Types.Mixed },
  response: { type: Schema.Types.Mixed },
  score: { type: Number },
  meta: { type: Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

// Indexes: common queries are by userId and createdAt
interactionSchema.index({ userId: 1, createdAt: -1 });

// TTL index: keep interactions for 1 year by default
const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60;
interactionSchema.index({ createdAt: 1 }, { expireAfterSeconds: ONE_YEAR_SECONDS });

export default mongoose.model('Interaction', interactionSchema);
