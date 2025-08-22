#!/usr/bin/env python3
"""
Enhanced Training Pipeline for ML Models
Integrates data pipeline with model training and evaluation
"""

import os
import sys
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.decomposition import TruncatedSVD, NMF
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import *
from data_pipeline import DataPipeline
from recommendation_model import RecommendationModel

# Configure logging
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ]
)
logger = logging.getLogger(__name__)

class TrainingPipeline:
    """
    Comprehensive training pipeline for recommendation models
    """
    
    def __init__(self):
        self.data_pipeline = DataPipeline()
        self.recommendation_model = None
        self.training_results = {}
        self.model_metadata = {}
        
    def prepare_training_data(self) -> Dict:
        """Prepare data for training"""
        logger.info("Preparing training data...")
        
        # Run data pipeline
        processed_data = self.data_pipeline.run_pipeline()
        
        # Validate data
        if processed_data['users'].empty or processed_data['packages'].empty:
            raise ValueError("Insufficient data for training")
        
        logger.info("Training data prepared successfully")
        return processed_data
    
    def train_content_based_model(self, packages_df: pd.DataFrame, tfidf_vectorizer) -> Dict:
        """Train content-based recommendation model"""
        logger.info("Training content-based model...")
        
        try:
            # Create content similarity matrix
            text_features = tfidf_vectorizer.transform(packages_df['combined_text'])
            content_similarity = text_features.dot(text_features.T).toarray()
            
            # Normalize similarity scores
            content_similarity = (content_similarity - content_similarity.min()) / (content_similarity.max() - content_similarity.min())
            
            results = {
                'content_similarity_matrix': content_similarity,
                'tfidf_vectorizer': tfidf_vectorizer,
                'package_ids': packages_df['_id'].tolist(),
                'training_date': datetime.now().isoformat()
            }
            
            logger.info("Content-based model trained successfully")
            return results
            
        except Exception as e:
            logger.error(f"Error training content-based model: {e}")
            raise
    
    def train_collaborative_model(self, user_item_matrix: pd.DataFrame) -> Dict:
        """Train collaborative filtering model"""
        logger.info("Training collaborative filtering model...")
        
        try:
            # Convert to numpy array
            matrix = user_item_matrix.values
            
            # Apply SVD for dimensionality reduction
            svd = TruncatedSVD(n_components=min(N_COMPONENTS, min(matrix.shape) - 1))
            matrix_reduced = svd.fit_transform(matrix)
            
            # Apply NMF for non-negative matrix factorization
            nmf = NMF(n_components=min(N_COMPONENTS, min(matrix.shape) - 1), random_state=42)
            nmf_matrix = nmf.fit_transform(matrix)
            
            results = {
                'collaborative_matrix': matrix,
                'collaborative_matrix_reduced': matrix_reduced,
                'nmf_matrix': nmf_matrix,
                'svd_model': svd,
                'nmf_model': nmf,
                'user_ids': user_item_matrix.index.tolist(),
                'item_ids': user_item_matrix.columns.tolist(),
                'training_date': datetime.now().isoformat()
            }
            
            logger.info("Collaborative filtering model trained successfully")
            return results
            
        except Exception as e:
            logger.error(f"Error training collaborative model: {e}")
            raise
    
    def train_clustering_model(self, user_item_matrix: pd.DataFrame) -> Dict:
        """Train user clustering model"""
        logger.info("Training clustering model...")
        
        try:
            # Use reduced collaborative matrix for clustering
            svd = TruncatedSVD(n_components=min(20, min(user_item_matrix.shape) - 1))
            matrix_reduced = svd.fit_transform(user_item_matrix.values)
            
            # Apply K-means clustering
            kmeans = KMeans(n_clusters=min(N_CLUSTERS, len(matrix_reduced)), random_state=42)
            clusters = kmeans.fit_predict(matrix_reduced)
            
            # Create user-cluster mapping
            user_clusters = pd.DataFrame({
                'user_id': user_item_matrix.index,
                'cluster': clusters
            })
            
            results = {
                'user_clusters': user_clusters,
                'kmeans_model': kmeans,
                'svd_model': svd,
                'training_date': datetime.now().isoformat()
            }
            
            logger.info("Clustering model trained successfully")
            return results
            
        except Exception as e:
            logger.error(f"Error training clustering model: {e}")
            raise
    
    def evaluate_models(self, training_data: Dict) -> Dict:
        """Evaluate model performance"""
        logger.info("Evaluating models...")
        
        evaluation_results = {}
        
        try:
            # Content-based evaluation (if we have user preferences)
            if 'user_item_matrix' in training_data and not training_data['user_item_matrix'].empty:
                matrix = training_data['user_item_matrix']
                
                # Simple evaluation using matrix sparsity
                sparsity = 1 - (matrix.values != 0).sum() / matrix.values.size
                evaluation_results['matrix_sparsity'] = sparsity
                evaluation_results['total_users'] = len(matrix)
                evaluation_results['total_items'] = len(matrix.columns)
                evaluation_results['total_interactions'] = (matrix.values != 0).sum()
            
            # Clustering evaluation
            if 'user_clusters' in training_data:
                clusters = training_data['user_clusters']
                evaluation_results['cluster_distribution'] = clusters['cluster'].value_counts().to_dict()
                evaluation_results['total_clusters'] = len(clusters['cluster'].unique())
            
            logger.info("Model evaluation completed")
            return evaluation_results
            
        except Exception as e:
            logger.error(f"Error evaluating models: {e}")
            return {}
    
    def save_models(self, models: Dict):
        """Save trained models to disk"""
        logger.info("Saving trained models...")
        
        try:
            # Save individual model components
            for model_name, model_data in models.items():
                if model_name == 'content_based':
                    joblib.dump(model_data['content_similarity_matrix'], 
                               os.path.join(MODEL_DIR, 'content_similarity_matrix.pkl'))
                    joblib.dump(model_data['tfidf_vectorizer'], 
                               os.path.join(MODEL_DIR, 'tfidf_vectorizer.pkl'))
                
                elif model_name == 'collaborative':
                    joblib.dump(model_data['collaborative_matrix'], 
                               os.path.join(MODEL_DIR, 'collaborative_matrix.pkl'))
                    joblib.dump(model_data['collaborative_matrix_reduced'], 
                               os.path.join(MODEL_DIR, 'collaborative_matrix_reduced.pkl'))
                    joblib.dump(model_data['svd_model'], 
                               os.path.join(MODEL_DIR, 'svd_model.pkl'))
                    joblib.dump(model_data['nmf_model'], 
                               os.path.join(MODEL_DIR, 'nmf_model.pkl'))
                
                elif model_name == 'clustering':
                    joblib.dump(model_data['user_clusters'], 
                               os.path.join(MODEL_DIR, 'user_clusters.pkl'))
                    joblib.dump(model_data['kmeans_model'], 
                               os.path.join(MODEL_DIR, 'kmeans_model.pkl'))
            
            # Save model metadata
            metadata = {
                'training_date': datetime.now().isoformat(),
                'model_versions': {
                    'content_based': '1.0',
                    'collaborative': '1.0',
                    'clustering': '1.0'
                },
                'parameters': {
                    'n_components': N_COMPONENTS,
                    'n_clusters': N_CLUSTERS,
                    'min_interactions': MIN_INTERACTIONS
                },
                'evaluation_results': self.training_results.get('evaluation', {})
            }
            
            with open(os.path.join(MODEL_DIR, 'model_metadata.json'), 'w') as f:
                json.dump(metadata, f, indent=2)
            
            logger.info("Models saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
            raise
    
    def run_training(self) -> Dict:
        """Run the complete training pipeline"""
        logger.info("Starting training pipeline...")
        
        try:
            # Step 1: Prepare data
            training_data = self.prepare_training_data()
            
            # Step 2: Train models
            models = {}
            
            # Train content-based model
            if 'tfidf_vectorizer' in training_data:
                models['content_based'] = self.train_content_based_model(
                    training_data['packages'], 
                    training_data['tfidf_vectorizer']
                )
            
            # Train collaborative filtering model
            if 'user_item_matrix' in training_data and not training_data['user_item_matrix'].empty:
                models['collaborative'] = self.train_collaborative_model(
                    training_data['user_item_matrix']
                )
            
            # Train clustering model
            if 'user_item_matrix' in training_data and not training_data['user_item_matrix'].empty:
                models['clustering'] = self.train_clustering_model(
                    training_data['user_item_matrix']
                )
            
            # Step 3: Evaluate models
            evaluation_results = self.evaluate_models(training_data)
            self.training_results['evaluation'] = evaluation_results
            
            # Step 4: Save models
            self.save_models(models)
            
            # Step 5: Create training summary
            training_summary = {
                'status': 'success',
                'training_date': datetime.now().isoformat(),
                'models_trained': list(models.keys()),
                'data_summary': {
                    'users': len(training_data['users']),
                    'packages': len(training_data['packages']),
                    'interactions': len(training_data['interactions'])
                },
                'evaluation_results': evaluation_results
            }
            
            logger.info("Training pipeline completed successfully!")
            return training_summary
            
        except Exception as e:
            logger.error(f"Error in training pipeline: {e}")
            return {
                'status': 'error',
                'error': str(e),
                'training_date': datetime.now().isoformat()
            }
    
    def test_recommendations(self, user_id: str = None) -> Dict:
        """Test recommendation generation"""
        logger.info("Testing recommendation generation...")
        
        try:
            # Initialize recommendation model
            self.recommendation_model = RecommendationModel()
            
            # Load trained models
            self.recommendation_model.load_models()
            
            # Test with a sample user or create dummy user
            if not user_id:
                # Get first user from database
                from pymongo import MongoClient
                client = MongoClient(MONGODB_URI)
                db = client[DB_NAME]
                user = db.users.find_one({'isEducator': False})
                user_id = str(user['_id']) if user else 'test_user'
                client.close()
            
            # Test different algorithms
            test_results = {}
            algorithms = ['content', 'collaborative', 'hybrid']
            
            for algorithm in algorithms:
                try:
                    recommendations = self.recommendation_model.get_recommendations(
                        user_id, "", algorithm, 5
                    )
                    test_results[algorithm] = {
                        'count': len(recommendations),
                        'status': 'success'
                    }
                except Exception as e:
                    test_results[algorithm] = {
                        'count': 0,
                        'status': 'error',
                        'error': str(e)
                    }
            
            logger.info("Recommendation testing completed")
            return test_results
            
        except Exception as e:
            logger.error(f"Error testing recommendations: {e}")
            return {'status': 'error', 'error': str(e)}

def main():
    """Main function to run the training pipeline"""
    print("=" * 60)
    print("AI Recommendation System - Training Pipeline")
    print("=" * 60)
    
    # Initialize training pipeline
    pipeline = TrainingPipeline()
    
    # Run training
    print("\n1. Starting model training...")
    training_results = pipeline.run_training()
    
    if training_results['status'] == 'success':
        print("\n✅ Training completed successfully!")
        print(f"Models trained: {', '.join(training_results['models_trained'])}")
        print(f"Data summary: {training_results['data_summary']}")
        
        # Test recommendations
        print("\n2. Testing recommendation generation...")
        test_results = pipeline.test_recommendations()
        
        if test_results.get('status') != 'error':
            print("✅ Recommendation testing completed!")
            for algo, result in test_results.items():
                print(f"  {algo}: {result['count']} recommendations generated")
        else:
            print(f"⚠️  Recommendation testing failed: {test_results.get('error')}")
    
    else:
        print(f"\n❌ Training failed: {training_results.get('error')}")
    
    print("\n" + "=" * 60)
    print("Training pipeline completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
