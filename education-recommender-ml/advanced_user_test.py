import sys
sys.path.append('src')
from recommendation_model import EducationalRecommendationSystem
import pickle
import json

class UserTester:
    def __init__(self):
        self.system = EducationalRecommendationSystem()
        self.system.load_data()
        
        # Load models
        with open('models/recommendation_system.pkl', 'rb') as f:
            self.system.models = pickle.load(f)
    
    def show_user_profile(self, user_id):
        """Display detailed user information"""
        user = next((u for u in self.system.data['users'] if u['_id'] == user_id), None)
        
        if not user:
            print(f"❌ User {user_id} not found")
            return False
        
        print(f"\n👤 User Profile:")
        print(f"   ID: {user['_id']}")
        print(f"   Username: {user['username']}")
        print(f"   Email: {user['email']}")
        print(f"   Type: {'Educator' if user['isEducator'] else 'Student'}")
        
        if not user['isEducator']:
            prefs = user.get('learningPreferences', {})
            print(f"   Learning Preferences:")
            print(f"      Subjects: {prefs.get('subjects', 'N/A')}")
            print(f"      Learning Style: {prefs.get('learningStyle', 'N/A')}")
            print(f"      Session Duration: {prefs.get('sessionDuration', 'N/A')}")
        
        return True
    
    def show_user_history(self, user_id):
        """Show user's interaction history"""
        interactions = [i for i in self.system.data['interactions'] if i['userId'] == user_id]
        
        print(f"\n📊 Interaction History ({len(interactions)} interactions):")
        for interaction in interactions[-5:]:  # Show last 5
            package_id = interaction['packageId']
            package = next((p for p in self.system.data['packages'] if p['_id'] == package_id), {})
            package_title = package.get('title', 'Unknown Package')
            
            print(f"   {interaction['interactionType']}: {package_title} (Score: {interaction['score']:.1f})")
    
    def test_all_methods(self, user_id):
        """Test all recommendation methods for a user"""
        methods = ['content_based', 'collaborative', 'hybrid']
        
        print(f"\n🎯 Testing All Methods for User {user_id[:8]}...")
        
        for method in methods:
            print(f"\n📋 {method.upper()} RECOMMENDATIONS:")
            try:
                recs = self.system.get_recommendations(user_id, 3, method)
                if recs:
                    for i, rec in enumerate(recs, 1):
                        print(f"   {i}. {rec['title']} - ${rec['rate']}")
                else:
                    print("   No recommendations available")
            except Exception as e:
                print(f"   Error: {e}")
    
    def compare_users(self, user1_id, user2_id):
        """Compare recommendations for two users"""
        print(f"\n👥 COMPARING USERS:")
        
        for user_id, label in [(user1_id, "USER 1"), (user2_id, "USER 2")]:
            print(f"\n{label} ({user_id[:8]}...):")
            recs = self.system.get_recommendations(user_id, 3)
            for i, rec in enumerate(recs, 1):
                print(f"   {i}. {rec['title']} - ${rec['rate']}")
    
    def interactive_test(self):
        """Interactive testing interface"""
        print("🧪 ADVANCED USER TESTING INTERFACE")
        print("="*50)
        
        # Show available users
        students = [u for u in self.system.data['users'] if not u['isEducator']]
        print(f"\n📋 Available Students ({len(students)} total):")
        for i, user in enumerate(students[:10], 1):  # Show first 10
            print(f"   {i}. {user['username']} ({user['_id'][:8]}...)")
        
        while True:
            print(f"\n🎯 TEST OPTIONS:")
            print("1. Test specific user ID")
            print("2. Test by username")
            print("3. Compare two users") 
            print("4. Test all methods for user")
            print("5. Random user test")
            print("6. Exit")
            
            choice = input("\nSelect option (1-6): ").strip()
            
            if choice == '1':
                user_id = input("Enter user ID: ").strip()
                if self.show_user_profile(user_id):
                    self.show_user_history(user_id)
                    recs = self.system.get_recommendations(user_id, 5)
                    print(f"\n🎯 TOP 5 RECOMMENDATIONS:")
                    for i, rec in enumerate(recs, 1):
                        print(f"   {i}. {rec['title']} - ${rec['rate']} ({rec['method']})")
            
            elif choice == '2':
                username = input("Enter username: ").strip()
                user = next((u for u in students if u['username'].lower() == username.lower()), None)
                if user:
                    user_id = user['_id']
                    if self.show_user_profile(user_id):
                        recs = self.system.get_recommendations(user_id, 5)
                        print(f"\n🎯 TOP 5 RECOMMENDATIONS:")
                        for i, rec in enumerate(recs, 1):
                            print(f"   {i}. {rec['title']} - ${rec['rate']} ({rec['method']})")
                else:
                    print(f"❌ Username '{username}' not found")
            
            elif choice == '3':
                user1_id = input("Enter first user ID: ").strip()
                user2_id = input("Enter second user ID: ").strip()
                self.compare_users(user1_id, user2_id)
            
            elif choice == '4':
                user_id = input("Enter user ID: ").strip()
                self.test_all_methods(user_id)
            
            elif choice == '5':
                import random
                random_user = random.choice(students)
                user_id = random_user['_id']
                print(f"\n🎲 Testing random user: {random_user['username']}")
                if self.show_user_profile(user_id):
                    recs = self.system.get_recommendations(user_id, 5)
                    print(f"\n🎯 TOP 5 RECOMMENDATIONS:")
                    for i, rec in enumerate(recs, 1):
                        print(f"   {i}. {rec['title']} - ${rec['rate']} ({rec['method']})")
            
            elif choice == '6':
                print("👋 Goodbye!")
                break
            
            else:
                print("❌ Invalid option. Please try again.")

if __name__ == "__main__":
    tester = UserTester()
    tester.interactive_test()
