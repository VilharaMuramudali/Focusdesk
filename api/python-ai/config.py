#!/usr/bin/env python3
"""
Configuration file for ML Training Pipeline
Centralized settings for the AI recommendation system
"""

import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent

# MongoDB Configuration
MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://vilhara_muramudali:QmQsiEjLEOxX5adE@vilieapi.skpkcb8.mongodb.net/FocusDesk?retryWrites=true&w=majority&appName=vilieAPi")
DB_NAME = os.getenv("DB_NAME", "FocusDesk")

# AI Service Configuration
AI_SERVICE_PORT = int(os.getenv("AI_SERVICE_PORT", 5000))
AI_SERVICE_HOST = os.getenv("AI_SERVICE_HOST", "0.0.0.0")

# Model Configuration
MODEL_DIR = os.path.join(BASE_DIR, "models")
N_COMPONENTS = int(os.getenv("N_COMPONENTS", 50))  # For SVD
N_CLUSTERS = int(os.getenv("N_CLUSTERS", 10))      # For K-means
MIN_INTERACTIONS = int(os.getenv("MIN_INTERACTIONS", 3))

# Training Configuration
BATCH_SIZE = int(os.getenv("BATCH_SIZE", 1000))
TRAINING_EPOCHS = int(os.getenv("TRAINING_EPOCHS", 10))
LEARNING_RATE = float(os.getenv("LEARNING_RATE", 0.001))

# Feature Engineering
MAX_FEATURES = int(os.getenv("MAX_FEATURES", 1000))  # TF-IDF features
MIN_DF = int(os.getenv("MIN_DF", 2))                 # Minimum document frequency
MAX_DF = float(os.getenv("MAX_DF", 0.95))           # Maximum document frequency

# Recommendation Configuration
DEFAULT_LIMIT = int(os.getenv("DEFAULT_LIMIT", 10))
MAX_LIMIT = int(os.getenv("MAX_LIMIT", 50))

# Logging Configuration
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE = os.path.join(BASE_DIR, "logs", "training.log")

# Cache Configuration
CACHE_TTL = int(os.getenv("CACHE_TTL", 3600))  # 1 hour
CACHE_SIZE = int(os.getenv("CACHE_SIZE", 1000))

# Model Performance Thresholds
MIN_SIMILARITY_SCORE = float(os.getenv("MIN_SIMILARITY_SCORE", 0.1))
MIN_RATING_THRESHOLD = float(os.getenv("MIN_RATING_THRESHOLD", 3.0))
MIN_INTERACTION_COUNT = int(os.getenv("MIN_INTERACTION_COUNT", 5))

# Feature Weights for Hybrid Recommendations
CONTENT_WEIGHT = float(os.getenv("CONTENT_WEIGHT", 0.4))
COLLABORATIVE_WEIGHT = float(os.getenv("COLLABORATIVE_WEIGHT", 0.6))

# Data Processing
TEXT_COLUMNS = ['title', 'desc', 'bio', 'subjects']
NUMERICAL_COLUMNS = ['price', 'rating', 'totalOrders', 'totalSessions']
CATEGORICAL_COLUMNS = ['level', 'learningStyle', 'teachingStyle', 'academicLevel']

# Model File Names
MODEL_FILES = {
    'tfidf_vectorizer': 'tfidf_vectorizer.pkl',
    'collaborative_matrix': 'collaborative_matrix.pkl',
    'collaborative_matrix_reduced': 'collaborative_matrix_reduced.pkl',
    'user_clusters': 'user_clusters.pkl',
    'scaler': 'scaler.pkl',
    'educator_features': 'educator_features.pkl',
    'package_features': 'package_features.pkl',
    'model_metadata': 'model_metadata.json'
}

# Create necessary directories
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "logs"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "data"), exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "cache"), exist_ok=True)
