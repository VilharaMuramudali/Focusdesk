# ML Recommendation System Integration Guide

## Overview

This integration adds a **Hybrid Recommendation System** to the FocusDesk platform, combining:

- **Collaborative Filtering** (60%): Learns from user behavior patterns
- **Content-Based Filtering** (40%): Finds similar packages based on content
- **Result**: Personalized package recommendations for each user

---

## Architecture

```
┌─────────────────┐
│   Client App    │
└────────┬────────┘
         │ HTTP Requests
         ▼
┌─────────────────────────────────┐
│   Node.js Express Server        │
│   (recommend.routes.js)         │
└────────┬────────────────────────┘
         │ Spawns Python Process
         ▼
┌─────────────────────────────────┐
│   Python ML Service             │
│   (hybrid_recommender.py)       │
│                                 │
│   ┌───────────────────────┐    │
│   │  Trained SVD Model    │    │
│   │  Content Similarity   │    │
│   │  Interaction Matrix   │    │
│   └───────────────────────┘    │
└─────────────────────────────────┘
```

---

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd api/python-ai
pip install -r requirements.txt
```

### 2. Train the Initial Model

Before using recommendations, train the model with your existing data:

```bash
cd api/python-ai
python train_model.py
```

This will:
- Export data from MongoDB (users, packages, events)
- Train the hybrid model
- Save the model to `api/python-ai/models/hybrid_model.pkl`

### 3. Verify Installation

Test that the model works:

```bash
cd api/python-ai
echo '{"userId": "test_user_id", "n": 5}' | python hybrid_recommender.py recommend
```

---

## API Endpoints

### 1. Get Personalized Recommendations

**GET** `/api/recommend/personalized?limit=5`

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

**Response:**
```json
{
  "success": true,
  "message": "Personalized recommendations generated successfully",
  "data": {
    "recommendations": [
      {
        "packageId": "pkg_0123",
        "title": "Advanced Mathematics Package",
        "subject": "Mathematics",
        "score": 0.8541,
        "recommendationType": "hybrid"
      }
    ],
    "userId": "user_00001",
    "count": 5,
    "source": "ml-hybrid-model"
  }
}
```

### 2. Get Similar Packages

**GET** `/api/recommend/similar/:packageId?limit=5`

**Response:**
```json
{
  "success": true,
  "message": "Similar packages found successfully",
  "data": {
    "similar": [
      {
        "packageId": "pkg_0456",
        "title": "Intro Mathematics Package",
        "subject": "Mathematics",
        "similarity": 0.7623,
        "recommendationType": "content-based"
      }
    ],
    "packageId": "pkg_0123",
    "count": 5,
    "source": "ml-content-based"
  }
}
```

### 3. Train/Retrain Model

**POST** `/api/recommend/train-model`

**Response:**
```json
{
  "success": true,
  "message": "Model trained successfully",
  "data": {
    "output": "Training logs...",
    "timestamp": "2025-11-22T10:30:00.000Z"
  }
}
```

---

## Usage in Frontend

### Example: Get Recommendations

```javascript
// Fetch personalized recommendations for current user
const getRecommendations = async () => {
  try {
    const response = await fetch('/api/recommend/personalized?limit=5', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log('Recommendations:', data.data.recommendations);
      // Display recommendations in UI
      displayRecommendations(data.data.recommendations);
    }
  } catch (error) {
    console.error('Error fetching recommendations:', error);
  }
};
```

### Example: Get Similar Packages

```javascript
// Show "You might also like" section on package detail page
const getSimilarPackages = async (packageId) => {
  try {
    const response = await fetch(`/api/recommend/similar/${packageId}?limit=5`);
    const data = await response.json();
    
    if (data.success) {
      console.log('Similar packages:', data.data.similar);
      // Display similar packages
      displaySimilarPackages(data.data.similar);
    }
  } catch (error) {
    console.error('Error fetching similar packages:', error);
  }
};
```

---

## Data Collection

The system learns from user interactions. Make sure these are tracked:

### Track Package Views

```javascript
await fetch('/api/recommend/track-package-view', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    packageId: 'pkg_0123',
    timeSpent: 45, // seconds
    viewStartTime: new Date(),
    viewEndTime: new Date()
  })
});
```

### Track Clicks

```javascript
await fetch('/api/recommend/track', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    packageId: 'pkg_0123',
    interactionType: 'click'
  })
});
```

### Track Searches

```javascript
await fetch('/api/recommend/track-search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    searchQuery: 'mathematics tutoring',
    filters: { subject: 'Mathematics' }
  })
});
```

---

## Model Retraining

### Manual Retraining

Retrain the model when you have new data:

```bash
cd api/python-ai
python train_model.py
```

Or via API:

```bash
curl -X POST http://localhost:8800/api/recommend/train-model
```

### Automated Retraining (Recommended)

Set up a cron job to retrain weekly:

**Windows Task Scheduler:**
```
Program: python
Arguments: C:\path\to\api\python-ai\train_model.py
Schedule: Weekly, Sunday at 2:00 AM
```

**Linux Cron:**
```bash
# Edit crontab
crontab -e

