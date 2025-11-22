# API Testing Guide

## Test the ML Recommendation Endpoints

### 1. Test Similar Packages (No Auth Required)

```bash
curl "http://localhost:8800/api/recommend/similar/pkg_0001?limit=5"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Similar packages found successfully",
  "data": {
    "similar": [
      {
        "packageId": "pkg_0248",
        "similarity": 0.7506,
        "title": "Crash Design Package",
        "subject": "Mathematics",
        "recommendationType": "content-based"
      }
    ],
    "packageId": "pkg_0001",
    "count": 5,
    "source": "ml-content-based"
  }
}
```

---

### 2. Test Personalized Recommendations (Requires Auth)

First, get a JWT token by logging in:

```bash
# Login to get token
curl -X POST http://localhost:8800/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"testuser\",\"password\":\"password123\"}"
```

Then use the token:

```bash
# Replace YOUR_JWT_TOKEN with the actual token
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  "http://localhost:8800/api/recommend/personalized?limit=5"
```

---

### 3. Test Model Training

```bash
curl -X POST http://localhost:8800/api/recommend/train-model
```

---

## Test with Postman

### Similar Packages

- **Method**: GET
- **URL**: `http://localhost:8800/api/recommend/similar/pkg_0001?limit=5`
- **Headers**: None required

### Personalized Recommendations

- **Method**: GET
- **URL**: `http://localhost:8800/api/recommend/personalized?limit=5`
- **Headers**:
  - Key: `Authorization`
  - Value: `Bearer YOUR_JWT_TOKEN`

### Train Model

- **Method**: POST
- **URL**: `http://localhost:8800/api/recommend/train-model`
- **Headers**: None required

---

## Frontend Integration Examples

See `FRONTEND_INTEGRATION_EXAMPLES.md` for complete React integration code.
