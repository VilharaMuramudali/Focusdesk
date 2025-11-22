# Create Windows Scheduled Task for Weekly ML Model Retraining
# Run this script as Administrator

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "FocusDesk ML Weekly Retraining Setup" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

$scriptPath = "C:\Users\VILHARA MURAMUDALI\Documents\FOCUS-DESK\Focusdesk\retrain-model.bat"
$taskName = "FocusDesk ML Retraining"

# Check if script exists
if (-not (Test-Path $scriptPath)) {
    Write-Host "❌ Error: retrain-model.bat not found at $scriptPath" -ForegroundColor Red
    Write-Host "Please ensure the file exists before running this setup." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "✓ Found retraining script: $scriptPath" -ForegroundColor Green
Write-Host ""

# Check if task already exists
$existingTask = Get-ScheduledTask -TaskName $taskName -ErrorAction SilentlyContinue

if ($existingTask) {
    Write-Host "⚠️  Task '$taskName' already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (Y/N)"
    
    if ($overwrite -eq "Y" -or $overwrite -eq "y") {
        Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
        Write-Host "✓ Removed existing task" -ForegroundColor Green
    } else {
        Write-Host "Setup cancelled." -ForegroundColor Yellow
        pause
        exit 0
    }
}

Write-Host ""
Write-Host "Creating scheduled task..." -ForegroundColor Cyan
Write-Host ""

try {
    # Create the scheduled task action
    $action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument "/c `"$scriptPath`""
    
    # Create the trigger (Every Sunday at 2:00 AM)
    $trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2:00AM
    
    # Create the principal (run with highest privileges)
    $principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -RunLevel Highest
    
    # Create the settings
    $settings = New-ScheduledTaskSettingsSet `
        -StartWhenAvailable `
        -DontStopIfGoingOnBatteries `
        -AllowStartIfOnBatteries `
        -ExecutionTimeLimit (New-TimeSpan -Hours 2)
    
    # Register the task
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $trigger `
        -Principal $principal `
        -Settings $settings `
        -Description "Retrain FocusDesk recommendation model weekly with fresh user interaction data"
    
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "✅ Success! Scheduled task created!" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Task Details:" -ForegroundColor Cyan
    Write-Host "  Name: $taskName" -ForegroundColor White
    Write-Host "  Schedule: Every Sunday at 2:00 AM" -ForegroundColor White
    Write-Host "  Script: $scriptPath" -ForegroundColor White
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Yellow
    Write-Host "  1. Test the task now: Start-ScheduledTask -TaskName '$taskName'" -ForegroundColor White
    Write-Host "  2. View task in Task Scheduler: taskschd.msc" -ForegroundColor White
    Write-Host "  3. Check task history after first run" -ForegroundColor White
    Write-Host ""
    
    # Ask if user wants to test now
    $testNow = Read-Host "Would you like to test the task now? (Y/N)"
    
    if ($testNow -eq "Y" -or $testNow -eq "y") {
        Write-Host ""
        Write-Host "Starting task..." -ForegroundColor Cyan
        Start-ScheduledTask -TaskName $taskName
        
        Write-Host ""
        Write-Host "✓ Task started! Check the api\python-ai\models folder for the updated model file." -ForegroundColor Green
        Write-Host "  You can view the task status in Task Scheduler (taskschd.msc)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "============================================" -ForegroundColor Red
    Write-Host "❌ Error creating scheduled task!" -ForegroundColor Red
    Write-Host "============================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error details:" -ForegroundColor Yellow
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Make sure you're running PowerShell as Administrator" -ForegroundColor White
    Write-Host "  2. Check that the script path is correct" -ForegroundColor White
    Write-Host "  3. Ensure Windows Task Scheduler service is running" -ForegroundColor White
    pause
    exit 1
}

Write-Host ""
Write-Host "Setup complete! Your ML model will retrain automatically every Sunday at 2:00 AM. 🎉" -ForegroundColor Green
Write-Host ""
pause
