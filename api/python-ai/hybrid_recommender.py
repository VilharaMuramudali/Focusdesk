"""
FocusDesk Hybrid Recommendation System
Combines Collaborative Filtering and Content-Based Filtering
"""

import sys
import json
import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from sklearn.metrics.pairwise import cosine_similarity
import pickle
import os
from pathlib import Path

class HybridRecommender:
    """
    Hybrid recommendation system combining collaborative and content-based filtering.
    """
    
    def __init__(self, model_dir='models'):
        """Initialize the recommender with model directory."""
        self.model_dir = Path(__file__).parent / model_dir
        self.model_dir.mkdir(exist_ok=True)
        
        # Model components
        self.svd = None
        self.interaction_matrix = None
        self.predicted_scores_df = None
        self.content_similarity_df = None
        self.packages_df = None
        
        # Event weights
        self.event_weights = {
            'booking': 1.0,
            'start_booking': 1.0,
            'click': 0.2,
            'view': 0.05,
            'search': 0.05,
            'rating': 0.3,
            'message': 0.05
        }
        
    def train(self, users_df, packages_df, events_df):
        """
        Train the hybrid recommendation model.
        
        Parameters:
        -----------
        users_df : DataFrame with user data
        packages_df : DataFrame with package data (must have text_embedding column)
        events_df : DataFrame with user interaction events
        """
        print("Training Hybrid Recommendation Model...")
        
        # Store packages data
        self.packages_df = packages_df.copy()
        
        # 1. Parse text embeddings
        print("  [1/4] Parsing text embeddings...")
        if 'text_embedding' in packages_df.columns:
            packages_df['embedding_vector'] = packages_df['text_embedding'].apply(
                lambda x: np.array(json.loads(x)) if isinstance(x, str) else np.array(x)
            )
        else:
            # Create dummy embeddings if not available
            packages_df['embedding_vector'] = [np.random.randn(16) for _ in range(len(packages_df))]
        
        # 2. Build interaction matrix
        print("  [2/4] Building interaction matrix...")
        events_df['weight'] = events_df['event_type'].map(self.event_weights).fillna(0.05)
        interaction_scores = events_df.groupby(['user_id', 'package_id'])['weight'].sum().reset_index()
        interaction_scores.columns = ['user_id', 'package_id', 'score']
        
        self.interaction_matrix = interaction_scores.pivot(
            index='user_id',
            columns='package_id',
            values='score'
        ).fillna(0)
        
        # 3. Train collaborative filtering (SVD)
        print("  [3/4] Training collaborative filtering model...")
        self.svd = TruncatedSVD(n_components=min(20, self.interaction_matrix.shape[1] - 1), random_state=42)
        user_factors = self.svd.fit_transform(self.interaction_matrix)
        package_factors = self.svd.components_.T
        
        predicted_scores = np.dot(user_factors, package_factors.T)
        self.predicted_scores_df = pd.DataFrame(
            predicted_scores,
            index=self.interaction_matrix.index,
            columns=self.interaction_matrix.columns
        )
        
        # 4. Build content-based similarity
        print("  [4/4] Computing content similarity...")
        embedding_matrix = np.vstack(packages_df['embedding_vector'].values)
        content_similarity = cosine_similarity(embedding_matrix)
        self.content_similarity_df = pd.DataFrame(
            content_similarity,
            index=packages_df['package_id'],
            columns=packages_df['package_id']
        )
        
        print(f"✓ Model trained successfully!")
        print(f"  - Users: {len(self.interaction_matrix)}")
        print(f"  - Packages: {len(packages_df)}")
        print(f"  - Interactions: {len(events_df)}")
        
    def save_model(self):
        """Save trained model to disk."""
        model_path = self.model_dir / 'hybrid_model.pkl'
        model_data = {
            'svd': self.svd,
            'interaction_matrix': self.interaction_matrix,
            'predicted_scores_df': self.predicted_scores_df,
            'content_similarity_df': self.content_similarity_df,
            'packages_df': self.packages_df,
            'event_weights': self.event_weights
        }
        
        with open(model_path, 'wb') as f:
            pickle.dump(model_data, f)
        
        print(f"✓ Model saved to {model_path}")
        
    def load_model(self):
        """Load trained model from disk."""
        model_path = self.model_dir / 'hybrid_model.pkl'
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model not found at {model_path}. Train the model first.")
        
        with open(model_path, 'rb') as f:
            model_data = pickle.load(f)
        
        self.svd = model_data['svd']
        self.interaction_matrix = model_data['interaction_matrix']
        self.predicted_scores_df = model_data['predicted_scores_df']
        self.content_similarity_df = model_data['content_similarity_df']
        self.packages_df = model_data['packages_df']
        self.event_weights = model_data['event_weights']
        
        print(f"✓ Model loaded from {model_path}")
        
    def recommend(self, user_id, n=5, collaborative_weight=0.6, content_weight=0.4):
        """
        Get hybrid recommendations for a user.
        
        Parameters:
        -----------
        user_id : str
            User ID to get recommendations for
        n : int
            Number of recommendations to return
        collaborative_weight : float
            Weight for collaborative filtering (default: 0.6)
        content_weight : float
            Weight for content-based filtering (default: 0.4)
            
        Returns:
        --------
        list of dict with package recommendations
        """
        # Check if user exists
        if user_id not in self.predicted_scores_df.index:
            # New user - use popularity-based recommendations
            return self._get_popular_packages(n)
        
        # Get collaborative scores
        user_predictions = self.predicted_scores_df.loc[user_id]
        
        # Get packages user already interacted with
        interacted_packages = self.interaction_matrix.loc[user_id]
        already_interacted = interacted_packages[interacted_packages > 0].index.tolist()
        
        # Get content-based scores
        if len(already_interacted) > 0:
            last_package_id = interacted_packages[interacted_packages > 0].idxmax()
            if last_package_id in self.content_similarity_df.index:
                content_scores = self.content_similarity_df[last_package_id]
            else:
                content_scores = pd.Series(0, index=self.content_similarity_df.index)
        else:
            content_scores = pd.Series(0, index=user_predictions.index)
            content_weight = 0
            collaborative_weight = 1.0
        
        # Normalize scores
        collab_min, collab_max = user_predictions.min(), user_predictions.max()
        if collab_max > collab_min:
            collab_normalized = (user_predictions - collab_min) / (collab_max - collab_min)
        else:
            collab_normalized = user_predictions
        
        content_min, content_max = content_scores.min(), content_scores.max()
        if content_max > content_min:
            content_normalized = (content_scores - content_min) / (content_max - content_min)
        else:
            content_normalized = content_scores
        
        # Combine scores
        common_packages = collab_normalized.index.intersection(content_normalized.index)
        hybrid_scores = (
            collaborative_weight * collab_normalized[common_packages] +
            content_weight * content_normalized[common_packages]
        )
        
        # Filter out already interacted packages
        uninteracted_scores = hybrid_scores[~hybrid_scores.index.isin(already_interacted)]
        
        # Get top N recommendations
        top_recommendations = uninteracted_scores.sort_values(ascending=False).head(n)
        
        # Format results
        results = []
        for package_id, score in top_recommendations.items():
            package_info = self.packages_df[self.packages_df['package_id'] == package_id]
            if not package_info.empty:
                results.append({
                    'packageId': str(package_id),
                    'score': float(score),
                    'title': package_info.iloc[0].get('title', ''),
                    'subject': package_info.iloc[0].get('subject', ''),
                    'recommendationType': 'hybrid'
                })
        
        return results
    
    def get_similar_packages(self, package_id, n=5):
        """
        Get similar packages based on content similarity.
        
        Parameters:
        -----------
        package_id : str
            Package ID to find similar packages for
        n : int
            Number of similar packages to return
            
        Returns:
        --------
        list of dict with similar packages
        """
        if package_id not in self.content_similarity_df.index:
            return []
        
        similarities = self.content_similarity_df[package_id].sort_values(ascending=False)
        similar_packages = similarities[similarities.index != package_id].head(n)
        
        results = []
        for pkg_id, similarity in similar_packages.items():
            package_info = self.packages_df[self.packages_df['package_id'] == pkg_id]
            if not package_info.empty:
                results.append({
                    'packageId': str(pkg_id),
                    'similarity': float(similarity),
                    'title': package_info.iloc[0].get('title', ''),
                    'subject': package_info.iloc[0].get('subject', ''),
                    'recommendationType': 'content-based'
                })
        
        return results
    
    def _get_popular_packages(self, n=5):
        """Get popular packages for new users (cold start)."""
        if self.interaction_matrix is None or len(self.interaction_matrix) == 0:
            return []
        
        # Calculate package popularity
        package_popularity = self.interaction_matrix.sum(axis=0).sort_values(ascending=False).head(n)
        
        results = []
        for package_id, score in package_popularity.items():
            package_info = self.packages_df[self.packages_df['package_id'] == package_id]
            if not package_info.empty:
                results.append({
                    'packageId': str(package_id),
                    'score': float(score),
                    'title': package_info.iloc[0].get('title', ''),
                    'subject': package_info.iloc[0].get('subject', ''),
                    'recommendationType': 'popular'
                })
        
        return results


def main():
    """CLI interface for the recommender."""
    if len(sys.argv) < 2:
        print(json.dumps({'error': 'Missing command argument'}))
        sys.exit(1)
    
    command = sys.argv[1]
    recommender = HybridRecommender()
    
    try:
        if command == 'recommend':
            # Load model
            recommender.load_model()
            
            # Get user_id from stdin
            input_data = json.loads(sys.stdin.read())
            user_id = input_data.get('userId')
            n = input_data.get('n', 5)
            
            # Get recommendations
            recommendations = recommender.recommend(user_id, n=n)
            print(json.dumps({'success': True, 'recommendations': recommendations}))
            
        elif command == 'similar':
            # Load model
            recommender.load_model()
            
            # Get package_id from stdin
            input_data = json.loads(sys.stdin.read())
            package_id = input_data.get('packageId')
            n = input_data.get('n', 5)
            
            # Get similar packages
            similar = recommender.get_similar_packages(package_id, n=n)
            print(json.dumps({'success': True, 'similar': similar}))
            
        else:
            print(json.dumps({'error': f'Unknown command: {command}'}))
            sys.exit(1)
            
    except Exception as e:
        print(json.dumps({'error': str(e)}))
        sys.exit(1)


if __name__ == '__main__':
    main()
