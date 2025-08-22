# 🤖 AI Recommendation System - ML Training Pipeline

This guide provides step-by-step instructions for setting up and running the complete machine learning training pipeline for your MERN stack educational platform.

## 📋 Prerequisites

### 1. Python Environment
```bash
# Install Python 3.8+ if not already installed
python --version

# Install required packages
cd api/python-ai
pip install -r requirements.txt
```

### 2. MongoDB Connection
Ensure your MongoDB Atlas connection is working:
- Connection string: `mongodb+srv://vilhara_muramudali:QmQsiEjLEOxX5adE@vilieapi.skpkcb8.mongodb.net/FocusDesk`
- Database: `FocusDesk`

### 3. VS Code Setup
- Install Python extension
- Install MongoDB extension (optional)
- Configure launch.json (already created)

## 🚀 Quick Start Guide

### Method 1: Using VS Code (Recommended)

1. **Open VS Code** in your project root
2. **Go to Debug panel** (Ctrl+Shift+D)
3. **Select "Train AI Models"** from dropdown
4. **Click the play button** or press F5

### Method 2: Using Terminal

```bash
# Navigate to project root
cd api/python-ai

# Run training pipeline
python run_training.py
```

### Method 3: Using npm scripts

```bash
# From project root
npm run train-ai
```

## 📊 Training Pipeline Overview

### 1. Data Pipeline (`data_pipeline.py`)
- **Extracts** data from MongoDB collections
- **Processes** and cleans the data
- **Creates** feature matrices for ML models
- **Saves** processed data to disk

### 2. Training Pipeline (`training_pipeline.py`)
- **Trains** content-based filtering model
- **Trains** collaborative filtering model
- **Trains** clustering model
- **Evaluates** model performance
- **Saves** trained models

### 3. Model Integration (`recommendation_model.py`)
- **Loads** trained models
- **Generates** recommendations
- **Provides** API endpoints

## 🔧 Configuration

### Environment Variables
Create a `.env` file in `api/python-ai/`:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://vilhara_muramudali:QmQsiEjLEOxX5adE@vilieapi.skpkcb8.mongodb.net/FocusDesk?retryWrites=true&w=majority&appName=vilieAPi
DB_NAME=FocusDesk

# AI Service Configuration
AI_SERVICE_PORT=5000

# Model Configuration
N_COMPONENTS=50
N_CLUSTERS=10
MIN_INTERACTIONS=3
```

### Model Parameters (config.py)
```python
# Training Configuration
BATCH_SIZE = 1000
TRAINING_EPOCHS = 10
LEARNING_RATE = 0.001

# Feature Engineering
MAX_FEATURES = 1000  # TF-IDF features
MIN_DF = 2           # Minimum document frequency
MAX_DF = 0.95        # Maximum document frequency
```

## 📈 Training Process

### Step 1: Data Extraction
```python
# Extracts from MongoDB collections:
- users (with AI-specific fields)
- packages (educator offerings)
- userinteractions (user behavior)
- sessionhistories (learning sessions)
- bookings (completed sessions)
```

### Step 2: Data Processing
```python
# Text Processing:
- Clean and normalize text
- Remove stopwords
- Lemmatization
- TF-IDF vectorization

# Feature Engineering:
- User-item interaction matrix
- Numerical feature scaling
- Categorical encoding
```

### Step 3: Model Training
```python
# Content-Based Filtering:
- TF-IDF similarity matrix
- Package content matching

# Collaborative Filtering:
- SVD decomposition
- NMF factorization
- User similarity calculation

# Clustering:
- K-means clustering
- User segmentation
```

### Step 4: Model Evaluation
```python
# Metrics calculated:
- Matrix sparsity
- Cluster distribution
- Interaction counts
- Model performance scores
```

## 🎯 Testing the Models

### 1. Test Training Results
```bash
# After training, test recommendations
python test_ai_service.py
```

### 2. Test API Endpoints
```bash
# Start AI service
python app.py

