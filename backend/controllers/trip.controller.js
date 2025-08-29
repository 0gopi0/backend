import { Trip } from "../model/trip.model.js";
import { Booking } from "../model/booking.model.js";
import ImageKit from "imagekit";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

const imagekit = new ImageKit({
  publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
});

export const upload = multer({
  storage: multer.memoryStorage(),
});

export const addTrip = async (req, res) => {
  try {
    // Validate required fields
    const { name, description, from, to, category, itinerary } = req.body;
    
    if (!name || !description || !from || !to || !category) {
      return res.status(400).json({ 
        message: "Missing required fields", 
        required: ["name", "description", "from", "to", "category"] 
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
    const invalidCategories = categoryArray.filter(cat => !validCategories.includes(cat));
    
    if (invalidCategories.length > 0) {
      return res.status(400).json({ 
        message: "Invalid category values", 
        invalidCategories,
        validCategories 
      });
    }

    // Validate itinerary if provided
    if (itinerary && !Array.isArray(itinerary)) {
      return res.status(400).json({ 
        message: "Itinerary must be an array" 
      });
    }

    if (itinerary) {
      for (const item of itinerary) {
        if (!item.day || !Array.isArray(item.activities)) {
          return res.status(400).json({ 
            message: "Each itinerary item must have 'day' (number) and 'activities' (array)" 
          });
        }
      }
    }

    // Check if image file is provided
    if (!req.file) {
      return res.status(400).json({ message: "Trip image is required" });
    }

    // Upload image to ImageKit
    const imageResponse = await imagekit.upload({
      file: req.file.buffer,
      fileName: `trip_${Date.now()}_${req.file.originalname}`,
      folder: "/trips", // Organize images in folders
    });

    // Create trip object with all fields
    const tripData = {
      name: name.trim(),
      description: description.trim(),
      from: from.trim(),
      to: to.trim(),
      category: categoryArray,
      fileName: imageResponse.name,
      url: imageResponse.url,
      fileId: imageResponse.fileId,
    };

    // Add itinerary if provided
    if (itinerary && itinerary.length > 0) {
      tripData.itinerary = itinerary;
    }

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
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    
    // Handle ImageKit upload errors
    if (error.message && error.message.includes('ImageKit')) {
      return res.status(500).json({ 
        message: "Image upload failed", 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
       message: "Internal server error", 
       error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
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
      filter.category = { $in: Array.isArray(category) ? category : [category] };
    }
    if (from) {
      filter.from = { $regex: from, $options: 'i' };
    }
    if (to) {
      filter.to = { $regex: to, $options: 'i' };
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Get trips with pagination
    const trips = await Trip.find(filter)
      .populate('bookings')
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
        hasPrevPage: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error("Error fetching trips:", error);
    res.status(500).json({ 
      message: "Error fetching trips", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
    });
  }
};

// Get single trip by ID
export const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const trip = await Trip.findById(id).populate('bookings');
    
    if (!trip) {
      return res.status(404).json({ 
        message: "Trip not found" 
      });
    }

    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error("Error fetching trip:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid trip ID format" 
      });
    }
    
    res.status(500).json({ 
      message: "Error fetching trip", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
    });
  }
};

// Update trip
export const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, from, to, category, itinerary } = req.body;
    
    // Find the trip first
    const existingTrip = await Trip.findById(id);
    if (!existingTrip) {
      return res.status(404).json({ 
        message: "Trip not found" 
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
      const invalidCategories = categoryArray.filter(cat => !validCategories.includes(cat));
      
      if (invalidCategories.length > 0) {
        return res.status(400).json({ 
          message: "Invalid category values", 
          invalidCategories,
          validCategories 
        });
      }
    }

    // Validate itinerary if provided
    if (itinerary) {
      if (!Array.isArray(itinerary)) {
        return res.status(400).json({ 
          message: "Itinerary must be an array" 
        });
      }

      for (const item of itinerary) {
        if (!item.day || !Array.isArray(item.activities)) {
          return res.status(400).json({ 
            message: "Each itinerary item must have 'day' (number) and 'activities' (array)" 
          });
        }
      }
    }

    // Build update object
    const updateData = {};
    if (name) updateData.name = name.trim();
    if (description) updateData.description = description.trim();
    if (from) updateData.from = from.trim();
    if (to) updateData.to = to.trim();
    if (category) updateData.category = Array.isArray(category) ? category : [category];
    if (itinerary) updateData.itinerary = itinerary;

    // Handle image update if new file is provided
    if (req.file) {
      try {
        // Delete old image from ImageKit
        await imagekit.deleteFile(existingTrip.fileId);
        
        // Upload new image
        const imageResponse = await imagekit.upload({
          file: req.file.buffer,
          fileName: `trip_${Date.now()}_${req.file.originalname}`,
          folder: "/trips",
        });

        updateData.fileName = imageResponse.name;
        updateData.url = imageResponse.url;
        updateData.fileId = imageResponse.fileId;
      } catch (imageError) {
        console.error("Error updating image:", imageError);
        return res.status(500).json({ 
          message: "Error updating trip image" 
        });
      }
    }

    // Update the trip
    const updatedTrip = await Trip.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('bookings');

    res.status(200).json({
      success: true,
      message: "Trip updated successfully!",
      data: updatedTrip
    });
  } catch (error) {
    console.error("Error updating trip:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid trip ID format" 
      });
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    
    res.status(500).json({ 
      message: "Error updating trip", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
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
        message: "Trip not found" 
      });
    }

    // Check if trip has bookings
    if (trip.bookings && trip.bookings.length > 0) {
      return res.status(400).json({ 
        message: "Cannot delete trip with existing bookings" 
      });
    }

    try {
      // Delete image from ImageKit
      await imagekit.deleteFile(trip.fileId);
    } catch (imageError) {
      console.error("Error deleting image from ImageKit:", imageError);
      // Continue with trip deletion even if image deletion fails
    }

    // Delete the trip
    await Trip.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Trip deleted successfully!"
    });
  } catch (error) {
    console.error("Error deleting trip:", error);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ 
        message: "Invalid trip ID format" 
      });
    }
    
    res.status(500).json({ 
      message: "Error deleting trip", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
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
      data: categories
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ 
      message: "Error fetching categories", 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong' 
    });
  }
};
