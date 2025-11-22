# 🚀 Quick Start: ML Recommendations in 5 Minutes

## Prerequisites
- ✅ Python 3.8+ installed
- ✅ MongoDB running with some data
- ✅ Node.js installed

---

## Step 1: Install Python Dependencies (1 minute)

```bash
cd api/python-ai
pip install pandas numpy scikit-learn pymongo python-dotenv
```

---

## Step 2: Train the Model (2 minutes)

```bash
python train_model.py
```

**Expected Output:**
```
================================================================================
TRAINING HYBRID RECOMMENDATION MODEL
================================================================================

[1/5] Connecting to MongoDB...
✓ Connected to MongoDB

[2/5] Exporting data from MongoDB...
✓ Data exported:
  - Users: 1000
  - Packages: 500
  - Events: 20000

[3/5] Training hybrid recommendation model...
  [1/4] Parsing text embeddings...
  [2/4] Building interaction matrix...
  [3/4] Training collaborative filtering model...
  [4/4] Computing content similarity...
✓ Model trained successfully!

[4/5] Saving model to disk...
✓ Model saved to models/hybrid_model.pkl

================================================================================
MODEL TRAINING COMPLETE!
================================================================================
```

---

## Step 3: Start the Server (30 seconds)

```bash
cd ../..
npm start
```

---

## Step 4: Test the API (1 minute)

### Get Personalized Recommendations

```bash
# Replace YOUR_TOKEN with actual JWT token
curl -H "Authorization: Bearer YOUR_TOKEN" \
     "http://localhost:8800/api/recommend/personalized?limit=5"
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
    "count": 5,
    "source": "ml-hybrid-model"
  }
}
```

### Get Similar Packages

```bash
# No auth required
curl "http://localhost:8800/api/recommend/similar/pkg_0001?limit=5"
```

---

## Step 5: Integrate in Frontend (30 seconds)

```javascript
// Fetch recommendations
const getRecommendations = async () => {
  const res = await fetch('/api/recommend/personalized?limit=5', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('Recommendations:', data.data.recommendations);
};

// Get similar packages
const getSimilar = async (packageId) => {
  const res = await fetch(`/api/recommend/similar/${packageId}?limit=5`);
  const data = await res.json();
  console.log('Similar:', data.data.similar);
};
```

---

## ✅ Done!

You now have a fully functional ML recommendation system!

### What's Next?

1. **Track User Interactions** - The more data, the better the recommendations
2. **Retrain Weekly** - Keep the model fresh with new data
3. **Monitor Performance** - Track CTR and conversion rates
4. **Optimize** - Experiment with different hybrid weights

---

## 📚 Full Documentation

- **Complete Guide**: See `ML_INTEGRATION_GUIDE.md`
- **Setup Checklist**: See `ML_SETUP_CHECKLIST.md`
- **Summary**: See `ML_INTEGRATION_SUMMARY.md`

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Model training fails | Check MongoDB connection in `.env` |
| No recommendations | Train the model first: `python train_model.py` |
| Python not found | Add Python to system PATH |
| Dependencies error | Run: `pip install -r requirements.txt` |

---

**Total Time**: ~5 minutes  
**Difficulty**: Easy  
**Status**: Production-Ready ✅
