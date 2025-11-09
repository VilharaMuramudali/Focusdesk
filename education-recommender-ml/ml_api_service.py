#!/usr/bin/env python3
"""
ML Recommendation API Service
Flask API service that extracts data from MongoDB, trains ML models, and provides recommendations
"""

import os
import sys
import json
import logging
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback

# Add src directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'src'))

from data_pipeline import EducationalDataPipeline
from recommendation_model import EducationalRecommendationSystem
import pickle
import pandas as pd

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Global variables
recommendation_system = None
models_loaded = False
MODEL_PATH = 'models/recommendation_system.pkl'
PROCESSED_DATA_DIR = 'processed_data'

def initialize_system():
    """Initialize the recommendation system"""
    global recommendation_system, models_loaded
    
    try:
        # Load existing model if available
        if os.path.exists(MODEL_PATH):
            logger.info("📦 Loading existing trained model...")
            recommendation_system = EducationalRecommendationSystem()
            with open(MODEL_PATH, 'rb') as f:
                recommendation_system.models = pickle.load(f)
            
            # Load processed data
            if os.path.exists(f'{PROCESSED_DATA_DIR}/user_features.csv'):
                import pandas as pd
                recommendation_system.users_df = pd.read_csv(f'{PROCESSED_DATA_DIR}/user_features.csv')
                recommendation_system.packages_df = pd.read_csv(f'{PROCESSED_DATA_DIR}/package_features.csv')
                
                # Load interaction matrix
                recommendation_system.interaction_matrix = pd.read_csv(
                    f'{PROCESSED_DATA_DIR}/interaction_matrix.csv', 
                    index_col=0
                )
                
                # Load TF-IDF features if available
                if os.path.exists(f'{PROCESSED_DATA_DIR}/feature_data.pkl'):
                    with open(f'{PROCESSED_DATA_DIR}/feature_data.pkl', 'rb') as f:
                        feature_data = pickle.load(f)
                        if 'content_features' in feature_data:
                            recommendation_system.content_features = feature_data['content_features']
                
                models_loaded = True
                logger.info("✅ Model loaded successfully")
                return True
        else:
            logger.warning("⚠️ No trained model found. Run training pipeline first.")
            return False
            
    except Exception as e:
        logger.error(f"❌ Error initializing system: {e}")
        logger.error(traceback.format_exc())
        return False

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': models_loaded,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/extract-data', methods=['POST'])
def extract_data():
    """Extract data from MongoDB and prepare for ML"""
    try:
        logger.info("🚀 Starting data extraction from MongoDB...")
        
        # Get MongoDB connection details from request or environment
        mongo_uri = request.json.get('mongo_uri') if request.json else None
        db_name = request.json.get('db_name') if request.json else None
        
        mongo_uri = mongo_uri or os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
        db_name = db_name or os.getenv('DB_NAME', 'focusdesk')
        
        # Initialize pipeline
        pipeline = EducationalDataPipeline(mongo_uri=mongo_uri, db_name=db_name)
        
        # Run complete pipeline
        success = pipeline.run_complete_pipeline()
        
        if success:
            return jsonify({
                'success': True,
                'message': 'Data extracted and processed successfully',
                'data_location': PROCESSED_DATA_DIR,
                'timestamp': datetime.now().isoformat()
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Data extraction failed'
            }), 500
            
    except Exception as e:
        logger.error(f"❌ Data extraction error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/train', methods=['POST'])
def train_model():
    """Train the recommendation model"""
    try:
        logger.info("🧠 Starting model training...")
        
        global recommendation_system, models_loaded
        
        # Initialize recommendation system
        recommendation_system = EducationalRecommendationSystem()
        
        # Load processed data
        import pandas as pd
        if not os.path.exists(f'{PROCESSED_DATA_DIR}/user_features.csv'):
            return jsonify({
                'success': False,
                'error': 'Processed data not found. Run /extract-data first.'
            }), 400
        
        # Load data
        recommendation_system.users_df = pd.read_csv(f'{PROCESSED_DATA_DIR}/user_features.csv')
        recommendation_system.packages_df = pd.read_csv(f'{PROCESSED_DATA_DIR}/package_features.csv')
        recommendation_system.interactions_df = pd.read_csv(f'{PROCESSED_DATA_DIR}/interactions.csv') if os.path.exists(f'{PROCESSED_DATA_DIR}/interactions.csv') else pd.DataFrame()
        
        # Load interaction matrix
        recommendation_system.interaction_matrix = pd.read_csv(
            f'{PROCESSED_DATA_DIR}/interaction_matrix.csv',
            index_col=0
        )
        
        # Load TF-IDF features if available
        if os.path.exists(f'{PROCESSED_DATA_DIR}/feature_data.pkl'):
            with open(f'{PROCESSED_DATA_DIR}/feature_data.pkl', 'rb') as f:
                feature_data = pickle.load(f)
                if 'content_features' in feature_data:
                    recommendation_system.content_features = feature_data['content_features']
        
        # Prepare features
        recommendation_system.prepare_features()
        
        # Train models
        recommendation_system.train_all()
        
        # Save models
        os.makedirs('models', exist_ok=True)
        recommendation_system.save_models()
        
        models_loaded = True
        
        return jsonify({
            'success': True,
            'message': 'Model trained successfully',
            'model_location': MODEL_PATH,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Model training error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
    """Get recommendations for a user"""
    try:
        if not models_loaded or recommendation_system is None:
            return jsonify({
                'success': False,
                'error': 'Model not loaded. Run /train first or ensure model exists.'
            }), 400
        
        data = request.json
        user_id = data.get('user_id')
        n_recommendations = data.get('limit', 10)
        method = data.get('algorithm', 'hybrid')
        query = data.get('query', '')
        
        if not user_id:
            return jsonify({
                'success': False,
                'error': 'user_id is required'
            }), 400
        
        logger.info(f"🔍 Getting {method} recommendations for user {user_id}...")
        
        # Get recommendations
        recommendations = recommendation_system.get_recommendations(
            user_id=str(user_id),
            n_recommendations=n_recommendations,
            method=method
        )
        
        if not recommendations:
            logger.warning(f"⚠️ No recommendations found for user {user_id}")
            # Return empty recommendations with success
            return jsonify({
                'success': True,
                'recommendations': [],
                'algorithm': method,
                'count': 0,
                'message': 'No recommendations available'
            }), 200
        
        # Format recommendations for frontend
        formatted_recommendations = []
        for rec in recommendations:
            package_id = str(rec.get('package_id') or rec.get('_id', ''))
            
            if not package_id or package_id == '':
                continue
            
            # Get package details from dataframe
            package_info = pd.DataFrame()
            
            # Try to find package in dataframe by different ID columns
            if 'package_id' in recommendation_system.packages_df.columns:
                package_info = recommendation_system.packages_df[
                    recommendation_system.packages_df['package_id'].astype(str) == package_id
                ]
            
            if package_info.empty and '_id' in recommendation_system.packages_df.columns:
                package_info = recommendation_system.packages_df[
                    recommendation_system.packages_df['_id'].astype(str) == package_id
                ]
            
            if not package_info.empty:
                package = package_info.iloc[0]
                formatted_rec = {
                    '_id': package_id,
                    'packageId': package_id,
                    'package_id': package_id,
                    'title': str(package.get('title', rec.get('title', 'Unknown'))),
                    'description': str(package.get('description', package.get('desc', ''))),
                    'rate': float(package.get('rate', rec.get('rate', 0))),
                    'price': float(package.get('rate', package.get('price', rec.get('rate', 0)))),
                    'score': float(rec.get('similarity_score', rec.get('predicted_score', 0))),
                    'method': rec.get('method', method),
                    'isPersonalized': True,
                    'aiScore': float(rec.get('similarity_score', rec.get('predicted_score', 0)))
                }
                formatted_recommendations.append(formatted_rec)
            else:
                # If package not found in dataframe, still return the recommendation with available data
                formatted_rec = {
                    '_id': package_id,
                    'packageId': package_id,
                    'package_id': package_id,
                    'title': str(rec.get('title', 'Unknown Package')),
                    'description': '',
                    'rate': float(rec.get('rate', 0)),
                    'price': float(rec.get('rate', 0)),
                    'score': float(rec.get('similarity_score', rec.get('predicted_score', 0))),
                    'method': rec.get('method', method),
                    'isPersonalized': True,
                    'aiScore': float(rec.get('similarity_score', rec.get('predicted_score', 0)))
                }
                formatted_recommendations.append(formatted_rec)
        
        # Sort by score (highest first)
        formatted_recommendations.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({
            'success': True,
            'recommendations': formatted_recommendations[:n_recommendations],
            'algorithm': method,
            'count': len(formatted_recommendations),
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Recommendation error: {e}")
        logger.error(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/extract-and-train', methods=['POST'])
def extract_and_train():
    """Extract data and train model in one call"""
    try:
        logger.info("🚀 Starting full pipeline: extract data + train model...")
        
        # Step 1: Extract data
        extract_result = extract_data()
        if extract_result[1] != 200:
            return extract_result
        
        # Step 2: Train model
        train_result = train_model()
        if train_result[1] != 200:
            return train_result
        
        return jsonify({
            'success': True,
            'message': 'Data extracted and model trained successfully',
            'model_location': MODEL_PATH,
            'timestamp': datetime.now().isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"❌ Extract and train error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/stats', methods=['GET'])
def get_stats():
    """Get model statistics"""
    try:
        stats = {
            'models_loaded': models_loaded,
            'model_exists': os.path.exists(MODEL_PATH),
            'processed_data_exists': os.path.exists(PROCESSED_DATA_DIR),
            'timestamp': datetime.now().isoformat()
        }
        
        if models_loaded and recommendation_system is not None:
            try:
                stats['users_count'] = len(recommendation_system.users_df) if hasattr(recommendation_system, 'users_df') else 0
                stats['packages_count'] = len(recommendation_system.packages_df) if hasattr(recommendation_system, 'packages_df') else 0
            except:
                pass
        
        return jsonify(stats), 200
        
    except Exception as e:
        return jsonify({
            'error': str(e)
        }), 500

if __name__ == '__main__':
    # Initialize system on startup
    logger.info("🚀 Starting ML Recommendation API Service...")
    
    # Initialize system in background (non-blocking)
    try:
        initialize_system()
    except Exception as e:
        logger.warning(f"⚠️ Could not initialize model on startup: {e}")
        logger.info("ℹ️ Model will be initialized on first request")
    
    # Get port from environment or default
    port = int(os.getenv('ML_API_PORT', 5000))
    
    # Check if debug mode should be enabled (only if explicitly set)
    debug_mode = os.getenv('ML_API_DEBUG', 'false').lower() == 'true'
    
    logger.info(f"📡 Server starting on port {port}")
    logger.info("📋 Available endpoints:")
    logger.info("   GET  /health - Health check")
    logger.info("   POST /extract-data - Extract data from MongoDB")
    logger.info("   POST /train - Train recommendation model")
    logger.info("   POST /extract-and-train - Extract data and train model")
    logger.info("   POST /recommendations - Get recommendations for user")
    logger.info("   GET  /stats - Get model statistics")
    
    # Run server (debug=False for production/automatic startup)
    app.run(host='0.0.0.0', port=port, debug=debug_mode, use_reloader=False)

