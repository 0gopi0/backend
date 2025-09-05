import Trip from "../model/trip.model.js";
import Image from "../model/image.model.js";
import { Booking } from "../model/booking.model.js";
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

// Configure multer for multiple image uploads
export const uploadMultiple = multer({
  storage: multer.memoryStorage(),
}).any();

export const addTrip = async (req, res) => {
  try {
    // Validate required fields
    const {
      heading,
      description,
      from,
      to,
      category,
      price,
      itinerary,
      highlights,
      pickupLocation,
      thingsToCarry,
    } = req.body;

    if (
      !heading ||
      !description ||
      !from ||
      !to ||
      !category ||
      !price ||
      !highlights ||
      !pickupLocation ||
      !thingsToCarry
    ) {
      return res.status(400).json({
        message: "Missing required fields",
        required: [
          "heading",
          "description",
          "from",
          "to",
          "category",
          "price",
          "highlights",
          "pickupLocation",
          "thingsToCarry",
        ],
      });
    }

    // Validate category values
    const validCategories = [
      "BACKPACKING TRIPS",
      "SUNRISE TREKS",
      "ONE DAY TRIPS",
      "INTERNATIONAL TRIPS",
      "WOMEN TRIPS",
      "LONG WEEKEND",
      "WATER SPORTS",
      "TWO DAYS TREK",
    ];

    const categoryArray = Array.isArray(category) ? category : [category];
    const invalidCategories = categoryArray.filter(
      (cat) => !validCategories.includes(cat)
    );

    if (invalidCategories.length > 0) {
      return res.status(400).json({
        message: "Invalid category values",
        invalidCategories,
        validCategories,
      });
    }

    // Validate price
    if (isNaN(price) || price <= 0) {
      return res.status(400).json({
        message: "Price must be a positive number",
      });
    }

    // Validate array fields
    if (!Array.isArray(highlights) || highlights.length === 0) {
      return res.status(400).json({
        message: "Highlights must be a non-empty array",
      });
    }

    if (!Array.isArray(pickupLocation) || pickupLocation.length === 0) {
      return res.status(400).json({
        message: "Pickup location must be a non-empty array",
      });
    }

    if (!Array.isArray(thingsToCarry) || thingsToCarry.length === 0) {
      return res.status(400).json({
        message: "Things to carry must be a non-empty array",
      });
    }

    // Validate itinerary (now required)
    if (!Array.isArray(itinerary) || itinerary.length === 0) {
      return res.status(400).json({
        message: "Itinerary is required and must be a non-empty array",
      });
    }

    for (const item of itinerary) {
      if (
        !item.day ||
        !Array.isArray(item.activities) ||
        item.activities.length === 0
      ) {
        return res.status(400).json({
          message:
            "Each itinerary item must have 'day' (number) and 'activities' (non-empty array)",
        });
      }
    }

    // Extract image files from req.files array
    const headerImageFile = req.files?.find(
      (file) => file.fieldname === "headerImage"
    );
    const heroImageFile = req.files?.find(
      (file) => file.fieldname === "heroImage"
    );

    // Check if both image files are provided
    if (!headerImageFile || !heroImageFile) {
      return res.status(400).json({
        message: "Both header image and hero image are required",
        required: ["headerImage", "heroImage"],
      });
    }

    // Upload header image to ImageKit
    const headerImageResponse = await imagekit.upload({
      file: headerImageFile.buffer,
      fileName: `trip_header_${Date.now()}_${headerImageFile.originalname}`,
      folder: "/trips/headers",
    });

    // Upload hero image to ImageKit
    const heroImageResponse = await imagekit.upload({
      file: heroImageFile.buffer,
      fileName: `trip_hero_${Date.now()}_${heroImageFile.originalname}`,
      folder: "/trips/heroes",
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

    // Create trip object with all fields
    const tripData = {
      heading: heading.trim(),
      description: description.trim(),
      from: from.trim(),
      to: to.trim(),
      category: categoryArray,
      price: parseFloat(price),
      itinerary: itinerary,
      highlights: highlights,
      pickupLocation: pickupLocation,
      thingsToCarry: thingsToCarry,
      // Image references
      headerImage: headerImageDoc._id,
      heroImage: heroImageDoc._id,
    };

    // Create and save the trip
    const newTrip = new Trip(tripData);
    await newTrip.save();

    res.status(201).json({
      success: true,
      message: "Trip created successfully!",
      data: newTrip,
    });
  } catch (error) {
    console.error("Error creating trip:", error);

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

// Get all trips with optional filtering
export const getAllTrips = async (req, res) => {
  try {
    const { category, from, to, page = 1, limit = 10 } = req.query;

    // Build filter object
    const filter = {};
    if (category) {
      filter.category = {
        $in: Array.isArray(category) ? category : [category],
      };
    }
    if (from) {
      filter.from = { $regex: from, $options: "i" };
    }
    if (to) {
      filter.to = { $regex: to, $options: "i" };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get trips with pagination
    const trips = await Trip.find(filter)
      .populate("bookings")
      .populate("headerImage", "name url fileId")
      .populate("heroImage", "name url fileId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const totalTrips = await Trip.countDocuments(filter);
    const totalPages = Math.ceil(totalTrips / parseInt(limit));

    res.status(200).json({
      success: true,
      data: trips,
      pagination: {
        currentPage: parseInt(page),
        totalPages,
        totalTrips,
        hasNextPage: parseInt(page) < totalPages,
        hasPrevPage: parseInt(page) > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({
      message: "Error fetching trips",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Get single trip by ID
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;

    const trip = await Trip.findById(id)
      .populate("bookings")
      .populate("headerImage", "name url fileId")
      .populate("heroImage", "name url fileId");

    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    res.status(200).json({
      success: true,
      data: trip,
    });
  } catch (error) {
    console.error("Error fetching trip:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid trip ID format",
      });
    }

    res.status(500).json({
      message: "Error fetching trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Update trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      heading,
      description,
      from,
      to,
      category,
      price,
      itinerary,
      highlights,
      pickupLocation,
      thingsToCarry,
    } = req.body;

    // Find the trip first
    const existingTrip = await Trip.findById(id);
    if (!existingTrip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // Validate category if provided
    if (category) {
      const validCategories = [
        "BACKPACKING TRIPS",
        "SUNRISE TREKS",
        "ONE DAY TRIPS",
        "INTERNATIONAL TRIPS",
        "WOMEN TRIPS",
        "LONG WEEKEND",
        "WATER SPORTS",
        "TWO DAYS TREK",
      ];

      const categoryArray = Array.isArray(category) ? category : [category];
      const invalidCategories = categoryArray.filter(
        (cat) => !validCategories.includes(cat)
      );

      if (invalidCategories.length > 0) {
        return res.status(400).json({
          message: "Invalid category values",
          invalidCategories,
          validCategories,
        });
      }
    }

    // Validate price if provided
    if (price !== undefined && (isNaN(price) || price <= 0)) {
      return res.status(400).json({
        message: "Price must be a positive number",
      });
    }

    // Validate array fields if provided
    if (
      highlights !== undefined &&
      (!Array.isArray(highlights) || highlights.length === 0)
    ) {
      return res.status(400).json({
        message: "Highlights must be a non-empty array",
      });
    }

    if (
      pickupLocation !== undefined &&
      (!Array.isArray(pickupLocation) || pickupLocation.length === 0)
    ) {
      return res.status(400).json({
        message: "Pickup location must be a non-empty array",
      });
    }

    if (
      thingsToCarry !== undefined &&
      (!Array.isArray(thingsToCarry) || thingsToCarry.length === 0)
    ) {
      return res.status(400).json({
        message: "Things to carry must be a non-empty array",
      });
    }

    // Validate itinerary if provided
    if (itinerary !== undefined) {
      if (!Array.isArray(itinerary) || itinerary.length === 0) {
        return res.status(400).json({
          message: "Itinerary must be a non-empty array",
        });
      }

      for (const item of itinerary) {
        if (
          !item.day ||
          !Array.isArray(item.activities) ||
          item.activities.length === 0
        ) {
          return res.status(400).json({
            message:
              "Each itinerary item must have 'day' (number) and 'activities' (non-empty array)",
          });
        }
      }
    }

    // Build update object
    const updateData = {};
    if (heading) updateData.heading = heading.trim();
    if (description) updateData.description = description.trim();
    if (from) updateData.from = from.trim();
    if (to) updateData.to = to.trim();
    if (category)
      updateData.category = Array.isArray(category) ? category : [category];
    if (price !== undefined) updateData.price = parseFloat(price);
    if (itinerary) updateData.itinerary = itinerary;
    if (highlights) updateData.highlights = highlights;
    if (pickupLocation) updateData.pickupLocation = pickupLocation;
    if (thingsToCarry) updateData.thingsToCarry = thingsToCarry;

    // Handle image updates if new files are provided
    if (req.files) {
      // Extract image files from req.files array
      const headerImageFile = req.files.find(
        (file) => file.fieldname === "headerImage"
      );
      const heroImageFile = req.files.find(
        (file) => file.fieldname === "heroImage"
      );

      try {
        // Handle header image update
        if (headerImageFile) {
          // Delete old header image if exists
          if (existingTrip.headerImage) {
            const oldHeaderImage = await Image.findById(
              existingTrip.headerImage
            );
            if (oldHeaderImage) {
              await imagekit.deleteFile(oldHeaderImage.fileId);
              await Image.findByIdAndDelete(existingTrip.headerImage);
            }
          }

          const headerImageResponse = await imagekit.upload({
            file: headerImageFile.buffer,
            fileName: `trip_header_${Date.now()}_${
              headerImageFile.originalname
            }`,
            folder: "/trips/headers",
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
          // Delete old hero image if exists
          if (existingTrip.heroImage) {
            const oldHeroImage = await Image.findById(existingTrip.heroImage);
            if (oldHeroImage) {
              await imagekit.deleteFile(oldHeroImage.fileId);
              await Image.findByIdAndDelete(existingTrip.heroImage);
            }
          }

          const heroImageResponse = await imagekit.upload({
            file: heroImageFile.buffer,
            fileName: `trip_hero_${Date.now()}_${heroImageFile.originalname}`,
            folder: "/trips/heroes",
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
      } catch (imageError) {
        console.error("Error updating images:", imageError);
        return res.status(500).json({
          message: "Error updating trip images",
        });
      }
    }

    // Update the trip
    const updatedTrip = await Trip.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("bookings")
      .populate("headerImage", "name url fileId")
      .populate("heroImage", "name url fileId");

    res.status(200).json({
      success: true,
      message: "Trip updated successfully!",
      data: updatedTrip,
    });
  } catch (error) {
    console.error("Error updating trip:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid trip ID format",
      });
    }

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err) => err.message
      );
      return res.status(400).json({
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      message: "Error updating trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Delete trip
export const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the trip first
    const trip = await Trip.findById(id);
    if (!trip) {
      return res.status(404).json({
        message: "Trip not found",
      });
    }

    // Check if trip has bookings
    if (trip.bookings && trip.bookings.length > 0) {
      return res.status(400).json({
        message: "Cannot delete trip with existing bookings",
      });
    }

    try {
      // Delete header image from ImageKit and database if exists
      if (trip.headerImage) {
        const headerImage = await Image.findById(trip.headerImage);
        if (headerImage) {
          await imagekit.deleteFile(headerImage.fileId);
          await Image.findByIdAndDelete(trip.headerImage);
        }
      }

      // Delete hero image from ImageKit and database if exists
      if (trip.heroImage) {
        const heroImage = await Image.findById(trip.heroImage);
        if (heroImage) {
          await imagekit.deleteFile(heroImage.fileId);
          await Image.findByIdAndDelete(trip.heroImage);
        }
      }
    } catch (imageError) {
      console.error("Error deleting images from ImageKit:", imageError);
      // Continue with trip deletion even if image deletion fails
    }

    // Delete the trip
    await Trip.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully!",
    });
  } catch (error) {
    console.error("Error deleting trip:", error);

    if (error.name === "CastError") {
      return res.status(400).json({
        message: "Invalid trip ID format",
      });
    }

    res.status(500).json({
      message: "Error deleting trip",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};

// Get trip categories
export const getTripCategories = async (req, res) => {
  try {
    const categories = [
      "BACKPACKING TRIPS",
      "SUNRISE TREKS",
      "ONE DAY TRIPS",
      "INTERNATIONAL TRIPS",
      "WOMEN TRIPS",
      "LONG WEEKEND",
      "WATER SPORTS",
      "TWO DAYS TREK",
    ];

    res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Error fetching categories",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Something went wrong",
    });
  }
};
