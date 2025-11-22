@echo off
echo ========================================
echo FocusDesk ML Setup Script
echo ========================================
echo.

echo [1/3] Installing Python dependencies...
cd api\python-ai
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo Error: Failed to install Python dependencies
    pause
    exit /b 1
)
echo ✓ Python dependencies installed successfully
echo.

echo [2/3] Training initial ML model...
python train_model.py
if %errorlevel% neq 0 (
    echo Error: Failed to train model
    pause
    exit /b 1
)
echo ✓ Model trained successfully
echo.

echo [3/3] Installing Node.js dependencies...
cd ..\..
npm install
if %errorlevel% neq 0 (
    echo Error: Failed to install Node.js dependencies
    pause
    exit /b 1
)
echo ✓ Node.js dependencies installed successfully
echo.

echo ========================================
echo ML Setup Complete!
echo ========================================
echo.
echo You can now use the recommendation system:
echo - GET /api/recommend/personalized
echo - GET /api/recommend/similar/:packageId
echo - POST /api/recommend/train-model
echo.
pause
