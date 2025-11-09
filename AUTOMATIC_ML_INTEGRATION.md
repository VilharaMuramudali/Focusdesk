# Automatic ML Service Integration

The ML recommendation service now starts **automatically** when the Node.js backend server starts. No manual command-line setup is required!

## How It Works

### Automatic Startup Process

1. **When Node.js server starts**, it automatically:
   - Detects Python installation
   - Finds the ML service directory
   - Checks and installs Python dependencies if needed
   - Starts the ML API service on port 5000
   - Checks if model is trained, and trains it if needed
   - Sets up automatic periodic retraining (every 24 hours by default)

2. **ML Service Lifecycle**:
   - Starts automatically with Node.js server
   - Monitors health every 30 seconds
   - Auto-restarts if it crashes
   - Trains model initially if not found
   - Retrains periodically to stay up-to-date

### Configuration

Add these optional environment variables to your `api/.env` file:

```env
# Enable/disable ML service (default: true)
ML_SERVICE_ENABLED=true

# ML service URL (default: http://localhost:5000)
ML_API_URL=http://localhost:5000
AI_SERVICE_URL=http://localhost:5000

# Automatic training interval in hours (default: 24)
ML_TRAINING_INTERVAL_HOURS=24

# ML API port (default: 5000)
ML_API_PORT=5000
```

### What Happens on Server Startup

```
🚀 Starting Node.js backend server...
✅ Connected to MongoDB!

🤖 Initializing ML Recommendation Service...
✅ Found Python executable: python
📦 Installing dependencies (if needed)...
🚀 Starting ML Recommendation Service...
✅ ML service started successfully!
📚 Checking ML model status and initializing if needed...
🔄 Automatic model training scheduled every 24 hours
```

### Automatic Features

1. **Dependency Installation**: Automatically installs Python dependencies if missing
2. **Model Training**: Trains model automatically if not found (waits 60 seconds after service start)
3. **Periodic Retraining**: Retrains model every 24 hours (configurable) to stay current
4. **Health Monitoring**: Checks service health every 30 seconds
5. **Auto-Restart**: Automatically restarts ML service if it crashes
6. **Graceful Fallback**: Falls back to rule-based recommendations if ML service unavailable

### Disabling ML Service

To disable automatic ML service startup, add to `api/.env`:

```env
ML_SERVICE_ENABLED=false
```

### Manual Control (Optional)

If you want to manually control the ML service, you can still use:

```bash
# Extract data
curl -X POST http://localhost:5000/extract-data

# Train model
curl -X POST http://localhost:5000/train

# Check status
curl http://localhost:5000/stats
```

### Troubleshooting

1. **ML Service Not Starting**:
   - Check if Python is installed: `python --version`
   - Check if ML directory exists: `education-recommender-ml/`
   - Check Node.js logs for error messages

2. **Model Training Fails**:
   - Ensure MongoDB is running and accessible
   - Check MongoDB connection string in `.env`
   - Verify there's data in the database (users, packages, interactions)

3. **No Recommendations**:
   - Check if model is trained: `curl http://localhost:5000/stats`
   - If model doesn't exist, wait for automatic training (60 seconds after startup)
   - Check ML service logs in Node.js console

### Logs

All ML service activity is logged in the Node.js server console:
- `[ML Service]:` - Python service output
- `[ML Service Error]:` - Python service errors
- Regular status updates about service health and training

### Performance

- **Initial startup**: ~30-60 seconds (includes dependency check and service start)
- **Model training**: ~1-5 minutes (depends on data size)
- **Recommendations**: ~100-500ms per request
- **Health checks**: Every 30 seconds (minimal overhead)

## Summary

✅ **Fully Automatic**: No manual commands needed  
✅ **Self-Healing**: Auto-restarts if service crashes  
✅ **Smart Training**: Trains automatically when needed  
✅ **Periodic Updates**: Keeps model current with new data  
✅ **Graceful Fallback**: Always provides recommendations  

Just start your Node.js server and the ML service will handle everything automatically! 🚀

