import mongoose from "mongoose";

const imageSchena = new mongoose.Schema({
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
});

export const Image = mongoose.model("Image", imageSchena);
