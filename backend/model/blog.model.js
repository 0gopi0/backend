import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    // Author Information
    authorName: {
      type: String,
      required: true,
    },

    // Blog Content
    heading: {
      type: String,
      required: true,
    },

    // Location Information
    locationName: {
      type: String,
      required: true,
    },
    locatedIn: {
      type: [String],
      required: true,
    },
    idealFor: {
      type: [String],
      required: true,
    },

    // Content Details
    whatIsSpecial: {
      type: String,
      required: true,
    },

    // Travel Information
    howToReach: [
      {
        key: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],

    // Essentials and Tips
    foodEssentials: {
      type: [String],
      required: true,
    },
    thingsToKnow: {
      type: [String],
      required: true,
    },

    // FAQ Section
    faq: [
      {
        key: {
          type: String,
          required: true,
        },
        value: {
          type: String,
          required: true,
        },
      },
    ],

    // Image Assets
    headerImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
    heroImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Image",
    },
  },
  {
    // Automatically add createdAt and updatedAt timestamps
    timestamps: true,
  }
);

const Blog = mongoose.model("Blog", blogSchema);

export default Blog;
