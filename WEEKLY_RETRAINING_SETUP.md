# Weekly Model Retraining Setup Guide

## Overview

To maintain optimal recommendation quality, the ML model should be retrained weekly with fresh user interaction data. This guide shows you how to set up automated weekly retraining on Windows.

---

## Quick Start

### Manual Retraining

Simply double-click `retrain-model.bat` or run:

```bash
retrain-model.bat
```

This will:
1. ✅ Backup your current model
2. ✅ Train a new model with latest data
3. ✅ Save the new model to `api/python-ai/models/hybrid_model.pkl`

---

## Automated Weekly Retraining (Windows Task Scheduler)

### Method 1: Quick Setup Script

1. **Run this PowerShell command as Administrator:**

```powershell
$action = New-ScheduledTaskAction -Execute 'cmd.exe' -Argument '/c "C:\Users\VILHARA MURAMUDALI\Documents\FOCUS-DESK\Focusdesk\retrain-model.bat"'
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At 2:00AM
$principal = New-ScheduledTaskPrincipal -UserId "$env:USERNAME" -RunLevel Highest
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopIfGoingOnBatteries
Register-ScheduledTask -TaskName "FocusDesk ML Retraining" -Action $action -Trigger $trigger -Principal $principal -Settings $settings -Description "Retrain FocusDesk recommendation model weekly"
```

This creates a scheduled task that runs every Sunday at 2:00 AM.

---

### Method 2: Manual Task Scheduler Setup

1. **Open Task Scheduler:**
   - Press `Win + R`
   - Type `taskschd.msc`
   - Press Enter

2. **Create New Task:**
   - Click "Create Task" (not "Create Basic Task")
   - Name: `FocusDesk ML Retraining`
   - Description: `Retrain recommendation model weekly`
   - Check "Run whether user is logged on or not"
   - Check "Run with highest privileges"

3. **Triggers Tab:**
   - Click "New"
   - Begin the task: "On a schedule"
   - Settings: "Weekly"
   - Start: Select a time (e.g., 2:00 AM on Sunday)
   - Recur every: 1 week
   - Days: Sunday (or your preferred day)
   - Click OK

4. **Actions Tab:**
   - Click "New"
   - Action: "Start a program"
   - Program/script: `cmd.exe`
   - Add arguments: `/c "C:\Users\VILHARA MURAMUDALI\Documents\FOCUS-DESK\Focusdesk\retrain-model.bat"`
   - Start in: `C:\Users\VILHARA MURAMUDALI\Documents\FOCUS-DESK\Focusdesk`
   - Click OK

5. **Settings Tab:**
   - Check "Allow task to be run on demand"
   - Check "Run task as soon as possible after a scheduled start is missed"
   - Check "If the task fails, restart every: 10 minutes"
   - Click OK

6. **Save the Task:**
   - Click OK to save
   - Enter your Windows password when prompted

---

## Testing Your Scheduled Task

### Test the task immediately:

```powershell
Start-ScheduledTask -TaskName "FocusDesk ML Retraining"
```

### Check task history:

1. Open Task Scheduler
2. Find "FocusDesk ML Retraining" in the task list
3. Click on it
4. View the "History" tab to see execution logs

---

## Monitoring Retraining

### Check Last Retraining Date

The model file timestamp shows when it was last trained:

```powershell
Get-Item "api\python-ai\models\hybrid_model.pkl" | Select-Object LastWriteTime
```

### View Training Logs

After retraining, check the output:

```powershell
Get-Content "api\python-ai\training.log" -Tail 50
```

### Model Backups

Backups are saved with timestamps:

```
api/python-ai/models/
├── hybrid_model.pkl                  (current model)
├── hybrid_model_backup_20240115.pkl  (backup from Jan 15)
├── hybrid_model_backup_20240122.pkl  (backup from Jan 22)
└── hybrid_model_backup_20240129.pkl  (backup from Jan 29)
```

---

## When to Retrain

### Recommended Schedule

- **Default:** Weekly (Sunday 2:00 AM)
- **High activity:** Twice weekly (Sunday & Wednesday)
- **Low activity:** Bi-weekly or monthly

### Signs You Need to Retrain

✅ **Retrain if:**
- User base has grown >10%
- New packages added
- Major changes in booking patterns
- Recommendation CTR is declining
- More than 7 days since last training

⚠️ **Don't retrain if:**
- Less than 100 new interactions since last training
- Server is under heavy load
- During peak business hours

---

## Troubleshooting

### Task Didn't Run

