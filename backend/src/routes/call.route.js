import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import express from "express";
import { createCallLog, getCallLogs } from "../controllers/call.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.post("/", createCallLog);
router.get("/", getCallLogs);

export default router;
