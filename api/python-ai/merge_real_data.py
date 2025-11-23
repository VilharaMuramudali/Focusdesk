"""
Merge real user data into the test dataset for training
"""

import pandas as pd
from pathlib import Path

script_dir = Path(__file__).parent
real_data_path = script_dir / 'data' / 'interactions.csv'
ml_data_dir = script_dir.parent.parent / 'ML' / 'recommender_dataset'

print("=" * 80)
print("MERGING REAL USER DATA WITH TEST DATASET")
print("=" * 80)

# Load real user interactions
print(f"\n[1/4] Loading real user data from {real_data_path}...")
real_df = pd.read_csv(real_data_path)
print(f"✓ Loaded {len(real_df)} real interactions from {real_df['user_id'].nunique()} users")

# Load test dataset
print(f"\n[2/4] Loading test dataset from {ml_data_dir}...")
test_events = pd.read_csv(ml_data_dir / 'events.csv')
test_packages = pd.read_csv(ml_data_dir / 'packages.csv')
test_users = pd.read_csv(ml_data_dir / 'users.csv')
print(f"✓ Test dataset: {len(test_events)} events, {len(test_packages)} packages, {len(test_users)} users")

# Convert real data to match test format
print(f"\n[3/4] Converting real data to test format...")

# Map real package IDs to test package IDs (use first 13 test packages)
real_package_ids = real_df['package_id'].unique()
test_package_ids = test_packages['packageId'].head(13).tolist()
package_id_mapping = dict(zip(real_package_ids, test_package_ids))

# Create new events from real data
new_events = []
for _, row in real_df.iterrows():
    new_events.append({
        'userId': row['user_id'],
        'packageId': package_id_mapping.get(row['package_id'], test_package_ids[0]),
        'eventType': row['interaction_type'],
        'timestamp': row['timestamp']
    })

new_events_df = pd.DataFrame(new_events)
print(f"✓ Created {len(new_events_df)} new events")

# Add real users to users dataset
real_user_ids = real_df['user_id'].unique()
new_users = []
for user_id in real_user_ids:
    if user_id not in test_users['userId'].values:
        new_users.append({'userId': user_id})

if new_users:
    new_users_df = pd.DataFrame(new_users)
    test_users = pd.concat([test_users, new_users_df], ignore_index=True)
    print(f"✓ Added {len(new_users)} new users")

# Merge events
merged_events = pd.concat([test_events, new_events_df], ignore_index=True)
print(f"✓ Total events: {len(merged_events)}")

# Save merged dataset
print(f"\n[4/4] Saving merged dataset...")
merged_events.to_csv(ml_data_dir / 'events.csv', index=False)
test_users.to_csv(ml_data_dir / 'users.csv', index=False)

print(f"✓ Saved to {ml_data_dir}")
print(f"  - events.csv: {len(merged_events)} rows")
print(f"  - users.csv: {len(test_users)} rows")
print(f"  - packages.csv: {len(test_packages)} rows (unchanged)")

print("\n" + "=" * 80)
print("✅ MERGE COMPLETE!")
print("=" * 80)
print("\nNow retrain the model with: python train_from_csv.py")
print(f"\nReal user IDs added: {list(real_user_ids)}")
