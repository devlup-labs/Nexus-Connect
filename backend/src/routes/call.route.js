import express from "express";
import { getCallLogs } from "../controllers/call.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.get("/", getCallLogs);

export default router;
