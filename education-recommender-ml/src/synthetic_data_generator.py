import pandas as pd
import numpy as np
import random
from datetime import datetime, timedelta
import json
from faker import Faker
from collections import defaultdict
import uuid

class EducationalPlatformDataGenerator:
    """
    Generate synthetic data that matches your MERN backend models
    for training the recommendation system
    """
    
    def __init__(self, seed=42):
        random.seed(seed)
        np.random.seed(seed)
        self.fake = Faker()
        Faker.seed(seed)
        
        # Configuration
        self.subjects = [
            'Programming', 'Web Development', 'Data Science', 'Machine Learning',
            'Mobile Development', 'DevOps', 'Cybersecurity', 'UI/UX Design',
            'Digital Marketing', 'Business Analytics', 'Mathematics', 'Physics',
            'Chemistry', 'Biology', 'English', 'History', 'Economics', 'Psychology'
        ]
        
        self.programming_keywords = [
            'javascript', 'python', 'react', 'node.js', 'java', 'c++', 'html', 'css',
            'angular', 'vue', 'typescript', 'mongodb', 'sql', 'aws', 'docker', 'git'
        ]
        
        self.learning_styles = ['visual', 'auditory', 'kinesthetic', 'reading']
        self.session_durations = ['30min', '1hour', '2hours']
        self.academic_levels = ['highschool', 'university', 'postgraduate']
        self.teaching_styles = ['structured', 'flexible', 'interactive', 'theoretical', 'practical']
        
        # Generated data storage
        self.users = []
        self.educator_profiles = []
        self.packages = []
        self.bookings = []
        self.reviews = []
        self.session_histories = []
        self.user_interactions = []
        self.conversations = []
        
        # ID mappings
        self.user_ids = []
        self.educator_ids = []
        self.student_ids = []
        self.package_ids = []
        
    def generate_users(self, n_students=800, n_educators=200):
        """Generate realistic users (students and educators)"""
        print(f"🧑‍🎓 Generating {n_students} students and {n_educators} educators...")
        
        total_users = n_students + n_educators
        
        for i in range(total_users):
            is_educator = i >= n_students
            user_id = str(uuid.uuid4())
            
            # Basic user info
            username = self.fake.user_name()
            email = f"{username}@{self.fake.domain_name()}"
            
            user = {
                '_id': user_id,
                'username': username,
                'email': email,
                'password': 'hashed_password',
                'img': self.fake.image_url(width=200, height=200),
                'country': self.fake.country(),
                'phone': self.fake.phone_number(),
                'desc': self.fake.text(max_nb_chars=200),
                'isEducator': is_educator,
                'subjects': random.sample(self.subjects, random.randint(1, 3)),
                'bio': self.fake.text(max_nb_chars=300),
                'educationLevel': random.choice(['high_school', 'bachelors', 'masters', 'phd']),
                'createdAt': self.fake.date_time_between(start_date='-2y', end_date='now'),
                'updatedAt': datetime.now()
            }
            
            if is_educator:
                # Educator-specific fields
                user['teachingProfile'] = {
                    'expertise': [
                        {
                            'subject': subject,
                            'proficiencyLevel': random.randint(6, 10),
                            'yearsExperience': random.randint(2, 15)
                        }
                        for subject in random.sample(self.subjects, random.randint(2, 4))
                    ],
                    'teachingStyle': random.choice(self.teaching_styles),
                    'averageRating': round(random.uniform(3.5, 5.0), 1),
                    'totalSessions': random.randint(10, 500),
                    'responseTimeHours': random.choice([1, 2, 4, 8, 12, 24])
                }
                self.educator_ids.append(user_id)
            else:
                # Student-specific fields
                user['learningPreferences'] = {
                    'subjects': random.sample(self.subjects, random.randint(1, 4)),
                    'learningStyle': random.choice(self.learning_styles),
                    'sessionDuration': random.choice(self.session_durations),
                    'timePreferences': random.sample(['morning', 'afternoon', 'evening', 'weekend'], 
                                                   random.randint(1, 3)),
                    'academicLevel': random.choice(self.academic_levels)
                }
                self.student_ids.append(user_id)
            
            # AI behavior tracking
            user['aiFeatures'] = {
                'learningVector': [random.uniform(-1, 1) for _ in range(50)],
                'lastActive': self.fake.date_time_between(start_date='-30d', end_date='now'),
                'interactionCount': random.randint(0, 100)
            }
            
            self.users.append(user)
            self.user_ids.append(user_id)
        
        print(f"✅ Generated {len(self.users)} users")
        return self.users
    
    def generate_educator_profiles(self):
        """Generate detailed educator profiles"""
        print(f"👨‍🏫 Generating educator profiles...")
        
        for educator_id in self.educator_ids:
            educator_user = next(u for u in self.users if u['_id'] == educator_id)
            
            profile = {
                '_id': str(uuid.uuid4()),
                'userId': educator_id,
                'name': educator_user['username'],
                'bio': self.fake.text(max_nb_chars=500),
                'qualifications': self.fake.text(max_nb_chars=300),
                'rating': educator_user['teachingProfile']['averageRating'],
                'totalRatings': random.randint(5, 100),
                'available': random.choice(['Available', 'Busy', 'Away']),
                'timeSlots': random.sample([
                    '09:00-10:00', '10:00-11:00', '11:00-12:00', '14:00-15:00',
                    '15:00-16:00', '16:00-17:00', '18:00-19:00', '19:00-20:00'
                ], random.randint(3, 6)),
                'hourlyRate': random.randint(15, 100),
                'languages': random.sample(['English', 'Spanish', 'French', 'German', 'Italian'], 
                                         random.randint(1, 3)),
                'subjects': educator_user['subjects'],
                'introVideo': self.fake.url(),
                'createdAt': educator_user['createdAt'],
                'updatedAt': datetime.now()
            }
            
            self.educator_profiles.append(profile)
        
        print(f"✅ Generated {len(self.educator_profiles)} educator profiles")
        return self.educator_profiles
    
    def generate_packages(self, packages_per_educator=(3, 8)):
        """Generate session packages"""
        print(f"📦 Generating session packages...")
        
        for educator_id in self.educator_ids:
            educator_user = next(u for u in self.users if u['_id'] == educator_id)
            n_packages = random.randint(*packages_per_educator)
            
            for _ in range(n_packages):
                package_id = str(uuid.uuid4())
                subject = random.choice(educator_user['subjects'])
                
                # Generate realistic titles based on subject
                title_templates = {
                    'Programming': ['Learn {}', '{} Fundamentals', 'Master {}', '{} for Beginners'],
                    'Web Development': ['Build {} Apps', '{} Complete Course', 'Modern {}', '{} Bootcamp'],
                    'Data Science': ['{} Analytics', 'Data {} Mastery', '{} for Data Science', 'Advanced {}'],
                    'Machine Learning': ['{} ML Course', 'AI with {}', '{} Algorithms', 'Deep {}']
                }
                
                template = random.choice(title_templates.get(subject, ['{} Course', 'Learn {}', 'Master {}']))
                technology = random.choice(self.programming_keywords) if 'Programming' in subject else subject
                
                package = {
                    '_id': package_id,
                    'educatorId': educator_id,
                    'thumbnail': self.fake.image_url(width=400, height=300),
                    'title': template.format(technology.title()),
                    'description': self.fake.text(max_nb_chars=500),
                    'keywords': random.sample(self.programming_keywords, random.randint(3, 8)),
                    'rate': random.randint(20, 150),
                    'video': self.fake.url(),
                    'isActive': random.choice([True, True, True, False]),
                    'sessions': random.randint(1, 10),
                    'languages': random.sample(['English', 'Spanish', 'French'], random.randint(1, 2)),
                    'createdAt': self.fake.date_time_between(start_date='-1y', end_date='now'),
                    'updatedAt': datetime.now()
                }
                
                self.packages.append(package)
                self.package_ids.append(package_id)
        
        print(f"✅ Generated {len(self.packages)} session packages")
        return self.packages
    
    def generate_user_interactions(self, interactions_per_user=(10, 50)):
        """Generate user interaction history"""
        print(f"🔄 Generating user interactions...")
        
        interaction_types = ['view', 'click', 'bookmark', 'share', 'message', 'book', 'cancel']
        interaction_weights = [0.4, 0.25, 0.1, 0.05, 0.1, 0.08, 0.02]
        
        for student_id in self.student_ids:
            student_user = next(u for u in self.users if u['_id'] == student_id)
            n_interactions = random.randint(*interactions_per_user)
            
            # Get student's preferred subjects
            preferred_subjects = student_user['learningPreferences']['subjects']
            
            for _ in range(n_interactions):
                interaction_type = np.random.choice(interaction_types, p=interaction_weights)
                
                # Select package based on student preferences (80% match, 20% random)
                if random.random() < 0.8:
                    # Prefer packages matching student's subjects
                    matching_packages = [
                        p for p in self.packages 
                        if any(subj in preferred_subjects for subj in [
                            next(u for u in self.users if u['_id'] == p['educatorId'])['subjects']
                        ][0])
                    ]
                    package = random.choice(matching_packages if matching_packages else self.packages)
                else:
                    # Random package
                    package = random.choice(self.packages)
                
                interaction = {
                    '_id': str(uuid.uuid4()),
                    'userId': student_id,
                    'packageId': package['_id'],
                    'targetId': package['educatorId'],
                    'interactionType': interaction_type,
                    'context': {
                        'searchQuery': random.choice(preferred_subjects + ['']) if random.random() < 0.3 else '',
                        'deviceType': random.choice(['desktop', 'mobile', 'tablet']),
                        'location': self.fake.city(),
                        'sessionDuration': random.randint(30, 600)
                    },
                    'metadata': {
                        'isRecommendation': random.choice([True, False]),
                        'recommendationRank': random.randint(1, 10) if random.choice([True, False]) else None,
                        'algorithmUsed': random.choice(['collaborative', 'content', 'hybrid', 'trending'])
                    },
                    'createdAt': self.fake.date_time_between(start_date='-6m', end_date='now'),
                    'updatedAt': datetime.now()
                }
                
                self.user_interactions.append(interaction)
        
        print(f"✅ Generated {len(self.user_interactions)} user interactions")
        return self.user_interactions
    
    def generate_bookings(self, booking_probability=0.15):
        """Generate bookings based on user interactions"""
        print(f"📅 Generating bookings...")
        
        # Get 'book' interactions to create bookings
        book_interactions = [i for i in self.user_interactions if i['interactionType'] == 'book']
        
        for interaction in book_interactions:
            if random.random() > booking_probability:
                continue
            
            package = next(p for p in self.packages if p['_id'] == interaction['packageId'])
            booking_id = str(uuid.uuid4())
            
            # Generate session dates
            sessions = []
            start_date = self.fake.date_time_between(start_date='-3m', end_date='+1m')
            
            for session_num in range(package['sessions']):
                session_date = start_date + timedelta(days=session_num * 7)
                sessions.append({
                    'date': session_date,
                    'time': random.choice(['09:00', '10:00', '14:00', '15:00', '16:00', '18:00']),
                    'duration': random.choice([60, 90, 120]),
                    'status': random.choice(['scheduled', 'completed', 'cancelled']),
                    'notes': self.fake.text(max_nb_chars=100) if random.random() < 0.3 else ''
                })
            
            booking = {
                '_id': booking_id,
                'packageId': package['_id'],
                'educatorId': package['educatorId'],
                'studentId': interaction['userId'],
                'status': random.choice(['pending', 'confirmed', 'completed', 'cancelled']),
                'sessions': sessions,
                'totalAmount': package['rate'] * package['sessions'],
                'paymentStatus': random.choice(['pending', 'paid', 'refunded']),
                'paymentIntent': f"pi_{uuid.uuid4().hex[:24]}",
                'packageDetails': {
                    'title': package['title'],
                    'description': package['description'],
                    'rate': package['rate'],
                    'sessions': package['sessions']
                },
                'studentNotes': self.fake.text(max_nb_chars=200) if random.random() < 0.4 else '',
                'educatorNotes': self.fake.text(max_nb_chars=200) if random.random() < 0.3 else '',
                'createdAt': interaction['createdAt'],
                'updatedAt': datetime.now()
            }
            
            self.bookings.append(booking)
        
        print(f"✅ Generated {len(self.bookings)} bookings")
        return self.bookings
    
    def generate_session_histories(self):
        """Generate detailed session histories for completed bookings - FIXED VERSION"""
        print(f"📊 Generating session histories...")
        
        completed_bookings = [b for b in self.bookings if b['status'] == 'completed']
        
        for booking in completed_bookings:
            completed_sessions = [s for s in booking['sessions'] if s['status'] == 'completed']
            
            for session in completed_sessions:
                session_id = str(uuid.uuid4())
                
                # Calculate performance metrics
                student_rating = random.randint(3, 5) if random.random() < 0.8 else random.randint(1, 5)
                completion_rate = random.randint(70, 100) if student_rating >= 4 else random.randint(30, 90)
                engagement_score = min(100, completion_rate + random.randint(-10, 20))
                
                # Get package info for subject
                package = next(p for p in self.packages if p['_id'] == booking['packageId'])
                educator = next(u for u in self.users if u['_id'] == booking['educatorId'])
                main_subject = random.choice(educator['subjects'])
                
                # FIXED: Safe keyword handling
                keywords = package.get('keywords', [])
                if not keywords:
                    topics = []
                    concepts_learned = []
                    areas_of_difficulty = []
                else:
                    # Safe sampling for topics
                    sample_size = random.randint(1, min(len(keywords), 5))
                    topics = random.sample(keywords, sample_size)
                    
                    # Safe sampling for learning outcomes
                    concepts_count = random.randint(1, min(len(keywords), 4))
                    concepts_learned = random.sample(keywords, concepts_count)
                    
                    difficulty_count = random.randint(0, min(len(keywords), 2))
                    areas_of_difficulty = random.sample(keywords, difficulty_count) if difficulty_count > 0 else []
                
                session_history = {
                    '_id': session_id,
                    'userId': booking['studentId'],
                    'educatorId': booking['educatorId'],
                    'bookingId': booking['_id'],
                    'sessionData': {
                        'duration': session['duration'],
                        'subject': main_subject,
                        'topics': topics,  # FIXED: Safe sampling
                        'difficulty': random.choice(['beginner', 'intermediate', 'advanced']),
                        'scheduledDate': session['date'],
                        'actualStartTime': session['date'],
                        'actualEndTime': session['date'] + timedelta(minutes=session['duration']),
                        'platform': random.choice(['zoom', 'teams', 'skype', 'google_meet']),
                        'meetingLink': self.fake.url(),
                        'recordingUrl': self.fake.url() if random.random() < 0.6 else ''
                    },
                    'performance': {
                        'studentRating': student_rating,
                        'educatorRating': random.randint(3, 5),
                        'completionRate': completion_rate,
                        'engagementScore': engagement_score,
                        'attendanceStatus': 'attended'
                    },
                    'learningOutcomes': {
                        'conceptsLearned': concepts_learned,  # FIXED: Safe sampling
                        'skillsImproved': random.sample(['problem-solving', 'critical-thinking', 'communication'], 
                                                     random.randint(1, 3)),
                        'areasOfDifficulty': areas_of_difficulty,  # FIXED: Safe sampling
                        'nextSteps': [self.fake.sentence() for _ in range(random.randint(1, 3))],
                        'overallProgress': min(100, completion_rate + random.randint(-5, 15))
                    },
                    'feedback': {
                        'studentFeedback': {
                            'rating': student_rating,
                            'comment': self.fake.text(max_nb_chars=200) if random.random() < 0.7 else '',
                            'suggestions': self.fake.text(max_nb_chars=150) if random.random() < 0.4 else '',
                            'wouldRecommend': student_rating >= 4
                        },
                        'educatorFeedback': {
                            'rating': random.randint(3, 5),
                            'comment': self.fake.text(max_nb_chars=200) if random.random() < 0.6 else '',
                            'studentPerformance': random.choice(['excellent', 'good', 'satisfactory', 'needs improvement']),
                            'improvementAreas': random.sample(['time management', 'practice', 'theory understanding'], 
                                                           random.randint(0, 2))
                        }
                    },
                    'metadata': {
                        'platform': 'web',
                        'location': {
                            'country': self.fake.country(),
                            'city': self.fake.city(),
                            'timezone': random.choice(['UTC', 'EST', 'PST', 'GMT'])
                        },
                        'deviceInfo': {
                            'deviceType': random.choice(['desktop', 'tablet', 'mobile']),
                            'browser': random.choice(['Chrome', 'Firefox', 'Safari', 'Edge']),
                            'os': random.choice(['Windows', 'macOS', 'iOS', 'Android', 'Linux'])
                        },
                        'technicalIssues': random.sample(['audio', 'video', 'connection'], random.randint(0, 1)),
                        'sessionQuality': random.choice(['excellent', 'good', 'fair', 'poor'])
                    },
                    'createdAt': session['date'],
                    'updatedAt': datetime.now()
                }
                
                self.session_histories.append(session_history)
        
        print(f"✅ Generated {len(self.session_histories)} session histories")
        return self.session_histories
    
    def generate_reviews(self):
        """Generate reviews for completed sessions"""
        print(f"⭐ Generating reviews...")
        
        for session_history in self.session_histories:
            if random.random() < 0.7:  # 70% of sessions get reviews
                review_id = str(uuid.uuid4())
                
                # Get related data
                booking = next(b for b in self.bookings if b['_id'] == session_history['bookingId'])
                package = next(p for p in self.packages if p['_id'] == booking['packageId'])
                educator = next(u for u in self.users if u['_id'] == session_history['educatorId'])
                
                student_rating = session_history['performance']['studentRating']
                
                # Generate category ratings around the overall rating
                categories = {
                    'overallExperience': min(5, max(1, student_rating + random.randint(-1, 1))),
                    'teachingQuality': min(5, max(1, student_rating + random.randint(-1, 1))),
                    'communication': min(5, max(1, student_rating + random.randint(-1, 1))),
                    'punctuality': min(5, max(1, student_rating + random.randint(-1, 1))),
                    'valueForMoney': min(5, max(1, student_rating + random.randint(-1, 1)))
                }
                
                review = {
                    '_id': review_id,
                    'studentId': session_history['userId'],
                    'educatorId': session_history['educatorId'],
                    'packageId': booking['packageId'],
                    'sessionId': session_history['_id'],
                    'overallRating': student_rating,
                    'review': self.fake.text(max_nb_chars=400) if random.random() < 0.8 else '',
                    'categories': categories,
                    'sessionDate': session_history['sessionData']['scheduledDate'],
                    'packageTitle': package['title'],
                    'educatorName': educator['username'],
                    'isVerified': random.choice([True, False]),
                    'helpfulCount': random.randint(0, 20),
                    'reported': False,
                    'createdAt': session_history['createdAt'] + timedelta(days=random.randint(0, 7)),
                    'updatedAt': datetime.now()
                }
                
                self.reviews.append(review)
        
        print(f"✅ Generated {len(self.reviews)} reviews")
        return self.reviews
    
    def save_to_files(self, output_dir='synthetic_data'):
        """Save all generated data to JSON files"""
        import os
        os.makedirs(output_dir, exist_ok=True)
        
        datasets = {
            'users': self.users,
            'educator_profiles': self.educator_profiles,
            'packages': self.packages,
            'bookings': self.bookings,
            'reviews': self.reviews,
            'session_histories': self.session_histories,
            'user_interactions': self.user_interactions
        }
        
        for name, data in datasets.items():
            filepath = f"{output_dir}/{name}.json"
            with open(filepath, 'w') as f:
                json.dump(data, f, indent=2, default=str)
            print(f"💾 Saved {len(data)} {name} to {filepath}")
        
        # Save summary statistics
        stats = {
            'generation_date': datetime.now().isoformat(),
            'total_users': len(self.users),
            'students': len(self.student_ids),
            'educators': len(self.educator_ids),
            'packages': len(self.packages),
            'bookings': len(self.bookings),
            'reviews': len(self.reviews),
            'session_histories': len(self.session_histories),
            'user_interactions': len(self.user_interactions),
            'subjects': self.subjects,
            'user_id_mappings': {
                'all_users': self.user_ids,
                'students': self.student_ids,
                'educators': self.educator_ids,
                'packages': self.package_ids
            }
        }
        
        with open(f"{output_dir}/dataset_summary.json", 'w') as f:
            json.dump(stats, f, indent=2, default=str)
        
        print(f"\n📊 Dataset Summary:")
        print(f"   👥 Total Users: {stats['total_users']}")
        print(f"   🧑‍🎓 Students: {stats['students']}")
        print(f"   👨‍🏫 Educators: {stats['educators']}")
        print(f"   📦 Packages: {stats['packages']}")
        print(f"   📅 Bookings: {stats['bookings']}")
        print(f"   ⭐ Reviews: {stats['reviews']}")
        print(f"   📊 Session Histories: {stats['session_histories']}")
        print(f"   🔄 User Interactions: {stats['user_interactions']}")
        
    def generate_complete_dataset(self, n_students=800, n_educators=200):
        """Generate complete synthetic dataset"""
        print("🚀 GENERATING COMPLETE SYNTHETIC DATASET")
        print("=" * 60)
        
        # Generate all data in order
        self.generate_users(n_students, n_educators)
        self.generate_educator_profiles()
        self.generate_packages()
        self.generate_user_interactions()
        self.generate_bookings()
        self.generate_session_histories()
        self.generate_reviews()
        
        # Save to files
        self.save_to_files()
        
        print("\n🎉 SYNTHETIC DATASET GENERATION COMPLETED!")
        return {
            'users': self.users,
            'educator_profiles': self.educator_profiles,
            'packages': self.packages,
            'bookings': self.bookings,
            'reviews': self.reviews,
            'session_histories': self.session_histories,
            'user_interactions': self.user_interactions
        }

if __name__ == "__main__":
    generator = EducationalPlatformDataGenerator()
    dataset = generator.generate_complete_dataset(
        n_students=1000,
        n_educators=200
    )
