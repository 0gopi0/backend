import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    // Core Trip Information
    heading: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    from: {
      type: String,
      required: true,
    },
    to: {
      type: String,
      required: true,
    },
    category: {
      type: [String],
      enum: [
        "BACKPACKING TRIPS",
        "SUNRISE TREKS",
        "ONE DAY TRIPS",
        "INTERNATIONAL TRIPS",
        "WOMEN TRIPS",
        "LONG WEEKEND",
        "WATER SPORTS",
        "TWO DAYS TREK",
      ],
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },

    // Detailed Trip Plan
    itinerary: [
      {
        day: { type: String, required: true },
        activities: { type: [String], required: true },
      },
    ],
    highlights: {
      type: [String],
      required: true,
    },

    // Image Assets
    headerImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
    heroImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },

    // Logistics & Preparation
    pickupLocation: {
      type: [String],
      required: true,
    },
    thingsToCarry: {
      type: [String],
      required: true,
    },

    // Relational Data
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

const Trip = mongoose.model("Trip", tripSchema);

export default Trip;
