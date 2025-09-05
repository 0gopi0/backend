import express from "express";
import {
  addBlog,
  getAllBlogs,
  getBlogById,
  updateBlog,
  deleteBlog,
  uploadMultiple,
} from "../controllers/blog.controller.js";
import { verifyToken } from "../midlleware/verifyToken.js";
import { checkAdmin } from "../midlleware/checkAdmin.js";

const router = express.Router();

// GET all blogs (public route)
router.get("/", getAllBlogs);

// GET blog by ID (public route)
router.get("/:id", getBlogById);

// POST create new blog (admin only)
router.post("/", verifyToken, checkAdmin, uploadMultiple, addBlog);

// PUT update blog (admin only)
router.put("/:id", verifyToken, checkAdmin, uploadMultiple, updateBlog);

// DELETE blog (admin only)
router.delete("/:id", verifyToken, checkAdmin, deleteBlog);

export default router;
