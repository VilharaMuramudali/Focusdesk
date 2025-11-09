import schedule
import time
import logging
from datetime import datetime
from src.data_pipeline import EducationalDataPipeline
from src.incremental_pipeline import IncrementalDataPipeline
from src.ml_training_pipeline import MLTrainingPipeline

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class PipelineScheduler:
    """Automated scheduling for data pipeline and model training"""
    
    def __init__(self, mongo_uri: str, db_name: str):
        self.mongo_uri = mongo_uri
        self.db_name = db_name
    
    def daily_incremental_update(self):
        """Daily incremental data update"""
        logger.info("🔄 Running daily incremental update...")
        
        incremental_pipeline = IncrementalDataPipeline(self.mongo_uri, self.db_name)
        
        success = incremental_pipeline.run_incremental_update()
        
        if success:
            logger.info("✅ Daily incremental update completed")
        else:
            logger.warning("⚠️ No updates found or update failed")
    
    def weekly_full_retrain(self):
        """Weekly full pipeline run and model retraining"""
        logger.info("🚀 Running weekly full retrain...")
        
        # Step 1: Full data pipeline
        data_pipeline = EducationalDataPipeline(self.mongo_uri, self.db_name)
        data_success = data_pipeline.run_complete_pipeline()
        
        if not data_success:
            logger.error("❌ Data pipeline failed - skipping training")
            return
        
        # Step 2: Model training
        ml_pipeline = MLTrainingPipeline()
        train_success = ml_pipeline.run_training_pipeline()
        
        if train_success:
            logger.info("✅ Weekly full retrain completed successfully")
        else:
            logger.error("❌ Weekly retrain failed")
    
    def hourly_health_check(self):
        """Hourly health check"""
        logger.info("💓 Running health check...")
        
        try:
            # Check if processed data exists
            import os
            required_files = [
                'processed_data/user_features.csv',
                'processed_data/package_features.csv',
                'processed_data/interaction_matrix.csv',
                'models/recommendation_system.pkl'
            ]
            
            missing_files = [f for f in required_files if not os.path.exists(f)]
            
            if missing_files:
                logger.warning(f"⚠️ Missing files: {missing_files}")
            else:
                logger.info("✅ All required files present")
        
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
    
    def start_scheduler(self):
        """Start the automated scheduler"""
        logger.info("⏰ Starting pipeline scheduler...")
        
        # Schedule jobs
        schedule.every().hour.do(self.hourly_health_check)
        schedule.every().day.at("02:00").do(self.daily_incremental_update)
        schedule.every().sunday.at("03:00").do(self.weekly_full_retrain)
        
        logger.info("📅 Scheduled jobs:")
        logger.info("   - Health check: Every hour")
        logger.info("   - Incremental update: Daily at 2:00 AM")  
        logger.info("   - Full retrain: Weekly on Sunday at 3:00 AM")
        
        # Run scheduler
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

def main():
    import os
    
    MONGO_URI = os.getenv('MONGO_URI', 'mongodb://localhost:27017/')
    DB_NAME = os.getenv('DB_NAME', 'focusdesk')
    
    scheduler = PipelineScheduler(MONGO_URI, DB_NAME)
    
    # Run initial setup
    logger.info("🚀 Running initial pipeline setup...")
    scheduler.weekly_full_retrain()
    
    # Start scheduler
    scheduler.start_scheduler()

if __name__ == "__main__":
    main()
