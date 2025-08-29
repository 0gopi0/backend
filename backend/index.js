import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { connectDB } from "./db/connectDB.js";
import authRoutes from "./routes/auth.routes.js";
import tripsRoutes from "./routes/trips.routes.js";
import blogsRoutes from "./routes/blogs.routes.js";
import bookingsRoutes from "./routes/bookings.routes.js";
import reviewsRoutes from "./routes/reviews.routes.js";
import cookieParser from "cookie-parser";

// Load environment variables from parent directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });
const app = express();
const PORT = process.env.PORT || 3000;
app.use(cookieParser()); // middleware to parse cookies
app.use(express.json()); // allows us to parse incoming requests:req.body

app.use("/api/auth", authRoutes);
app.use("/api/trips", tripsRoutes);
app.use("/api/blogs", blogsRoutes);
app.use("/api/bookings", bookingsRoutes);
app.use("/api/reviews", reviewsRoutes);

app.listen(PORT, () => {
  connectDB();
  console.log("Server is running on port: ", PORT);
});
