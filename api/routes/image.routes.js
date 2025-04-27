// routes/image.routes.js
import express from "express";
import mongoose from "mongoose";
import { ObjectId } from "mongodb";
import createError from "../utils/createError.js";

const router = express.Router();

// Get image by ID
router.get("/:id", async (req, res, next) => {
  try {
    const id = new ObjectId(req.params.id);
    
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'profileImages'
    });
    
    // Check if file exists
    const files = await bucket.find({ _id: id }).toArray();
    
    if (!files || files.length === 0) {
      return next(createError(404, "Image not found"));
    }
    
    const file = files[0];
    
    // Set the proper content type
    res.set('Content-Type', file.contentType);
    
    // Create a download stream and pipe it to the response
    const downloadStream = bucket.openDownloadStream(id);
    downloadStream.pipe(res);
    
  } catch (error) {
    console.error("Error retrieving image:", error);
    next(createError(500, "Failed to retrieve image"));
  }
});

export default router;
