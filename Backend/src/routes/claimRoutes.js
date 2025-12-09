import express from "express";
import { createClaim } from "../controllers/claimController.js";

const router = express.Router();

// Create claim
router.post("/", createClaim);

export default router;
