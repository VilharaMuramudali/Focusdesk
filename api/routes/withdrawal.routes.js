import express from "express";
import {
  getWithdrawalInfo,
  createWithdrawal,
  getWithdrawalById,
  cancelWithdrawal,
  getAllWithdrawals
} from "../controllers/withdrawal.controller.js";
import { verifyToken, educator } from "../middleware/jwt.js";

const router = express.Router();

// Get withdrawal information (available balance, history)
router.get("/info", verifyToken, educator, getWithdrawalInfo);

// Create withdrawal request
router.post("/request", verifyToken, educator, createWithdrawal);

// Get withdrawal by ID
router.get("/:id", verifyToken, educator, getWithdrawalById);

// Cancel withdrawal (only if pending)
router.put("/:id/cancel", verifyToken, educator, cancelWithdrawal);

// Get all withdrawals (for admin - optional, can add admin middleware later)
router.get("/", verifyToken, getAllWithdrawals);

export default router;

