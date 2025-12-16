import Claim from "../models/Claim.js";
import Report from "../models/Report.js";
import { v4 as uuidv4 } from "uuid";

// 1. CREATE CLAIM
export const createClaim = async (req, res) => {
  try {
    const { reportId, name, reason, answers } = req.body;

    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Barang tidak ditemukan." });

    // Cegah duplikasi klaim pending
    const existing = await Claim.findOne({ reportId, name, status: 'pending' });
    if(existing) return res.status(400).json({ message: "Klaim sedang diproses." });

    const token = uuidv4().split('-')[0].toUpperCase();

    const claim = await Claim.create({
      reportId,
      name,
      reason,
      claimToken: token, 
      answers: {
        answer1: answers?.secret1 || "-",
        answer2: answers?.secret2 || "-",
        answer3: answers?.secret3 || "-"
      }
    });

    await Report.findByIdAndUpdate(reportId, { 
        status: 'pending',
        $inc: { claimCount: 1 } 
    });

    res.json({ 
      message: req.t("CLAIM_SUBMITTED"), 
      data: claim, 
      claimToken: token
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getClaimStatus = async (req, res) => {
  try {
    
    const { id } = req.query; 
    
    if (!id) return res.status(400).json({ message: "Token klaim diperlukan." });

    const claim = await Claim.findOne({ claimToken: id }).populate("reportId", "title finderName phone");

    if (!claim) {
      return res.status(404).json({ message: "Token klaim tidak valid." });
    }
    
    let responseData = {
      status: claim.status, 
      itemTitle: claim.reportId.title,
      finderName: claim.reportId.finderName || "Penemu",
      message: ""
    };

    if (claim.status === "approved") {
      responseData.status = "confirmed"; 
      responseData.finderPhone = claim.reportId.phone; 
      responseData.message = "Selamat! Klaim disetujui. Silakan hubungi penemu.";
    } else if (claim.status === "rejected") {
      responseData.message = "Maaf, klaim Anda ditolak karena jawaban tidak sesuai.";
    } else {
      responseData.message = "Klaim masih menunggu verifikasi admin.";
    }

    res.json(responseData);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};