**Check Task Scheduler history:**
```powershell
Get-ScheduledTaskInfo -TaskName "FocusDesk ML Retraining"
```

**Common issues:**
- Computer was in sleep mode → Enable "Wake the computer to run this task"
- User not logged in → Set "Run whether user is logged on or not"
- Permission denied → Run task as Administrator

### Training Failed

**Check Python installation:**
```powershell
python --version
```

**Check dependencies:**
```bash
cd api\python-ai
pip list | findstr "pandas numpy scikit-learn"
```

**Check data files:**
```powershell
dir "ML\recommender_dataset\*.csv"
```

### Model Not Loading

**Verify model file exists:**
```powershell
dir "api\python-ai\models\hybrid_model.pkl"
```

**Test model manually:**
```bash
cd api\python-ai
echo {"userId": "user_00001", "n": 5} | python hybrid_recommender.py recommend
```

**Restart Node.js server:**
```bash
cd api
npm start
```

---

## Advanced: Custom Retraining Schedule

### Train Multiple Times Per Week

Edit the PowerShell script trigger:

```powershell
# Train every Monday, Wednesday, Friday at 2:00 AM
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Monday,Wednesday,Friday -At 2:00AM
```

### Train After Specific Events

Create a script that checks conditions before training:

```batch
@echo off
REM Only train if >1000 new interactions

cd api\python-ai
python -c "import pandas as pd; df = pd.read_csv('../../ML/recommender_dataset/user_package_events.csv'); print(len(df))" > temp.txt
set /p TOTAL=<temp.txt
del temp.txt

if %TOTAL% GTR 20000 (
    echo Training model with %TOTAL% total interactions...
    python train_from_csv.py
) else (
    echo Only %TOTAL% interactions, skipping training
)
```

---

## Email Notifications (Optional)

### Get notified when retraining completes:

Add this to the end of `retrain-model.bat`:

```batch
REM Send email notification (requires blat or similar)
blat -to your-email@example.com -subject "FocusDesk Model Retrained" -body "Model retraining completed successfully!"
```

Or use PowerShell:

```powershell
Send-MailMessage -To "your-email@example.com" -From "focusdesk@example.com" -Subject "Model Retrained" -Body "Weekly retraining completed" -SmtpServer "smtp.gmail.com" -Port 587 -UseSsl -Credential (Get-Credential)
```

---

## Performance Tracking

### Monitor Recommendation Quality Over Time

Create a log of model performance after each training:

```python
# Add to train_from_csv.py at the end:

import json
from datetime import datetime

metrics = {
    'timestamp': datetime.now().isoformat(),
    'precision_at_5': precision_at_5,
    'recall_at_10': recall_at_10,
    'ndcg_at_10': ndcg_at_10,
    'total_users': len(users_df),
    'total_packages': len(packages_df),
    'total_events': len(events_df)
}

# Append to metrics log
with open('models/training_history.json', 'a') as f:
    f.write(json.dumps(metrics) + '\n')
```

View history:

```bash
type api\python-ai\models\training_history.json
```

---

## Checklist

- [ ] Test manual retraining with `retrain-model.bat`
- [ ] Create scheduled task in Task Scheduler
- [ ] Set task to run weekly (Sunday 2:00 AM)
- [ ] Enable "Run whether user is logged on or not"
- [ ] Enable "Wake computer to run this task"
- [ ] Test scheduled task immediately
- [ ] Verify task appears in Task Scheduler history
- [ ] Set up model backup retention (keep last 4 weeks)
- [ ] Configure email notifications (optional)
- [ ] Document retraining process for your team

---

## Quick Reference Commands

```bash
# Manual retrain
retrain-model.bat

# Test model
cd api\python-ai
echo {"userId": "user_00001", "n": 5} | python hybrid_recommender.py recommend

# Check model date
powershell -Command "Get-Item api\python-ai\models\hybrid_model.pkl | Select-Object LastWriteTime"

# Run scheduled task now
powershell -Command "Start-ScheduledTask -TaskName 'FocusDesk ML Retraining'"

# View task history
powershell -Command "Get-ScheduledTaskInfo -TaskName 'FocusDesk ML Retraining'"
```

---

## Next Steps

1. ✅ Run `retrain-model.bat` to verify it works
2. ✅ Set up automated weekly schedule
3. ✅ Monitor first few automated runs
4. ✅ Track recommendation performance metrics
5. ✅ Adjust schedule based on user activity

**You're all set!** Your recommendation model will now stay fresh and improve over time. 🎉
