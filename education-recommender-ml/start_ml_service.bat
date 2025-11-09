@echo off
REM Start ML Recommendation API Service (Windows)

echo 🚀 Starting ML Recommendation API Service...
echo ==========================================

REM Check if virtual environment exists
if exist "venv\Scripts\activate.bat" (
    echo ✅ Activating virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo ⚠️ Virtual environment not found. Creating one...
    python -m venv venv
    call venv\Scripts\activate.bat
)

REM Install dependencies
echo 📦 Installing dependencies...
pip install -r requirements.txt

REM Start the service
echo 🚀 Starting ML API service on port 5000...
python ml_api_service.py

pause

