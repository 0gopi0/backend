import express from "express";

const router = express.Router();

// GET all reviews
router.get("/", (req, res) => {
  res.json({ message: "Get all reviews" });
});

// GET review by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get review with ID: ${req.params.id}` });
});

// POST create new review
router.post("/", (req, res) => {
  res.json({ message: "Create new review" });
});

// PUT update review
router.put("/:id", (req, res) => {
  res.json({ message: `Update review with ID: ${req.params.id}` });
});

// DELETE review
router.delete("/:id", (req, res) => {
  res.json({ message: `Delete review with ID: ${req.params.id}` });
});

export default router;
