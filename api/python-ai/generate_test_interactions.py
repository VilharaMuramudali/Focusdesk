"""
Generate test interaction data for current logged-in user
This creates sample interactions so you can see ML recommendations immediately
"""

import os
import sys
from datetime import datetime, timedelta
import random
from dotenv import load_dotenv
from pymongo import MongoClient

# Load environment variables
load_dotenv()

# MongoDB connection
MONGO_URI = os.getenv('MONGO_URI')
if not MONGO_URI:
    print("Error: MONGO_URI not found in environment variables")
    sys.exit(1)

client = MongoClient(MONGO_URI)
db = client['FocusDesk']

def generate_interactions_for_user(user_id, num_interactions=50):
    """Generate test interactions for a specific user"""
    
    # Get available packages
    packages = list(db.packages.find({'isActive': True}).limit(20))
    if not packages:
        print("No packages found in database!")
        return
    
    print(f"Found {len(packages)} packages")
    print(f"Generating {num_interactions} interactions for user: {user_id}")
    
    interactions = []
    interaction_types = ['view', 'click', 'view', 'click', 'view']  # More views and clicks
    
    # Generate interactions over the past 30 days
    base_time = datetime.now()
    
    for i in range(num_interactions):
        # Random package
        package = random.choice(packages)
        
        # Random interaction type
        interaction_type = random.choice(interaction_types)
        
        # Random timestamp in the past 30 days
        days_ago = random.randint(0, 30)
        hours_ago = random.randint(0, 23)
        timestamp = base_time - timedelta(days=days_ago, hours=hours_ago)
        
        interaction = {
            'userId': user_id,
            'packageId': str(package['_id']),
            'interactionType': interaction_type,
            'timestamp': timestamp,
            'metadata': {
                'source': 'test_data_generation',
                'packageTitle': package.get('title', 'Unknown')
            }
        }
        
        interactions.append(interaction)
    
    # Insert interactions
    if interactions:
        result = db.interactions.insert_many(interactions)
        print(f"✅ Created {len(result.inserted_ids)} interactions")
        
        # Show summary
        print("\nInteraction Summary:")
        type_counts = {}
        for interaction in interactions:
            t = interaction['interactionType']
            type_counts[t] = type_counts.get(t, 0) + 1
        
        for itype, count in type_counts.items():
            print(f"  - {itype}: {count}")
        
        # Show some package titles
        print("\nPackages interacted with:")
        unique_packages = set(i['metadata']['packageTitle'] for i in interactions[:10])
        for title in list(unique_packages)[:5]:
            print(f"  - {title}")
    
    client.close()
    print("\n✅ Done! Now retrain the model with: python train_model.py")

if __name__ == '__main__':
    # Your actual user ID from the console logs
    USER_ID = '680a9116b88e07cba6d4572b'
    
    # Allow custom user ID from command line
    if len(sys.argv) > 1:
        USER_ID = sys.argv[1]
    
    # Allow custom number of interactions
    num_interactions = 50
    if len(sys.argv) > 2:
        num_interactions = int(sys.argv[2])
    
    print(f"Generating test interactions for user: {USER_ID}")
    generate_interactions_for_user(USER_ID, num_interactions)
