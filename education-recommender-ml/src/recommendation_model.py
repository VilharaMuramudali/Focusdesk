import pandas as pd
import numpy as np
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.decomposition import TruncatedSVD
import pickle
import os

class EducationalRecommendationSystem:
    def __init__(self):
        self.models = {}
        self.data = {}
        
    def load_data(self, data_dir='data'):
        """Load the generated data"""
        print("📊 Loading data...")
        
        # Load all datasets
        for filename in ['users.json', 'packages.json', 'interactions.json', 'reviews.json']:
            filepath = f"{data_dir}/{filename}"
            with open(filepath, 'r') as f:
                dataset_name = filename.replace('.json', '')
                self.data[dataset_name] = json.load(f)
        
        print("✅ Data loaded successfully!")
        
        # Convert to DataFrames for easier processing
        self.users_df = pd.DataFrame(self.data['users'])
        self.packages_df = pd.DataFrame(self.data['packages'])
        self.interactions_df = pd.DataFrame(self.data['interactions'])
        self.reviews_df = pd.DataFrame(self.data['reviews'])
        
        return True
    
    def prepare_features(self):
        """Prepare features for recommendation models"""
        print("🔧 Preparing features...")
        
        # Check if we have processed data from pipeline or raw data
        if hasattr(self, 'packages_df') and 'title' in self.packages_df.columns:
            # Create package features from pipeline data
            if 'description' in self.packages_df.columns:
                desc_field = 'description'
            elif 'desc' in self.packages_df.columns:
                desc_field = 'desc'
            else:
                desc_field = None
            
            if 'keywords_text' in self.packages_df.columns:
                # Use keywords_text from pipeline
                keywords_field = 'keywords_text'
            elif 'keywords' in self.packages_df.columns:
                keywords_field = 'keywords'
            else:
                keywords_field = None
            
            # Build combined text
            text_parts = [self.packages_df['title'].fillna('')]
            
            if desc_field:
                text_parts.append(self.packages_df[desc_field].fillna(''))
            
            if keywords_field:
                if keywords_field == 'keywords_text':
                    text_parts.append(self.packages_df[keywords_field].fillna(''))
                else:
                    text_parts.append(self.packages_df[keywords_field].apply(
                        lambda x: ' '.join(x) if isinstance(x, list) else str(x)
                    ).fillna(''))
            
            self.packages_df['combined_text'] = ' '.join(text_parts)
        
        # Interaction matrix should already be loaded from pipeline
        if not hasattr(self, 'interaction_matrix'):
            # Create from interactions if available
            if hasattr(self, 'interactions_df') and not self.interactions_df.empty:
                if 'user_id' in self.interactions_df.columns and 'package_id' in self.interactions_df.columns:
                    # Use weight column if available, otherwise use count
                    weight_col = 'weight' if 'weight' in self.interactions_df.columns else 'score'
                    if weight_col not in self.interactions_df.columns:
                        self.interactions_df[weight_col] = 1.0
                    
                    self.interaction_matrix = self.interactions_df.pivot_table(
                        index='user_id',
                        columns='package_id',
                        values=weight_col,
                        fill_value=0,
                        aggfunc='sum'
                    )
                elif 'userId' in self.interactions_df.columns and 'packageId' in self.interactions_df.columns:
                    # Old format
                    weight_col = 'weight' if 'weight' in self.interactions_df.columns else 'score'
                    if weight_col not in self.interactions_df.columns:
                        self.interactions_df[weight_col] = 1.0
                    
                    self.interaction_matrix = self.interactions_df.pivot_table(
                        index='userId',
                        columns='packageId',
                        values=weight_col,
                        fill_value=0,
                        aggfunc='sum'
                    )
        
        print("✅ Features prepared!")
        return True
    
    def train_content_based_model(self):
        """Train content-based recommendation model"""
        print("📚 Training content-based model...")
        
        if 'combined_text' not in self.packages_df.columns:
            print("⚠️ No combined_text available, skipping content-based model")
            return
        
        # TF-IDF vectorization
        tfidf = TfidfVectorizer(max_features=1000, stop_words='english')
        tfidf_matrix = tfidf.fit_transform(self.packages_df['combined_text'].fillna(''))
        
        # Calculate similarity matrix
        similarity_matrix = cosine_similarity(tfidf_matrix)
        
        # Get package IDs - handle both _id and package_id columns
        if '_id' in self.packages_df.columns:
            package_ids = self.packages_df['_id'].tolist()
        elif 'package_id' in self.packages_df.columns:
            package_ids = self.packages_df['package_id'].tolist()
        else:
            package_ids = list(range(len(self.packages_df)))
        
        self.models['content_based'] = {
            'tfidf_vectorizer': tfidf,
            'similarity_matrix': similarity_matrix,
            'package_ids': package_ids
        }
        
        print("✅ Content-based model trained!")
        
    def train_collaborative_model(self):
        """Train collaborative filtering model"""
        print("🤝 Training collaborative model...")
        
        if self.interaction_matrix.shape[0] < 2 or self.interaction_matrix.shape[1] < 2:
            print("⚠️ Not enough data for collaborative filtering")
            return
        
        # SVD for matrix factorization
        n_components = min(20, min(self.interaction_matrix.shape) - 1)
        svd = TruncatedSVD(n_components=n_components, random_state=42)
        
        user_factors = svd.fit_transform(self.interaction_matrix.values)
        item_factors = svd.components_
        
        self.models['collaborative'] = {
            'svd': svd,
            'user_factors': user_factors,
            'item_factors': item_factors,
            'user_ids': self.interaction_matrix.index.tolist(),
            'package_ids': self.interaction_matrix.columns.tolist()
        }
        
        print("✅ Collaborative model trained!")
        
    def get_recommendations(self, user_id, n_recommendations=10, method='hybrid'):
        """Get recommendations for a user"""
        
        if method == 'content_based':
            return self._get_content_recommendations(user_id, n_recommendations)
        elif method == 'collaborative':
            return self._get_collaborative_recommendations(user_id, n_recommendations)
        else:
            return self._get_hybrid_recommendations(user_id, n_recommendations)
    
    def _get_content_recommendations(self, user_id, n_recommendations):
        """Get content-based recommendations"""
        # Get user's interaction history - handle both formats
        if hasattr(self, 'interactions_df') and not self.interactions_df.empty:
            if 'user_id' in self.interactions_df.columns:
                user_interactions = self.interactions_df[self.interactions_df['user_id'] == str(user_id)]
                package_col = 'package_id'
            else:
                user_interactions = self.interactions_df[self.interactions_df['userId'] == str(user_id)]
                package_col = 'packageId'
        else:
            user_interactions = pd.DataFrame()
        
        model = self.models.get('content_based')
        if not model:
            # Fallback: return popular packages
            if hasattr(self, 'packages_df') and not self.packages_df.empty:
                rate_col = 'rate' if 'rate' in self.packages_df.columns else 'price'
                id_col = '_id' if '_id' in self.packages_df.columns else 'package_id'
                title_col = 'title' if 'title' in self.packages_df.columns else 'name'
                
                top_packages = self.packages_df.nlargest(n_recommendations, rate_col)
                return top_packages[[id_col, title_col, rate_col]].rename(columns={
                    id_col: 'package_id',
                    title_col: 'title',
                    rate_col: 'rate'
                }).to_dict('records')
            return []
        
        if user_interactions.empty:
            # Return popular packages based on rate/price
            rate_col = 'rate' if 'rate' in self.packages_df.columns else 'price'
            id_col = '_id' if '_id' in self.packages_df.columns else 'package_id'
            title_col = 'title' if 'title' in self.packages_df.columns else 'name'
            
            top_packages = self.packages_df.nlargest(n_recommendations, rate_col)
            return top_packages[[id_col, title_col, rate_col]].rename(columns={
                id_col: 'package_id',
                title_col: 'title',
                rate_col: 'rate'
            }).to_dict('records')
        
        # Get user's most interacted package
        weight_col = 'weight' if 'weight' in user_interactions.columns else ('score' if 'score' in user_interactions.columns else 'count')
        if weight_col not in user_interactions.columns:
            weight_col = user_interactions.columns[-1]  # Use last column as fallback
        
        top_interaction = user_interactions.loc[user_interactions[weight_col].idxmax()]
        top_package_id = str(top_interaction[package_col])
        
        # Find similar packages
        try:
            # Find package index
            package_ids_list = [str(p) for p in model['package_ids']]
            if top_package_id not in package_ids_list:
                # Try to find similar package IDs
                matching_ids = [p for p in package_ids_list if str(p).startswith(str(top_package_id)[:8]) or str(top_package_id).startswith(str(p)[:8])]
                if matching_ids:
                    top_package_id = matching_ids[0]
                    package_idx = package_ids_list.index(top_package_id)
                else:
                    # Use first package as fallback
                    package_idx = 0
            else:
                package_idx = package_ids_list.index(top_package_id)
            
            similarity_scores = model['similarity_matrix'][package_idx]
            
            # Get top similar packages
            similar_indices = np.argsort(similarity_scores)[::-1][1:n_recommendations+1]
            
            recommendations = []
            id_col = '_id' if '_id' in self.packages_df.columns else 'package_id'
            title_col = 'title' if 'title' in self.packages_df.columns else 'name'
            rate_col = 'rate' if 'rate' in self.packages_df.columns else 'price'
            
            for idx in similar_indices:
                package_id = model['package_ids'][idx]
                package_id_str = str(package_id)
                
                # Find package in dataframe
                if id_col in self.packages_df.columns:
                    package_info = self.packages_df[self.packages_df[id_col].astype(str) == package_id_str]
                elif 'package_id' in self.packages_df.columns:
                    package_info = self.packages_df[self.packages_df['package_id'].astype(str) == package_id_str]
                else:
                    package_info = pd.DataFrame()
                
                if not package_info.empty:
                    pkg = package_info.iloc[0]
                    recommendations.append({
                        'package_id': package_id_str,
                        'title': str(pkg.get(title_col, pkg.get('name', 'Unknown'))),
                        'rate': float(pkg.get(rate_col, pkg.get('price', 0))),
                        'similarity_score': float(similarity_scores[idx]),
                        'method': 'content_based'
                    })
            
            return recommendations
        except (ValueError, IndexError, KeyError) as e:
            print(f"Error in content recommendations: {e}")
            return []
    
    def _get_collaborative_recommendations(self, user_id, n_recommendations):
        """Get collaborative filtering recommendations"""
        model = self.models.get('collaborative')
        if not model or user_id not in model['user_ids']:
            return []
        
        user_idx = model['user_ids'].index(user_id)
        user_vector = model['user_factors'][user_idx]
        
        # Calculate scores for all packages
        scores = np.dot(user_vector, model['item_factors'])
        
        # Get top recommendations
        top_indices = np.argsort(scores)[::-1]
        
        recommendations = []
        for idx in top_indices[:n_recommendations]:
            package_id = model['package_ids'][idx]
            package_info = self.packages_df[self.packages_df['_id'] == package_id]
            
            if not package_info.empty:
                package_info = package_info.iloc[0]
                recommendations.append({
                    'package_id': package_id,
                    'title': package_info['title'],
                    'rate': package_info['rate'],
                    'predicted_score': float(scores[idx]),
                    'method': 'collaborative'
                })
        
        return recommendations
    
    def _get_hybrid_recommendations(self, user_id, n_recommendations):
        """Get hybrid recommendations"""
        content_recs = self._get_content_recommendations(user_id, n_recommendations//2 + 1)
        collab_recs = self._get_collaborative_recommendations(user_id, n_recommendations//2 + 1)
        
        # Combine recommendations
        all_recs = content_recs + collab_recs
        
        # Remove duplicates and limit
        seen_packages = set()
        final_recs = []
        
        for rec in all_recs:
            if rec['package_id'] not in seen_packages:
                seen_packages.add(rec['package_id'])
                rec['method'] = 'hybrid'
                final_recs.append(rec)
            
            if len(final_recs) >= n_recommendations:
                break
        
        return final_recs
    
    def train_all(self):
        """Train all models"""
        print("🚀 Training all recommendation models...")
        
        self.prepare_features()
        self.train_content_based_model()
        self.train_collaborative_model()
        
        print("🎉 All models trained successfully!")
    
    def save_models(self, models_dir='models'):
        """Save trained models"""
        os.makedirs(models_dir, exist_ok=True)
        
        with open(f'{models_dir}/recommendation_system.pkl', 'wb') as f:
            pickle.dump(self.models, f)
        
        print(f"💾 Models saved to {models_dir}/recommendation_system.pkl")

if __name__ == "__main__":
    # Example usage
    system = EducationalRecommendationSystem()
    system.load_data()
    system.train_all()
    system.save_models()
    
    # Test recommendations
    sample_user = system.users_df[system.users_df['isEducator'] == False].iloc[0]['_id']
    recommendations = system.get_recommendations(sample_user, 5)
    
    print(f"\nRecommendations for user {sample_user[:8]}:")
    for i, rec in enumerate(recommendations, 1):
        print(f"{i}. {rec['title']} - ${rec['rate']} ({rec['method']})")
