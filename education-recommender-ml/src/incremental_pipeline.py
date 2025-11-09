from pymongo import MongoClient
from datetime import datetime, timedelta
import pandas as pd
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class IncrementalDataPipeline:
    """Handle incremental data updates using MongoDB Change Streams"""
    
    def __init__(self, mongo_uri: str, db_name: str):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[db_name]
        self.last_update_file = 'pipeline_data/last_update.txt'
    
    def get_last_update_timestamp(self) -> Optional[datetime]:
        """Get the last update timestamp"""
        try:
            with open(self.last_update_file, 'r') as f:
                timestamp_str = f.read().strip()
                return datetime.fromisoformat(timestamp_str)
        except FileNotFoundError:
            # If no previous update, return 7 days ago
            return datetime.now() - timedelta(days=7)
    
    def save_last_update_timestamp(self, timestamp: datetime):
        """Save the last update timestamp"""
        with open(self.last_update_file, 'w') as f:
            f.write(timestamp.isoformat())
    
    def get_incremental_data(self, collection_name: str, since: datetime) -> pd.DataFrame:
        """Get incremental data since last update"""
        try:
            query = {'createdAt': {'$gte': since}}
            cursor = self.db[collection_name].find(query)
            data = list(cursor)
            
            if data:
                df = pd.DataFrame(data)
                df['_id'] = df['_id'].astype(str)
                return df
            else:
                return pd.DataFrame()
        
        except Exception as e:
            logger.error(f"Error getting incremental data from {collection_name}: {e}")
            return pd.DataFrame()
    
    def run_incremental_update(self) -> bool:
        """Run incremental data update"""
        logger.info("🔄 Running incremental data update...")
        
        try:
            last_update = self.get_last_update_timestamp()
            current_time = datetime.now()
            
            logger.info(f"Fetching data since: {last_update}")
            
            # Get incremental data from each collection
            collections = ['users', 'packages', 'userinteractions', 'bookings', 'reviews']
            updates_found = False
            
            for collection in collections:
                incremental_data = self.get_incremental_data(collection, last_update)
                
                if not incremental_data.empty:
                    logger.info(f"Found {len(incremental_data)} new records in {collection}")
                    
                    # Save incremental data
                    incremental_data.to_csv(f'pipeline_data/incremental_{collection}_{current_time.strftime("%Y%m%d_%H%M%S")}.csv', index=False)
                    updates_found = True
            
            if updates_found:
                # Update the last update timestamp
                self.save_last_update_timestamp(current_time)
                logger.info("✅ Incremental update completed")
                return True
            else:
                logger.info("📝 No new data found")
                return False
        
        except Exception as e:
            logger.error(f"❌ Incremental update failed: {e}")
            return False
    
    def watch_for_changes(self):
        """Watch for real-time changes using Change Streams"""
        logger.info("👁️ Starting Change Stream monitoring...")
        
        try:
            # Watch for changes in critical collections
            pipeline = [
                {"$match": {"operationType": {"$in": ["insert", "update"]}}}
            ]
            
            collections_to_watch = ['userinteractions', 'bookings', 'reviews']
            
            for collection_name in collections_to_watch:
                collection = self.db[collection_name]
                
                with collection.watch(pipeline) as stream:
                    logger.info(f"Watching {collection_name} for changes...")
                    
                    for change in stream:
                        logger.info(f"Change detected in {collection_name}: {change['operationType']}")
                        
                        # Process the change
                        self._process_change(change, collection_name)
        
        except Exception as e:
            logger.error(f"❌ Change Stream monitoring failed: {e}")
    
    def _process_change(self, change: dict, collection_name: str):
        """Process a detected change"""
        try:
            operation_type = change['operationType']
            document = change.get('fullDocument', {})
            
            # Log the change
            logger.info(f"Processing {operation_type} in {collection_name}")
            
            # Here you could trigger incremental retraining
            # or update specific model components
            
            # Example: If it's a new booking, update user interaction scores
            if collection_name == 'bookings' and operation_type == 'insert':
                self._update_user_interaction_scores(document)
        
        except Exception as e:
            logger.error(f"Error processing change: {e}")
    
    def _update_user_interaction_scores(self, booking_document: dict):
        """Update interaction scores when new booking is made"""
        # This is where you'd update your model's interaction data
        # without requiring a full retrain
        pass
