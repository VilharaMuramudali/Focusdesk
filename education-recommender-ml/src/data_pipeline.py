import os
from pymongo import MongoClient
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import json
import logging
from typing import Dict, List, Optional
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
import pickle

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class EducationalDataPipeline:
    """
    Complete data pipeline for extracting, transforming, and preparing 
    real MongoDB data for ML model training
    """
    
    def __init__(self, mongo_uri: str = "mongodb://localhost:27017/", db_name: str = "focusdesk"):
        """
        Initialize the data pipeline with MongoDB connection
        
        Args:
            mongo_uri: MongoDB connection string
            db_name: Database name
        """
        try:
            self.client = MongoClient(mongo_uri)
            self.db = self.client[db_name]
            logger.info(f"✅ Connected to MongoDB: {db_name}")
            
            # Test connection
            self.client.admin.command('ping')
            
        except Exception as e:
            logger.error(f"❌ MongoDB connection failed: {e}")
            raise
        
        # Initialize data containers
        self.raw_data = {}
        self.processed_data = {}
        self.feature_data = {}
        
        # Create output directories
        os.makedirs('pipeline_data', exist_ok=True)
        os.makedirs('processed_data', exist_ok=True)
        
    def extract_users_data(self) -> pd.DataFrame:
        """Extract users data from MongoDB"""
        logger.info("📊 Extracting users data...")
        
        try:
            # Query all users with relevant fields
            users_cursor = self.db.users.find({}, {
                '_id': 1,
                'username': 1,
                'email': 1,
                'country': 1,
                'isEducator': 1,
                'subjects': 1,
                'educationLevel': 1,
                'learningPreferences': 1,
                'teachingProfile': 1,
                'aiFeatures': 1,
                'createdAt': 1,
                'updatedAt': 1
            })
            
            users_data = list(users_cursor)
            df_users = pd.DataFrame(users_data)
            
            if not df_users.empty:
                # Convert MongoDB ObjectId to string
                df_users['_id'] = df_users['_id'].astype(str)
                
                # Handle nested documents
                df_users = self._flatten_nested_fields(df_users, ['learningPreferences', 'teachingProfile', 'aiFeatures'])
                
                # Convert dates
                if 'createdAt' in df_users.columns:
                    df_users['createdAt'] = pd.to_datetime(df_users['createdAt'])
                
                logger.info(f"✅ Extracted {len(df_users)} users")
            else:
                logger.warning("⚠️ No users found in database")
                df_users = pd.DataFrame()
            
            self.raw_data['users'] = df_users
            return df_users
            
        except Exception as e:
            logger.error(f"❌ Error extracting users: {e}")
            return pd.DataFrame()
    
    def extract_packages_data(self) -> pd.DataFrame:
        """Extract packages data from MongoDB"""
        logger.info("📦 Extracting packages data...")
        
        try:
            packages_cursor = self.db.packages.find({}, {
                '_id': 1,
                'educatorId': 1,
                'title': 1,
                'description': 1,
                'keywords': 1,
                'rate': 1,
                'sessions': 1,
                'languages': 1,
                'isActive': 1,
                'thumbnail': 1,
                'createdAt': 1,
                'updatedAt': 1
            })
            
            packages_data = list(packages_cursor)
            df_packages = pd.DataFrame(packages_data)
            
            if not df_packages.empty:
                # Convert ObjectIds
                df_packages['_id'] = df_packages['_id'].astype(str)
                df_packages['educatorId'] = df_packages['educatorId'].astype(str)
                
                # Handle arrays (keywords, languages)
                df_packages['keywords'] = df_packages['keywords'].apply(
                    lambda x: x if isinstance(x, list) else []
                )
                df_packages['languages'] = df_packages['languages'].apply(
                    lambda x: x if isinstance(x, list) else []
                )
                
                # Convert dates
                if 'createdAt' in df_packages.columns:
                    df_packages['createdAt'] = pd.to_datetime(df_packages['createdAt'])
                
                logger.info(f"✅ Extracted {len(df_packages)} packages")
            else:
                logger.warning("⚠️ No packages found in database")
                df_packages = pd.DataFrame()
            
            self.raw_data['packages'] = df_packages
            return df_packages
            
        except Exception as e:
            logger.error(f"❌ Error extracting packages: {e}")
            return pd.DataFrame()
    
    def extract_interactions_data(self) -> pd.DataFrame:
        """Extract user interactions from multiple collections"""
        logger.info("🔄 Extracting user interactions...")
        
        interactions_list = []
        
        try:
            # 1. UserInteractions collection
            user_interactions = list(self.db.userinteractions.find({}, {
                '_id': 1,
                'userId': 1,
                'packageId': 1,
                'targetId': 1,
                'interactionType': 1,
                'context': 1,
                'metadata': 1,
                'createdAt': 1
            }))
            
            for interaction in user_interactions:
                interactions_list.append({
                    'user_id': str(interaction['userId']),
                    'package_id': str(interaction.get('packageId', '')),
                    'interaction_type': interaction['interactionType'],
                    'weight': self._get_interaction_weight(interaction['interactionType']),
                    'timestamp': interaction['createdAt'],
                    'source': 'user_interactions'
                })
            
            # 2. Bookings collection (high-value interactions)
            bookings = list(self.db.bookings.find({}, {
                '_id': 1,
                'studentId': 1,
                'packageId': 1,
                'status': 1,
                'createdAt': 1
            }))
            
            for booking in bookings:
                interactions_list.append({
                    'user_id': str(booking['studentId']),
                    'package_id': str(booking['packageId']),
                    'interaction_type': 'booking',
                    'weight': 5.0,  # High weight for bookings
                    'timestamp': booking['createdAt'],
                    'source': 'bookings'
                })
            
            # 3. Reviews collection (engagement indicators)
            reviews = list(self.db.reviews.find({}, {
                '_id': 1,
                'studentId': 1,
                'packageId': 1,
                'overallRating': 1,
                'createdAt': 1
            }))
            
            for review in reviews:
                interactions_list.append({
                    'user_id': str(review['studentId']),
                    'package_id': str(review['packageId']),
                    'interaction_type': 'review',
                    'weight': review['overallRating'],  # Use rating as weight
                    'timestamp': review['createdAt'],
                    'source': 'reviews'
                })
            
            df_interactions = pd.DataFrame(interactions_list)
            
            if not df_interactions.empty:
                # Convert timestamps
                df_interactions['timestamp'] = pd.to_datetime(df_interactions['timestamp'])
                
                # Sort by timestamp
                df_interactions = df_interactions.sort_values('timestamp')
                
                logger.info(f"✅ Extracted {len(df_interactions)} interactions")
            else:
                logger.warning("⚠️ No interactions found in database")
                df_interactions = pd.DataFrame()
            
            self.raw_data['interactions'] = df_interactions
            return df_interactions
            
        except Exception as e:
            logger.error(f"❌ Error extracting interactions: {e}")
            return pd.DataFrame()
    
    def extract_session_histories(self) -> pd.DataFrame:
        """Extract session history data"""
        logger.info("📊 Extracting session histories...")
        
        try:
            session_cursor = self.db.sessionhistories.find({}, {
                '_id': 1,
                'userId': 1,
                'educatorId': 1,
                'bookingId': 1,
                'sessionData': 1,
                'performance': 1,
                'learningOutcomes': 1,
                'feedback': 1,
                'createdAt': 1
            })
            
            sessions_data = list(session_cursor)
            df_sessions = pd.DataFrame(sessions_data)
            
            if not df_sessions.empty:
                # Convert ObjectIds
                df_sessions['_id'] = df_sessions['_id'].astype(str)
                df_sessions['userId'] = df_sessions['userId'].astype(str)
                df_sessions['educatorId'] = df_sessions['educatorId'].astype(str)
                
                # Flatten nested fields
                df_sessions = self._flatten_nested_fields(df_sessions, ['sessionData', 'performance', 'learningOutcomes', 'feedback'])
                
                logger.info(f"✅ Extracted {len(df_sessions)} session histories")
            else:
                logger.warning("⚠️ No session histories found")
                df_sessions = pd.DataFrame()
            
            self.raw_data['session_histories'] = df_sessions
            return df_sessions
            
        except Exception as e:
            logger.error(f"❌ Error extracting session histories: {e}")
            return pd.DataFrame()
    
    def _get_interaction_weight(self, interaction_type: str) -> float:
        """Get weight for different interaction types"""
        weights = {
            'view': 1.0,
            'click': 1.5,
            'bookmark': 2.0,
            'share': 2.5,
            'message': 3.0,
            'book': 5.0,
            'cancel': -1.0
        }
        return weights.get(interaction_type, 1.0)
    
    def _flatten_nested_fields(self, df: pd.DataFrame, nested_columns: List[str]) -> pd.DataFrame:
        """Flatten nested dictionary fields in DataFrame"""
        for col in nested_columns:
            if col in df.columns:
                # Extract nested fields and create new columns
                nested_df = pd.json_normalize(df[col].fillna({}))
                
                # Add prefix to avoid column conflicts
                nested_df = nested_df.add_prefix(f"{col}_")
                
                # Concatenate with original DataFrame
                df = pd.concat([df.drop(columns=[col]), nested_df], axis=1)
        
        return df
    
    def create_user_features(self) -> pd.DataFrame:
        """Create comprehensive user feature matrix"""
        logger.info("👥 Creating user features...")
        
        df_users = self.raw_data.get('users', pd.DataFrame())
        df_interactions = self.raw_data.get('interactions', pd.DataFrame())
        df_sessions = self.raw_data.get('session_histories', pd.DataFrame())
        
        if df_users.empty:
            logger.error("❌ No users data available for feature creation")
            return pd.DataFrame()
        
        user_features_list = []
        
        for _, user in df_users.iterrows():
            user_id = user['_id']
            
            # Basic user features
            features = {
                'user_id': user_id,
                'username': user.get('username', ''),
                'country': user.get('country', ''),
                'is_educator': user.get('isEducator', False),
                'education_level': user.get('educationLevel', 'unknown'),
                'account_age_days': (datetime.now() - user.get('createdAt', datetime.now())).days if pd.notna(user.get('createdAt')) else 0
            }
            
            # Learning preferences (for students)
            if not user.get('isEducator', True):
                lp_prefix = 'learningPreferences_'
                for col in df_users.columns:
                    if col.startswith(lp_prefix):
                        key = col.replace(lp_prefix, '')
                        features[f'learning_{key}'] = user.get(col, None)
            
            # Interaction-based features
            user_interactions = df_interactions[df_interactions['user_id'] == user_id] if not df_interactions.empty else pd.DataFrame()
            
            if not user_interactions.empty:
                features.update({
                    'total_interactions': len(user_interactions),
                    'unique_packages_interacted': user_interactions['package_id'].nunique(),
                    'avg_interaction_weight': user_interactions['weight'].mean(),
                    'booking_count': len(user_interactions[user_interactions['interaction_type'] == 'booking']),
                    'review_count': len(user_interactions[user_interactions['interaction_type'] == 'review']),
                    'last_interaction_days_ago': (datetime.now() - user_interactions['timestamp'].max()).days,
                    'interaction_frequency': len(user_interactions) / max(1, (datetime.now() - user_interactions['timestamp'].min()).days)
                })
            else:
                features.update({
                    'total_interactions': 0,
                    'unique_packages_interacted': 0,
                    'avg_interaction_weight': 0.0,
                    'booking_count': 0,
                    'review_count': 0,
                    'last_interaction_days_ago': 999,
                    'interaction_frequency': 0.0
                })
            
            # Session-based features (if available)
            user_sessions = df_sessions[df_sessions['userId'] == user_id] if not df_sessions.empty else pd.DataFrame()
            
            if not user_sessions.empty:
                # Add session performance metrics
                if 'performance_studentRating' in user_sessions.columns:
                    features['avg_student_rating'] = user_sessions['performance_studentRating'].mean()
                if 'performance_completionRate' in user_sessions.columns:
                    features['avg_completion_rate'] = user_sessions['performance_completionRate'].mean()
            else:
                features.update({
                    'avg_student_rating': 0.0,
                    'avg_completion_rate': 0.0
                })
            
            user_features_list.append(features)
        
        df_user_features = pd.DataFrame(user_features_list)
        
        # Handle missing values
        df_user_features = df_user_features.fillna(0)
        
        # Encode categorical variables
        categorical_columns = ['country', 'education_level']
        for col in categorical_columns:
            if col in df_user_features.columns:
                le = LabelEncoder()
                df_user_features[f'{col}_encoded'] = le.fit_transform(df_user_features[col].astype(str))
        
        logger.info(f"✅ Created features for {len(df_user_features)} users with {len(df_user_features.columns)} features")
        
        self.processed_data['user_features'] = df_user_features
        return df_user_features
    
    def create_package_features(self) -> pd.DataFrame:
        """Create comprehensive package feature matrix"""
        logger.info("📦 Creating package features...")
        
        df_packages = self.raw_data.get('packages', pd.DataFrame())
        df_interactions = self.raw_data.get('interactions', pd.DataFrame())
        df_users = self.raw_data.get('users', pd.DataFrame())
        
        if df_packages.empty:
            logger.error("❌ No packages data available for feature creation")
            return pd.DataFrame()
        
        package_features_list = []
        
        for _, package in df_packages.iterrows():
            package_id = package['_id']
            
            # Basic package features
            features = {
                'package_id': package_id,
                'educator_id': package.get('educatorId', ''),
                'title': package.get('title', ''),
                'description': package.get('description', ''),
                'rate': package.get('rate', 0),
                'sessions': package.get('sessions', 1),
                'is_active': package.get('isActive', True),
                'package_age_days': (datetime.now() - package.get('createdAt', datetime.now())).days if pd.notna(package.get('createdAt')) else 0
            }
            
            # Text features
            keywords = package.get('keywords', [])
            features.update({
                'keywords_text': ' '.join(keywords) if isinstance(keywords, list) else str(keywords),
                'num_keywords': len(keywords) if isinstance(keywords, list) else 0,
                'title_length': len(package.get('title', '')),
                'description_length': len(package.get('description', ''))
            })
            
            # Language features
            languages = package.get('languages', [])
            features['num_languages'] = len(languages) if isinstance(languages, list) else 0
            
            # Educator features
            educator_id = package.get('educatorId', '')
            educator_data = df_users[df_users['_id'] == educator_id] if not df_users.empty else pd.DataFrame()
            
            if not educator_data.empty:
                educator = educator_data.iloc[0]
                features.update({
                    'educator_rating': educator.get('teachingProfile_averageRating', 0.0),
                    'educator_total_sessions': educator.get('teachingProfile_totalSessions', 0),
                    'educator_subjects_count': len(educator.get('subjects', [])) if isinstance(educator.get('subjects'), list) else 0
                })
            else:
                features.update({
                    'educator_rating': 0.0,
                    'educator_total_sessions': 0,
                    'educator_subjects_count': 0
                })
            
            # Interaction-based features
            package_interactions = df_interactions[df_interactions['package_id'] == package_id] if not df_interactions.empty else pd.DataFrame()
            
            if not package_interactions.empty:
                features.update({
                    'total_interactions': len(package_interactions),
                    'unique_users_interacted': package_interactions['user_id'].nunique(),
                    'avg_interaction_weight': package_interactions['weight'].mean(),
                    'booking_count': len(package_interactions[package_interactions['interaction_type'] == 'booking']),
                    'review_count': len(package_interactions[package_interactions['interaction_type'] == 'review']),
                    'avg_rating': package_interactions[package_interactions['interaction_type'] == 'review']['weight'].mean() if len(package_interactions[package_interactions['interaction_type'] == 'review']) > 0 else 0.0
                })
            else:
                features.update({
                    'total_interactions': 0,
                    'unique_users_interacted': 0,
                    'avg_interaction_weight': 0.0,
                    'booking_count': 0,
                    'review_count': 0,
                    'avg_rating': 0.0
                })
            
            # Derived features
            features['price_per_session'] = features['rate'] / max(1, features['sessions'])
            features['interaction_rate'] = features['total_interactions'] / max(1, features['package_age_days'])
            
            package_features_list.append(features)
        
        df_package_features = pd.DataFrame(package_features_list)
        
        # Handle missing values
        df_package_features = df_package_features.fillna(0)
        
        logger.info(f"✅ Created features for {len(df_package_features)} packages with {len(df_package_features.columns)} features")
        
        self.processed_data['package_features'] = df_package_features
        return df_package_features
    
    def create_interaction_matrix(self) -> pd.DataFrame:
        """Create user-package interaction matrix"""
        logger.info("🔄 Creating interaction matrix...")
        
        df_interactions = self.raw_data.get('interactions', pd.DataFrame())
        
        if df_interactions.empty:
            logger.error("❌ No interactions data available for matrix creation")
            return pd.DataFrame()
        
        # Aggregate interactions by user and package
        interaction_scores = df_interactions.groupby(['user_id', 'package_id']).agg({
            'weight': 'sum',
            'timestamp': 'max'
        }).reset_index()
        
        # Create pivot table (interaction matrix)
        interaction_matrix = interaction_scores.pivot(
            index='user_id',
            columns='package_id', 
            values='weight'
        ).fillna(0)
        
        logger.info(f"✅ Created interaction matrix: {interaction_matrix.shape}")
        logger.info(f"   Sparsity: {(1 - interaction_matrix.astype(bool).sum().sum() / interaction_matrix.size) * 100:.2f}%")
        
        self.processed_data['interaction_matrix'] = interaction_matrix
        return interaction_matrix
    
    def create_content_features(self) -> Dict:
        """Create content-based features (TF-IDF)"""
        logger.info("📚 Creating content features...")
        
        df_packages = self.processed_data.get('package_features', pd.DataFrame())
        
        if df_packages.empty:
            logger.error("❌ No package features available for content feature creation")
            return {}
        
        # Combine text fields
        df_packages['combined_text'] = (
            df_packages['title'].fillna('') + ' ' +
            df_packages['description'].fillna('') + ' ' + 
            df_packages['keywords_text'].fillna('')
        ).str.lower()
        
        # Create TF-IDF features
        tfidf_vectorizer = TfidfVectorizer(
            max_features=1000,
            stop_words='english',
            ngram_range=(1, 2),
            min_df=2
        )
        
        tfidf_matrix = tfidf_vectorizer.fit_transform(df_packages['combined_text'])
        
        # Save vectorizer for future use
        with open('processed_data/tfidf_vectorizer.pkl', 'wb') as f:
            pickle.dump(tfidf_vectorizer, f)
        
        content_features = {
            'tfidf_matrix': tfidf_matrix,
            'tfidf_vectorizer': tfidf_vectorizer,
            'package_ids': df_packages['package_id'].tolist()
        }
        
        logger.info(f"✅ Created TF-IDF matrix: {tfidf_matrix.shape}")
        
        self.feature_data['content_features'] = content_features
        return content_features
    
    def save_processed_data(self) -> None:
        """Save all processed data to files"""
        logger.info("💾 Saving processed data...")
        
        # Save DataFrames as CSV
        for name, df in self.processed_data.items():
            if isinstance(df, pd.DataFrame) and not df.empty:
                filepath = f"processed_data/{name}.csv"
                if name == 'interaction_matrix':
                    df.to_csv(filepath)  # Keep index for interaction matrix
                else:
                    df.to_csv(filepath, index=False)
                logger.info(f"   ✅ Saved {name}: {df.shape}")
        
        # Save feature data (TF-IDF, etc.)
        if self.feature_data:
            with open('processed_data/feature_data.pkl', 'wb') as f:
                pickle.dump(self.feature_data, f)
            logger.info("   ✅ Saved feature data")
        
        # Create data summary
        summary = {
            'extraction_date': datetime.now().isoformat(),
            'data_shapes': {name: df.shape for name, df in self.processed_data.items() if isinstance(df, pd.DataFrame)},
            'total_users': len(self.processed_data.get('user_features', pd.DataFrame())),
            'total_packages': len(self.processed_data.get('package_features', pd.DataFrame())),
            'total_interactions': len(self.raw_data.get('interactions', pd.DataFrame())),
            'interaction_matrix_sparsity': f"{(1 - self.processed_data.get('interaction_matrix', pd.DataFrame()).astype(bool).sum().sum() / self.processed_data.get('interaction_matrix', pd.DataFrame()).size) * 100:.2f}%" if not self.processed_data.get('interaction_matrix', pd.DataFrame()).empty else "N/A"
        }
        
        with open('processed_data/pipeline_summary.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        logger.info("💾 All processed data saved successfully!")
    
    def run_complete_pipeline(self) -> bool:
        """Run the complete data pipeline"""
        logger.info("🚀 Starting complete data pipeline...")
        
        try:
            # Step 1: Extract raw data
            logger.info("Step 1: Data Extraction")
            self.extract_users_data()
            self.extract_packages_data()  
            self.extract_interactions_data()
            self.extract_session_histories()
            
            # Step 2: Create features
            logger.info("Step 2: Feature Engineering")
            self.create_user_features()
            self.create_package_features()
            self.create_interaction_matrix()
            self.create_content_features()
            
            # Step 3: Save processed data
            logger.info("Step 3: Data Persistence")
            self.save_processed_data()
            
            logger.info("🎉 Data pipeline completed successfully!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Pipeline failed: {e}")
            return False
        finally:
            # Close MongoDB connection
            self.client.close()
            logger.info("🔌 MongoDB connection closed")

def main():
    """Main function to run the data pipeline"""
    # Configuration
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    DB_NAME = os.getenv('DB_NAME', 'focusdesk')  # Your database name
    
    # Initialize and run pipeline
    pipeline = EducationalDataPipeline(mongo_uri=MONGO_URI, db_name=DB_NAME)
    
    success = pipeline.run_complete_pipeline()
    
    if success:
        print("\n✅ Pipeline completed! Files created:")
        print("📁 processed_data/")
        print("   ├── user_features.csv")
        print("   ├── package_features.csv") 
        print("   ├── interaction_matrix.csv")
        print("   ├── tfidf_vectorizer.pkl")
        print("   ├── feature_data.pkl")
        print("   └── pipeline_summary.json")
        print("\n🚀 Ready for ML training!")
    else:
        print("❌ Pipeline failed. Check logs for details.")

if __name__ == "__main__":
    main()
