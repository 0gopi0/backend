import express from "express";
import {
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  login,
  logout,
} from "../controllers/auth.controller.js";

const router = express.Router();

// Example: Register route
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

export default router;
