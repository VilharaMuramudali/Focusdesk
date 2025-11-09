import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
import pickle
import logging
from src.data_pipeline import EducationalDataPipeline
from src.recommendation_model import EducationalRecommendationSystem

logger = logging.getLogger(__name__)

class MLTrainingPipeline:
    """ML Training Pipeline that uses real data from MongoDB"""
    
    def __init__(self):
        self.model = EducationalRecommendationSystem()
        
    def load_processed_data(self) -> bool:
        """Load processed data from pipeline"""
        try:
            # Load processed features
            self.user_features = pd.read_csv('processed_data/user_features.csv')
            self.package_features = pd.read_csv('processed_data/package_features.csv')
            self.interaction_matrix = pd.read_csv('processed_data/interaction_matrix.csv', index_col=0)
            
            # Load interactions for detailed analysis
            try:
                # Try to load from pipeline data first
                interactions_files = [
                    'pipeline_data/interactions.csv',
                    'processed_data/interactions_detailed.csv'
                ]
                
                self.interactions_detailed = None
                for file_path in interactions_files:
                    try:
                        self.interactions_detailed = pd.read_csv(file_path)
                        break
                    except FileNotFoundError:
                        continue
                
                if self.interactions_detailed is None:
                    logger.warning("No detailed interactions file found, creating from raw data")
                    self.interactions_detailed = pd.DataFrame()
            
            except Exception as e:
                logger.warning(f"Could not load detailed interactions: {e}")
                self.interactions_detailed = pd.DataFrame()
            
            # Load feature data
            with open('processed_data/feature_data.pkl', 'rb') as f:
                self.feature_data = pickle.load(f)
            
            logger.info("✅ Loaded processed data for training")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to load processed data: {e}")
            return False
    
    def prepare_training_data(self):
        """Prepare data for model training"""
        logger.info("🔧 Preparing training data...")
        
        # Set up model data structure
        self.model.user_features = self.user_features
        self.model.package_features = self.package_features
        self.model.interaction_matrix = self.interaction_matrix
        self.model.interactions_detailed = self.interactions_detailed
        
        # Create synthetic data structure for compatibility
        self.model.data = {
            'users': self.user_features.to_dict('records'),
            'packages': self.package_features.to_dict('records'),
            'interactions': self.interactions_detailed.to_dict('records') if not self.interactions_detailed.empty else []
        }
        
        logger.info("✅ Training data prepared")
    
    def train_models(self):
        """Train recommendation models"""
        logger.info("🧠 Training recommendation models...")
        
        try:
            # Train collaborative filtering
            self.model.train_collaborative_filtering()
            
            # Train content-based filtering
            self.model.train_content_based_model()
            
            # Save trained models
            os.makedirs('models', exist_ok=True)
            self.model.save_models('models/recommendation_system.pkl')
            
            logger.info("✅ Models trained and saved successfully")
            return True
            
        except Exception as e:
            logger.error(f"❌ Model training failed: {e}")
            return False
    
    def run_training_pipeline(self) -> bool:
        """Run complete training pipeline"""
        logger.info("🚀 Starting ML training pipeline...")
        
        try:
            # Step 1: Load processed data
            if not self.load_processed_data():
                return False
            
            # Step 2: Prepare training data
            self.prepare_training_data()
            
            # Step 3: Train models
            if not self.train_models():
                return False
            
            # Step 4: Basic evaluation
            self._quick_evaluation()
            
            logger.info("🎉 ML training pipeline completed!")
            return True
            
        except Exception as e:
            logger.error(f"❌ Training pipeline failed: {e}")
            return False
    
    def _quick_evaluation(self):
        """Quick evaluation of trained model"""
        try:
            logger.info("📊 Running quick evaluation...")
            
            if not self.user_features.empty:
                # Test on a sample user
                sample_user_id = self.user_features.iloc[0]['user_id']
                recommendations = self.model.get_hybrid_recommendations(sample_user_id, 5)
                
                if recommendations:
                    logger.info(f"✅ Model working - generated {len(recommendations)} recommendations for sample user")
                else:
                    logger.warning("⚠️ Model generated no recommendations for sample user")
            else:
                logger.warning("⚠️ No users available for evaluation")
        
        except Exception as e:
            logger.warning(f"⚠️ Quick evaluation failed: {e}")
