# Fix Conversation Indexes Script

## Problem
The conversation collection had a problematic `id_1` index that was causing duplicate key errors when creating conversations. The error was:
```
E11000 duplicate key error collection: FocusDesk.conversations index: id_1 dup key: { id: null }
```

## Solution
This script removes the problematic `id_1` index and ensures the correct indexes are in place.

## Usage
```bash
node scripts/fix-conversation-indexes.js
```

## What it does
1. Connects to MongoDB
2. Lists all current indexes on the conversations collection
3. Drops the problematic `id_1` index if it exists
4. Creates the proper indexes:
   - `participants.userId_1` - for finding conversations by user
   - `bookingId_1` - for finding conversations by booking
   - `lastActivity_-1` - for sorting conversations by recent activity
   - `isActive_1` - for filtering active conversations
5. Lists the final indexes

## Result
After running this script, the conversation creation should work without duplicate key errors.
