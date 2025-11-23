# Manual Testing Commands for AI Recommendation System

## Prerequisites
- **Backend API** running on port `8800` (default)
- **ML Service** running on port `5000` (default)
- **MongoDB** connected and running
- **Authentication token** (JWT) for protected endpoints

---

## 1. ML Service Health & Status Checks

### 1.1 Check ML Service Health
```bash
curl http://localhost:5000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "timestamp": "2024-..."
}
```

### 1.2 Get ML Service Statistics
```bash
curl http://localhost:5000/stats
```

**Expected Response:**
```json
{
  "models_loaded": true,
  "model_exists": true,
  "processed_data_exists": true,
  "users_count": 100,
  "packages_count": 50,
  "timestamp": "2024-..."
}
```

---

## 2. ML Model Training & Initialization

### 2.1 Extract Data from MongoDB
```bash
curl -X POST http://localhost:5000/extract-data \
  -H "Content-Type: application/json" \
  -d "{\"mongo_uri\": \"mongodb://localhost:27017/\", \"db_name\": \"focusdesk\"}"
```

### 2.2 Train the Recommendation Model
```bash
curl -X POST http://localhost:5000/train
```

### 2.3 Extract Data and Train Model (One Step)
```bash
curl -X POST http://localhost:5000/extract-and-train
```

---

## 3. Testing ML Recommendations Directly

### 3.1 Get Recommendations for a User (Basic)
```bash
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"YOUR_USER_ID_HERE\",
    \"algorithm\": \"hybrid\",
    \"limit\": 10
  }"
```

### 3.2 Get Recommendations with Topic Query
```bash
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"YOUR_USER_ID_HERE\",
    \"query\": \"mathematics\",
    \"algorithm\": \"hybrid\",
    \"limit\": 5
  }"
```

### 3.3 Test Collaborative Filtering Algorithm
```bash
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"YOUR_USER_ID_HERE\",
    \"algorithm\": \"collaborative\",
    \"limit\": 10
  }"
```

### 3.4 Test Content-Based Filtering Algorithm
```bash
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"YOUR_USER_ID_HERE\",
    \"algorithm\": \"content\",
    \"limit\": 10
  }"
```

### 3.5 Test Hybrid Algorithm (Default)
```bash
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"YOUR_USER_ID_HERE\",
    \"algorithm\": \"hybrid\",
    \"limit\": 10
  }"
```

**Note:** Replace `YOUR_USER_ID_HERE` with an actual user ID from your MongoDB database.

---

## 4. Testing Backend API Endpoints (Requires Authentication)

### 4.1 Get Educator Recommendations (Main Endpoint)
```bash
curl -X GET "http://localhost:8800/api/recommendations/educators?topic=mathematics&algorithm=hybrid&limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.2 Get Recommendations with Filters
```bash
curl -X GET "http://localhost:8800/api/recommendations/educators?topic=science&algorithm=hybrid&limit=5&minRating=4.0&priceRange=500-1000" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.3 Get Dashboard Recommendations
```bash
curl -X GET "http://localhost:8800/api/recommendations/dashboard" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.4 Get Tutor Recommendations
```bash
curl -X GET "http://localhost:8800/api/recommendations/tutors" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4.5 Track Recommendation Interaction
```bash
curl -X POST http://localhost:8800/api/recommendations/track \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"targetEducatorId\": \"EDUCATOR_ID\",
    \"interactionType\": \"click\",
    \"recommendationRank\": 1,
    \"algorithmUsed\": \"hybrid\"
  }"
```

### 4.6 Track Search Query
```bash
curl -X POST http://localhost:8800/api/recommendations/track-search \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"searchQuery\": \"advanced mathematics tutor\",
    \"filters\": {}
  }"
```

### 4.7 Track Package View with Time Spent
```bash
curl -X POST http://localhost:8800/api/recommendations/track-package-view \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"packageId\": \"PACKAGE_ID\",
    \"timeSpent\": 45,
    \"viewStartTime\": \"2024-01-01T10:00:00Z\",
    \"viewEndTime\": \"2024-01-01T10:00:45Z\"
  }"
```

### 4.8 Get Recommendation Metrics
```bash
curl -X GET http://localhost:8800/api/recommendations/metrics \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 5. AI Service Management Endpoints

### 5.1 Get AI Service Stats
```bash
curl -X GET http://localhost:8800/api/recommendations/ai/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.2 Train AI Model via Backend
```bash
curl -X POST http://localhost:8800/api/recommendations/ai/train \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.3 Load AI Model via Backend
```bash
curl -X POST http://localhost:8800/api/recommendations/ai/load \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.4 Get Available Algorithms
```bash
curl -X GET http://localhost:8800/api/recommendations/ai/algorithms \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 5.5 Get Evaluation Results
```bash
curl -X GET http://localhost:8800/api/recommendations/ai/evaluation-results \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 6. Automated Test Scripts

### 6.1 Run Comprehensive ML Connection Test
```bash
cd api
node test-ml-connection.js
```

