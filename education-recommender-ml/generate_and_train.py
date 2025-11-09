#!/usr/bin/env python3
"""
Complete Educational Recommendation System
Generate data, train models, and test recommendations
"""

import sys
import os
sys.path.append('src')

from data_generator import EducationalDataGenerator
from recommendation_model import EducationalRecommendationSystem

def main():
    print("🎯 EDUCATIONAL RECOMMENDATION SYSTEM")
    print("=" * 60)
    
    # Step 1: Generate synthetic data
    print("\n🏗️ STEP 1: GENERATING SYNTHETIC DATA")
    print("-" * 40)
    
    generator = EducationalDataGenerator(seed=42)
    generator.generate_all()
    
    # Step 2: Train recommendation models
    print("\n🧠 STEP 2: TRAINING RECOMMENDATION MODELS")
    print("-" * 40)
    
    system = EducationalRecommendationSystem()
    system.load_data()
    system.train_all()
    system.save_models()
    
    # Step 3: Test the system
    print("\n🧪 STEP 3: TESTING RECOMMENDATIONS")
    print("-" * 40)
    
    # Get sample users
    students = system.users_df[system.users_df['isEducator'] == False]
    
    if len(students) > 0:
        sample_users = students.sample(min(3, len(students)))
        
        for _, user in sample_users.iterrows():
            user_id = user['_id']
            username = user['username']
            preferences = user.get('learningPreferences', {})
            
            print(f"\n👤 User: {username}")
            print(f"   Preferred subjects: {preferences.get('subjects', 'N/A')}")
            print(f"   Learning style: {preferences.get('learningStyle', 'N/A')}")
            
            # Get recommendations
            recommendations = system.get_recommendations(user_id, 5)
            
            print(f"   🎯 Top 5 Recommendations:")
            if recommendations:
                for i, rec in enumerate(recommendations, 1):
                    print(f"      {i}. {rec['title']} - ${rec['rate']} ({rec['method']})")
            else:
                print("      No recommendations available")
    
    print("\n🎉 SYSTEM SETUP COMPLETED!")
    print("\n📁 Generated Files:")
    print("   📂 data/")
    print("      ├── users.json")
    print("      ├── packages.json")
    print("      ├── interactions.json")
    print("      └── reviews.json")
    print("   📂 models/")
    print("      └── recommendation_system.pkl")

if __name__ == "__main__":
    main()
