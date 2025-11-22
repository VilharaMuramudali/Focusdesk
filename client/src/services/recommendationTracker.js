import newRequest from '../utils/newRequest';

class RecommendationTracker {
  constructor() {
    this.viewStartTime = null;
    this.currentPackageId = null;
  }

  // Track package view
  async trackView(packageId) {
    this.viewStartTime = new Date();
    this.currentPackageId = packageId;
    
    try {
      await newRequest.post('/recommend/track-package-view', {
        packageId,
        viewStartTime: this.viewStartTime,
        viewEndTime: new Date(),
        timeSpent: 0
      });
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  }

  // Track when user leaves page (calculate time spent)
  async trackViewEnd(packageId) {
    if (!this.viewStartTime || !packageId) return;

    const viewEndTime = new Date();
    const timeSpent = Math.floor((viewEndTime - this.viewStartTime) / 1000); // seconds

    try {
      await newRequest.post('/recommend/track-package-view', {
        packageId,
        viewStartTime: this.viewStartTime,
        viewEndTime,
        timeSpent
      });
    } catch (error) {
      console.error('Error tracking view end:', error);
    }

    this.viewStartTime = null;
    this.currentPackageId = null;
  }

  // Track search query
  async trackSearch(searchQuery, filters = {}) {
    try {
      await newRequest.post('/recommend/track-search', {
        searchQuery,
        filters
      });
    } catch (error) {
      console.error('Error tracking search:', error);
    }
  }

  // Track click
  async trackClick(packageId, source = 'general') {
    try {
      await newRequest.post('/recommend/track', {
        packageId,
        interactionType: 'click',
        recommendationSource: source
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  }

  // Track interaction (generic)
  async trackInteraction(packageId, interactionType, source = 'general') {
    try {
      await newRequest.post('/recommend/track', {
        packageId,
        interactionType,
        recommendationSource: source
      });
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }
}

export default new RecommendationTracker();
