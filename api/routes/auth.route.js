import express from "express";
import { register, login, logout, updatePassword } from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/jwt.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.put("/password", verifyToken, updatePassword);

export default router;
