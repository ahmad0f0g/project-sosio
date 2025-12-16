import express from "express";
import { createReport, getReports, getReportById, deleteReport } from "../controllers/reportController.js";
import upload from "../middleware/upload.js";

const router = express.Router();

router.get("/", getReports);
router.get("/:id", getReportById);

router.post("/", upload.array("images", 3), createReport); 

router.delete("/:id", deleteReport);

export default router;