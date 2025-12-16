import express from "express";
import { createClaim, getClaimStatus } from "../controllers/claimController.js";

const router = express.Router();

router.post("/", createClaim);
router.get("/check", getClaimStatus);

export default router;
