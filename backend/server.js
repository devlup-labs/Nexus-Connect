import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

import cookieParser from "cookie-parser";
import cors from "cors";

import { connectDB } from "./src/lib/db.js";
import authRoutes from "./src/routes/auth.route.js";


dotenv.config();

const app = express();
const _dirname = path.resolve();

const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.get("/health", (req, res) => {  //DO NOT REMOVE THIS ENDPOINT
  res.status(200).json({ msg: "api is up and running" });
});

app.use("/api/auth", authRoutes);

//This is for deploying the frontend
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(_dirname, '../frontend/dist')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(_dirname, '../frontend/dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();
});