import express from "express";

const router = express.Router();

// GET all blogs
router.get("/", (req, res) => {
  res.json({ message: "Get all blogs" });
});

// GET blog by ID
router.get("/:id", (req, res) => {
  res.json({ message: `Get blog with ID: ${req.params.id}` });
});

// POST create new blog
router.post("/", (req, res) => {
  res.json({ message: "Create new blog" });
});

// PUT update blog
router.put("/:id", (req, res) => {
  res.json({ message: `Update blog with ID: ${req.params.id}` });
});

// DELETE blog
router.delete("/:id", (req, res) => {
  res.json({ message: `Delete blog with ID: ${req.params.id}` });
});

export default router;
