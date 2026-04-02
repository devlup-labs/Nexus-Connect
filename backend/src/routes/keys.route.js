import express from "express";
import {
    registerKeys,
    getKeyBundle,
    rotateSignedPreKey,
    uploadOneTimePreKeys,
    hasKeys,
} from "../controllers/keys.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(protectRoute);

router.post("/register", registerKeys);
router.get("/bundle/:userId", getKeyBundle);
router.post("/rotate-signed-prekey", rotateSignedPreKey);
router.post("/upload-one-time-prekeys", uploadOneTimePreKeys);
router.get("/has-keys/:userId", hasKeys);

export default router;
