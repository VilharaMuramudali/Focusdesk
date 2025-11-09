import json
import random
import uuid
from faker import Faker
from datetime import datetime, timedelta
import os

class EducationalDataGenerator:
    def __init__(self, seed=42):
        random.seed(seed)
        self.fake = Faker()
        Faker.seed(seed)
        
        self.subjects = ['Programming', 'Web Development', 'Data Science', 'UI/UX Design', 'Digital Marketing']
        self.keywords = ['python', 'javascript', 'react', 'html', 'css', 'sql', 'mongodb']
        
        # Data storage
        self.users = []
        self.packages = []
        self.interactions = []
        self.reviews = []
        
    def generate_users(self, n_students=500, n_educators=100):
        """Generate users (students and educators)"""
        print(f"👥 Generating {n_students} students and {n_educators} educators...")
        
        total_users = n_students + n_educators
        
        for i in range(total_users):
            is_educator = i >= n_students
            user_id = str(uuid.uuid4())
            
            user = {
                '_id': user_id,
                'username': self.fake.user_name(),
                'email': self.fake.email(),
                'isEducator': is_educator,
                'subjects': random.sample(self.subjects, random.randint(1, 3)),
                'createdAt': self.fake.date_time_between(start_date='-1y', end_date='now').isoformat()
            }
            
            if is_educator:
                user['teachingProfile'] = {
                    'averageRating': round(random.uniform(3.5, 5.0), 1),
                    'totalSessions': random.randint(10, 200)
                }
            else:
                user['learningPreferences'] = {
                    'subjects': random.sample(self.subjects, random.randint(1, 3)),
                    'learningStyle': random.choice(['visual', 'auditory', 'hands-on']),
                    'sessionDuration': random.choice(['30min', '1hour', '2hours'])
                }
            
            self.users.append(user)
        
        print(f"✅ Generated {len(self.users)} users")
        return self.users
    
    def generate_packages(self):
        """Generate session packages"""
        print("📦 Generating session packages...")
        
        educators = [u for u in self.users if u['isEducator']]
        
        for educator in educators:
            n_packages = random.randint(2, 5)
            
            for _ in range(n_packages):
                package_id = str(uuid.uuid4())
                subject = random.choice(educator['subjects'])
                
                package = {
                    '_id': package_id,
                    'educatorId': educator['_id'],
                    'title': f"{subject} Course by {educator['username']}",
                    'description': self.fake.text(max_nb_chars=300),
                    'keywords': random.sample(self.keywords, random.randint(2, 5)),  # Safe sampling
                    'rate': random.randint(30, 150),
                    'sessions': random.randint(1, 8),
                    'isActive': True,
                    'createdAt': self.fake.date_time_between(start_date='-6m', end_date='now').isoformat()
                }
                
                self.packages.append(package)
        
        print(f"✅ Generated {len(self.packages)} packages")
        return self.packages
    
    def generate_interactions(self):
        """Generate user interactions"""
        print("🔄 Generating user interactions...")
        
        students = [u for u in self.users if not u['isEducator']]
        
        for student in students:
            n_interactions = random.randint(5, 20)
            
            # Prefer packages matching student interests
            preferred_subjects = student['learningPreferences']['subjects']
            relevant_packages = [
                p for p in self.packages 
                if any(subj in preferred_subjects for subj in [random.choice(self.subjects)])
            ]
            
            if not relevant_packages:
                relevant_packages = self.packages
            
            for _ in range(n_interactions):
                package = random.choice(relevant_packages if random.random() < 0.7 else self.packages)
                
                interaction = {
                    '_id': str(uuid.uuid4()),
                    'userId': student['_id'],
                    'packageId': package['_id'],
                    'interactionType': random.choice(['view', 'click', 'bookmark', 'book']),
                    'score': random.uniform(1, 5),
                    'createdAt': self.fake.date_time_between(start_date='-3m', end_date='now').isoformat()
                }
                
                self.interactions.append(interaction)
        
        print(f"✅ Generated {len(self.interactions)} interactions")
        return self.interactions
    
    def generate_reviews(self):
        """Generate reviews for interactions"""
        print("⭐ Generating reviews...")
        
        # Generate reviews for some interactions
        sample_interactions = random.sample(self.interactions, min(200, len(self.interactions)))
        
        for interaction in sample_interactions:
            if random.random() < 0.6:  # 60% chance of review
                review = {
                    '_id': str(uuid.uuid4()),
                    'studentId': interaction['userId'],
                    'packageId': interaction['packageId'],
                    'overallRating': random.randint(3, 5) if random.random() < 0.8 else random.randint(1, 5),
                    'review': self.fake.text(max_nb_chars=200),
                    'createdAt': interaction['createdAt']
                }
                
                self.reviews.append(review)
        
        print(f"✅ Generated {len(self.reviews)} reviews")
        return self.reviews
    
    def save_data(self, output_dir='data'):
        """Save all generated data"""
        os.makedirs(output_dir, exist_ok=True)
        
        datasets = {
            'users': self.users,
            'packages': self.packages,
            'interactions': self.interactions,
            'reviews': self.reviews
        }
        
        for name, data in datasets.items():
            filepath = f"{output_dir}/{name}.json"
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            print(f"💾 Saved {len(data)} {name} to {filepath}")
        
        # Save summary
        summary = {
            'total_users': len(self.users),
            'students': len([u for u in self.users if not u['isEducator']]),
            'educators': len([u for u in self.users if u['isEducator']]),
            'packages': len(self.packages),
            'interactions': len(self.interactions),
            'reviews': len(self.reviews),
            'generated_at': datetime.now().isoformat()
        }
        
        with open(f"{output_dir}/summary.json", 'w') as f:
            json.dump(summary, f, indent=2)
        
        print(f"\n📊 Summary:")
        for key, value in summary.items():
            if isinstance(value, int):
                print(f"   {key}: {value}")
    
    def generate_all(self):
        """Generate complete dataset"""
        print("🚀 GENERATING COMPLETE EDUCATIONAL DATASET")
        print("=" * 50)
        
        self.generate_users()
        self.generate_packages()
        self.generate_interactions()
        self.generate_reviews()
        self.save_data()
        
        print("\n🎉 DATA GENERATION COMPLETED!")

if __name__ == "__main__":
    generator = EducationalDataGenerator()
    generator.generate_all()
