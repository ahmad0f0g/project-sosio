import express from "express";
import { createClaim } from "../controllers/claimController.js";

const router = express.Router();

// Create claim
router.post("/", createClaim);
router.get("/status/:id", getClaimStatus); // <--- Tambahkan baris ini

export default router;
