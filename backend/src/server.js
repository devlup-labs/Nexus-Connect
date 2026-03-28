import express from 'express';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./lib/db.js";
import { initializeSocket } from "./lib/socket.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import userRoutes from "./routes/user.route.js";
import callRoutes from "./routes/call.route.js";
import dns from "node:dns";


dotenv.config();
dns.setServers(["1.1.1.1", "8.8.8.8"]);



const app = express();
const httpServer = createServer(app);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');

const PORT = process.env.PORT || 3000;

// Initialize Socket.IO
initializeSocket(httpServer);

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

app.get("/health", (req, res) => {  //DO NOT REMOVE THIS ENDPOINT
  res.status(200).json({ msg: "api is up and running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/api/calls", callRoutes);

//This is for deploying the frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

httpServer.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);

  connectDB();
});