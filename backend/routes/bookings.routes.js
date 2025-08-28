import express from "express";

const router = express.Router();

// GET all bookings
router.get("/", (req, res) => {
  res.json({ message: "Get all bookings" });
});

// GET booking by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get booking with ID: ${req.params.id}` });
});

// POST create new booking
router.post("/", (req, res) => {
  res.json({ message: "Create new booking" });
});

// PUT update booking
router.put("/:id", (req, res) => {
  res.json({ message: `Update booking with ID: ${req.params.id}` });
});

// DELETE booking
router.delete("/:id", (req, res) => {
  res.json({ message: `Delete booking with ID: ${req.params.id}` });
});

export default router;
