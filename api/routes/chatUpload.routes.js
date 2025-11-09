import express from "express";
import multer from "multer";
import path from "path";
import { verifyToken } from "../middleware/jwt.js";
import createError from "../utils/createError.js";

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/chat/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter function
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/zip',
    'application/x-rar-compressed'
  ];

  // Maximum file size (10MB)
  const maxSize = 10 * 1024 * 1024;

  if (!allowedTypes.includes(file.mimetype)) {
    return cb(new Error('File type not allowed'), false);
  }

  if (file.size > maxSize) {
    return cb(new Error('File size too large. Maximum size is 10MB'), false);
  }

  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Upload chat file
router.post("/chat", verifyToken, upload.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      return next(createError(400, "No file uploaded"));
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/chat/${req.file.filename}`;
    
    res.status(200).json({
      url: fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      fileType: req.file.mimetype
    });
  } catch (error) {
    next(error);
  }
});

// Upload multiple chat files
router.post("/chat/multiple", verifyToken, upload.array('files', 5), (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return next(createError(400, "No files uploaded"));
    }

    const uploadedFiles = req.files.map(file => ({
      url: `${req.protocol}://${req.get('host')}/uploads/chat/${file.filename}`,
      fileName: file.originalname,
      fileSize: file.size,
      fileType: file.mimetype
    }));

    res.status(200).json({ files: uploadedFiles });
  } catch (error) {
    next(error);
  }
});

// Delete chat file
router.delete("/chat/:filename", verifyToken, (req, res, next) => {
  try {
    const { filename } = req.params;
    const fs = require('fs');
    const filePath = path.join(__dirname, '../uploads/chat/', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ message: "File deleted successfully" });
    } else {
      return next(createError(404, "File not found"));
    }
  } catch (error) {
    next(error);
  }
});

export default router;
