import pandas as pd
import numpy as np
import sys
import json
from collections import defaultdict

sys.path.append('src')

class AccuracyMeasurer:
    def __init__(self, recommendation_system):
        self.system = recommendation_system
        self.results = {}
    
    def load_test_data(self):
        """Load and prepare test data"""
        print("📊 Loading test interactions...")
        
        # Load interactions
        interactions_df = pd.DataFrame(self.system.data['interactions'])
        
        # Split into train/test by time or randomly
        from sklearn.model_selection import train_test_split
        
        # Group by users to ensure each user has data in both sets
        user_test_data = {}
        user_train_data = {}
        
        for user_id in interactions_df['userId'].unique():
            user_data = interactions_df[interactions_df['userId'] == user_id]
            
            if len(user_data) > 1:
                train, test = train_test_split(user_data, test_size=0.3, random_state=42)
                user_train_data[user_id] = set(train['packageId'].tolist())
                user_test_data[user_id] = set(test['packageId'].tolist())
            else:
                user_train_data[user_id] = set(user_data['packageId'].tolist())
                user_test_data[user_id] = set()
        
        self.test_data = user_test_data
        self.train_data = user_train_data
        
        # Filter users with test data
        self.test_users = [uid for uid, items in user_test_data.items() if items]
        
        print(f"✅ Test data prepared for {len(self.test_users)} users")
    
    def calculate_accuracy_metrics(self, k_values=[5, 10, 20]):
        """Calculate all accuracy metrics"""
        print("🎯 Calculating accuracy metrics...")
        
        results = {}
        
        for k in k_values:
            precisions = []
            recalls = []
            f1_scores = []
            ndcgs = []
            
            print(f"  Evaluating @{k}...")
            
            for user_id in self.test_users[:50]:  # Test first 50 users
                actual_items = self.test_data[user_id]
                
                try:
                    # Get recommendations
                    recommendations = self.system.get_recommendations(user_id, k)
                    recommended_items = [rec['package_id'] for rec in recommendations]
                    
                    # Calculate metrics
                    precision = self.precision_at_k(actual_items, recommended_items, k)
                    recall = self.recall_at_k(actual_items, recommended_items, k)
                    f1 = self.f1_at_k(actual_items, recommended_items, k)
                    ndcg = self.ndcg_at_k(actual_items, recommended_items, k)
                    
                    precisions.append(precision)
                    recalls.append(recall)
                    f1_scores.append(f1)
                    ndcgs.append(ndcg)
                    
                except Exception as e:
                    continue
            
            results[k] = {
                'precision': np.mean(precisions) if precisions else 0,
                'recall': np.mean(recalls) if recalls else 0,
                'f1': np.mean(f1_scores) if f1_scores else 0,
                'ndcg': np.mean(ndcgs) if ndcgs else 0,
                'users_evaluated': len(precisions)
            }
            
            print(f"    Precision@{k}: {results[k]['precision']:.4f}")
            print(f"    Recall@{k}: {results[k]['recall']:.4f}")
            print(f"    F1@{k}: {results[k]['f1']:.4f}")
            print(f"    NDCG@{k}: {results[k]['ndcg']:.4f}")
        
        self.results = results
        return results
    
    def precision_at_k(self, actual_items, recommended_items, k):
        if k == 0 or not recommended_items:
            return 0.0
        top_k = set(recommended_items[:k])
        return len(top_k.intersection(actual_items)) / k
    
    def recall_at_k(self, actual_items, recommended_items, k):
        if not actual_items or not recommended_items:
            return 0.0
        top_k = set(recommended_items[:k])
        return len(top_k.intersection(actual_items)) / len(actual_items)
    
    def f1_at_k(self, actual_items, recommended_items, k):
        precision = self.precision_at_k(actual_items, recommended_items, k)
        recall = self.recall_at_k(actual_items, recommended_items, k)
        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)
    
    def ndcg_at_k(self, actual_items, recommended_items, k):
        if not recommended_items or not actual_items:
            return 0.0
        
        # Simple binary relevance (1 if relevant, 0 if not)
        relevance = [1 if item in actual_items else 0 for item in recommended_items[:k]]
        
        # DCG calculation
        dcg = sum((2**rel - 1) / np.log2(i + 2) for i, rel in enumerate(relevance))
        
        # IDCG calculation (ideal ranking)
        ideal_relevance = [1] * min(len(actual_items), k) + [0] * max(0, k - len(actual_items))
        idcg = sum((2**rel - 1) / np.log2(i + 2) for i, rel in enumerate(ideal_relevance))
        
        return dcg / idcg if idcg > 0 else 0.0
    
    def calculate_map(self):
        """Calculate Mean Average Precision"""
        print("📈 Calculating Mean Average Precision...")
        
        aps = []
        
        for user_id in self.test_users[:50]:
            actual_items = self.test_data[user_id]
            
            try:
                recommendations = self.system.get_recommendations(user_id, 20)
                recommended_items = [rec['package_id'] for rec in recommendations]
                
                ap = self.average_precision(actual_items, recommended_items)
                aps.append(ap)
                
            except:
                continue
        
        map_score = np.mean(aps) if aps else 0
        print(f"    MAP: {map_score:.4f}")
        
        return map_score
    
    def average_precision(self, actual_items, recommended_items):
        if not actual_items:
            return 0.0
        
        precisions = []
        relevant_count = 0
        
        for i, item in enumerate(recommended_items):
            if item in actual_items:
                relevant_count += 1
                precision_at_i = relevant_count / (i + 1)
                precisions.append(precision_at_i)
        
        return sum(precisions) / len(actual_items) if precisions else 0.0
    
    def print_accuracy_report(self):
        """Print comprehensive accuracy report"""
        print("\n" + "="*60)
        print("📊 MODEL ACCURACY REPORT")
        print("="*60)
        
        for k, metrics in self.results.items():
            print(f"\n🎯 TOP-{k} RECOMMENDATIONS:")
            print(f"   Precision@{k}:  {metrics['precision']:.4f}")
            print(f"   Recall@{k}:     {metrics['recall']:.4f}")
            print(f"   F1-Score@{k}:   {metrics['f1']:.4f}")
            print(f"   NDCG@{k}:       {metrics['ndcg']:.4f}")
            print(f"   Users tested:   {metrics['users_evaluated']}")
        
        # Interpretation
        print(f"\n🔍 ACCURACY INTERPRETATION:")
        
        best_k = max(self.results.keys(), key=lambda k: self.results[k]['f1'])
        best_precision = self.results[best_k]['precision']
        best_recall = self.results[best_k]['recall']
        
        if best_precision >= 0.3:
            print("   ✅ HIGH ACCURACY: Most recommendations are relevant")
        elif best_precision >= 0.15:
            print("   🟡 MODERATE ACCURACY: Some recommendations are relevant")
        else:
            print("   🔴 LOW ACCURACY: Few recommendations are relevant")
        
        if best_recall >= 0.4:
            print("   ✅ HIGH COVERAGE: Captures most user interests")
        elif best_recall >= 0.2:
            print("   🟡 MODERATE COVERAGE: Captures some user interests")
        else:
            print("   🔴 LOW COVERAGE: Misses many user interests")

def main():
    """Main accuracy measurement script"""
    print("🎯 MEASURING RECOMMENDATION MODEL ACCURACY")
    print("="*60)
    
    # Import and load system
    from recommendation_model import EducationalRecommendationSystem
    import pickle
    
    system = EducationalRecommendationSystem()
    if not system.load_data():
        print("❌ Failed to load data")
        return
    
    # Load trained models
    try:
        with open('models/recommendation_system.pkl', 'rb') as f:
            system.models = pickle.load(f)
    except FileNotFoundError:
        print("❌ No trained models found. Run training first.")
        return
    
    # Measure accuracy
    measurer = AccuracyMeasurer(system)
    measurer.load_test_data()
    measurer.calculate_accuracy_metrics()
    measurer.calculate_map()
    measurer.print_accuracy_report()
    
    # Save results
    with open('results/accuracy_results.json', 'w') as f:
        json.dump(measurer.results, f, indent=2)
    
    print("\n💾 Results saved to results/accuracy_results.json")

if __name__ == "__main__":
    main()
