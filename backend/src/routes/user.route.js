import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { toggleArchiveUser, getArchivedUsers } from "../controllers/user.controller.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";

const router = express.Router();
router.use(arcjetProtection, protectRoute);

router.patch("/archive/:id", toggleArchiveUser);
router.get("/archived", getArchivedUsers);

export default router;