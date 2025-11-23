# Activity Heatmap Testing Guide

## Overview
The activity heatmap now properly displays user activity based on completed sessions from the database.

## What Was Fixed

### 1. Visual Improvements
- ✅ Enhanced hover effects (cells scale and show shadow)
- ✅ Added border on hover for better visibility
- ✅ Added active days counter below the heatmap
- ✅ Added empty state message when no activity exists
- ✅ Console logging to debug data fetching

### 2. Data Flow
```
User Activity → Database (Bookings/LearningSessions) 
→ Backend API (/api/learning/activity) 
→ Frontend (activityData state) 
→ Heatmap Grid Rendering
```

### 3. Activity Levels
The heatmap uses 5 activity levels with distinct colors:
- **Level 0** (No activity): Light gray `#ebedf0`
- **Level 1** (1 session): Light green `#c6e48b`
- **Level 2** (2 sessions): Medium green `#7bc96f`
- **Level 3** (3 sessions): Dark green `#239a3b`
- **Level 4** (4+ sessions): Darkest green `#196127`

## How to Test

### Step 1: Check Browser Console
1. Open the My Learning page
2. Open Browser DevTools (F12)
3. Look for these console messages:
   ```
   Activity Data Fetched: {2024-11-15: 2, 2024-11-18: 1, ...}
   Number of active dates: X
   Generating grid with activity data: {...}
   ```

### Step 2: Verify Visual Display
1. The heatmap grid should show 28 columns × 7 rows (196 cells total)
2. Cells with activity should be green (shades based on activity level)
3. Gray cells = no activity on that date
4. Hover over cells to see date and session count tooltip
5. Bottom of heatmap shows: "Active time" + "X active days" (if data exists)

### Step 3: Check Empty State
If no activity data exists:
- You'll see a message: "No activity recorded yet. Complete sessions to see your activity heatmap!"
- All cells will be gray (level-0)

### Step 4: Generate Test Data (If Needed)

If you have no activity data to display:

```bash
# Navigate to API directory
cd api

# Run the data generation script
node scripts/generate-learning-data.js
```

This script will:
- Create bookings with completed sessions spanning 6 months
- Generate realistic activity patterns
- Provide data for all analytics (stats, trends, activity, recommendations)

### Step 5: Verify Backend Response

Test the API endpoint directly:

```bash
# Using curl (if you have it)
curl -X GET http://localhost:5000/api/learning/activity \
  -H "Cookie: accessToken=YOUR_TOKEN"

# Or visit in browser (if logged in)
http://localhost:5000/api/learning/activity
```

Expected response format:
```json
{
  "2024-05-15": 2,
  "2024-06-20": 1,
  "2024-07-10": 3,
  "2024-11-01": 4
}
```

## Troubleshooting

### Issue: All cells are gray
**Possible Causes:**
1. No bookings with completed sessions exist
2. Backend not returning activity data
3. Date format mismatch

**Solutions:**
1. Check console for "Activity Data Fetched" - should show object with dates
2. Run the test data generation script
3. Verify you're logged in (JWT token present)
4. Check Network tab for `/api/learning/activity` response

### Issue: Cells not changing color on hover
**Cause:** CSS not loaded properly

**Solution:**
1. Hard refresh the page (Ctrl+Shift+R)
2. Check if MyLearning.scss is properly imported
3. Verify browser console for CSS errors

### Issue: "Number of active dates: 0" but you have bookings
**Possible Causes:**
1. Sessions not marked as "completed"
2. Session dates outside the 7-month window
3. Backend query issue

**Solutions:**
1. Check booking sessions in database:
   ```javascript
   db.bookings.find({ studentId: YOUR_USER_ID })
   ```
2. Verify session status is "completed"
3. Check session dates are recent (last 7 months)

### Issue: Wrong dates highlighted
**Cause:** Timezone mismatch

**Solution:**
Backend uses `toISOString().split('T')[0]` to format dates as YYYY-MM-DD in UTC.
Ensure frontend uses the same format.

## Data Structure

### Backend Returns (from `/api/learning/activity`):
```javascript
{
  "2024-11-01": 1,  // Date: Activity Level (0-4)
  "2024-11-05": 2,
  "2024-11-10": 3,
  "2024-11-15": 4
}
```

### Frontend State (`activityData`):
```javascript
{
  "2024-11-01": 1,
  "2024-11-05": 2,
  "2024-11-10": 3,
  "2024-11-15": 4
}
```

### Grid Cell Generation:
```javascript
for (let week = 0; week < 28; week++) {
  for (let day = 0; day < 7; day++) {
    const dateKey = cellDate.toISOString().split('T')[0];
    const activityLevel = activityData[dateKey] || 0;
    // Render cell with class "level-{activityLevel}"
  }
}
```

## Expected Behavior

### With Activity Data:
- Green cells appear on dates with completed sessions
- Darker green = more sessions on that day
- Hover shows: "Nov 15, 2024: 2 sessions"
- Footer shows: "Active time  5 active days"

### Without Activity Data:
- All cells are gray
- Empty state message appears
- Footer shows only: "Active time"

## Files Modified

1. `client/src/pages/dashboard/student/MyLearning.jsx`
   - Added console logging for debugging
   - Added empty state message
   - Added active days counter
   - Enhanced data fetching

2. `client/src/pages/dashboard/student/MyLearning.scss`
   - Enhanced hover effects
   - Added border and shadow on hover
   - Added footer styles for active days count

## Next Steps

After verifying the heatmap works:
1. ✅ Activity cells show green for active dates
2. ✅ Tooltip displays date and session count
3. ✅ Console shows activity data being fetched
4. ✅ Empty state appears when no data

You can optionally:
- Customize colors in SCSS (.level-1 through .level-4)
- Adjust the date range (currently 7 months)
- Add click handlers to cells to show session details
- Add week labels on the left side of the grid

---

**Status**: ✅ Ready to Test
**Last Updated**: November 22, 2025
