import Activity from "../models/activity.model.js";
import createError from "../utils/createError.js";

// Track search query - saves search keywords in real-time
export const trackSearchQuery = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { searchQuery, filters } = req.body;

    // Validate search query
    if (!searchQuery || typeof searchQuery !== 'string' || searchQuery.trim().length < 2) {
      return res.status(200).json({ 
        message: "Search query too short or invalid", 
        success: true 
      });
    }

    // Extract keywords from search query
    const keywords = searchQuery
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 2);

    // Create activity record for search
    const activity = new Activity({
      studentId: userId,
      type: 'search',
      subject: keywords[0] || 'general', // Use first keyword as subject
      details: {
        searchQuery: searchQuery.trim(),
        keywords: keywords,
        filters: filters || {},
        timestamp: new Date()
      },
      timestamp: new Date()
    });

    await activity.save();

    res.status(200).json({
      success: true,
      message: "Search query tracked successfully",
      data: {
        searchQuery: searchQuery.trim(),
        keywords: keywords
      }
    });
  } catch (error) {
    console.error('Error tracking search query:', error);
    // Don't fail the request if tracking fails - return success anyway
    res.status(200).json({
      success: true,
      message: "Search query received"
    });
  }
};

// Track package view with time spent
export const trackPackageView = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { 
      packageId, 
      timeSpent, 
      viewStartTime, 
      viewEndTime,
      searchQuery,
      searchKeywords 
    } = req.body;

    // Validate required fields
    if (!packageId) {
      return res.status(400).json({ 
        message: "Package ID is required" 
      });
    }

    // Create activity record for package view
    const activity = new Activity({
      studentId: userId,
      type: 'package_view',
      subject: 'package',
      details: {
        packageId: packageId,
        timeSpent: timeSpent || 0,
        viewStartTime: viewStartTime ? new Date(viewStartTime) : new Date(),
        viewEndTime: viewEndTime ? new Date(viewEndTime) : new Date(),
        searchQuery: searchQuery || null,
        searchKeywords: searchKeywords || [],
        timestamp: new Date()
      },
      timestamp: new Date()
    });

    await activity.save();

    res.status(200).json({
      success: true,
      message: "Package view tracked successfully",
      data: {
        packageId,
        timeSpent: timeSpent || 0
      }
    });
  } catch (error) {
    console.error('Error tracking package view:', error);
    // Don't fail the request if tracking fails
    res.status(200).json({
      success: true,
      message: "Package view received"
    });
  }
};

// Track general interaction (clicks, views, etc.)
export const trackInteraction = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { 
      packageId, 
      interactionType, 
      recommendationSource,
      metadata 
    } = req.body;

    // Validate required fields
    if (!interactionType) {
      return res.status(400).json({ 
        message: "Interaction type is required" 
      });
    }

    // Determine subject based on interaction
    let subject = 'general';
    if (packageId) {
      subject = 'package';
    } else if (interactionType === 'click') {
      subject = 'click';
    } else if (interactionType === 'view') {
      subject = 'view';
    }

    // Create activity record for interaction
    const activity = new Activity({
      studentId: userId,
      type: interactionType,
      subject: subject,
      details: {
        packageId: packageId || null,
        interactionType: interactionType,
        recommendationSource: recommendationSource || null,
        metadata: metadata || {},
        timestamp: new Date()
      },
      timestamp: new Date()
    });

    await activity.save();

    res.status(200).json({
      success: true,
      message: "Interaction tracked successfully",
      data: {
        interactionType,
        packageId: packageId || null
      }
    });
  } catch (error) {
    console.error('Error tracking interaction:', error);
    // Don't fail the request if tracking fails
    res.status(200).json({
      success: true,
      message: "Interaction received"
    });
  }
};

