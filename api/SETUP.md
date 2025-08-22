# FocusDesk API Setup Guide

## 🚨 MongoDB Connection Error Fix

If you're seeing this error:
```
Error: querySrv ENOTFOUND _mongodb._tcp.vilieapi.skpkcb8.mongodb.net
```

Follow these steps to fix it:

## 🔧 Quick Setup

### Option 1: Automatic Setup (Recommended)
```bash
cd api
node setup-env.js
```

This will create a `.env` file template for you to fill in.

### Option 2: Manual Setup

1. **Create a `.env` file** in the `api` directory:
```bash
cd api
touch .env
```

2. **Add the following content** to your `.env` file:
```env
# MongoDB Connection String
MONGO_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/focusdesk?retryWrites=true&w=majority

# JWT Secret Key
JWT_KEY=your_jwt_secret_key_here

# Node Environment
NODE_ENV=development

# Server Port
PORT=8800

# Client URL for CORS
CLIENT_URL=http://localhost:5173
```

## 🗄️ MongoDB Atlas Setup

### 1. Create MongoDB Atlas Account
- Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
- Sign up for a free account
- Create a new cluster (M0 Free tier is sufficient)

### 2. Get Connection String
1. Click "Connect" on your cluster
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<password>` with your database user password
5. Replace `<dbname>` with `focusdesk`

### 3. Create Database User
1. Go to "Database Access" in Atlas
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password
5. Give "Read and write to any database" permissions

### 4. Configure Network Access
1. Go to "Network Access" in Atlas
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (for development)
4. Or add your specific IP address

## 🔑 Generate JWT Secret

Run this command to generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Copy the output and use it as your `JWT_KEY` in the `.env` file.

## 🚀 Start the Server

After setting up your `.env` file:

```bash
cd api
npm install
npm start
```

## ✅ Verification

You should see:
```
✅ Connected to MongoDB successfully!
🚀 Backend server (with Socket.io) is running on port 8800!
📱 Client URL: http://localhost:5173
🔗 API Base URL: http://localhost:8800/api
```

## 🆘 Troubleshooting

### Common Issues:

1. **DNS Resolution Error**
   - Check your internet connection
   - Verify the MongoDB Atlas cluster is running
   - Ensure the connection string is correct

2. **Authentication Error**
   - Verify username and password in connection string
   - Check if database user has correct permissions
   - Ensure the database user exists in Atlas

3. **Network Access Error**
   - Add your IP address to MongoDB Atlas Network Access
   - Or use "Allow Access from Anywhere" for development

4. **Connection Timeout**
   - Check firewall settings
   - Verify the connection string format
   - Try connecting from a different network

### Test Connection

You can test your MongoDB connection with:
```bash
node -e "
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB connected!'))
  .catch(err => console.error('❌ Connection failed:', err.message))
  .finally(() => process.exit());
"
```

## 📞 Support

If you're still having issues:
1. Check the MongoDB Atlas status page
2. Verify your cluster is active
3. Review the connection string format
4. Check the server logs for detailed error messages

## 🔒 Security Notes

- Never commit your `.env` file to version control
- Use strong, unique passwords for database users
- In production, restrict network access to specific IPs
- Regularly rotate JWT secrets 