# Add this line (runs every Sunday at 2 AM)
0 2 * * 0 cd /path/to/api/python-ai && python train_model.py >> /var/log/ml_training.log 2>&1
```

---

## Performance Considerations

### Cold Start Problem

For new users with no interaction history:
- System falls back to popularity-based recommendations
- Recommendation quality improves as users interact with packages

### Model Size

- Trained model: ~5-10 MB (depending on data size)
- Load time: ~1-2 seconds
- Memory usage: ~100-200 MB

### Scaling

For large datasets (>10,000 packages, >100,000 interactions):
- Consider using a dedicated ML service (FastAPI)
- Implement model caching
- Use asynchronous processing

---

## Monitoring & Maintenance

### Check Model Performance

1. **Track Recommendation Click-Through Rate (CTR)**
   - How many recommendations users click
   - Target: >5% CTR

2. **Monitor Conversion Rate**
   - Recommendations that lead to bookings
   - Target: >2% conversion

3. **A/B Testing**
   - Test different hybrid weights (e.g., 70/30, 50/50)
   - Measure which performs better

### Debug Mode

Enable detailed logging:

```javascript
// In recommend.controller.js, add:
console.log('ML Input:', { userId, limit });
console.log('ML Output:', result);
```

---

## Troubleshooting

### Error: "Python process exited with code 1"

**Solution:**
- Check Python is installed: `python --version`
- Verify dependencies: `pip list`
- Check error logs in console

### Error: "Model not found"

**Solution:**
- Train the model first: `python train_model.py`
- Check model file exists: `api/python-ai/models/hybrid_model.pkl`

### Error: "No recommendations returned"

**Causes:**
- New user with no interaction history → Uses fallback recommendations
- No packages in database
- Model not trained

**Solution:**
- Ensure packages exist in database
- Retrain model with current data

### Poor Recommendation Quality

**Solutions:**
1. Collect more interaction data (views, clicks, bookings)
2. Adjust hybrid weights in `hybrid_recommender.py`
3. Improve text embeddings (use BERT or Word2Vec)
4. Add more features (price, difficulty, ratings)

---

## Advanced Features (Future Enhancements)

1. **Real-time Learning**: Update model incrementally with new interactions
2. **Context-aware**: Consider time of day, device, location
3. **Multi-armed Bandit**: Balance exploration vs exploitation
4. **Deep Learning**: Use neural networks for better embeddings
5. **Explain ability**: Show why each package was recommended

---

## Model Accuracy Metrics

Current performance (from `recommendation_model.ipynb`):

| Metric | Hybrid Model | Improvement vs Collaborative |
|--------|-------------|------------------------------|
| Precision@5 | 0.60% | +200% |
| Recall@10 | 2.00% | +140% |
| NDCG@10 | 1.08% | +185% |

**Note:** These metrics improve with more user data!

---

## Support

For issues or questions:
1. Check the Jupyter notebook: `recommendation_model.ipynb`
2. Review training logs: Check console output from `train_model.py`
3. Verify data quality: Ensure events are being tracked correctly

---

## Summary

✅ **What's Integrated:**
- Hybrid recommendation algorithm
- RESTful API endpoints
- Automatic model training
- Fallback mechanisms

✅ **Benefits:**
- Personalized user experience
- Increased package discovery
- Higher engagement and conversions
- Data-driven insights

🚀 **Next Steps:**
1. Train initial model
2. Integrate API calls in frontend
3. Track user interactions
4. Monitor performance
5. Retrain weekly
