# FocusDesk ML Recommendation System - Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FocusDesk Platform                          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (React)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │
│  │ Package List │  │Package Detail│  │  Dashboard   │             │
│  │              │  │              │  │              │             │
│  │ • Recommended│  │ • Similar    │  │ • Personal   │             │
│  │   For You    │  │   Packages   │  │   Picks      │             │
│  └──────────────┘  └──────────────┘  └──────────────┘             │
└────────────┬─────────────────┬─────────────────┬───────────────────┘
             │                 │                 │
             │ HTTP/JSON       │ HTTP/JSON       │ HTTP/JSON
             ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    Node.js Express Server (Port 8800)               │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │                  Recommendation Routes                         │ │
│  │  ┌────────────────────────────────────────────────────────┐   │ │
│  │  │ GET  /api/recommend/personalized?limit=5               │   │ │
│  │  │ GET  /api/recommend/similar/:packageId?limit=5         │   │ │
│  │  │ POST /api/recommend/train-model                        │   │ │
│  │  │ POST /api/recommend/track-search                       │   │ │
│  │  │ POST /api/recommend/track-package-view                 │   │ │
│  │  │ POST /api/recommend/track                              │   │ │
│  │  └────────────────────────────────────────────────────────┘   │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                               │                                     │
│                               │ spawn Python process                │
│                               ▼                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              Python ML Service (Child Process)                │ │
│  │  ┌────────────────────────────────────────────────────────┐  │ │
│  │  │  hybrid_recommender.py                                 │  │ │
│  │  │                                                         │  │ │
│  │  │  • recommend(userId, n)                                │  │ │
│  │  │  • get_similar_packages(packageId, n)                  │  │ │
│  │  │  • _get_popular_packages(n)                            │  │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  └───────────────────────────────────────────────────────────────┘ │
└────────────┬────────────────────────────────────────┬──────────────┘
             │                                        │
             │ Read Model                             │ Write Tracking
             ▼                                        ▼
┌─────────────────────────────────────┐  ┌──────────────────────────┐
│  Trained ML Model (Pickle)          │  │    MongoDB Database      │
│  ┌───────────────────────────────┐  │  │  ┌──────────────────┐   │
│  │ models/hybrid_model.pkl       │  │  │  │ users            │   │
│  │                               │  │  │  │ packages         │   │
│  │ • SVD Model                   │  │  │  │ activities       │   │
│  │ • Interaction Matrix          │  │  │  │ bookings         │   │
│  │ • Content Similarity Matrix   │  │  │  │ interactions     │   │
│  │ • Packages Metadata           │  │  │  └──────────────────┘   │
│  └───────────────────────────────┘  │  └──────────────────────────┘
└─────────────────────────────────────┘              ▲
             ▲                                       │
             │ Load Model                            │
             │                                       │ Export Data
┌────────────┴───────────────────────────────────────┴──────────────┐
│              Model Training Process (Weekly)                      │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  train_model.py                                              ││
│  │                                                              ││
│  │  1. Connect to MongoDB                                      ││
│  │  2. Export users, packages, events                          ││
│  │  3. Build interaction matrix                                ││
│  │  4. Train collaborative filtering (TruncatedSVD)            ││
│  │  5. Compute content similarity (Cosine)                     ││
│  │  6. Save model to models/hybrid_model.pkl                   ││
│  └──────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

### 1. User Interaction Flow

```
┌──────┐    View/Click/Book    ┌──────────┐    Track Event    ┌──────────┐
│ User │ ───────────────────▶  │ Frontend │ ─────────────────▶│  API     │
└──────┘                        └──────────┘                   └────┬─────┘
                                                                    │
                                                                    ▼
                                                              ┌──────────┐
                                                              │ MongoDB  │
                                                              │ Activity │
                                                              └──────────┘
```

### 2. Recommendation Flow

```
┌──────┐   Request Recommendations  ┌──────────┐   Call Python   ┌────────┐
│ User │ ─────────────────────────▶ │   API    │ ──────────────▶ │ Python │
└──────┘                             └──────────┘                 │   ML   │
   ▲                                      ▲                       └───┬────┘
   │                                      │                           │
   │                                      │  Return JSON              │
   │  Display                             │                           │
   │  Results                             └───────────────────────────┘
   │                                            Load Model
   │                                                 ▼
   └───────────────────────────────────────┌────────────────┐
                                           │ hybrid_model   │
                                           │     .pkl       │
                                           └────────────────┘
```

### 3. Model Training Flow

```
┌──────────┐   1. Export Data   ┌──────────┐
│ MongoDB  │ ◀────────────────  │  Train   │
└────┬─────┘                    │  Script  │
     │                          └────┬─────┘
     │                               │
     │ Users, Packages, Events       │ 2. Process Data
     │                               │
     └──────────────────────────────▶│
                                     │ 3. Train Models
                                     │    • SVD
                                     │    • Cosine Similarity
                                     │
                                     ▼
                              ┌──────────────┐
                              │ Save Model   │
                              │ .pkl File    │
                              └──────────────┘
```

## Component Interactions

