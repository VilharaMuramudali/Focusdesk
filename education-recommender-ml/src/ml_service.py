from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import joblib
import os
import logging
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.is_initialized = False
        self.last_training = None
        
    def initialize(self):
        try:
            # Load pre-trained model and scaler
            model_path = os.path.join('models', 'recommendation_model.pkl')
            scaler_path = os.path.join('models', 'scaler.pkl')
            
            if os.path.exists(model_path) and os.path.exists(scaler_path):
                self.model = joblib.load(model_path)
                self.scaler = joblib.load(scaler_path)
                self.is_initialized = True
                logger.info("Model and scaler loaded successfully")
            else:
                logger.warning("Model files not found, initialization failed")
                
        except Exception as e:
            logger.error(f"Error initializing recommendation service: {str(e)}")
            self.is_initialized = False

    def get_recommendations(self, user_id, preferences, limit=10):
        try:
            if not self.is_initialized:
                self.initialize()
                
            if not self.is_initialized:
                return {"error": "Service not initialized"}
            
            # Convert preferences to feature vector
            features = self._extract_features(preferences)
            
            # Scale features
            scaled_features = self.scaler.transform([features])
            
            # Get similarity scores
            similarity_scores = self._calculate_similarity(scaled_features)
            
            # Get top recommendations
            top_indices = np.argsort(similarity_scores[0])[-limit:][::-1]
            
            recommendations = []
            for idx in top_indices:
                rec = {
                    "package_id": str(idx),  # Replace with actual package IDs
                    "score": float(similarity_scores[0][idx]),
                    "rank": len(recommendations) + 1
                }
                recommendations.append(rec)
            
            return {
                "recommendations": recommendations,
                "algorithm": "hybrid",
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {str(e)}")
            return {"error": str(e)}

    def _extract_features(self, preferences):
        # Extract features from user preferences
        # This is a simplified version - expand based on your feature set
        features = []
        
        # Subject preferences (one-hot encoded)
        subject_features = [0] * len(self.subject_categories)
        for subject in preferences.get('subjects', []):
            if subject in self.subject_categories:
                idx = self.subject_categories.index(subject)
                subject_features[idx] = 1
        features.extend(subject_features)
        
        # Price preference
        price_preference = preferences.get('price_range', 50)
        features.append(float(price_preference))
        
        # Learning style (one-hot encoded)
        learning_style = preferences.get('learning_style', 'visual')
        learning_style_features = [0] * len(self.learning_styles)
        if learning_style in self.learning_styles:
            idx = self.learning_styles.index(learning_style)
            learning_style_features[idx] = 1
        features.extend(learning_style_features)
        
        return features

    def _calculate_similarity(self, user_features):
        # Calculate similarity between user preferences and all packages
        return cosine_similarity(user_features, self.model)

# Initialize service
recommendation_service = RecommendationService()

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "initialized": recommendation_service.is_initialized,
        "last_training": recommendation_service.last_training
    })

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get personalized recommendations"""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        preferences = data.get('preferences', {})
        limit = int(data.get('limit', 10))
        
        if not user_id:
            return jsonify({"error": "user_id is required"}), 400
            
        recommendations = recommendation_service.get_recommendations(
            user_id=user_id,
            preferences=preferences,
            limit=limit
        )
        
        return jsonify(recommendations)
        
    except Exception as e:
        logger.error(f"Error processing recommendation request: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    # Initialize on startup
    recommendation_service.initialize()
    
    # Start server
    app.run(host='0.0.0.0', port=5000)