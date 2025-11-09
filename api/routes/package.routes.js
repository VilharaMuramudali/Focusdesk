// server/routes/package.routes.js
import express from "express";
import { 
  getEducatorPackages, 
  createPackage, 
  updatePackage, 
  deletePackage, 
  getPackageById,
  getPublicPackages,
  getRecommendedPackages,
  refreshPackageRatings
} from "../controllers/package.controller.js";
import { verifyToken, educator } from "../middleware/jwt.js";

const router = express.Router();

// Routes that require authentication and educator role
router.get("/educator", verifyToken, educator, getEducatorPackages);
router.post("/", verifyToken, educator, createPackage);
router.put("/:id", verifyToken, educator, updatePackage);
router.delete("/:id", verifyToken, educator, deletePackage);

// Public routes
router.get("/public", getPublicPackages);
router.get("/recommended", getRecommendedPackages);
router.get("/:id", getPackageById);
router.get("/:id/refresh-ratings", refreshPackageRatings); // For testing ratings

export default router;
