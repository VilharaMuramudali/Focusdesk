# ML Model Integration Guide

This guide explains how to integrate the ML recommendation system with the Node.js backend.

## Setup

### 1. Install Python Dependencies

```bash
cd education-recommender-ml
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create a `.env` file in the `education-recommender-ml` directory:

```env
MONGO_URI=mongodb://localhost:27017/
DB_NAME=focusdesk
ML_API_PORT=5000
```

### 3. Start the ML API Service

```bash
cd education-recommender-ml
python ml_api_service.py
```

The service will start on `http://localhost:5000`

### 4. Extract Data and Train Model

#### Option A: Using API

```bash
# Extract data from MongoDB
curl -X POST http://localhost:5000/extract-data

# Train the model
curl -X POST http://localhost:5000/train

# Or do both at once
curl -X POST http://localhost:5000/extract-and-train
```

#### Option B: Using Python Script

```bash
cd education-recommender-ml
python -m src.data_pipeline  # Extract data
python -m src.recommendation_model  # Train model (after extraction)
```

### 5. Configure Node.js Backend

Add to your `.env` file in the `api` directory:

```env
ML_API_URL=http://localhost:5000
AI_SERVICE_URL=http://localhost:5000
```

## API Endpoints

### ML API Service (Port 5000)

- `GET /health` - Health check
- `POST /extract-data` - Extract data from MongoDB
- `POST /train` - Train recommendation model
- `POST /extract-and-train` - Extract and train in one call
- `POST /recommendations` - Get recommendations for a user
- `GET /stats` - Get model statistics

### Node.js Backend Integration

The Node.js backend automatically uses the ML service through `aiRecommendationService.js`:

- When ML service is available: Uses ML recommendations
- When ML service is unavailable: Falls back to rule-based recommendations

## Usage Flow

1. **Data Extraction**: ML service extracts data from MongoDB
2. **Model Training**: ML model is trained on the extracted data
3. **Recommendations**: When user requests recommendations:
   - Node.js backend calls ML API service
   - ML service returns package IDs with scores
   - Node.js backend fetches full package details from MongoDB
   - Packages are displayed to the user

## Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test recommendations (replace USER_ID)
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "USER_ID", "limit": 10, "algorithm": "hybrid"}'
```

## Troubleshooting

1. **ML Service not connecting**: Check if service is running on port 5000
2. **No recommendations**: Ensure model is trained (check `/stats` endpoint)
3. **Data extraction fails**: Verify MongoDB connection string
4. **Model training fails**: Check if processed data exists in `processed_data/` directory

## Model Retraining

The model should be retrained periodically as new data is added:

```bash
# Manual retraining
curl -X POST http://localhost:5000/extract-and-train

# Or set up a cron job/scheduled task
```

## Performance

- Data extraction: ~30-60 seconds (depends on data size)
- Model training: ~1-5 minutes (depends on data size)
- Getting recommendations: ~100-500ms per request

