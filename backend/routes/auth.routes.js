import express from "express";
import {
  signup,
  verifyEmail,
  forgotPassword,
  resetPassword,
  login,
  logout,
  googleAuth,
  googleCallback,
  checkAuth,
} from "../controllers/auth.controller.js";
import passport from '../config/passport.js';
import { verifyToken } from '../midlleware/verifyToken.js';

const router = express.Router();

// Example: Register route
router.post("/signup", signup);
router.post("/verify-email", verifyEmail);
router.post("/login", login);
router.get("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// Google OAuth routes
router.get('/google', googleAuth);
router.get('/google/callback', googleCallback);

// Check authentication status
router.get('/check-auth', verifyToken, checkAuth);

export default router;