### Hybrid Recommendation Algorithm

```
User Request (userId: "user_123")
         │
         ▼
┌────────────────────────────────────────────┐
│   Collaborative Filtering (60%)            │
│   ┌──────────────────────────────────┐    │
│   │ 1. Get user's predicted scores   │    │
│   │    from SVD model                 │    │
│   │ 2. Filter already interacted      │    │
│   │ 3. Normalize scores (0-1)         │    │
│   └──────────────────────────────────┘    │
└────────────────────────────────────────────┘
         │
         ├──────────── Combine Scores ────────────┐
         │                                        │
         ▼                                        ▼
┌────────────────────────────────────────────┐   │
│   Content-Based Filtering (40%)            │   │
│   ┌──────────────────────────────────┐    │   │
│   │ 1. Get user's last interaction   │    │   │
│   │ 2. Find similar packages          │    │   │
│   │    (cosine similarity)            │    │   │
│   │ 3. Normalize scores (0-1)         │    │   │
│   └──────────────────────────────────┘    │   │
└────────────────────────────────────────────┘   │
                                                  │
         ┌────────────────────────────────────────┘
         ▼
┌────────────────────────────────────────────┐
│   Hybrid Score Calculation                 │
│   hybrid = 0.6 * collab + 0.4 * content   │
└────────────────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│   Sort by Score & Return Top N             │
└────────────────────────────────────────────┘
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                      Technology Layers                      │
├─────────────────────────────────────────────────────────────┤
│  Frontend       │ React + Vite                              │
├─────────────────┼───────────────────────────────────────────┤
│  API Layer      │ Node.js + Express                         │
├─────────────────┼───────────────────────────────────────────┤
│  ML Service     │ Python 3.x                                │
│                 │ • pandas (data processing)                │
│                 │ • numpy (numerical operations)            │
│                 │ • scikit-learn (ML algorithms)            │
│                 │ • pymongo (database connection)           │
├─────────────────┼───────────────────────────────────────────┤
│  Database       │ MongoDB                                   │
├─────────────────┼───────────────────────────────────────────┤
│  Model Storage  │ Pickle (.pkl files)                       │
└─────────────────┴───────────────────────────────────────────┘
```

## File Structure

```
Focusdesk/
│
├── api/
│   ├── controllers/
│   │   └── recommend.controller.js  ◄── API logic
│   │
│   ├── routes/
│   │   └── recommend.routes.js      ◄── API endpoints
│   │
│   ├── python-ai/                    ◄── ML Service
│   │   ├── hybrid_recommender.py    ◄── Main ML algorithm
│   │   ├── train_model.py           ◄── Training script
│   │   ├── requirements.txt         ◄── Python dependencies
│   │   └── models/
│   │       └── hybrid_model.pkl     ◄── Trained model (generated)
│   │
│   ├── models/
│   │   ├── activity.model.js        ◄── User activity schema
│   │   ├── package.model.js         ◄── Package schema
│   │   └── interaction.model.js     ◄── Interaction schema
│   │
│   └── server.js                    ◄── Express server
│
├── ML/
│   └── recommender_dataset/         ◄── Training data
│       ├── users.csv
│       ├── packages.csv
│       └── events.csv
│
├── recommendation_model.ipynb       ◄── Research notebook
│
├── ML_INTEGRATION_GUIDE.md          ◄── Full documentation
├── ML_INTEGRATION_SUMMARY.md        ◄── Quick overview
├── ML_SETUP_CHECKLIST.md            ◄── Setup steps
├── QUICKSTART_ML.md                 ◄── 5-minute guide
│
└── setup-ml.bat                     ◄── Automated setup
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Production Server                          │
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                     │
│  │  Node.js     │         │   Python     │                     │
│  │  Process     │ spawn   │   Process    │                     │
│  │  (Express)   │────────▶│  (ML Model)  │                     │
│  └──────┬───────┘         └──────┬───────┘                     │
│         │                        │                              │
│         │                        │ Load Model                   │
│         │                        ▼                              │
│         │                ┌──────────────┐                       │
│         │                │ Model Files  │                       │
│         │                │   (.pkl)     │                       │
│         │                └──────────────┘                       │
│         │                                                       │
│         │ Query/Update                                          │
│         ▼                                                       │
│  ┌──────────────┐                                               │
│  │   MongoDB    │                                               │
│  │   Database   │                                               │
│  └──────────────┘                                               │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Security & Performance

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Measures                         │
├─────────────────────────────────────────────────────────────┤
│  • JWT Authentication for personalized recommendations      │
│  • Input validation on all tracking endpoints               │
│  • Rate limiting on API requests                            │
│  • Admin-only access for model training endpoint            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                 Performance Optimizations                   │
├─────────────────────────────────────────────────────────────┤
│  • Model loaded once and cached in Python process           │
│  • Asynchronous Python execution (non-blocking)             │
│  • Efficient matrix operations with NumPy                   │
│  • Database indexes on user_id and package_id               │
│  • Fallback to simple recommendations if ML fails           │
└─────────────────────────────────────────────────────────────┘
```
