// middleware/upload.js
import multer from 'multer';
import { GridFsStorage } from 'multer-gridfs-storage';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

// MongoDB connection URL from environment variables
const url = process.env.MONGO_URI || 'mongodb+srv://vilhara_muramudali:QmQsiEjLEOxX5adE@vilieapi.skpkcb8.mongodb.net/FocusDesk?retryWrites=true&w=majority&appName=vilieAPi';

// Create storage engine with GridFS
const storage = new GridFsStorage({
  url,
  options: { useNewUrlParser: true, useUnifiedTopology: true },
  file: (req, file) => {
    // Check file type
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
      return {
        bucketName: 'profileImages',
        filename: `profile-${req.userId}-${Date.now()}${path.extname(file.originalname)}`
      };
    }
    
    return null; // Reject file
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

// Create upload middleware
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter
});

export default upload;
