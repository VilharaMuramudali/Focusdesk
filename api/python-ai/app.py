#!/usr/bin/env python3
"""
Flask API for AI Recommendation Service
Provides REST endpoints for getting recommendations
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import logging
import os
import sys
from datetime import datetime
import traceback

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from recommendation_model import RecommendationModel

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Global model instance
model = None

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model is not None,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get recommendations for a user"""
    try:
        data = request.json
        user_id = data.get('user_id')
        query = data.get('query', '')
        algorithm = data.get('algorithm', 'hybrid')
        limit = data.get('limit', 10)
        
        if not user_id:
            return jsonify({'error': 'user_id is required'}), 400
        
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        recommendations = model.get_recommendations(user_id, query, algorithm, limit)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'algorithm': algorithm,
            'query': query,
            'total_count': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"API error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/recommendations/<user_id>', methods=['GET'])
def get_recommendations_get(user_id):
    """Get recommendations via GET request"""
    try:
        query = request.args.get('query', '')
        algorithm = request.args.get('algorithm', 'hybrid')
        limit = int(request.args.get('limit', 10))
        
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        recommendations = model.get_recommendations(user_id, query, algorithm, limit)
        
        return jsonify({
            'success': True,
            'recommendations': recommendations,
            'algorithm': algorithm,
            'query': query,
            'total_count': len(recommendations),
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"API error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Train the recommendation model"""
    try:
        global model
        logger.info("Starting model training...")
        
        model = RecommendationModel()
        model.train_models()
        
        logger.info("Model training completed successfully")
        return jsonify({
            'success': True, 
            'message': 'Model trained successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/load', methods=['POST'])
def load_model():
    """Load a pre-trained model"""
    try:
        global model
        logger.info("Loading pre-trained model...")
        
        model = RecommendationModel()
        model.load_models()
        
        logger.info("Model loaded successfully")
        return jsonify({
            'success': True, 
            'message': 'Model loaded successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Loading error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/interaction', methods=['POST'])
def record_interaction():
    """Record a new user interaction"""
    try:
        data = request.json
        user_id = data.get('user_id')
        package_id = data.get('package_id')
        interaction_type = data.get('interaction_type')
        
        if not all([user_id, package_id, interaction_type]):
            return jsonify({'error': 'user_id, package_id, and interaction_type are required'}), 400
        
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        model.update_user_interaction(user_id, package_id, interaction_type)
        
        return jsonify({
            'success': True,
            'message': 'Interaction recorded successfully',
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logger.error(f"Interaction recording error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/algorithms', methods=['GET'])
def get_algorithms():
    """Get available recommendation algorithms"""
    return jsonify({
        'algorithms': [
            {
                'name': 'content',
                'description': 'Content-based filtering using user preferences and package features'
            },
            {
                'name': 'collaborative',
                'description': 'Collaborative filtering based on similar users\' interactions'
            },
            {
                'name': 'cluster',
                'description': 'Cluster-based recommendations using user segmentation'
            },
            {
                'name': 'hybrid',
                'description': 'Combines content and collaborative filtering for optimal results'
            }
        ]
    })

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get model statistics"""
    try:
        if model is None:
            return jsonify({'error': 'Model not loaded'}), 500
        
        stats = {
            'users_count': len(model.users_df) if model.users_df is not None else 0,
            'packages_count': len(model.packages_df) if model.packages_df is not None else 0,
            'interactions_count': len(model.interactions_df) if model.interactions_df is not None else 0,
            'sessions_count': len(model.sessions_df) if model.sessions_df is not None else 0,
            'clusters_count': model.n_clusters if model.user_clusters else 0,
            'model_components': model.n_components,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(stats)
        
    except Exception as e:
        logger.error(f"Stats error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load model on startup
    try:
        logger.info("Loading recommendation model...")
        model = RecommendationModel()
        model.load_models()
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load model on startup: {e}")
        logger.info("You can train or load the model using /train or /load endpoints")
    
    # Get port from environment or use default
    port = int(os.getenv('AI_SERVICE_PORT', 5000))
    
    logger.info(f"Starting AI Recommendation Service on port {port}")
    app.run(host='0.0.0.0', port=port, debug=False)
