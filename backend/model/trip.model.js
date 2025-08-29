import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    name: {
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
    itinerary: [
      {
        day: Number,
        activities: [String],
      },
    ],
    fileName: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
    },
    fileId: {
      type: String,
      required: true,
    },
    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
  },
  { timestamps: true }
);

export const Trip = mongoose.model("Trip", tripSchema);
