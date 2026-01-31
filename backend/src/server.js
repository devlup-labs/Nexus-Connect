import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// 1. Initialize variables (MUST be at the top)
dotenv.config();
const app = express(); 
const PORT = process.env.PORT || 5001;

// 2. Now you can safely use middleware
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

// 3. Import your routes and DB (Do this AFTER app initialization)
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";

// 4. Set up routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

// 5. Start the server
app.listen(PORT, () => {
  console.log("🚀 Server is running on port: " + PORT);
  connectDB();
});