### 6.2 Test Personalized Recommendations
```bash
cd api
node test-personalized-recommendations.js
```

### 6.3 Run Connection Check Script
```bash
cd api
node check-connection.js
```

---

## 7. Getting Test Data (User IDs, Package IDs)

### 7.1 Get User ID from MongoDB (using MongoDB Shell)
```bash
mongosh focusdesk
db.users.findOne({isEducator: false}, {_id: 1, username: 1, email: 1})
```

### 7.2 Get All Student IDs
```bash
mongosh focusdesk
db.users.find({isEducator: false}, {_id: 1, username: 1}).toArray()
```

### 7.3 Get Package IDs
```bash
mongosh focusdesk
db.packages.find({isActive: true}, {_id: 1, title: 1}).limit(10).toArray()
```

### 7.4 Get JWT Token (via Login Endpoint)
```bash
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"YOUR_USERNAME\",
    \"password\": \"YOUR_PASSWORD\"
  }"
```

**Response will contain:** `accessToken` - use this as `YOUR_JWT_TOKEN`

---

## 8. PowerShell Commands (Windows)

### 8.1 Test ML Service Health (PowerShell)
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/health" -Method Get
```

### 8.2 Get Recommendations (PowerShell)
```powershell
$body = @{
    user_id = "YOUR_USER_ID"
    algorithm = "hybrid"
    limit = 10
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/recommendations" -Method Post -Body $body -ContentType "application/json"
```

### 8.3 Get Recommendations with Token (PowerShell)
```powershell
$headers = @{
    Authorization = "Bearer YOUR_JWT_TOKEN"
}

Invoke-RestMethod -Uri "http://localhost:8800/api/recommendations/educators?topic=math&limit=5" -Method Get -Headers $headers
```

---

## 9. Quick Test Sequence

### Complete Test Workflow:
```bash
# 1. Check ML Service is running
curl http://localhost:5000/health

# 2. Check ML Model Status
curl http://localhost:5000/stats

# 3. If model not loaded, train it
curl -X POST http://localhost:5000/extract-and-train

# 4. Get a user ID (replace with actual ID)
# User ID: 507f1f77bcf86cd799439011

# 5. Test recommendations
curl -X POST http://localhost:5000/recommendations \
  -H "Content-Type: application/json" \
  -d '{"user_id": "507f1f77bcf86cd799439011", "algorithm": "hybrid", "limit": 5}'

# 6. Login to get JWT token
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "student1", "password": "password123"}'

# 7. Test backend endpoint (use token from step 6)
curl -X GET "http://localhost:8800/api/recommendations/educators?topic=math&limit=5" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 10. Common Test Scenarios

### Scenario 1: New User (No History)
- Use a user ID that has no interactions
- Test with `algorithm: "hybrid"` and `algorithm: "content"`

### Scenario 2: User with History
- Use a user ID with previous interactions/bookings
- Test all algorithms: `hybrid`, `collaborative`, `content`

### Scenario 3: Topic-Specific Search
- Test with different topics: `"mathematics"`, `"science"`, `"english"`
- Verify results match the topic

### Scenario 4: Filter Testing
- Test with `minRating`, `priceRange`, `language` filters
- Verify results respect the filters

### Scenario 5: Multiple Algorithms Comparison
- Request recommendations with same user and topic
- Compare results from `hybrid`, `collaborative`, and `content` algorithms

---

## 11. Expected Response Format

### ML Service Recommendation Response:
```json
{
  "success": true,
  "recommendations": [
    {
      "_id": "package_id",
      "packageId": "package_id",
      "title": "Advanced Mathematics",
      "description": "Learn advanced math concepts",
      "rate": 500,
      "price": 500,
      "score": 0.95,
      "method": "hybrid",
      "isPersonalized": true,
      "aiScore": 0.95
    }
  ],
  "algorithm": "hybrid",
  "count": 5,
  "timestamp": "2024-..."
}
```

### Backend API Response:
```json
{
  "success": true,
  "data": {
    "recommendations": [...],
    "algorithm": "hybrid",
    "totalCount": 10,
    "source": "ai"
  }
}
```

---

## 12. Troubleshooting Commands

### Check if ML Service is Running
```bash
# Windows
netstat -ano | findstr :5000

# Linux/Mac
lsof -i :5000
```

### Check if Backend API is Running
```bash
# Windows
netstat -ano | findstr :8800

# Linux/Mac
lsof -i :8800
```

### View ML Service Logs
- Check the terminal where ML service is running
- Or check logs in `education-recommender-ml/` directory

### Check MongoDB Connection
```bash
mongosh focusdesk
db.users.countDocuments()
db.packages.countDocuments()
```

---

## Notes:
1. Replace `YOUR_JWT_TOKEN` with actual JWT token from login
2. Replace `YOUR_USER_ID_HERE` with actual MongoDB user ObjectId
3. Ensure both backend (port 8800) and ML service (port 5000) are running
4. All timestamps should be in ISO format
5. User must be a student (`isEducator: false`) to get recommendations

