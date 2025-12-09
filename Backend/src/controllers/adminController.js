import Claim from "../models/Claim.js";
import Report from "../models/Report.js";
import dotenv from "dotenv";
dotenv.config();

// Helper cek password
const checkAuth = (req) => req.headers.authorization === process.env.ADMIN_PASSWORD;

export const getAllClaims = async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: "Unauthorized" });

  // Populate reportId untuk melihat 'secrets' (kunci jawaban)
  const claims = await Claim.find().populate("reportId").sort({ createdAt: -1 });
  res.json({ data: claims });
};

export const approveClaim = async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: "Unauthorized" });

  try {
    const claim = await Claim.findByIdAndUpdate(req.params.id, { status: "approved" }, { new: true });
    if (!claim) return res.status(404).json({ message: "Claim not found" });

    // Tandai barang selesai (sudah diambil)
    await Report.findByIdAndUpdate(claim.reportId, { status: "finished" });

    res.json({ message: req.t("CLAIM_APPROVED"), data: claim });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const rejectClaim = async (req, res) => {
  if (!checkAuth(req)) return res.status(401).json({ message: "Unauthorized" });

  const claim = await Claim.findByIdAndUpdate(req.params.id, { status: "rejected" }, { new: true });
  res.json({ message: req.t("CLAIM_REJECTED"), data: claim });
};