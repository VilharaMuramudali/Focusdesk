"""
Train the Hybrid Recommendation Model using CSV files
Alternative to train_model.py when MongoDB is unavailable
"""

import sys
import os
from pathlib import Path
import pandas as pd
import numpy as np
import json
from hybrid_recommender import HybridRecommender

def train_from_csv():
    """Train model using CSV files from ML/recommender_dataset/"""
    print("=" * 80)
    print("TRAINING HYBRID RECOMMENDATION MODEL FROM CSV")
    print("=" * 80)
    
    # Get paths
    script_dir = Path(__file__).parent
    data_dir = script_dir.parent.parent / 'ML' / 'recommender_dataset'
    
    print(f"\n[1/5] Loading CSV files from {data_dir}...")
    
    # Check if CSV files exist
    if not data_dir.exists():
        print(f"❌ Error: Data directory not found: {data_dir}")
        print(f"   Please ensure ML/recommender_dataset/ exists with CSV files")
        return False
    
    # Load CSV files
    try:
        users_df = pd.read_csv(data_dir / 'users.csv')
        packages_df = pd.read_csv(data_dir / 'packages.csv')
        events_df = pd.read_csv(data_dir / 'events.csv')
        
        # Rename columns to match expected format
        if 'userId' in events_df.columns:
            events_df = events_df.rename(columns={
                'userId': 'user_id',
                'eventType': 'event_type',
                'packageId': 'package_id'
            })
        
        if 'packageId' in packages_df.columns:
            packages_df = packages_df.rename(columns={'packageId': 'package_id'})
        
        print(f"✓ Data loaded successfully:")
        print(f"  - Users: {len(users_df)}")
        print(f"  - Packages: {len(packages_df)}")
        print(f"  - Events: {len(events_df)}")
        
    except FileNotFoundError as e:
        print(f"❌ Error: CSV file not found: {e}")
        print(f"   Required files: users.csv, packages.csv, events.csv")
        return False
    
    # Validate data
    if len(packages_df) == 0:
        print("⚠ Warning: No packages found. Cannot train model.")
        return False
    
    if len(events_df) == 0:
        print("⚠ Warning: No interaction events found.")
        print("   Creating minimal synthetic interactions for initial model...")
        # Create minimal interactions
        events_df = pd.DataFrame({
            'user_id': ['user_00001'] * min(10, len(packages_df)),
            'event_type': ['view'] * min(10, len(packages_df)),
            'package_id': packages_df['package_id'].iloc[:min(10, len(packages_df))].tolist()
        })
    
    # Ensure user_id column exists in users_df
    if 'user_id' not in users_df.columns and 'userId' in users_df.columns:
        users_df['user_id'] = users_df['userId']
    elif 'user_id' not in users_df.columns:
        users_df['user_id'] = users_df.index.astype(str)
    
    # Train model
    print("\n[2/5] Training hybrid recommendation model...")
    recommender = HybridRecommender()
    
    try:
        recommender.train(users_df, packages_df, events_df)
    except Exception as e:
        print(f"❌ Error during training: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    # Save model
    print("\n[3/5] Saving model to disk...")
    try:
        recommender.save_model()
    except Exception as e:
        print(f"❌ Error saving model: {e}")
        return False
    
    # Test model
    print("\n[4/5] Testing model...")
    try:
        if len(users_df) > 0:
            test_user_id = users_df['user_id'].iloc[0]
            recommendations = recommender.recommend(test_user_id, n=5)
            print(f"✓ Test recommendations for user {test_user_id}:")
            for i, rec in enumerate(recommendations[:3], 1):
                print(f"  {i}. {rec.get('title', 'N/A')} (score: {rec.get('score', 0):.4f})")
    except Exception as e:
        print(f"⚠ Warning: Test failed but model is saved: {e}")
    
    print("\n[5/5] Verifying model file...")
    model_path = Path(__file__).parent / 'models' / 'hybrid_model.pkl'
    if model_path.exists():
        size_mb = model_path.stat().st_size / (1024 * 1024)
        print(f"✓ Model file exists: {model_path}")
        print(f"  Size: {size_mb:.2f} MB")
    else:
        print(f"❌ Warning: Model file not found at {model_path}")
        return False
    
    print("\n" + "=" * 80)
    print("MODEL TRAINING COMPLETE!")
    print("=" * 80)
    print("\nYou can now use the recommendation API:")
    print("  GET /api/recommend/personalized?limit=5")
    print("  GET /api/recommend/similar/:packageId?limit=5")
    return True

if __name__ == '__main__':
    try:
        success = train_from_csv()
        sys.exit(0 if success else 1)
    except Exception as e:
        print(f"\n❌ Error training model: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
