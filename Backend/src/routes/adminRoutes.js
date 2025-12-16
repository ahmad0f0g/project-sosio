import express from "express";
import {
  getAllClaims,
  approveClaim,
  rejectClaim,
} from "../controllers/adminController.js";

const router = express.Router();

router.get("/claims", getAllClaims);

router.post("/approve/:id", approveClaim);

router.post("/reject/:id", rejectClaim);

export default router;
