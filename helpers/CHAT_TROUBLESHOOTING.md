# Chat System Troubleshooting Guide

## Issue: "Failed to send message. Please try again."

This guide will help you identify and fix the chat message sending issue.

## Step 1: Check Backend Server

First, ensure your backend server is running:

```bash
cd api
npm start
```

**Expected Output**: Server should start without errors and show "Server is running on port 8800"

## Step 2: Check Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the Console tab
3. Try to send a message
4. Look for error messages and log output

**What to look for**:
- Network errors (404, 500, etc.)
- Authentication errors (401)
- Console.log messages from our debugging code

## Step 3: Use the Debug Tool

I've added a debug tool to the MySessions page. Look for a small debug panel in the bottom-right corner.

**Click "Test Backend"** and check the results:

- ✅ **Basic Connection**: Tests if the server is reachable
- ✅ **Authentication**: Tests if you're properly logged in
- ✅ **Conversation Creation**: Tests if conversations can be created

## Step 4: Common Issues & Solutions

### Issue 1: Backend Server Not Running
**Symptoms**: All tests fail with "Network Error"
**Solution**: Start the backend server

### Issue 2: Authentication Problem
**Symptoms**: Authentication test fails with 401 status
**Solution**: 
1. Log out and log back in
2. Check if your access token is valid
3. Clear browser cache and cookies

### Issue 3: Invalid User Data
**Symptoms**: Conversation creation fails with 400 status
**Solution**: 
1. Check if the educator ID is valid
2. Ensure you're logged in as a student
3. Verify the booking data is correct

### Issue 4: Database Connection
**Symptoms**: Server errors (500 status)
**Solution**: 
1. Check if MongoDB is running
2. Verify database connection string
3. Check server logs for database errors

## Step 5: Manual Testing

Try these steps manually:

1. **Test API directly**:
```bash
curl -X GET http://localhost:8800/api/conversations \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

2. **Check user authentication**:
```javascript
// In browser console
console.log('Current user:', JSON.parse(localStorage.getItem('currentUser')));
console.log('Access token:', localStorage.getItem('accessToken'));
```

3. **Test conversation creation**:
```javascript
// In browser console
fetch('http://localhost:8800/api/conversations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('accessToken')
  },
  body: JSON.stringify({
    participantId: 'EDUCATOR_ID_HERE',
    participantName: 'Test Educator',
    bookingId: null
  })
})
.then(res => res.json())
.then(data => console.log('Response:', data))
.catch(err => console.error('Error:', err));
```

## Step 6: Debug Information

When you encounter the error, please provide:

1. **Browser Console Output**: Copy all error messages and logs
2. **Debug Tool Results**: Screenshot or copy the test results
3. **Network Tab**: Check the failed request details
4. **Server Logs**: Any error messages from the backend

## Step 7: Quick Fixes to Try

### Fix 1: Restart Everything
```bash
# Stop all servers
# Then restart:
cd api && npm start
cd client && npm run dev
```

### Fix 2: Clear Browser Data
1. Clear browser cache and cookies
2. Log out and log back in
3. Try again

### Fix 3: Check Database
```bash
# If using MongoDB locally
mongosh
use your_database_name
db.users.find().limit(1)  # Check if users exist
```

### Fix 4: Verify Routes
Check if these endpoints are accessible:
- `GET /api/conversations` (should return 401 if not authenticated)
- `POST /api/conversations` (should return 401 if not authenticated)
- `POST /api/messages` (should return 401 if not authenticated)

## Step 8: Expected Behavior

When working correctly:

1. **Click message button** → Chat modal opens
2. **Type message** → Console shows debugging logs
3. **Send message** → Success notification appears
4. **Navigate to messages** → Message appears in chat history

## Step 9: Remove Debug Tool

Once the issue is resolved, remove the debug tool:

1. Remove the import: `import ChatDebugger from '../../../components/ChatDebugger';`
2. Remove the component: `<ChatDebugger />`
3. Delete the file: `client/src/components/ChatDebugger.jsx`

## Still Having Issues?

If the problem persists after trying these steps:

1. **Check the server logs** for any error messages
2. **Verify MongoDB connection** and data
3. **Test with a different browser** or incognito mode
4. **Check if the issue is specific to certain educators** or all conversations

## Contact Information

If you need further assistance, please provide:
- Complete error logs from browser console
- Debug tool results
- Server logs
- Steps to reproduce the issue
