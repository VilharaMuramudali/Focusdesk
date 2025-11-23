import { useCallback } from 'react';
import newRequest from '../utils/newRequest';

// Lightweight analytics hook to record searches and interactions
export default function useAnalytics() {
  const recordSearch = useCallback(async ({ userId, query, filters = {}, resultsCount = 0, meta = {} }) => {
    if (!userId || !query) return null;
    try {
      const res = await newRequest.post(`/users/${userId}/searches`, { query, filters, resultsCount, meta });
      return res.data;
    } catch (err) {
      console.warn('recordSearch failed', err?.response?.data || err.message);
      return null;
    }
  }, []);

  const recordInteraction = useCallback(async ({ userId, type = 'general', input = null, response = null, score = null, meta = {} }) => {
    if (!userId) return null;
    try {
      const res = await newRequest.post(`/users/${userId}/interactions`, { type, input, response, score, meta });
      return res.data;
    } catch (err) {
      console.warn('recordInteraction failed', err?.response?.data || err.message);
      return null;
    }
  }, []);

  return { recordSearch, recordInteraction };
}
