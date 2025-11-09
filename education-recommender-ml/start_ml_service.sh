#!/bin/bash
# Start ML Recommendation API Service

echo "🚀 Starting ML Recommendation API Service..."
echo "=========================================="

# Check if virtual environment exists
if [ -d "venv" ]; then
    echo "✅ Activating virtual environment..."
    source venv/bin/activate
else
    echo "⚠️ Virtual environment not found. Creating one..."
    python -m venv venv
    source venv/bin/activate
fi

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt

# Start the service
echo "🚀 Starting ML API service on port 5000..."
python ml_api_service.py

