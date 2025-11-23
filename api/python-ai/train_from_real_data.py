"""
Train model from interactions.csv in data/ folder
"""

import os
import sys
from pathlib import Path
import pandas as pd
import pickle
from hybrid_recommender import HybridRecommender

def main():
    script_dir = Path(__file__).parent
    csv_path = script_dir / 'data' / 'interactions.csv'
    
    print("=" * 80)
    print("TRAINING MODEL FROM REAL USER DATA")
    print("=" * 80)
    
    print(f"\n[1/4] Loading interactions from {csv_path}...")
    
    if not csv_path.exists():
        print(f"❌ Error: File not found: {csv_path}")
        print("   Run: node scripts/export-to-csv.js first")
        sys.exit(1)
    
    # Load interactions
    df = pd.read_csv(csv_path)
    print(f"✓ Loaded {len(df)} interactions")
    print(f"  - Users: {df['user_id'].nunique()}")
    print(f"  - Packages: {df['package_id'].nunique()}")
    
    # Show sample
    print("\n  Sample interactions:")
    for idx, row in df.head(3).iterrows():
        print(f"    {row['user_id'][:8]}... → {row['package_title'][:30]} ({row['interaction_type']})")
    
    # Prepare data for training
    print("\n[2/4] Preparing training data...")
    
    # Create users dataframe
    users_df = pd.DataFrame({
        'user_id': df['user_id'].unique()
    })
    
    # Create events dataframe
    events_df = df[['user_id', 'package_id', 'interaction_type', 'timestamp']].copy()
    events_df.columns = ['user_id', 'package_id', 'event_type', 'timestamp']
    
    # Create packages dataframe with unique packages
    packages_df = df[['package_id', 'package_title', 'package_subject', 'package_price']].drop_duplicates('package_id')
    packages_df.columns = ['package_id', 'title', 'subject', 'price']
    
    # Create text embeddings as simple vectors (TF-IDF will handle this)
    # For now, create dummy embeddings - the model will compute them
    import json
    packages_df['text_embedding'] = packages_df.apply(
        lambda row: json.dumps([0.1] * 16),  # Dummy 16-dimensional vector
        axis=1
    )
    
    print(f"✓ Prepared {len(users_df)} users, {len(events_df)} events, {len(packages_df)} packages")
    
    # Train model
    print("\n[3/4] Training hybrid model...")
    model = HybridRecommender()
    model.train(users_df, packages_df, events_df)
    print("✓ Model trained successfully")
    
    # Save model
    model_path = script_dir / 'models' / 'hybrid_model.pkl'
    model_path.parent.mkdir(exist_ok=True)
    
    print(f"\n[4/4] Saving model to {model_path}...")
    
    # Save as dictionary (compatible with load_model method)
    model_data = {
        'svd': model.svd,
        'interaction_matrix': model.interaction_matrix,
        'predicted_scores_df': model.predicted_scores_df,
        'content_similarity_df': model.content_similarity_df,
        'packages_df': model.packages_df,
        'event_weights': model.event_weights
    }
    
    with open(model_path, 'wb') as f:
        pickle.dump(model_data, f)
    
    size_mb = model_path.stat().st_size / (1024 * 1024)
    print(f"✓ Model saved ({size_mb:.2f} MB)")
    
    # Test the model
    print("\n" + "=" * 80)
    print("TESTING MODEL")
    print("=" * 80)
    
    test_user_id = df['user_id'].iloc[0]
    print(f"\nGetting recommendations for user: {test_user_id}...")
    
    try:
        recommendations = model.recommend(test_user_id, n=5)
        if recommendations:
            print(f"✓ Generated {len(recommendations)} recommendations:")
            for i, rec in enumerate(recommendations, 1):
                pkg_title = packages_df[packages_df['package_id'] == rec['package_id']]['title'].iloc[0]
                print(f"  {i}. {pkg_title} (score: {rec['score']:.4f})")
        else:
            print("⚠ No recommendations generated (this is normal for very small datasets)")
    except Exception as e:
        print(f"⚠ Could not test recommendations: {e}")
    
    print("\n" + "=" * 80)
    print("✅ TRAINING COMPLETE!")
    print("=" * 80)
    print("\nRefresh your dashboard to see personalized recommendations!")

if __name__ == '__main__':
    main()
