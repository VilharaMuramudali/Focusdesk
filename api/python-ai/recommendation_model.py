#!/usr/bin/env python3
"""
AI Recommendation Model for Educator/Package Recommendations
Uses collaborative filtering, content-based filtering, and hybrid approaches
"""

import os
import sys
import json
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import List, Dict, Tuple, Optional
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import NMF, TruncatedSVD
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.ensemble import RandomForestRegressor
import joblib
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class RecommendationModel:
    """
    AI-powered recommendation system for educators and packages
    """
    
    def __init__(self, model_dir: str = "models"):
        self.model_dir = model_dir
        self.mongo_client = None
        self.db = None
        
        # Model components
        self.tfidf_vectorizer = None
        self.content_similarity_matrix = None
        self.collaborative_matrix = None
        self.user_clusters = None
        self.scaler = StandardScaler()
        
        # Data storage
        self.users_df = None
        self.packages_df = None
        self.interactions_df = None
        self.sessions_df = None
        
        # Model parameters
        self.n_components = 50
        self.n_clusters = 10
        self.min_interactions = 3
        
        # Create model directory
        os.makedirs(model_dir, exist_ok=True)
        
    def connect_mongodb(self):
        """Connect to MongoDB database"""
        try:
            mongo_uri = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
            self.mongo_client = MongoClient(mongo_uri)
            self.db = self.mongo_client[os.getenv("DB_NAME", "focusdesk")]
            logger.info("Connected to MongoDB successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def load_data(self):
        """Load all necessary data from MongoDB"""
        logger.info("Loading data from MongoDB...")
        
        try:
            # Load users
            users_collection = self.db.users
            users_data = list(users_collection.find({}, {
                '_id': 1, 'username': 1, 'email': 1, 'isEducator': 1,
                'subjects': 1, 'bio': 1, 'educationLevel': 1,
                'learningPreferences': 1, 'teachingProfile': 1,
                'aiFeatures': 1, 'country': 1, 'createdAt': 1
            }))
            self.users_df = pd.DataFrame(users_data)
            
            # Load packages
            packages_collection = self.db.packages
            packages_data = list(packages_collection.find({}, {
                '_id': 1, 'title': 1, 'desc': 1, 'price': 1,
                'educatorId': 1, 'subjects': 1, 'level': 1,
                'duration': 1, 'rating': 1, 'totalOrders': 1
            }))
            self.packages_df = pd.DataFrame(packages_data)
            
            # Load interactions
            interactions_collection = self.db.userinteractions
            interactions_data = list(interactions_collection.find({}, {
                'userId': 1, 'targetId': 1, 'packageId': 1,
                'interactionType': 1, 'context': 1, 'metadata': 1,
                'createdAt': 1
            }))
            self.interactions_df = pd.DataFrame(interactions_data)
            
            # Load sessions
            sessions_collection = self.db.sessionhistories
            sessions_data = list(sessions_collection.find({}, {
                'userId': 1, 'educatorId': 1, 'sessionData': 1,
                'performance': 1, 'feedback': 1, 'createdAt': 1
            }))
            self.sessions_df = pd.DataFrame(sessions_data)
            
            logger.info(f"Loaded {len(self.users_df)} users, {len(self.packages_df)} packages, "
                       f"{len(self.interactions_df)} interactions, {len(self.sessions_df)} sessions")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def preprocess_data(self):
        """Preprocess and clean the data"""
        logger.info("Preprocessing data...")
        
        # Process users data
        if not self.users_df.empty:
            self.users_df['user_id'] = self.users_df['_id'].astype(str)
            self.users_df['is_educator'] = self.users_df['isEducator'].fillna(False)
            self.users_df['subjects'] = self.users_df['subjects'].fillna([])
            self.users_df['bio'] = self.users_df['bio'].fillna('')
            
            # Extract learning preferences
            self.users_df['learning_style'] = self.users_df['learningPreferences'].apply(
                lambda x: x.get('learningStyle', 'visual') if x else 'visual'
            )
            self.users_df['academic_level'] = self.users_df['learningPreferences'].apply(
                lambda x: x.get('academicLevel', 'university') if x else 'university'
            )
            
            # Extract teaching profile
            self.users_df['avg_rating'] = self.users_df['teachingProfile'].apply(
                lambda x: x.get('averageRating', 0) if x else 0
            )
            self.users_df['total_sessions'] = self.users_df['teachingProfile'].apply(
                lambda x: x.get('totalSessions', 0) if x else 0
            )
            self.users_df['response_time'] = self.users_df['teachingProfile'].apply(
                lambda x: x.get('responseTimeHours', 24) if x else 24
            )
        
        # Process packages data
        if not self.packages_df.empty:
            self.packages_df['package_id'] = self.packages_df['_id'].astype(str)
            self.packages_df['educator_id'] = self.packages_df['educatorId'].astype(str)
            self.packages_df['title'] = self.packages_df['title'].fillna('')
            self.packages_df['desc'] = self.packages_df['desc'].fillna('')
            self.packages_df['subjects'] = self.packages_df['subjects'].fillna([])
            self.packages_df['price'] = self.packages_df['price'].fillna(0)
            self.packages_df['rating'] = self.packages_df['rating'].fillna(0)
            self.packages_df['total_orders'] = self.packages_df['totalOrders'].fillna(0)
        
        # Process interactions data
        if not self.interactions_df.empty:
            self.interactions_df['user_id'] = self.interactions_df['userId'].astype(str)
            self.interactions_df['target_id'] = self.interactions_df['targetId'].astype(str)
            self.interactions_df['package_id'] = self.interactions_df['packageId'].astype(str)
            
            # Calculate interaction weights
            interaction_weights = {
                'view': 1, 'click': 2, 'bookmark': 3, 'share': 2,
                'message': 5, 'book': 10, 'cancel': -2
            }
            self.interactions_df['weight'] = self.interactions_df['interactionType'].map(
                lambda x: interaction_weights.get(x, 1)
            )
        
        # Process sessions data
        if not self.sessions_df.empty:
            self.sessions_df['user_id'] = self.sessions_df['userId'].astype(str)
            self.sessions_df['educator_id'] = self.sessions_df['educatorId'].astype(str)
            self.sessions_df['subject'] = self.sessions_df['sessionData'].apply(
                lambda x: x.get('subject', '') if x else ''
            )
            self.sessions_df['duration'] = self.sessions_df['sessionData'].apply(
                lambda x: x.get('duration', 0) if x else 0
            )
            self.sessions_df['student_rating'] = self.sessions_df['performance'].apply(
                lambda x: x.get('studentRating', 0) if x else 0
            )
        
        logger.info("Data preprocessing completed")
    
    def build_content_features(self):
        """Build content-based features for educators and packages"""
        logger.info("Building content-based features...")
        
        # Combine educator and package text features
        educator_features = []
        package_features = []
        
        for _, user in self.users_df[self.users_df['is_educator']].iterrows():
            # Educator features
            subjects = ' '.join(user['subjects']) if user['subjects'] else ''
            bio = user['bio']
            education_level = user['educationLevel'] or ''
            learning_style = user['learning_style']
            academic_level = user['academic_level']
            
            educator_text = f"{subjects} {bio} {education_level} {learning_style} {academic_level}"
            educator_features.append({
                'educator_id': user['user_id'],
                'text': educator_text,
                'subjects': user['subjects'],
                'avg_rating': user['avg_rating'],
                'total_sessions': user['total_sessions'],
                'response_time': user['response_time']
            })
        
        for _, package in self.packages_df.iterrows():
            # Package features
            title = package['title']
            desc = package['desc']
            subjects = ' '.join(package['subjects']) if package['subjects'] else ''
            level = package.get('level', '')
            
            package_text = f"{title} {desc} {subjects} {level}"
            package_features.append({
                'package_id': package['package_id'],
                'educator_id': package['educator_id'],
                'text': package_text,
                'subjects': package['subjects'],
                'price': package['price'],
                'rating': package['rating'],
                'total_orders': package['total_orders']
            })
        
        # Create TF-IDF vectors
        educator_texts = [f['text'] for f in educator_features]
        package_texts = [f['text'] for f in package_features]
        
        self.tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Fit on combined text
        all_texts = educator_texts + package_texts
        tfidf_matrix = self.tfidf_vectorizer.fit_transform(all_texts)
        
        # Split back to educator and package matrices
        n_educators = len(educator_features)
        self.educator_tfidf = tfidf_matrix[:n_educators]
        self.package_tfidf = tfidf_matrix[n_educators:]
        
        # Store feature data
        self.educator_features = educator_features
        self.package_features = package_features
        
        logger.info(f"Built content features for {len(educator_features)} educators and {len(package_features)} packages")
    
    def build_collaborative_matrix(self):
        """Build collaborative filtering matrix from user interactions"""
        logger.info("Building collaborative filtering matrix...")
        
        if self.interactions_df.empty:
            logger.warning("No interactions data available for collaborative filtering")
            return
        
        # Create user-item interaction matrix
        interaction_matrix = self.interactions_df.groupby(['user_id', 'package_id'])['weight'].sum().reset_index()
        
        # Pivot to create matrix
        self.collaborative_matrix = interaction_matrix.pivot(
            index='user_id', 
            columns='package_id', 
            values='weight'
        ).fillna(0)
        
        # Apply dimensionality reduction
        svd = TruncatedSVD(n_components=min(self.n_components, self.collaborative_matrix.shape[1]))
        self.collaborative_matrix_reduced = svd.fit_transform(self.collaborative_matrix)
        
        logger.info(f"Built collaborative matrix with shape {self.collaborative_matrix.shape}")
    
    def cluster_users(self):
        """Cluster users based on their preferences and behavior"""
        logger.info("Clustering users...")
        
        if self.users_df.empty:
            logger.warning("No users data available for clustering")
            return
        
        # Create user feature matrix
        user_features = []
        user_ids = []
        
        for _, user in self.users_df.iterrows():
            features = [
                user['avg_rating'],
                user['total_sessions'],
                user['response_time'],
                len(user['subjects']) if user['subjects'] else 0,
                1 if user['is_educator'] else 0
            ]
            user_features.append(features)
            user_ids.append(user['user_id'])
        
        # Scale features
        user_features_scaled = self.scaler.fit_transform(user_features)
        
        # Apply clustering
        kmeans = KMeans(n_clusters=self.n_clusters, random_state=42)
        clusters = kmeans.fit_predict(user_features_scaled)
        
        self.user_clusters = dict(zip(user_ids, clusters))
        
        logger.info(f"Clustered {len(user_ids)} users into {self.n_clusters} groups")
    
    def train_models(self):
        """Train all recommendation models"""
        logger.info("Training recommendation models...")
        
        try:
            # Connect to database
            self.connect_mongodb()
            
            # Load and preprocess data
            self.load_data()
            self.preprocess_data()
            
            # Build features
            self.build_content_features()
            self.build_collaborative_matrix()
            self.cluster_users()
            
            # Save models
            self.save_models()
            
            logger.info("All models trained successfully!")
            
        except Exception as e:
            logger.error(f"Error training models: {e}")
            raise
        finally:
            if self.mongo_client:
                self.mongo_client.close()
    
    def get_content_based_recommendations(self, user_id: str, query: str = "", limit: int = 10) -> List[Dict]:
        """Get content-based recommendations"""
        try:
            # Get user preferences
            user = self.users_df[self.users_df['user_id'] == user_id]
            if user.empty:
                return []
            
            user = user.iloc[0]
            
            # Create user query vector
            if query:
                user_query = f"{query} {' '.join(user['subjects'])} {user['learning_style']} {user['academic_level']}"
            else:
                user_query = f"{' '.join(user['subjects'])} {user['learning_style']} {user['academic_level']}"
            
            query_vector = self.tfidf_vectorizer.transform([user_query])
            
            # Calculate similarities with packages
            package_similarities = cosine_similarity(query_vector, self.package_tfidf).flatten()
            
            # Get top packages
            top_indices = np.argsort(package_similarities)[::-1][:limit]
            
            recommendations = []
            for idx in top_indices:
                package = self.package_features[idx]
                educator = self.users_df[self.users_df['user_id'] == package['educator_id']]
                
                if not educator.empty:
                    educator = educator.iloc[0]
                    recommendations.append({
                        'package_id': package['package_id'],
                        'educator_id': package['educator_id'],
                        'educator_name': educator['username'],
                        'package_title': package.get('title', ''),
                        'subjects': package['subjects'],
                        'price': package['price'],
                        'rating': package['rating'],
                        'similarity_score': float(package_similarities[idx]),
                        'recommendation_type': 'content_based',
                        'explanation': f"Matches your interest in {', '.join(package['subjects'])} and {user['learning_style']} learning style"
                    })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in content-based recommendations: {e}")
            return []
    
    def get_collaborative_recommendations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get collaborative filtering recommendations"""
        try:
            if user_id not in self.collaborative_matrix.index:
                return []
            
            # Get user vector
            user_idx = self.collaborative_matrix.index.get_loc(user_id)
            user_vector = self.collaborative_matrix_reduced[user_idx].reshape(1, -1)
            
            # Calculate similarities with other users
            user_similarities = cosine_similarity(user_vector, self.collaborative_matrix_reduced).flatten()
            
            # Get similar users
            similar_users = np.argsort(user_similarities)[::-1][1:6]  # Top 5 similar users
            
            # Get packages liked by similar users
            package_scores = {}
            for similar_user_idx in similar_users:
                similar_user_id = self.collaborative_matrix.index[similar_user_idx]
                similarity = user_similarities[similar_user_idx]
                
                # Get packages this user interacted with
                user_packages = self.collaborative_matrix.loc[similar_user_id]
                for package_id, score in user_packages.items():
                    if score > 0:  # Only positive interactions
                        if package_id not in package_scores:
                            package_scores[package_id] = 0
                        package_scores[package_id] += score * similarity
            
            # Sort packages by score
            sorted_packages = sorted(package_scores.items(), key=lambda x: x[1], reverse=True)
            
            recommendations = []
            for package_id, score in sorted_packages[:limit]:
                package = self.packages_df[self.packages_df['package_id'] == package_id]
                if not package.empty:
                    package = package.iloc[0]
                    educator = self.users_df[self.users_df['user_id'] == package['educator_id']]
                    
                    if not educator.empty:
                        educator = educator.iloc[0]
                        recommendations.append({
                            'package_id': package_id,
                            'educator_id': package['educator_id'],
                            'educator_name': educator['username'],
                            'package_title': package['title'],
                            'subjects': package['subjects'],
                            'price': package['price'],
                            'rating': package['rating'],
                            'similarity_score': float(score),
                            'recommendation_type': 'collaborative',
                            'explanation': f"Recommended by students with similar preferences"
                        })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in collaborative recommendations: {e}")
            return []
    
    def get_hybrid_recommendations(self, user_id: str, query: str = "", limit: int = 10) -> List[Dict]:
        """Get hybrid recommendations combining content and collaborative filtering"""
        try:
            # Get both types of recommendations
            content_recs = self.get_content_based_recommendations(user_id, query, limit * 2)
            collaborative_recs = self.get_collaborative_recommendations(user_id, limit * 2)
            
            # Combine and score
            package_scores = {}
            
            # Add content-based scores
            for rec in content_recs:
                package_id = rec['package_id']
                if package_id not in package_scores:
                    package_scores[package_id] = {'score': 0, 'rec': rec}
                package_scores[package_id]['score'] += rec['similarity_score'] * 0.6  # Content weight
            
            # Add collaborative scores
            for rec in collaborative_recs:
                package_id = rec['package_id']
                if package_id not in package_scores:
                    package_scores[package_id] = {'score': 0, 'rec': rec}
                package_scores[package_id]['score'] += rec['similarity_score'] * 0.4  # Collaborative weight
            
            # Sort by combined score
            sorted_packages = sorted(package_scores.items(), key=lambda x: x[1]['score'], reverse=True)
            
            recommendations = []
            for package_id, data in sorted_packages[:limit]:
                rec = data['rec']
                rec['similarity_score'] = data['score']
                rec['recommendation_type'] = 'hybrid'
                rec['explanation'] = f"AI-optimized recommendation based on your preferences and similar students' choices"
                recommendations.append(rec)
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in hybrid recommendations: {e}")
            return []
    
    def get_cluster_based_recommendations(self, user_id: str, limit: int = 10) -> List[Dict]:
        """Get recommendations based on user clustering"""
        try:
            if user_id not in self.user_clusters:
                return []
            
            user_cluster = self.user_clusters[user_id]
            
            # Get other users in the same cluster
            cluster_users = [uid for uid, cluster in self.user_clusters.items() if cluster == user_cluster and uid != user_id]
            
            # Get popular packages in this cluster
            cluster_packages = {}
            for cluster_user in cluster_users[:10]:  # Limit to top 10 users in cluster
                if cluster_user in self.collaborative_matrix.index:
                    user_packages = self.collaborative_matrix.loc[cluster_user]
                    for package_id, score in user_packages.items():
                        if score > 0:
                            if package_id not in cluster_packages:
                                cluster_packages[package_id] = 0
                            cluster_packages[package_id] += score
            
            # Sort packages by popularity in cluster
            sorted_packages = sorted(cluster_packages.items(), key=lambda x: x[1], reverse=True)
            
            recommendations = []
            for package_id, score in sorted_packages[:limit]:
                package = self.packages_df[self.packages_df['package_id'] == package_id]
                if not package.empty:
                    package = package.iloc[0]
                    educator = self.users_df[self.users_df['user_id'] == package['educator_id']]
                    
                    if not educator.empty:
                        educator = educator.iloc[0]
                        recommendations.append({
                            'package_id': package_id,
                            'educator_id': package['educator_id'],
                            'educator_name': educator['username'],
                            'package_title': package['title'],
                            'subjects': package['subjects'],
                            'price': package['price'],
                            'rating': package['rating'],
                            'similarity_score': float(score),
                            'recommendation_type': 'cluster_based',
                            'explanation': f"Popular among students with similar learning patterns"
                        })
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error in cluster-based recommendations: {e}")
            return []
    
    def get_recommendations(self, user_id: str, query: str = "", algorithm: str = "hybrid", limit: int = 10) -> List[Dict]:
        """Main method to get recommendations"""
        try:
            if algorithm == "content":
                return self.get_content_based_recommendations(user_id, query, limit)
            elif algorithm == "collaborative":
                return self.get_collaborative_recommendations(user_id, limit)
            elif algorithm == "cluster":
                return self.get_cluster_based_recommendations(user_id, limit)
            elif algorithm == "hybrid":
                return self.get_hybrid_recommendations(user_id, query, limit)
            else:
                logger.warning(f"Unknown algorithm: {algorithm}, using hybrid")
                return self.get_hybrid_recommendations(user_id, query, limit)
                
        except Exception as e:
            logger.error(f"Error getting recommendations: {e}")
            return []
    
    def save_models(self):
        """Save trained models to disk"""
        try:
            # Save TF-IDF vectorizer
            joblib.dump(self.tfidf_vectorizer, os.path.join(self.model_dir, 'tfidf_vectorizer.pkl'))
            
            # Save collaborative matrix
            joblib.dump(self.collaborative_matrix, os.path.join(self.model_dir, 'collaborative_matrix.pkl'))
            joblib.dump(self.collaborative_matrix_reduced, os.path.join(self.model_dir, 'collaborative_matrix_reduced.pkl'))
            
            # Save user clusters
            joblib.dump(self.user_clusters, os.path.join(self.model_dir, 'user_clusters.pkl'))
            
            # Save scaler
            joblib.dump(self.scaler, os.path.join(self.model_dir, 'scaler.pkl'))
            
            # Save feature data
            joblib.dump(self.educator_features, os.path.join(self.model_dir, 'educator_features.pkl'))
            joblib.dump(self.package_features, os.path.join(self.model_dir, 'package_features.pkl'))
            
            logger.info("Models saved successfully")
            
        except Exception as e:
            logger.error(f"Error saving models: {e}")
            raise
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            # Load TF-IDF vectorizer
            self.tfidf_vectorizer = joblib.load(os.path.join(self.model_dir, 'tfidf_vectorizer.pkl'))
            
            # Load collaborative matrix
            self.collaborative_matrix = joblib.load(os.path.join(self.model_dir, 'collaborative_matrix.pkl'))
            self.collaborative_matrix_reduced = joblib.load(os.path.join(self.model_dir, 'collaborative_matrix_reduced.pkl'))
            
            # Load user clusters
            self.user_clusters = joblib.load(os.path.join(self.model_dir, 'user_clusters.pkl'))
            
            # Load scaler
            self.scaler = joblib.load(os.path.join(self.model_dir, 'scaler.pkl'))
            
            # Load feature data
            self.educator_features = joblib.load(os.path.join(self.model_dir, 'educator_features.pkl'))
            self.package_features = joblib.load(os.path.join(self.model_dir, 'package_features.pkl'))
            
            logger.info("Models loaded successfully")
            
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            raise
    
    def update_user_interaction(self, user_id: str, package_id: str, interaction_type: str):
        """Update the model with new user interaction"""
        try:
            # This would typically update the database and retrain the model
            # For now, we'll just log the interaction
            logger.info(f"New interaction: User {user_id} {interaction_type} package {package_id}")
            
            # In a production system, you would:
            # 1. Add the interaction to the database
            # 2. Periodically retrain the model
            # 3. Or use online learning techniques
            
        except Exception as e:
            logger.error(f"Error updating interaction: {e}")

# Flask API for serving recommendations
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Global model instance
model = None

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model_loaded': model is not None})

@app.route('/recommendations', methods=['POST'])
def get_recommendations():
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
            'total_count': len(recommendations)
        })
        
    except Exception as e:
        logger.error(f"API error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train_model():
    try:
        global model
        model = RecommendationModel()
        model.train_models()
        return jsonify({'success': True, 'message': 'Model trained successfully'})
        
    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/load', methods=['POST'])
def load_model():
    try:
        global model
        model = RecommendationModel()
        model.load_models()
        return jsonify({'success': True, 'message': 'Model loaded successfully'})
        
    except Exception as e:
        logger.error(f"Loading error: {e}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Load model on startup
    try:
        model = RecommendationModel()
        model.load_models()
        logger.info("Model loaded successfully")
    except Exception as e:
        logger.warning(f"Could not load model: {e}")
    
    # Run Flask app
    app.run(host='0.0.0.0', port=5000, debug=True)
