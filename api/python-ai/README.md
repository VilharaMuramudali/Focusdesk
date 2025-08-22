# AI Recommendation System

This directory contains the AI-powered recommendation system for the FocusDesk platform. The system uses machine learning algorithms to recommend educators and session packages to students based on their preferences, search queries, and behavior patterns.

## Features

- **Content-Based Filtering**: Recommends based on user preferences and package features
- **Collaborative Filtering**: Recommends based on similar users' interactions
- **Cluster-Based Filtering**: Groups users and recommends popular items within clusters
- **Hybrid Recommendations**: Combines multiple algorithms for optimal results
- **Real-time Learning**: Updates recommendations based on user interactions
- **Fallback System**: Provides basic recommendations when AI service is unavailable

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Node.js API   │    │  Python AI       │    │   MongoDB       │
│   (Express)     │◄──►│  Service         │◄──►│   Database      │
│                 │    │  (Flask)         │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd api/python-ai
pip install -r requirements.txt
```

### 2. Environment Variables

Create a `.env` file in the `api/python-ai` directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017
DB_NAME=focusdesk

# AI Service Configuration
AI_SERVICE_PORT=5000

# Model Configuration
MODEL_DIR=models
N_COMPONENTS=50
N_CLUSTERS=10
MIN_INTERACTIONS=3
```

### 3. Start the AI Service

#### Option A: Using the startup script (Recommended)
```bash
cd api/python-ai
python start_ai_service.py
```

#### Option B: Direct startup
```bash
cd api/python-ai
python app.py
```

### 4. Configure Node.js Integration

Add the AI service URL to your Node.js environment variables:

```env
AI_SERVICE_URL=http://localhost:5000
```

## API Endpoints

### Python AI Service (Port 5000)

#### Health Check
```
GET /health
```

#### Get Recommendations
```
POST /recommendations
{
  "user_id": "user_id",
  "query": "mathematics",
  "algorithm": "hybrid",
  "limit": 10
}
```

#### Train Model
```
POST /train
```

#### Load Model
```
POST /load
```

#### Record Interaction
```
POST /interaction
{
  "user_id": "user_id",
  "package_id": "package_id",
  "interaction_type": "view"
}
```

#### Get Statistics
```
GET /stats
```

#### Get Available Algorithms
```
GET /algorithms
```

### Node.js API Integration

#### Get Educator Recommendations
```
GET /api/recommendations/educators?topic=mathematics&algorithm=hybrid&limit=10
```

#### Track Interaction
```
POST /api/recommendations/track
{
  "targetEducatorId": "educator_id",
  "interactionType": "view",
  "recommendationRank": 1,
  "algorithmUsed": "hybrid"
}
```

#### Get Dashboard Recommendations
```
GET /api/recommendations/dashboard
```

#### AI Service Management
```
GET /api/recommendations/ai/stats
POST /api/recommendations/ai/train
POST /api/recommendations/ai/load
GET /api/recommendations/ai/algorithms
```

## Algorithms

### 1. Content-Based Filtering
- Uses TF-IDF vectorization of package descriptions and user preferences
- Matches user learning style, academic level, and subject interests
- Provides personalized recommendations based on content similarity

### 2. Collaborative Filtering
- Builds user-item interaction matrix
- Uses Singular Value Decomposition (SVD) for dimensionality reduction
- Recommends items based on similar users' preferences

### 3. Cluster-Based Filtering
- Groups users into clusters using K-means
- Recommends popular items within user's cluster
- Useful for new users with limited interaction history

### 4. Hybrid Recommendations
- Combines content-based and collaborative filtering
- Weights: 60% collaborative, 40% content-based
- Provides optimal balance of personalization and discovery

## Data Flow

1. **Data Collection**: User interactions, session history, and preferences are stored in MongoDB
2. **Model Training**: Python service processes data and trains recommendation models
3. **Recommendation Generation**: Models generate personalized recommendations
4. **Integration**: Node.js service calls Python AI service and enhances results
5. **User Interaction**: User actions are recorded and used to improve future recommendations

## Model Training

The system automatically trains models when:
- No trained models exist
- `/train` endpoint is called
- Service starts up (if models are missing)

Training process:
1. Loads user, package, interaction, and session data from MongoDB
2. Preprocesses and cleans the data
3. Builds TF-IDF vectors for content-based filtering
4. Creates collaborative filtering matrix
5. Clusters users based on behavior patterns
6. Saves trained models to disk

## Performance Optimization

- **Caching**: Models are cached in memory after loading
- **Batch Processing**: Large datasets are processed in batches
- **Fallback System**: Basic recommendations when AI service is unavailable
- **Connection Pooling**: Efficient database connections
- **Indexing**: MongoDB indexes for fast queries

## Monitoring

### Health Checks
- Service availability: `GET /health`
- Model status: `GET /stats`
- Connection status: Logged automatically

### Metrics
- User count
- Package count
- Interaction count
- Session count
- Model performance metrics

## Troubleshooting

### Common Issues

1. **AI Service Not Available**
   - Check if Python service is running on port 5000
   - Verify dependencies are installed
   - Check MongoDB connection

2. **Model Training Fails**
   - Ensure sufficient data exists in MongoDB
   - Check disk space for model storage
   - Verify MongoDB permissions

3. **Poor Recommendations**
   - Train model with more data
   - Adjust algorithm parameters
   - Check data quality

### Logs
- Python service logs are written to console
- Node.js integration logs are in the main application logs
- MongoDB queries can be monitored in MongoDB logs

## Development

### Adding New Algorithms
1. Implement algorithm in `recommendation_model.py`
2. Add algorithm name to available algorithms list
3. Update API endpoints to support new algorithm
4. Test with sample data

### Customizing Models
- Adjust `n_components` for collaborative filtering
- Modify `n_clusters` for user clustering
- Change TF-IDF parameters for content filtering
- Update weights in hybrid algorithm

### Testing
```bash
# Test Python service
curl http://localhost:5000/health

# Test recommendations
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user", "query": "mathematics", "limit": 5}'
```

## Production Deployment

### Docker (Recommended)
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["python", "start_ai_service.py"]
```

### Environment Variables
- Set `FLASK_ENV=production`
- Configure MongoDB connection string
- Set appropriate model parameters
- Enable logging and monitoring

### Scaling
- Use load balancer for multiple AI service instances
- Implement Redis for caching
- Use MongoDB replica sets for high availability
- Monitor resource usage and performance metrics
