#!/usr/bin/env python3
"""
Startup script for the AI Recommendation Service
Handles model training, loading, and service startup
"""

import os
import sys
import logging
import subprocess
import time
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def check_dependencies():
    """Check if all required Python packages are installed"""
    required_packages = [
        'flask', 'flask-cors', 'numpy', 'pandas', 'scikit-learn',
        'pymongo', 'python-dotenv', 'joblib'
    ]
    
    missing_packages = []
    
    for package in required_packages:
        try:
            __import__(package.replace('-', '_'))
        except ImportError:
            missing_packages.append(package)
    
    if missing_packages:
        logger.error(f"Missing packages: {missing_packages}")
        logger.info("Install missing packages with: pip install -r requirements.txt")
        return False
    
    logger.info("All dependencies are installed")
    return True

def check_mongodb_connection():
    """Check if MongoDB is accessible"""
    try:
        from pymongo import MongoClient
        from dotenv import load_dotenv
        
        load_dotenv()
        
        mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        client.admin.command('ping')
        logger.info("MongoDB connection successful")
        return True
        
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return False

def train_model_if_needed():
    """Train the model if no trained model exists"""
    try:
        from recommendation_model import RecommendationModel
        
        model_dir = Path("models")
        model_files = [
            "tfidf_vectorizer.pkl",
            "collaborative_matrix.pkl",
            "user_clusters.pkl"
        ]
        
        # Check if model files exist
        model_exists = all((model_dir / file).exists() for file in model_files)
        
        if not model_exists:
            logger.info("No trained model found. Starting model training...")
            
            model = RecommendationModel()
            model.train_models()
            
            logger.info("Model training completed successfully")
        else:
            logger.info("Trained model found")
            
        return True
        
    except Exception as e:
        logger.error(f"Model training failed: {e}")
        return False

def start_service():
    """Start the Flask service"""
    try:
        logger.info("Starting AI Recommendation Service...")
        
        # Set environment variables
        os.environ['FLASK_APP'] = 'app.py'
        os.environ['FLASK_ENV'] = 'production'
        
        # Start the Flask app
        from app import app
        
        port = int(os.getenv('AI_SERVICE_PORT', 5000))
        app.run(host='0.0.0.0', port=port, debug=False)
        
    except Exception as e:
        logger.error(f"Failed to start service: {e}")
        return False

def main():
    """Main startup function"""
    logger.info("=== AI Recommendation Service Startup ===")
    
    # Check dependencies
    if not check_dependencies():
        logger.error("Dependency check failed. Exiting.")
        sys.exit(1)
    
    # Check MongoDB connection
    if not check_mongodb_connection():
        logger.warning("MongoDB connection failed. Service may not work properly.")
    
    # Train model if needed
    if not train_model_if_needed():
        logger.error("Model training failed. Exiting.")
        sys.exit(1)
    
    # Start service
    logger.info("All checks passed. Starting service...")
    start_service()

if __name__ == "__main__":
    main()
