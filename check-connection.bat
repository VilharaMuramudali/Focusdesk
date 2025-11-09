@echo off
echo ========================================
echo ML Service Connection Check
echo ========================================
echo.

echo Step 1: Checking if Node.js backend is running (port 8800)...
curl -s http://localhost:8800 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Node.js backend is running
) else (
    echo [X] Node.js backend is NOT running
    echo    Start it with: cd api ^&^& npm start
)
echo.

echo Step 2: Checking if ML service is running (port 5000)...
curl -s http://localhost:5000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] ML service is running
    echo.
    echo Step 3: Getting ML service health details...
    curl -s http://localhost:5000/health
    echo.
    echo.
    echo Step 4: Getting ML service stats...
    curl -s http://localhost:5000/stats
    echo.
) else (
    echo [X] ML service is NOT running
    echo    It should auto-start with Node.js backend
)
echo.

echo ========================================
echo Connection Check Complete
echo ========================================
pause
