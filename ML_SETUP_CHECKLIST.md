# ML Recommendation System - Setup Checklist

## ✅ Pre-Integration Checklist

- [x] Jupyter notebook created (`recommendation_model.ipynb`)
- [x] Python ML service created (`api/python-ai/hybrid_recommender.py`)
- [x] Training script created (`api/python-ai/train_model.py`)
- [x] Backend controllers updated (`api/controllers/recommend.controller.js`)
- [x] API routes updated (`api/routes/recommend.routes.js`)
- [x] Python dependencies listed (`api/python-ai/requirements.txt`)
- [x] Documentation created (ML_INTEGRATION_GUIDE.md)
- [x] Setup script created (`setup-ml.bat`)

---

## 📋 Installation Checklist

### Step 1: Python Setup
- [ ] Python 3.8+ installed (`python --version`)
- [ ] pip is working (`pip --version`)
- [ ] Virtual environment created (optional but recommended)
  ```bash
  cd api/python-ai
  python -m venv venv
  venv\Scripts\activate  # Windows
  ```

### Step 2: Install Dependencies
- [ ] Python dependencies installed
  ```bash
  cd api/python-ai
  pip install -r requirements.txt
  ```
- [ ] Verify installations:
  - [ ] pandas (`python -c "import pandas; print(pandas.__version__)")`)
  - [ ] numpy (`python -c "import numpy; print(numpy.__version__)")`)
  - [ ] scikit-learn (`python -c "import sklearn; print(sklearn.__version__)")`)
  - [ ] pymongo (`python -c "import pymongo; print(pymongo.__version__)")`)

### Step 3: Database Check
- [ ] MongoDB is running
- [ ] Database has users (`db.users.count()`)
- [ ] Database has packages (`db.packages.count()`)
- [ ] Database has interactions (`db.activities.count()` or `db.bookings.count()`)

### Step 4: Train Initial Model
- [ ] Run training script
  ```bash
  cd api/python-ai
  python train_model.py
  ```
- [ ] Check for success message
- [ ] Verify model file created: `api/python-ai/models/hybrid_model.pkl`
- [ ] Model file size is >1KB

### Step 5: Test Python Service
- [ ] Test recommend command
  ```bash
  echo {"userId": "test_user", "n": 5} | python hybrid_recommender.py recommend
  ```
- [ ] Test similar command
  ```bash
  echo {"packageId": "test_pkg", "n": 5} | python hybrid_recommender.py similar
  ```

### Step 6: Node.js Integration
- [ ] Node.js server starts without errors (`npm start`)
- [ ] Recommendation routes registered in server.js
- [ ] Test API endpoint with curl/Postman

### Step 7: API Testing
- [ ] Test personalized recommendations
  ```bash
  curl -H "Authorization: Bearer YOUR_TOKEN" \
       http://localhost:8800/api/recommend/personalized?limit=5
  ```
- [ ] Test similar packages
  ```bash
  curl http://localhost:8800/api/recommend/similar/PACKAGE_ID?limit=5
  ```
- [ ] Test model training endpoint
  ```bash
  curl -X POST http://localhost:8800/api/recommend/train-model
  ```

---

## 🔄 Operational Checklist

### Daily
- [ ] Monitor API response times
- [ ] Check for Python process errors in logs

### Weekly
- [ ] Retrain model with new data
  ```bash
  python api/python-ai/train_model.py
  # OR
  curl -X POST http://localhost:8800/api/recommend/train-model
  ```
- [ ] Review recommendation quality
- [ ] Check model file size (shouldn't grow too large)

### Monthly
- [ ] Analyze recommendation CTR (Click-Through Rate)
- [ ] A/B test different hybrid weights
- [ ] Review and update event weights if needed
- [ ] Clean up old interaction data (optional)

---

## 🎯 Frontend Integration Checklist

### Package List Page
- [ ] Fetch personalized recommendations
- [ ] Display "Recommended for You" section
- [ ] Track clicks on recommended packages

### Package Detail Page
- [ ] Fetch similar packages
- [ ] Display "You Might Also Like" section
- [ ] Track package views with time spent

### Search Results Page
- [ ] Track search queries
- [ ] Track clicks on search results
- [ ] Consider mixing in recommended packages

### User Dashboard
- [ ] Show personalized recommendations
- [ ] Track user interactions
- [ ] Display recently viewed packages

---

## 🐛 Troubleshooting Checklist

### Issue: Model Training Fails
- [ ] Check MongoDB connection string in `.env`
- [ ] Verify database has data
- [ ] Check Python dependencies are installed
- [ ] Review training logs for specific errors

### Issue: No Recommendations Returned
- [ ] Verify model file exists
- [ ] Check user exists in database
- [ ] Ensure user has some interaction history
- [ ] Review API logs for errors

### Issue: Python Process Errors
- [ ] Verify Python is in system PATH
- [ ] Check Python version (3.8+)
- [ ] Ensure all dependencies installed
- [ ] Test Python script independently

### Issue: Slow Response Times
- [ ] Check model file size (should be <50MB)
- [ ] Consider caching recommendations
- [ ] Reduce number of SVD components
- [ ] Optimize database queries

---

## 📊 Success Metrics Checklist

### Week 1
- [ ] Model trains successfully
- [ ] API returns recommendations
- [ ] Frontend displays recommendations
- [ ] Tracking endpoints work

### Month 1
- [ ] Measure recommendation CTR
  - Target: >5% of users click on recommendations
- [ ] Track conversion rate
  - Target: >2% of recommended packages lead to bookings
- [ ] Monitor API uptime
  - Target: >99% availability

### Quarter 1
- [ ] Improve model accuracy
  - Target: +50% improvement in NDCG
- [ ] Increase user engagement
  - Target: +20% package views from recommendations
- [ ] Optimize performance
  - Target: <500ms response time

---

## 🔒 Security Checklist

- [ ] Train model endpoint requires authentication
- [ ] Consider adding admin-only middleware to `/train-model`
- [ ] Validate user input in tracking endpoints
- [ ] Sanitize package IDs before querying
- [ ] Rate limit recommendation requests
- [ ] Log suspicious activity

---

## 📝 Documentation Checklist

- [x] Integration guide created
- [x] API documentation complete
- [x] Setup instructions clear
- [x] Troubleshooting guide available
- [ ] Frontend integration examples added to client docs
- [ ] Team trained on how to use the system
- [ ] Monitoring dashboard setup (optional)

---

## 🚀 Production Deployment Checklist

### Before Deploy
- [ ] All tests pass
- [ ] Model trained on production data
- [ ] Environment variables configured
- [ ] Backup plan in place

### Deploy
- [ ] Python dependencies installed on server
- [ ] Model files uploaded to server
- [ ] Server has Python in PATH
- [ ] API endpoints tested in production
- [ ] Monitoring enabled

### After Deploy
- [ ] Smoke test all endpoints
- [ ] Monitor logs for errors
- [ ] Track first week of metrics
- [ ] Schedule weekly retraining job

---

## ✨ Enhancement Checklist (Future)

- [ ] Add real-time learning (update model incrementally)
- [ ] Implement multi-armed bandit for exploration
- [ ] Use BERT/Word2Vec for better text embeddings
- [ ] Add diversity and serendipity metrics
- [ ] Create admin dashboard for model monitoring
- [ ] Implement A/B testing framework
- [ ] Add explanation features ("Why this recommendation?")
- [ ] Support multiple recommendation strategies

---

**Date Created**: November 22, 2025  
**Status**: Ready for Installation  
**Next Action**: Run `setup-ml.bat` or follow installation checklist
