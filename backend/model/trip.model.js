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
      type: String,
      required: true,
    },
    itinerary: [
      {
        day: Number,
        activities: [String],
      },
    ],
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