# Test endpoints
curl http://localhost:5000/health
curl http://localhost:5000/algorithms
```

### 3. Test Node.js Integration
```bash
# Start Node.js server
npm start

# Test recommendation endpoint
curl "http://localhost:8800/api/recommendations/educators?topic=mathematics"
```

## 📁 File Structure

```
api/python-ai/
├── config.py                 # Configuration settings
├── data_pipeline.py          # Data processing pipeline
├── training_pipeline.py      # Model training pipeline
├── recommendation_model.py   # Main recommendation model
├── app.py                   # Flask API service
├── test_ai_service.py       # Testing script
├── run_training.py          # Training runner
├── requirements.txt         # Python dependencies
├── models/                  # Trained models (created after training)
│   ├── tfidf_vectorizer.pkl
│   ├── collaborative_matrix.pkl
│   ├── user_clusters.pkl
│   └── model_metadata.json
├── data/                    # Processed data (created after pipeline)
│   ├── users_processed.csv
│   ├── packages_processed.csv
│   └── interactions_processed.csv
└── logs/                    # Training logs
    └── training.log
```

## 🔍 Monitoring and Debugging

### 1. Check Training Logs
```bash
# View training logs
tail -f api/python-ai/logs/training.log
```

### 2. Monitor Model Performance
```bash
# Check model metadata
cat api/python-ai/models/model_metadata.json
```

### 3. Debug Data Pipeline
```bash
# Run data pipeline separately
python data_pipeline.py
```

## 🚨 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   ```bash
   # Check connection
   python -c "from pymongo import MongoClient; client = MongoClient('your_connection_string'); print(client.admin.command('ping'))"
   ```

2. **Missing Dependencies**
   ```bash
   # Install dependencies
   pip install -r requirements.txt
   ```

3. **Insufficient Data**
   ```bash
   # Check data counts
   python -c "from data_pipeline import DataPipeline; p = DataPipeline(); p.connect_mongodb(); print('Users:', p.db.users.count_documents({}))"
   ```

4. **Model Loading Error**
   ```bash
   # Retrain models
   python run_training.py
   ```

### Performance Optimization

1. **Increase Training Speed**
   ```python
   # In config.py
   BATCH_SIZE = 2000  # Increase batch size
   N_COMPONENTS = 30  # Reduce components
   ```

2. **Reduce Memory Usage**
   ```python
   # In config.py
   MAX_FEATURES = 500  # Reduce features
   N_CLUSTERS = 5      # Reduce clusters
   ```

## 📊 Model Performance Metrics

### Expected Results
After successful training, you should see:

```json
{
  "status": "success",
  "models_trained": ["content_based", "collaborative", "clustering"],
  "data_summary": {
    "users": 100,
    "packages": 50,
    "interactions": 500
  },
  "evaluation_results": {
    "matrix_sparsity": 0.85,
    "total_users": 100,
    "total_items": 50,
    "total_interactions": 500
  }
}
```

## 🔄 Continuous Training

### Automated Retraining
```bash
# Set up cron job for daily retraining
0 2 * * * cd /path/to/project/api/python-ai && python run_training.py
```

### Incremental Training
```python
# Add to training_pipeline.py
def incremental_training(self):
    # Load existing models
    # Update with new data
    # Retrain incrementally
    pass
```

## 🎉 Success Indicators

✅ **Training Complete** when you see:
- Models saved in `models/` directory
- No error messages in logs
- Test recommendations working
- API endpoints responding

✅ **Integration Working** when:
- Node.js server starts without errors
- AI service responds to health checks
- Recommendation endpoints return data
- User interactions are tracked

## 📞 Support

If you encounter issues:

1. Check the logs in `api/python-ai/logs/`
2. Verify MongoDB connection
3. Ensure all dependencies are installed
4. Check data quality in your database
5. Review configuration settings

---

**Happy Training! 🚀**
