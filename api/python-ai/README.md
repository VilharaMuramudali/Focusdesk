# FocusDesk ML Recommendation System

## Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Train the Model

```bash
python train_model.py
```

This will:
- Connect to MongoDB
- Export user interaction data
- Train the hybrid recommendation model
- Save the model to `models/hybrid_model.pkl`

### 3. Test the Model

```bash
# Get recommendations for a user
echo '{"userId": "user_00001", "n": 5}' | python hybrid_recommender.py recommend

# Get similar packages
echo '{"packageId": "pkg_0001", "n": 5}' | python hybrid_recommender.py similar
```

## Files

- **`hybrid_recommender.py`**: Main ML service (hybrid recommendation algorithm)
- **`train_model.py`**: Model training script (exports data from MongoDB and trains the model)
- **`requirements.txt`**: Python dependencies
- **`models/`**: Directory where trained models are saved

## Model Architecture

**Hybrid Approach:**
- 60% Collaborative Filtering (TruncatedSVD matrix factorization)
- 40% Content-Based Filtering (Cosine similarity on text embeddings)

**Input:**
- User interaction history (views, clicks, bookings)
- Package content (title, description, subject)

**Output:**
- Top N personalized package recommendations

## Usage from Node.js

The Node.js server calls this Python service via `child_process.spawn()`:

```javascript
const { spawn } = require('child_process');
const pythonProcess = spawn('python', ['hybrid_recommender.py', 'recommend']);
pythonProcess.stdin.write(JSON.stringify({ userId: 'user123', n: 5 }));
```

## Maintenance

**Retrain the model weekly** to incorporate new user interactions:

```bash
python train_model.py
```

Or via API endpoint: `POST /api/recommend/train-model`
