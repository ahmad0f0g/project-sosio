import express from "express";
import { createReport, getReports, getReportById, deleteReport } from "../controllers/reportController.js";
import upload from "../middleware/upload.js";
// import validateImage from "../middleware/validateImage.js"; // Opsional: Matikan dulu biar cepat

const router = express.Router();

router.get("/", getReports);
router.get("/:id", getReportById);

// 'images' harus sama dengan formData.append('images', ...) di frontend
router.post("/", upload.array("images", 3), createReport); 

router.delete("/:id", deleteReport);

export default router;