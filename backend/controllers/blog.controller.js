import Blog from "../model/blog.model.js";
import Image from "../model/image.model.js";
import ImageKit from "imagekit";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../../.env") });

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const upload = multer({
  storage: multer.memoryStorage(),
});

export const uploadMultiple = multer({
  storage: multer.memoryStorage(),
}).fields([
  { name: "headerImage", maxCount: 1 },
  { name: "heroImage", maxCount: 1 },
]);

export const addBlog = async (req, res) => {
  try {
    // Validate required fields
    const {
      authorName,
      heading,
      locationName,
      locatedIn,
      idealFor,
      whatIsSpecial,
      howToReach,
      foodEssentials,
      thingsToKnow,
      faq,
    } = req.body;

    if (
      !authorName ||
      !heading ||
      !locationName ||
      !locatedIn ||
      !idealFor ||
      !whatIsSpecial ||
      !foodEssentials ||
      !thingsToKnow
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        required: [
          "authorName",
          "heading",
          "locationName",
          "locatedIn",
          "idealFor",
          "whatIsSpecial",
          "foodEssentials",
          "thingsToKnow",
        ],
      });
    }

    // Validate array fields
    if (!Array.isArray(locatedIn) || locatedIn.length === 0) {
      return res.status(400).json({
        message: "Located in must be a non-empty array",
      });
    }

    if (!Array.isArray(idealFor) || idealFor.length === 0) {
      return res.status(400).json({
        message: "Ideal for must be a non-empty array",
      });
    }

    if (!Array.isArray(foodEssentials) || foodEssentials.length === 0) {
      return res.status(400).json({
        message: "Food essentials must be a non-empty array",
      });
    }

    if (!Array.isArray(thingsToKnow) || thingsToKnow.length === 0) {
      return res.status(400).json({
        message: "Things to know must be a non-empty array",
      });
    }

    // Validate howToReach if provided
    if (howToReach && Array.isArray(howToReach)) {
      for (const item of howToReach) {
        if (!item.key || !item.value) {
          return res.status(400).json({
            message: "Each howToReach item must have 'key' and 'value'",
          });
        }
      }
    }

    // Validate FAQ if provided
    if (faq && Array.isArray(faq)) {
      for (const item of faq) {
        if (!item.key || !item.value) {
          return res.status(400).json({
            message: "Each FAQ item must have 'key' and 'value'",
          });
        }
      }
    }

    // Extract headerImage and heroImage from files array
    if (!req.files || !req.files.headerImage || !req.files.heroImage) {
      return res.status(400).json({
        message: "Both header image and hero image are required",
        required: ["headerImage", "heroImage"],
      });
    }

    const headerImageFile = req.files.headerImage[0];
    const heroImageFile = req.files.heroImage[0];

    const headerImageResponse = await imagekit.upload({
      file: headerImageFile.buffer,
      fileName: `trip_header_${Date.now()}_${headerImageFile.originalname}`,
      folder: "/blogs/headers",
    });

    // Upload hero image to ImageKit
    const heroImageResponse = await imagekit.upload({
      file: heroImageFile.buffer,
      fileName: `trip_hero_${Date.now()}_${heroImageFile.originalname}`,
      folder: "/blogs/heroes",
    });

    // Create Image documents
    const headerImageDoc = new Image({
      name: headerImageResponse.name,
      url: headerImageResponse.url,
      fileId: headerImageResponse.fileId,
    });
    await headerImageDoc.save();

    const heroImageDoc = new Image({
      name: heroImageResponse.name,
      url: heroImageResponse.url,
      fileId: heroImageResponse.fileId,
    });
    await heroImageDoc.save();

    // Create blog object with all fields
    const blogData = {
      authorName: authorName.trim(),
      heading: heading.trim(),
      locationName: locationName.trim(),
      locatedIn: locatedIn,
      idealFor: idealFor,
      whatIsSpecial: whatIsSpecial.trim(),
      howToReach: howToReach || [],
      foodEssentials: foodEssentials,
      thingsToKnow: thingsToKnow,
      faq: faq || [],
      // Image references
      headerImage: headerImageDoc._id,
      heroImage: heroImageDoc._id,
    };

    // Create and save the blog
    const newBlog = new Blog(blogData);
    await newBlog.save();

    res.status(201).json({
      success: true,
      message: "Blog created successfully!",
      data: newBlog,
    });
  } catch (error) {
    console.error("Error creating blog:", error);

    // Handle specific MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle ImageKit upload errors
    if (error.message && error.message.includes("ImageKit")) {
      return res.status(500).json({
        message: "Image upload failed",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Get all blogs with optional filtering
export const getAllBlogs = async (req, res) => {
  try {
    const { author, location, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (author) {
      filter.authorName = { $regex: author, $options: "i" };
    }
    if (location) {
      filter.locationName = { $regex: location, $options: "i" };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get blogs with pagination and populate images
    const blogs = await Blog.find(filter)
      .populate("headerImage")
      .populate("heroImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBlogs = await Blog.countDocuments(filter);
    const totalPages = Math.ceil(totalBlogs / parseInt(limit));

    res.status(200).json({
      success: true,
      data: blogs,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalBlogs,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Get blog by ID
export const getBlogById = async (req, res) => {
  try {
    const { id } = req.params;

    const blog = await Blog.findById(id)
      .populate("headerImage")
      .populate("heroImage");

    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    res.status(200).json({
      success: true,
      data: blog,
    });
  } catch (error) {
    console.error("Error fetching blog:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID format",
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Update blog
export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      authorName,
      heading,
      locationName,
      locatedIn,
      idealFor,
      whatIsSpecial,
      howToReach,
      foodEssentials,
      thingsToKnow,
      faq,
    } = req.body;

    // Find the existing blog
    const existingBlog = await Blog.findById(id);
    if (!existingBlog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    // Validate array fields if provided
    if (locatedIn && (!Array.isArray(locatedIn) || locatedIn.length === 0)) {
      return res.status(400).json({
        message: "Located in must be a non-empty array",
      });
    }

    if (idealFor && (!Array.isArray(idealFor) || idealFor.length === 0)) {
      return res.status(400).json({
        message: "Ideal for must be a non-empty array",
      });
    }

    if (
      foodEssentials &&
      (!Array.isArray(foodEssentials) || foodEssentials.length === 0)
    ) {
      return res.status(400).json({
        message: "Food essentials must be a non-empty array",
      });
    }

    if (
      thingsToKnow &&
      (!Array.isArray(thingsToKnow) || thingsToKnow.length === 0)
    ) {
      return res.status(400).json({
        message: "Things to know must be a non-empty array",
      });
    }

    // Validate howToReach if provided
    if (howToReach && Array.isArray(howToReach)) {
      for (const item of howToReach) {
        if (!item.key || !item.value) {
          return res.status(400).json({
            message: "Each howToReach item must have 'key' and 'value'",
          });
        }
      }
    }

    // Validate FAQ if provided
    if (faq && Array.isArray(faq)) {
      for (const item of faq) {
        if (!item.key || !item.value) {
          return res.status(400).json({
            message: "Each FAQ item must have 'key' and 'value'",
          });
        }
      }
    }

    // Build update data object
    const updateData = {};
    if (authorName) updateData.authorName = authorName.trim();
    if (heading) updateData.heading = heading.trim();
    if (locationName) updateData.locationName = locationName.trim();
    if (locatedIn) updateData.locatedIn = locatedIn;
    if (idealFor) updateData.idealFor = idealFor;
    if (whatIsSpecial) updateData.whatIsSpecial = whatIsSpecial.trim();
    if (howToReach) updateData.howToReach = howToReach;
    if (foodEssentials) updateData.foodEssentials = foodEssentials;
    if (thingsToKnow) updateData.thingsToKnow = thingsToKnow;
    if (faq) updateData.faq = faq;

    // Handle image updates
    if (req.files && req.files.length > 0) {
      // Extract headerImage and heroImage from files array
      const headerImageFile = req.files.find(
        (file) => file.fieldname === "headerImage"
      );
      const heroImageFile = req.files.find(
        (file) => file.fieldname === "heroImage"
      );

      // Handle header image update
      if (headerImageFile) {
        // Delete old header image
        if (existingBlog.headerImage) {
          const oldHeaderImage = await Image.findById(existingBlog.headerImage);
          if (oldHeaderImage) {
            await imagekit.deleteFile(oldHeaderImage.fileId);
            await Image.findByIdAndDelete(existingBlog.headerImage);
          }
        }

        // Upload new header image
        const headerImageResponse = await imagekit.upload({
          file: headerImageFile.buffer,
          fileName: `blog_header_${Date.now()}_${headerImageFile.originalname}`,
          folder: "/blogs/headers",
        });

        // Create new Image document
        const headerImageDoc = new Image({
          name: headerImageResponse.name,
          url: headerImageResponse.url,
          fileId: headerImageResponse.fileId,
        });
        await headerImageDoc.save();
        updateData.headerImage = headerImageDoc._id;
      }

      // Handle hero image update
      if (heroImageFile) {
        // Delete old hero image
        if (existingBlog.heroImage) {
          const oldHeroImage = await Image.findById(existingBlog.heroImage);
          if (oldHeroImage) {
            await imagekit.deleteFile(oldHeroImage.fileId);
            await Image.findByIdAndDelete(existingBlog.heroImage);
          }
        }

        // Upload new hero image
        const heroImageResponse = await imagekit.upload({
          file: heroImageFile.buffer,
          fileName: `blog_hero_${Date.now()}_${heroImageFile.originalname}`,
          folder: "/blogs/heroes",
        });

        // Create new Image document
        const heroImageDoc = new Image({
          name: heroImageResponse.name,
          url: heroImageResponse.url,
          fileId: heroImageResponse.fileId,
        });
        await heroImageDoc.save();
        updateData.heroImage = heroImageDoc._id;
      }
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("headerImage")
      .populate("heroImage");

    res.status(200).json({
      success: true,
      message: "Blog updated successfully!",
      data: updatedBlog,
    });
  } catch (error) {
    console.error("Error updating blog:", error);

    // Handle specific MongoDB validation errors
    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID format",
      });
    }

    // Handle ImageKit upload errors
    if (error.message && error.message.includes("ImageKit")) {
      return res.status(500).json({
        message: "Image upload failed",
        error: error.message,
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Delete blog
export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the blog to delete
    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({
        message: "Blog not found",
      });
    }

    // Delete images from ImageKit and database
    if (blog.headerImage) {
      const headerImage = await Image.findById(blog.headerImage);
      if (headerImage) {
        await imagekit.deleteFile(headerImage.fileId);
        await Image.findByIdAndDelete(blog.headerImage);
      }
    }

    if (blog.heroImage) {
      const heroImage = await Image.findById(blog.heroImage);
      if (heroImage) {
        await imagekit.deleteFile(heroImage.fileId);
        await Image.findByIdAndDelete(blog.heroImage);
      }
    }

    // Delete the blog
    await Blog.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Blog deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting blog:", error);

    // Handle invalid ObjectId
    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid blog ID format",
      });
    }

    res.status(500).json({
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};
