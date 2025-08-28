import express from "express";
import { verifyToken } from "../middleware/verifyToken.js";
const router = express.Router();

// GET all trips
router.get("/", getTrips);

export default router;
