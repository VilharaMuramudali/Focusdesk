@echo off
REM Weekly Model Retraining Script for FocusDesk ML Recommendations
REM Run this script weekly to update the recommendation model

echo ============================================
echo FocusDesk ML Model Retraining
echo ============================================
echo.

REM Change to API directory
cd /d "%~dp0api\python-ai"

REM Activate virtual environment if exists
if exist "venv\Scripts\activate.bat" (
    echo [1/3] Activating Python virtual environment...
    call venv\Scripts\activate.bat
) else (
    echo [1/3] Using system Python...
)

REM Backup old model
echo.
echo [2/3] Backing up current model...
if exist "models\hybrid_model.pkl" (
    copy "models\hybrid_model.pkl" "models\hybrid_model_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.pkl" >nul
    echo     Backup created: hybrid_model_backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.pkl
) else (
    echo     No existing model to backup
)

REM Train new model
echo.
echo [3/3] Training new model...
python train_from_csv.py

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ============================================
    echo Model Retraining Successful!
    echo ============================================
    echo.
    echo Next steps:
    echo 1. Restart your Node.js server to load the new model
    echo 2. Test recommendations at http://localhost:8800/api/recommend/personalized
    echo 3. Check model performance in logs
    echo.
) else (
    echo.
    echo ============================================
    echo Model Retraining Failed!
    echo ============================================
    echo.
    echo The backup model is still available.
    echo Check the error messages above.
    echo.
)

pause
