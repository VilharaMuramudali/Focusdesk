import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error
import matplotlib.pyplot as plt
import seaborn as sns
from collections import defaultdict
import json
import sys
import os

sys.path.append('src')

class RecommendationEvaluator:
    """
    Comprehensive evaluation framework for recommendation systems
    """
    
    def __init__(self, recommendation_system):
        self.system = recommendation_system
        self.results = {}
        
    def load_data_and_split(self, test_size=0.2):
        """Load data and create train/test split"""
        print("📊 Loading and splitting data...")
        
        # Load interactions
        interactions_df = pd.DataFrame(self.system.data['interactions'])
        
        # Split by users (each user has interactions in both train and test)
        train_interactions = []
        test_interactions = []
        
        for user_id in interactions_df['userId'].unique():
            user_data = interactions_df[interactions_df['userId'] == user_id]
            
            if len(user_data) > 1:
                user_train, user_test = train_test_split(
                    user_data, test_size=test_size, random_state=42
                )
                train_interactions.append(user_train)
                test_interactions.append(user_test)
            else:
                train_interactions.append(user_data)
        
        self.train_df = pd.concat(train_interactions, ignore_index=True)
        self.test_df = pd.concat(test_interactions, ignore_index=True) if test_interactions else pd.DataFrame()
        
        print(f"✅ Train: {len(self.train_df)} interactions, Test: {len(self.test_df)} interactions")
        
    def calculate_precision_recall_at_k(self, k_values=[5, 10, 20]):
        """Calculate Precision@K and Recall@K"""
        print(f"🎯 Calculating Precision@K and Recall@K...")
        
        results = {}
        
        if self.test_df.empty:
            print("⚠️ No test data available")
            return results
        
        test_users = self.test_df['userId'].unique()[:50]  # Test on first 50 users for speed
        
        for k in k_values:
            precisions = []
            recalls = []
            f1_scores = []
            
            for user_id in test_users:
                # Get user's actual interactions in test set
                user_test_items = set(self.test_df[
                    self.test_df['userId'] == user_id
                ]['packageId'].tolist())
                
                if not user_test_items:
                    continue
                
                try:
                    # Get recommendations
                    recommendations = self.system.get_recommendations(user_id, k)
                    recommended_items = set([rec['package_id'] for rec in recommendations])
                    
                    # Calculate metrics
                    if recommended_items:
                        intersection = user_test_items.intersection(recommended_items)
                        
                        precision = len(intersection) / len(recommended_items)
                        recall = len(intersection) / len(user_test_items)
                        f1 = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
                        
                        precisions.append(precision)
                        recalls.append(recall)
                        f1_scores.append(f1)
                
                except Exception as e:
                    continue
            
            results[k] = {
                'precision': np.mean(precisions) if precisions else 0,
                'recall': np.mean(recalls) if recalls else 0,
                'f1': np.mean(f1_scores) if f1_scores else 0,
                'users_evaluated': len(precisions)
            }
            
            print(f"  K={k}: P={results[k]['precision']:.4f}, R={results[k]['recall']:.4f}, F1={results[k]['f1']:.4f} ({results[k]['users_evaluated']} users)")
        
        self.results['precision_recall_at_k'] = results
        return results
    
    def calculate_coverage(self, n_recommendations=10):
        """Calculate catalog and user coverage"""
        print("📈 Calculating coverage metrics...")
        
        all_packages = set(self.system.packages_df['_id'].tolist())
        recommended_packages = set()
        
        test_users = self.system.users_df[self.system.users_df['isEducator'] == False]['_id'].tolist()
        users_with_recs = 0
        
        for user_id in test_users[:100]:  # Test first 100 users
            try:
                recommendations = self.system.get_recommendations(user_id, n_recommendations)
                if recommendations:
                    users_with_recs += 1
                    recommended_packages.update([rec['package_id'] for rec in recommendations])
            except:
                continue
        
        catalog_coverage = len(recommended_packages) / len(all_packages)
        user_coverage = users_with_recs / min(100, len(test_users))
        
        coverage_results = {
            'catalog_coverage': catalog_coverage,
            'user_coverage': user_coverage,
            'total_packages': len(all_packages),
            'recommended_packages': len(recommended_packages),
            'users_evaluated': min(100, len(test_users)),
            'users_with_recommendations': users_with_recs
        }
        
        print(f"  Catalog Coverage: {catalog_coverage:.4f} ({len(recommended_packages)}/{len(all_packages)})")
        print(f"  User Coverage: {user_coverage:.4f} ({users_with_recs}/{min(100, len(test_users))})")
        
        self.results['coverage'] = coverage_results
        return coverage_results
    
    def calculate_diversity(self, n_recommendations=10, sample_users=50):
        """Calculate recommendation diversity"""
        print("🌈 Calculating diversity metrics...")
        
        test_users = self.system.users_df[self.system.users_df['isEducator'] == False]['_id'].tolist()[:sample_users]
        
        all_recommendations = []
        intra_list_diversities = []
        
        for user_id in test_users:
            try:
                recommendations = self.system.get_recommendations(user_id, n_recommendations)
                if not recommendations:
                    continue
                
                rec_packages = [rec['package_id'] for rec in recommendations]
                all_recommendations.extend(rec_packages)
                
                # Calculate intra-list diversity (subject diversity within user's recommendations)
                subjects = []
                for rec in recommendations:
                    package_info = self.system.packages_df[
                        self.system.packages_df['_id'] == rec['package_id']
                    ]
                    if not package_info.empty:
                        # Get educator's subjects
                        educator_id = package_info.iloc[0]['educatorId']
                        educator = next((u for u in self.system.data['users'] if u['_id'] == educator_id), None)
                        if educator:
                            subjects.extend(educator.get('subjects', []))
                
                if subjects:
                    unique_subjects = len(set(subjects))
                    total_subjects = len(subjects)
                    diversity = unique_subjects / total_subjects if total_subjects > 0 else 0
                    intra_list_diversities.append(diversity)
            
            except:
                continue
        
        # Overall diversity (how many unique items are recommended across all users)
        unique_items_recommended = len(set(all_recommendations))
        total_recommendations = len(all_recommendations)
        overall_diversity = unique_items_recommended / total_recommendations if total_recommendations > 0 else 0
        
        avg_intra_list_diversity = np.mean(intra_list_diversities) if intra_list_diversities else 0
        
        diversity_results = {
            'overall_diversity': overall_diversity,
            'avg_intra_list_diversity': avg_intra_list_diversity,
            'unique_items_recommended': unique_items_recommended,
            'total_recommendations': total_recommendations,
            'users_evaluated': len(intra_list_diversities)
        }
        
        print(f"  Overall Diversity: {overall_diversity:.4f}")
        print(f"  Avg Intra-List Diversity: {avg_intra_list_diversity:.4f}")
        
        self.results['diversity'] = diversity_results
        return diversity_results
    
    def calculate_novelty(self, n_recommendations=10, sample_users=50):
        """Calculate recommendation novelty"""
        print("✨ Calculating novelty metrics...")
        
        # Calculate item popularity from training interactions
        item_popularity = self.train_df['packageId'].value_counts()
        total_interactions = len(self.train_df)
        
        test_users = self.system.users_df[self.system.users_df['isEducator'] == False]['_id'].tolist()[:sample_users]
        novelty_scores = []
        
        for user_id in test_users:
            try:
                recommendations = self.system.get_recommendations(user_id, n_recommendations)
                if not recommendations:
                    continue
                
                user_novelty = []
                for rec in recommendations:
                    package_id = rec['package_id']
                    popularity = item_popularity.get(package_id, 1) / total_interactions
                    novelty = -np.log2(popularity) if popularity > 0 else 10
                    user_novelty.append(novelty)
                
                if user_novelty:
                    novelty_scores.append(np.mean(user_novelty))
            
            except:
                continue
        
        avg_novelty = np.mean(novelty_scores) if novelty_scores else 0
        
        novelty_results = {
            'avg_novelty': avg_novelty,
            'users_evaluated': len(novelty_scores),
            'novelty_std': np.std(novelty_scores) if novelty_scores else 0
        }
        
        print(f"  Average Novelty: {avg_novelty:.4f}")
        
        self.results['novelty'] = novelty_results
        return novelty_results
    
    def evaluate_by_method(self, methods=['content_based', 'collaborative', 'hybrid'], sample_users=30):
        """Compare different recommendation methods"""
        print("🔍 Evaluating different methods...")
        
        test_users = self.system.users_df[self.system.users_df['isEducator'] == False]['_id'].tolist()[:sample_users]
        method_results = {}
        
        for method in methods:
            print(f"  Testing {method} method...")
            
            successful_recs = 0
            total_users_tested = 0
            
            for user_id in test_users:
                try:
                    recommendations = self.system.get_recommendations(user_id, 10, method)
                    total_users_tested += 1
                    
                    if recommendations and len(recommendations) > 0:
                        successful_recs += 1
                
                except Exception as e:
                    continue
            
            success_rate = successful_recs / total_users_tested if total_users_tested > 0 else 0
            
            method_results[method] = {
                'success_rate': success_rate,
                'successful_recommendations': successful_recs,
                'users_tested': total_users_tested
            }
            
            print(f"    Success Rate: {success_rate:.4f} ({successful_recs}/{total_users_tested})")
        
        self.results['method_comparison'] = method_results
        return method_results
    
    def generate_evaluation_report(self):
        """Generate comprehensive evaluation report"""
        print("\n" + "="*60)
        print("📋 COMPREHENSIVE EVALUATION REPORT")
        print("="*60)
        
        # Split data
        self.load_data_and_split()
        
        # Run all evaluations
        precision_recall_results = self.calculate_precision_recall_at_k()
        coverage_results = self.calculate_coverage()
        diversity_results = self.calculate_diversity()
        novelty_results = self.calculate_novelty()
        method_results = self.evaluate_by_method()
        
        # Create visualizations
        self.create_evaluation_plots()
        
        # Print summary
        print("\n📊 EVALUATION SUMMARY")
        print("="*60)
        
        if precision_recall_results:
            print("Precision@K and Recall@K:")
            for k, metrics in precision_recall_results.items():
                print(f"  K={k}: Precision={metrics['precision']:.4f}, Recall={metrics['recall']:.4f}, F1={metrics['f1']:.4f}")
        
        print(f"\nCoverage:")
        print(f"  Catalog Coverage: {coverage_results['catalog_coverage']:.4f}")
        print(f"  User Coverage: {coverage_results['user_coverage']:.4f}")
        
        print(f"\nDiversity:")
        print(f"  Overall Diversity: {diversity_results['overall_diversity']:.4f}")
        print(f"  Avg Intra-List Diversity: {diversity_results['avg_intra_list_diversity']:.4f}")
        
        print(f"\nNovelty:")
        print(f"  Average Novelty: {novelty_results['avg_novelty']:.4f}")
        
        print(f"\nMethod Performance:")
        for method, results in method_results.items():
            print(f"  {method}: {results['success_rate']:.4f} success rate")
        
        # Save results
        self.save_evaluation_results()
        
        return self.results
    
    def create_evaluation_plots(self):
        """Create evaluation visualizations"""
        print("📈 Creating evaluation plots...")
        
        # Create results directory
        os.makedirs('results', exist_ok=True)
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # 1. Precision/Recall@K plot
        if 'precision_recall_at_k' in self.results:
            ax = axes[0, 0]
            k_values = list(self.results['precision_recall_at_k'].keys())
            precisions = [self.results['precision_recall_at_k'][k]['precision'] for k in k_values]
            recalls = [self.results['precision_recall_at_k'][k]['recall'] for k in k_values]
            
            ax.plot(k_values, precisions, 'o-', label='Precision@K', linewidth=2)
            ax.plot(k_values, recalls, 's-', label='Recall@K', linewidth=2)
            ax.set_xlabel('K')
            ax.set_ylabel('Score')
            ax.set_title('Precision@K and Recall@K')
            ax.legend()
            ax.grid(True, alpha=0.3)
        
        # 2. Coverage metrics
        if 'coverage' in self.results:
            ax = axes[0, 1]
            coverage_data = self.results['coverage']
            metrics = ['Catalog Coverage', 'User Coverage']
            values = [coverage_data['catalog_coverage'], coverage_data['user_coverage']]
            
            bars = ax.bar(metrics, values, color=['lightblue', 'lightgreen'])
            ax.set_title('Coverage Metrics')
            ax.set_ylabel('Coverage Score')
            ax.set_ylim(0, 1)
            
            # Add value labels
            for bar, value in zip(bars, values):
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                       f'{value:.3f}', ha='center', va='bottom')
        
        # 3. Method comparison
        if 'method_comparison' in self.results:
            ax = axes[1, 0]
            methods = list(self.results['method_comparison'].keys())
            success_rates = [self.results['method_comparison'][m]['success_rate'] for m in methods]
            
            bars = ax.bar(methods, success_rates, color=['orange', 'purple', 'green'][:len(methods)])
            ax.set_title('Method Success Rates')
            ax.set_ylabel('Success Rate')
            ax.set_ylim(0, 1)
            
            # Add value labels
            for bar, rate in zip(bars, success_rates):
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                       f'{rate:.3f}', ha='center', va='bottom')
        
        # 4. Diversity and Novelty
        ax = axes[1, 1]
        metrics = []
        values = []
        
        if 'diversity' in self.results:
            metrics.append('Overall\nDiversity')
            values.append(self.results['diversity']['overall_diversity'])
            metrics.append('Intra-List\nDiversity')
            values.append(self.results['diversity']['avg_intra_list_diversity'])
        
        if 'novelty' in self.results:
            metrics.append('Novelty\n(scaled)')
            values.append(min(self.results['novelty']['avg_novelty'] / 10, 1))  # Scale down for visualization
        
        if metrics:
            bars = ax.bar(metrics, values, color=['red', 'blue', 'yellow'][:len(metrics)])
            ax.set_title('Diversity and Novelty')
            ax.set_ylabel('Score')
            
            for bar, value in zip(bars, values):
                ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
                       f'{value:.3f}', ha='center', va='bottom')
        
        plt.tight_layout()
        plt.savefig('results/evaluation_report.png', dpi=300, bbox_inches='tight')
        plt.show()
        
        print("✅ Evaluation plots saved to results/evaluation_report.png")
    
    def save_evaluation_results(self):
        """Save evaluation results to JSON"""
        os.makedirs('results', exist_ok=True)
        
        # Convert numpy types for JSON serialization
        def convert_types(obj):
            if isinstance(obj, np.integer):
                return int(obj)
            elif isinstance(obj, np.floating):
                return float(obj)
            elif isinstance(obj, np.ndarray):
                return obj.tolist()
            return obj
        
        # Clean results for JSON
        clean_results = {}
        for key, value in self.results.items():
            if isinstance(value, dict):
                clean_results[key] = {k: convert_types(v) for k, v in value.items()}
            else:
                clean_results[key] = convert_types(value)
        
        with open('results/evaluation_results.json', 'w') as f:
            json.dump(clean_results, f, indent=2)
        
        print("💾 Evaluation results saved to results/evaluation_results.json")

def main():
    """Main evaluation script"""
    print("🎯 RECOMMENDATION MODEL EVALUATION")
    print("="*60)
    
    # Import and load your recommendation system
    from recommendation_model import EducationalRecommendationSystem
    import pickle
    
    # Load the system
    system = EducationalRecommendationSystem()
    
    if not system.load_data():
        print("❌ Failed to load data. Please run data generation first.")
        return
    
    # Load trained models
    try:
        with open('models/recommendation_system.pkl', 'rb') as f:
            system.models = pickle.load(f)
        print("✅ Trained models loaded successfully")
    except FileNotFoundError:
        print("❌ No trained models found. Please train the model first.")
        print("Run: python generate_and_train.py")
        return
    
    # Initialize evaluator
    evaluator = RecommendationEvaluator(system)
    
    # Run comprehensive evaluation
    results = evaluator.generate_evaluation_report()
    
    print("\n🎉 EVALUATION COMPLETED!")
    print("📁 Check 'results/' folder for:")
    print("   - evaluation_report.png (visualizations)")
    print("   - evaluation_results.json (detailed results)")

if __name__ == "__main__":
    main()
