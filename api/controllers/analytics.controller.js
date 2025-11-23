import Search from '../models/search.model.js';
import Interaction from '../models/interaction.model.js';
import User from '../models/user.model.js';
import createError from '../utils/createError.js';

// Record a search performed by a user
export const recordSearch = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.userId || req.userId !== id) {
      return next(createError(403, 'You can only record searches for your account'));
    }

    const { query, filters = {}, resultsCount = 0, meta = {} } = req.body;
    if (!query || typeof query !== 'string') {
      return next(createError(400, 'Query string is required'));
    }

    const record = await Search.create({ userId: id, query, filters, resultsCount, meta });
    res.status(201).json({ success: true, search: record });
  } catch (err) {
    console.error('recordSearch error:', err);
    next(createError(500, 'Failed to record search'));
  }
};

// Get recent searches for a user
export const getSearches = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.userId || req.userId !== id) {
      return next(createError(403, 'You can only view searches for your account'));
    }

    const searches = await Search.find({ userId: id }).sort({ createdAt: -1 }).limit(100);
    res.status(200).json({ success: true, searches });
  } catch (err) {
    console.error('getSearches error:', err);
    next(createError(500, 'Failed to fetch searches'));
  }
};

// Record a user interaction (e.g., AI chat/request)
export const recordInteraction = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.userId || req.userId !== id) {
      return next(createError(403, 'You can only record interactions for your account'));
    }

    const { type = 'general', input = null, response = null, score = null, meta = {} } = req.body;

    const record = await Interaction.create({ userId: id, type, input, response, score, meta });

    // increment user's aiFeatures.interactionCount for quick metric
    try {
      await User.findByIdAndUpdate(id, { $inc: { 'aiFeatures.interactionCount': 1 }, $set: { 'aiFeatures.lastActive': new Date() } });
    } catch (e) {
      console.warn('Failed to update user aiFeatures:', e.message);
    }

    res.status(201).json({ success: true, interaction: record });
  } catch (err) {
    console.error('recordInteraction error:', err);
    next(createError(500, 'Failed to record interaction'));
  }
};

// Get recent interactions for a user
export const getInteractions = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!req.userId || req.userId !== id) {
      return next(createError(403, 'You can only view interactions for your account'));
    }

    const interactions = await Interaction.find({ userId: id }).sort({ createdAt: -1 }).limit(200);
    res.status(200).json({ success: true, interactions });
  } catch (err) {
    console.error('getInteractions error:', err);
    next(createError(500, 'Failed to fetch interactions'));
  }
};
