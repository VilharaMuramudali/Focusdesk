#!/usr/bin/env python3
"""
Data Pipeline for ML Training
Handles data extraction, transformation, and loading (ETL) for the recommendation system
"""

import os
import sys
import json
import logging
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
from pymongo import MongoClient
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.feature_extraction.text import TfidfVectorizer
import re
import nltk
from nltk.corpus import stopwords
from nltk.tokenize import word_tokenize
from nltk.stem import WordNetLemmatizer
import warnings
warnings.filterwarnings('ignore')

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from config import *

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

class DataPipeline:
    """
    Comprehensive data pipeline for ML training
    """
    
    def __init__(self):
        self.mongo_client = None
        self.db = None
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.tfidf_vectorizer = None
        
        # Download NLTK data if not available
        try:
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            nltk.download('punkt')
        
        try:
            nltk.data.find('corpora/stopwords')
        except LookupError:
            nltk.download('stopwords')
        
        try:
            nltk.data.find('corpora/wordnet')
        except LookupError:
            nltk.download('wordnet')
        
        self.stop_words = set(stopwords.words('english'))
        self.lemmatizer = WordNetLemmatizer()
    
    def connect_mongodb(self):
        """Connect to MongoDB database"""
        try:
            self.mongo_client = MongoClient(MONGODB_URI)
            self.db = self.mongo_client[DB_NAME]
            logger.info("Connected to MongoDB successfully")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {e}")
            raise
    
    def extract_data(self) -> Dict[str, pd.DataFrame]:
        """Extract all necessary data from MongoDB"""
        logger.info("Extracting data from MongoDB...")
        
        try:
            # Extract users data
            users_data = list(self.db.users.find({}, {
                '_id': 1, 'username': 1, 'email': 1, 'isEducator': 1,
                'subjects': 1, 'bio': 1, 'educationLevel': 1,
                'learningPreferences': 1, 'teachingProfile': 1,
                'aiFeatures': 1, 'country': 1, 'createdAt': 1,
                'rating': 1, 'totalSessions': 1
            }))
            
            # Extract packages data
            packages_data = list(self.db.packages.find({}, {
                '_id': 1, 'title': 1, 'description': 1, 'rate': 1,
                'educatorId': 1, 'subjects': 1, 'level': 1,
                'sessions': 1, 'languages': 1, 'isActive': 1,
                'createdAt': 1
            }))
            
            # Extract interactions data
            interactions_data = list(self.db.userinteractions.find({}, {
                '_id': 1, 'userId': 1, 'targetId': 1, 'packageId': 1,
                'interactionType': 1, 'context': 1, 'metadata': 1,
                'createdAt': 1
            }))
            
            # Extract session history data
            sessions_data = list(self.db.sessionhistories.find({}, {
                '_id': 1, 'userId': 1, 'educatorId': 1, 'bookingId': 1,
                'sessionData': 1, 'performance': 1, 'learningOutcomes': 1,
                'feedback': 1, 'createdAt': 1
            }))
            
            # Extract bookings data
            bookings_data = list(self.db.bookings.find({}, {
                '_id': 1, 'packageId': 1, 'educatorId': 1, 'studentId': 1,
                'status': 1, 'totalAmount': 1, 'sessions': 1,
                'createdAt': 1
            }))
            
            # Convert to DataFrames
            data = {
                'users': pd.DataFrame(users_data),
                'packages': pd.DataFrame(packages_data),
                'interactions': pd.DataFrame(interactions_data),
                'sessions': pd.DataFrame(sessions_data),
                'bookings': pd.DataFrame(bookings_data)
            }
            
            logger.info(f"Data extraction completed:")
            for key, df in data.items():
                logger.info(f"  {key}: {len(df)} records")
            
            return data
            
        except Exception as e:
            logger.error(f"Error extracting data: {e}")
            raise
    
    def clean_text(self, text: str) -> str:
        """Clean and preprocess text data"""
        if pd.isna(text) or text == '':
            return ''
        
        # Convert to string and lowercase
        text = str(text).lower()
        
        # Remove special characters and numbers
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        
        # Tokenize
        tokens = word_tokenize(text)
        
        # Remove stopwords and lemmatize
        tokens = [self.lemmatizer.lemmatize(token) for token in tokens 
                 if token not in self.stop_words and len(token) > 2]
        
        return ' '.join(tokens)
    
    def process_users_data(self, users_df: pd.DataFrame) -> pd.DataFrame:
        """Process and clean users data"""
        logger.info("Processing users data...")
        
        if users_df.empty:
            return pd.DataFrame()
        
        # Create a copy to avoid modifying original
        df = users_df.copy()
        
        # Handle missing values
        df['bio'] = df['bio'].fillna('')
        df['subjects'] = df['subjects'].fillna('[]')
        df['educationLevel'] = df['educationLevel'].fillna('unknown')
        df['country'] = df['country'].fillna('unknown')
        
        # Clean text fields
        df['bio_clean'] = df['bio'].apply(self.clean_text)
        df['subjects_clean'] = df['subjects'].apply(lambda x: ' '.join(x) if isinstance(x, list) else str(x))
        
        # Extract learning preferences
        df['learning_style'] = df['learningPreferences'].apply(
            lambda x: x.get('learningStyle', 'unknown') if isinstance(x, dict) else 'unknown'
        )
        df['academic_level'] = df['learningPreferences'].apply(
            lambda x: x.get('academicLevel', 'unknown') if isinstance(x, dict) else 'unknown'
        )
        
        # Extract teaching profile
        df['teaching_style'] = df['teachingProfile'].apply(
            lambda x: x.get('teachingStyle', 'unknown') if isinstance(x, dict) else 'unknown'
        )
        df['avg_rating'] = df['teachingProfile'].apply(
            lambda x: x.get('averageRating', 0) if isinstance(x, dict) else 0
        )
        df['total_sessions'] = df['teachingProfile'].apply(
            lambda x: x.get('totalSessions', 0) if isinstance(x, dict) else 0
        )
        
        # Convert ObjectId to string for processing
        df['_id'] = df['_id'].astype(str)
        
        # Create user type feature
        df['user_type'] = df['isEducator'].map({True: 'educator', False: 'student'})
        
        logger.info(f"Processed {len(df)} users")
        return df
    
    def process_packages_data(self, packages_df: pd.DataFrame) -> pd.DataFrame:
        """Process and clean packages data"""
        logger.info("Processing packages data...")
        
        if packages_df.empty:
            return pd.DataFrame()
        
        df = packages_df.copy()
        
        # Handle missing values
        df['title'] = df['title'].fillna('')
        df['description'] = df['description'].fillna('')
        df['subjects'] = df['subjects'].fillna('[]')
        df['level'] = df['level'].fillna('intermediate')
        df['languages'] = df['languages'].fillna('[]')
        
        # Clean text fields
        df['title_clean'] = df['title'].apply(self.clean_text)
        df['description_clean'] = df['description'].apply(self.clean_text)
        df['subjects_clean'] = df['subjects'].apply(lambda x: ' '.join(x) if isinstance(x, list) else str(x))
        
        # Convert ObjectId to string
        df['_id'] = df['_id'].astype(str)
        df['educatorId'] = df['educatorId'].astype(str)
        
        # Create combined text for TF-IDF
        df['combined_text'] = df['title_clean'] + ' ' + df['description_clean'] + ' ' + df['subjects_clean']
        
        # Handle price normalization
        df['price_normalized'] = (df['rate'] - df['rate'].mean()) / df['rate'].std()
        
        logger.info(f"Processed {len(df)} packages")
        return df
    
    def process_interactions_data(self, interactions_df: pd.DataFrame) -> pd.DataFrame:
        """Process and clean interactions data"""
        logger.info("Processing interactions data...")
        
        if interactions_df.empty:
            return pd.DataFrame()
        
        df = interactions_df.copy()
        
        # Handle missing values
        df['interactionType'] = df['interactionType'].fillna('view')
        
        # Convert ObjectId to string
        df['_id'] = df['_id'].astype(str)
        df['userId'] = df['userId'].astype(str)
        df['targetId'] = df['targetId'].astype(str)
        df['packageId'] = df['packageId'].astype(str)
        
        # Create interaction weights
        interaction_weights = {
            'view': 1,
            'click': 2,
            'bookmark': 3,
            'message': 4,
            'book': 5,
            'share': 2
        }
        
        df['interaction_weight'] = df['interactionType'].map(interaction_weights).fillna(1)
        
        # Extract search query from context
        df['search_query'] = df['context'].apply(
            lambda x: x.get('searchQuery', '') if isinstance(x, dict) else ''
        )
        
        logger.info(f"Processed {len(df)} interactions")
        return df
    
    def create_user_item_matrix(self, interactions_df: pd.DataFrame, users_df: pd.DataFrame, packages_df: pd.DataFrame) -> pd.DataFrame:
        """Create user-item interaction matrix for collaborative filtering"""
        logger.info("Creating user-item interaction matrix...")
        
        if interactions_df.empty:
            return pd.DataFrame()
        
        # Filter valid interactions
        valid_interactions = interactions_df[
            interactions_df['userId'].notna() & 
            interactions_df['packageId'].notna()
        ].copy()
        
        # Create pivot table
        user_item_matrix = valid_interactions.pivot_table(
            index='userId',
            columns='packageId',
            values='interaction_weight',
            aggfunc='sum',
            fill_value=0
        )
        
        # Filter users and items with minimum interactions
        user_counts = valid_interactions['userId'].value_counts()
        package_counts = valid_interactions['packageId'].value_counts()
        
        active_users = user_counts[user_counts >= MIN_INTERACTIONS].index
        active_packages = package_counts[package_counts >= MIN_INTERACTIONS].index
        
        user_item_matrix = user_item_matrix.loc[active_users, active_packages]
        
        logger.info(f"Created user-item matrix: {user_item_matrix.shape}")
        return user_item_matrix
    
    def create_text_features(self, packages_df: pd.DataFrame) -> Tuple[np.ndarray, TfidfVectorizer]:
        """Create TF-IDF features from text data"""
        logger.info("Creating text features...")
        
        if packages_df.empty:
            return np.array([]), None
        
        # Initialize TF-IDF vectorizer
        tfidf = TfidfVectorizer(
            max_features=MAX_FEATURES,
            min_df=MIN_DF,
            max_df=MAX_DF,
            stop_words='english',
            ngram_range=(1, 2)
        )
        
        # Fit and transform
        text_features = tfidf.fit_transform(packages_df['combined_text'])
        
        logger.info(f"Created text features: {text_features.shape}")
        return text_features, tfidf
    
    def create_numerical_features(self, packages_df: pd.DataFrame) -> np.ndarray:
        """Create numerical features"""
        logger.info("Creating numerical features...")
        
        if packages_df.empty:
            return np.array([])
        
        # Select numerical columns
        numerical_cols = ['rate', 'sessions']
        features = packages_df[numerical_cols].fillna(0).values
        
        # Normalize features
        features_scaled = self.scaler.fit_transform(features)
        
        logger.info(f"Created numerical features: {features_scaled.shape}")
        return features_scaled
    
    def save_processed_data(self, data: Dict[str, pd.DataFrame], output_dir: str = "data"):
        """Save processed data to disk"""
        logger.info("Saving processed data...")
        
        os.makedirs(output_dir, exist_ok=True)
        
        for name, df in data.items():
            if not df.empty:
                file_path = os.path.join(output_dir, f"{name}_processed.csv")
                df.to_csv(file_path, index=False)
                logger.info(f"Saved {name} to {file_path}")
    
    def run_pipeline(self) -> Dict[str, pd.DataFrame]:
        """Run the complete data pipeline"""
        logger.info("Starting data pipeline...")
        
        try:
            # Connect to MongoDB
            self.connect_mongodb()
            
            # Extract data
            raw_data = self.extract_data()
            
            # Process data
            processed_data = {
                'users': self.process_users_data(raw_data['users']),
                'packages': self.process_packages_data(raw_data['packages']),
                'interactions': self.process_interactions_data(raw_data['interactions']),
                'sessions': raw_data['sessions'],
                'bookings': raw_data['bookings']
            }
            
            # Create user-item matrix
            if not processed_data['interactions'].empty:
                user_item_matrix = self.create_user_item_matrix(
                    processed_data['interactions'],
                    processed_data['users'],
                    processed_data['packages']
                )
                processed_data['user_item_matrix'] = user_item_matrix
            
            # Create text features
            if not processed_data['packages'].empty:
                text_features, tfidf_vectorizer = self.create_text_features(processed_data['packages'])
                processed_data['text_features'] = text_features
                processed_data['tfidf_vectorizer'] = tfidf_vectorizer
            
            # Create numerical features
            if not processed_data['packages'].empty:
                numerical_features = self.create_numerical_features(processed_data['packages'])
                processed_data['numerical_features'] = numerical_features
            
            # Save processed data
            self.save_processed_data(processed_data)
            
            logger.info("Data pipeline completed successfully!")
            return processed_data
            
        except Exception as e:
            logger.error(f"Error in data pipeline: {e}")
            raise
        finally:
            if self.mongo_client:
                self.mongo_client.close()

if __name__ == "__main__":
    # Run the pipeline
    pipeline = DataPipeline()
    processed_data = pipeline.run_pipeline()
    print("Pipeline completed!")
