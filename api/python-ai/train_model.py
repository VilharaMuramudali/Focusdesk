"""
Train the Hybrid Recommendation Model
Exports data from MongoDB and trains the ML model
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
import json
from pymongo import MongoClient
from dotenv import load_dotenv
from hybrid_recommender import HybridRecommender

# Load environment variables
load_dotenv(Path(__file__).parent.parent / '.env')

def connect_to_mongodb():
    """Connect to MongoDB database."""
    mongo_uri = os.getenv('MONGO_URI', 'mongodb://localhost:27017/focusdesk')
    client = MongoClient(mongo_uri)
    db = client.get_database()
    return db

def export_users_data(db):
    """Export users from MongoDB to DataFrame."""
    users_collection = db['users']
    users = list(users_collection.find({}, {
        '_id': 1,
        'username': 1,
        'email': 1,
        'isEducator': 1,
        'createdAt': 1
    }))
    
    users_df = pd.DataFrame(users)
    if not users_df.empty:
        users_df['user_id'] = users_df['_id'].astype(str)
        users_df = users_df[['user_id', 'username', 'email', 'isEducator', 'createdAt']]
    else:
        users_df = pd.DataFrame(columns=['user_id', 'username', 'email', 'isEducator', 'createdAt'])
    
    return users_df

def export_packages_data(db):
    """Export packages from MongoDB to DataFrame with text embeddings."""
    packages_collection = db['packages']
    packages = list(packages_collection.find({}, {
        '_id': 1,
        'title': 1,
        'description': 1,
        'subjects': 1,
        'keywords': 1,
        'rate': 1,
        'educatorId': 1
    }))
    
    packages_df = pd.DataFrame(packages)
    if not packages_df.empty:
        packages_df['package_id'] = packages_df['_id'].astype(str)
        
        # Extract subject (use first subject or 'General')
        packages_df['subject'] = packages_df['subjects'].apply(
            lambda x: x[0] if isinstance(x, list) and len(x) > 0 else 'General'
        )
        
        # Generate text embeddings from title, description, and keywords
        packages_df['text_embedding'] = packages_df.apply(
            lambda row: generate_text_embedding(row), axis=1
        )
        
        packages_df = packages_df[['package_id', 'title', 'subject', 'rate', 'text_embedding']]
    else:
        packages_df = pd.DataFrame(columns=['package_id', 'title', 'subject', 'rate', 'text_embedding'])
    
    return packages_df

def generate_text_embedding(row):
    """Generate a simple text embedding based on package features."""
    # Simple embedding: create a 16-dimensional vector from text features
    # In production, use proper embeddings (BERT, Word2Vec, etc.)
    
    title = str(row.get('title', '')).lower()
    description = str(row.get('description', '')).lower()
    keywords = row.get('keywords', [])
    subject = str(row.get('subjects', [''])[0] if isinstance(row.get('subjects'), list) else '').lower()
    
    # Combine text
    all_text = f"{title} {description} {subject} {' '.join(keywords if isinstance(keywords, list) else [])}"
    
    # Create a simple hash-based embedding (16 dimensions)
    # This is a placeholder - in production use proper NLP embeddings
    np.random.seed(abs(hash(all_text)) % (2**32))
    embedding = np.random.randn(16).tolist()
    
    return json.dumps(embedding)

def export_events_data(db):
    """Export user interaction events from MongoDB."""
    # Combine data from activities, bookings, and interactions
    events = []
    
    # 1. Get activities (searches, views, clicks)
    activities_collection = db['activities']
    activities = list(activities_collection.find({}, {
        'studentId': 1,
        'type': 1,
        'details': 1,
        'timestamp': 1
    }))
    
    for activity in activities:
        user_id = str(activity.get('studentId', ''))
        event_type = activity.get('type', 'view')
        details = activity.get('details', {})
        package_id = details.get('packageId', '')
        
        if user_id and package_id:
            events.append({
                'user_id': user_id,
                'event_type': event_type,
                'package_id': str(package_id)
            })
    
    # 2. Get bookings (strongest signal)
    bookings_collection = db['bookings']
    bookings = list(bookings_collection.find({}, {
        'studentId': 1,
        'packageId': 1,
        'status': 1,
        'createdAt': 1
    }))
    
    for booking in bookings:
        user_id = str(booking.get('studentId', ''))
        package_id = str(booking.get('packageId', ''))
        status = booking.get('status', 'pending')
        
        if user_id and package_id:
            # Map booking status to event type
            if status in ['confirmed', 'completed']:
                event_type = 'booking'
            else:
                event_type = 'start_booking'
            
            events.append({
                'user_id': user_id,
                'event_type': event_type,
                'package_id': package_id
            })
    
    # 3. Get interactions
    interactions_collection = db['interactions']
    interactions = list(interactions_collection.find({'type': {'$in': ['search', 'view', 'click']}}, {
        'userId': 1,
        'type': 1,
        'meta': 1
    }))
    
    for interaction in interactions:
        user_id = str(interaction.get('userId', ''))
        event_type = interaction.get('type', 'view')
        meta = interaction.get('meta', {})
        package_id = meta.get('packageId', '')
        
        if user_id and package_id:
            events.append({
                'user_id': user_id,
                'event_type': event_type,
                'package_id': str(package_id)
            })
    
    events_df = pd.DataFrame(events)
    if events_df.empty:
        events_df = pd.DataFrame(columns=['user_id', 'event_type', 'package_id'])
    
    return events_df

def train_and_save_model():
    """Main function to train and save the recommendation model."""
    print("=" * 80)
    print("TRAINING HYBRID RECOMMENDATION MODEL")
    print("=" * 80)
    
    # Connect to MongoDB
    print("\n[1/5] Connecting to MongoDB...")
    db = connect_to_mongodb()
    print("✓ Connected to MongoDB")
    
    # Export data
    print("\n[2/5] Exporting data from MongoDB...")
    users_df = export_users_data(db)
    packages_df = export_packages_data(db)
    events_df = export_events_data(db)
    
    print(f"✓ Data exported:")
    print(f"  - Users: {len(users_df)}")
    print(f"  - Packages: {len(packages_df)}")
    print(f"  - Events: {len(events_df)}")
    
    # Validate data
    if len(packages_df) == 0:
        print("⚠ Warning: No packages found. Cannot train model.")
        return False
    
    if len(events_df) == 0:
        print("⚠ Warning: No interaction events found. Creating minimal model...")
        # Create minimal fake interactions for initial model
        events_df = pd.DataFrame({
            'user_id': [users_df['user_id'].iloc[0]] * min(5, len(packages_df)),
            'event_type': ['view'] * min(5, len(packages_df)),
            'package_id': packages_df['package_id'].iloc[:min(5, len(packages_df))].tolist()
        })
    
    # Train model
    print("\n[3/5] Training hybrid recommendation model...")
    recommender = HybridRecommender()
    recommender.train(users_df, packages_df, events_df)
    
    # Save model
    print("\n[4/5] Saving model to disk...")
    recommender.save_model()
    
    # Test model
    print("\n[5/5] Testing model...")
    if len(users_df) > 0:
        test_user_id = users_df['user_id'].iloc[0]
        recommendations = recommender.recommend(test_user_id, n=5)
        print(f"✓ Test recommendations for user {test_user_id}:")
        for i, rec in enumerate(recommendations[:3], 1):
            print(f"  {i}. {rec.get('title', 'N/A')} (score: {rec.get('score', 0):.4f})")
    
    print("\n" + "=" * 80)
    print("MODEL TRAINING COMPLETE!")
    print("=" * 80)
    return True

if __name__ == '__main__':
    try:
        success = train_and_save_model()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error training model: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
