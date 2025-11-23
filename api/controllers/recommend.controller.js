import Activity from "../models/activity.model.js";
import createError from "../utils/createError.js";
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to call Python ML service
const callPythonML = (command, inputData) => {
  return new Promise((resolve, reject) => {
    const pythonScript = path.join(__dirname, '../python-ai/hybrid_recommender.py');
    const pythonProcess = spawn('python', [pythonScript, command]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`Python process exited with code ${code}: ${stderr}`));
      } else {
        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      }
    });
    
    // Send input data to Python script
    if (inputData) {
      pythonProcess.stdin.write(JSON.stringify(inputData));
      pythonProcess.stdin.end();
    }
  });
};

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


// Get ML-powered personalized recommendations for a user
export const getPersonalizedRecommendations = async (req, res, next) => {
  try {
    const userId = req.userId;
    const { limit = 5 } = req.query;

    console.log(`Getting ML recommendations for user: ${userId}`);

    // Check if user is authenticated
    if (!userId) {
      console.error('No userId found in request - user not authenticated');
      return res.status(401).json({
        success: false,
        message: "Authentication required",
        error: "Please login to see personalized recommendations"
      });
    }

    // Call Python ML service
    const result = await callPythonML('recommend', {
      userId: userId,
      n: parseInt(limit)
    });

    if (result.error) {
      console.error('ML service error:', result.error);
      return res.status(500).json({
        success: false,
        message: "Failed to generate recommendations",
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: "Personalized recommendations generated successfully",
      data: {
        recommendations: result.recommendations || [],
        userId: userId,
        count: result.recommendations?.length || 0,
        source: 'ml-hybrid-model'
      }
    });
  } catch (error) {
    console.error('Error getting ML recommendations:', error);
    
    // Fallback to simple recommendations if ML fails
    res.status(200).json({
      success: true,
      message: "Recommendations generated (fallback mode)",
      data: {
        recommendations: [],
        userId: req.userId,
        count: 0,
        source: 'fallback',
        error: error.message
      }
    });
  }
};

// Get similar packages based on content similarity
export const getSimilarPackages = async (req, res, next) => {
  try {
    const { packageId } = req.params;
    const { limit = 5 } = req.query;

    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: "Package ID is required"
      });
    }

    console.log(`Getting similar packages for: ${packageId}`);

    // Call Python ML service
    const result = await callPythonML('similar', {
      packageId: packageId,
      n: parseInt(limit)
    });

    if (result.error) {
      console.error('ML service error:', result.error);
      return res.status(500).json({
        success: false,
        message: "Failed to find similar packages",
        error: result.error
      });
    }

    res.status(200).json({
      success: true,
      message: "Similar packages found successfully",
      data: {
        similar: result.similar || [],
        packageId: packageId,
        count: result.similar?.length || 0,
        source: 'ml-content-based'
      }
    });
  } catch (error) {
    console.error('Error getting similar packages:', error);
    res.status(500).json({
      success: false,
      message: "Failed to find similar packages",
      error: error.message
    });
  }
};

// Train or retrain the ML model
export const trainModel = async (req, res, next) => {
  try {
    console.log('Starting ML model training...');

    const trainScript = path.join(__dirname, '../python-ai/train_model.py');
    const pythonProcess = spawn('python', [trainScript]);
    
    let stdout = '';
    let stderr = '';
    
    pythonProcess.stdout.on('data', (data) => {
      const output = data.toString();
      stdout += output;
      console.log('[ML Training]', output);
    });
    
    pythonProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Model training failed:', stderr);
        return res.status(500).json({
          success: false,
          message: "Model training failed",
          error: stderr
        });
      } else {
        console.log('Model training completed successfully');
        res.status(200).json({
          success: true,
          message: "Model trained successfully",
          data: {
            output: stdout,
            timestamp: new Date()
          }
        });
      }
    });

  } catch (error) {
    console.error('Error training model:', error);
    res.status(500).json({
      success: false,
      message: "Failed to start model training",
      error: error.message
    });
  }
};


