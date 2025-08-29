import express from "express";
import { 
  upload, 
  addTrip, 
  getAllTrips, 
  getTripById, 
  updateTrip, 
  deleteTrip, 
  getTripCategories 
} from "../controllers/trip.controller.js";
import { verifyToken } from "../midlleware/verifyToken.js";
import { checkAdmin } from "../midlleware/checkAdmin.js";

const router = express.Router();

// Public routes
router.get("/", getAllTrips); // Get all trips with optional filtering
router.get("/categories", getTripCategories); // Get available categories
router.get("/:id", getTripById); // Get single trip by ID

// Admin protected routes
router.post(
  "/",
  verifyToken,
  checkAdmin,
  upload.single("image"),
  addTrip
); // Create new trip

router.put(
  "/:id",
  verifyToken,
  checkAdmin,
  upload.single("image"),
  updateTrip
); // Update trip

router.delete(
  "/:id",
  verifyToken,
  checkAdmin,
  deleteTrip
); // Delete trip

export default router;
